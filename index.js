const fn = require("gulp-fn")
const fs = require("fs")
const globby = require("globby")
const path = require("path")
const vinylFile = require("vinyl-file")
const watch = require("gulp-watch")
const gutil = require("gulp-util")

const MULTILINE_COMMENTS = /\/\*[\s\S]*?\*\//g
const SINGLELINE_COMMENTS = /[ \t]*\/\/[^\r\n]*/g
const IMPORT_STATEMENTS = /^[ \t]*@import[ \t]+(["'])([^\r\n]+?)\1/gm
const SCSS_EXTENSION = /\.scss$/
const STYLESHEET_EXTENSION = /\.s?css$/
const FILENAME = /([^/\\]+)$/
const FILENAME_WITHOUT_LEADING_UNDERSCORE = /[/\\][^_/\\][^/\\]*$/
const SCSS_FILENAME_WITHOUT_LEADING_UNDERSCORE = /[/\\][^_/\\][^/\\]*\.scss$/

const ImportTree = (() => {

  function gatherImport(importingFile, importedFile) {
    if (this.desc.hasOwnProperty(importingFile) && this.desc[importingFile].includes(importedFile)) {
      this.warn(`Duplicated @import in file '${importingFile}': '${importedFile}'`)
    } else {
      if (!this.desc.hasOwnProperty(importingFile)) {
        this.desc[importingFile] = []
      }
      if (!this.asc.hasOwnProperty(importedFile)) {
        this.asc[importedFile] = []
      }
      this.desc[importingFile].push(importedFile)
      this.asc[importedFile].push(importingFile)
    }
  }

  function resolveImportCandidates(importingFile, importedPath, candidates) {
    const existingCandidates = candidates.filter((candidate) => fs.existsSync(candidate))
    switch (existingCandidates.length) {

    case 0:
      throw new Error(`Could not resolve '${importedPath}' from file '${importingFile}': file not found`)

    case 1:
      return existingCandidates[0]

    default:
      throw new Error(`Could not resolve ambiguous '${importedPath}' from file '${importingFile}', following candidates exist:\n- ${existingCandidates.join("\n- ")}`)

    }
  }

  function resolveImportWithExtension(importingFile, importedPath, importedFile) {
    const candidates = [
      importedFile
    ]
    if (SCSS_FILENAME_WITHOUT_LEADING_UNDERSCORE.test(importedFile)) {
      candidates.push(importedFile.replace(FILENAME, "_$1"))
    }
    return resolveImportCandidates.call(this, importingFile, importedPath, candidates)
  }

  function resolveImportWithoutExtension(importingFile, importedPath, importedFile) {
    const candidates = [
      `${importedFile}.scss`,
      `${importedFile}.css`
    ]
    if (FILENAME_WITHOUT_LEADING_UNDERSCORE.test(importedFile)) {
      candidates.push(importedFile.replace(FILENAME, "_$1.scss"))
    }
    return resolveImportCandidates.call(this, importingFile, importedPath, candidates)
  }

  function resolveImport(importingFile, importedPath) {
    if (!importedPath.endsWith(".css")) {
      // if ends with .css, then SASS will translate it into CSS rule "@import url(...)"
      const importedFile = path.resolve(importingFile.replace(FILENAME, ""), importedPath)
      gatherImport.call(this, importingFile, STYLESHEET_EXTENSION.test(importedFile)
        ? resolveImportWithExtension.call(this, importingFile, importedPath, importedFile)
        : resolveImportWithoutExtension.call(this, importingFile, importedPath, importedFile))
    }
  }

  return class {

    constructor(globs, options = {}) {
      this.globs = globs
      this.cwd = options.cwd || process.cwd()
      this.warn = options.warn || ((message) => gutil.log(gutil.colors.yellow(message)))
      this.desc = {}
      this.asc = {}
    }

    readFile(file) {
      if (file.endsWith(".scss")) {
        const content = fs.readFileSync(file, "utf8")
          .replace(MULTILINE_COMMENTS, "")
          .replace(SINGLELINE_COMMENTS, "")
        IMPORT_STATEMENTS.lastIndex = 0
        let match = null
        while (null !== (match = IMPORT_STATEMENTS.exec(content))) {
          try {
            resolveImport.call(this, file, match[2])
          } catch (e) {
            this.warn(e.message)
          }
        }
      }
    }

    build() {
      globby.sync(this.globs, { cwd: this.cwd }).forEach((file) => {
        this.readFile(path.resolve(this.cwd, file))
      })
      return this
    }

    findImportingFiles(importedFile, dedupe = true) {
      let allImportingFiles = []
      if (this.asc.hasOwnProperty(importedFile)) {
        const importingFiles = this.asc[importedFile]
        allImportingFiles = importingFiles.slice()
        importingFiles.forEach((importingFile) => {
          if (this.asc.hasOwnProperty(importingFile)) {
            allImportingFiles = allImportingFiles.concat(this.findImportingFiles(importingFile, false))
          }
        })
        if (dedupe) {
          allImportingFiles = [...new Set(allImportingFiles)]
        }
      }
      return allImportingFiles
    }

    removeImportedFile(file) {
      delete this.asc[file]
      Object.keys(this.desc).forEach((importingFile) => {
        this.desc[importingFile] = this.desc[importingFile].filter((importedFile) => importedFile !== file)
        if (0 === this.desc[importingFile].length) {
          delete this.desc[importingFile]
        }
      })
    }

    removeImportingFile(file) {
      delete this.desc[file]
      Object.keys(this.asc).forEach((importedFile) => {
        this.asc[importedFile] = this.asc[importedFile].filter((importingFile) => importingFile !== file)
        if (0 === this.asc[importedFile].length) {
          delete this.asc[importedFile]
        }
      })
    }

  }

})()

const EventHandler = (() => {

  const addToStream = (base, files, stream) => {
    files.forEach((file) => {
      stream.push(vinylFile.readSync(file, { base }))
    })
  }

  return class {

    constructor(tree) {
      this.tree = tree
    }

    add(vinyl, stream) {
      const file = vinyl.history[0]
      this.tree.readFile(file)
      addToStream(vinyl.base, this.tree.findImportingFiles(file), stream)
      return stream
    }

    change(vinyl, stream) {
      const file = vinyl.history[0]
      this.tree.removeImportingFile(file)
      return this.add(vinyl, stream)
    }

    unlink(vinyl, stream) {
      const file = vinyl.history[0]
      const cssFile = file.replace(SCSS_EXTENSION, ".css")
      if (cssFile !== file && fs.existsSync(cssFile)) {
        fs.unlinkSync(cssFile)
      }
      const importingFiles = this.tree.findImportingFiles(file)
      this.tree.removeImportingFile(file)
      this.tree.removeImportedFile(file)
      addToStream(vinyl.base, importingFiles, stream)
      return stream
    }

  }

})()

const watchSass = (globs, options) => {
  const tree = new ImportTree(globs, options).build()
  const handler = new EventHandler(tree)
  return watch(globs, options)
    .pipe(fn(function (vinyl) {
      if (!vinyl.history[0].endsWith(".css")) {
        this.push(vinyl)
      }
      handler[vinyl.event](vinyl, this)
    }, false))
}

module.exports = Object.assign(watchSass, { ImportTree, EventHandler })
