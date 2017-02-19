const fn = require("gulp-fn")
const fs = require("fs")
const globby = require("globby")
const path = require("path")
const vinylFile = require("vinyl-file")
const watch = require("gulp-watch")
const gutil = require("gulp-util")

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

  function resolveImport(importingFile, importedPath) {
    let importedFile = path.resolve(importingFile.replace(/([^/\\]+)$/, ""), importedPath)
    if (!(/\.s?css$/).test(importedFile)) {
      importedFile += ".scss"
    }
    let exists = fs.existsSync(importedFile)
    if (!exists && importedFile.endsWith(".scss")) {
      importedFile = importedFile.replace(/([^/\\]+)$/, "_$1")
      exists = fs.existsSync(importedFile)
    }
    if (!exists) {
      this.warn(`Could not resolve '${importedPath}' from file '${importingFile}': file not found`)
    } else {
      gatherImport.call(this, importingFile, importedFile)
    }
  }

  return class {

    constructor(cwd, globs, warn) {
      this.cwd = cwd
      this.globs = globs
      this.warn = warn
      this.desc = {}
      this.asc = {}
    }

    readFile(file) {
      const content = fs.readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/[ \t]*\/\/[^\r\n]*/g, "")
      const importRegex = /^[ \t]*@import[ \t]+(["'])([^\r\n]+?)\1/gm
      let match = null
      while ((match = importRegex.exec(content)) !== null) {
        resolveImport.call(this, file, match[2])
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
        if (this.desc[importingFile].length === 0) {
          delete this.desc[importingFile]
        }
      })
    }

    removeImportingFile(file) {
      delete this.desc[file]
      Object.keys(this.asc).forEach((importedFile) => {
        this.asc[importedFile] = this.asc[importedFile].filter((importingFile) => importingFile !== file)
        if (this.asc[importedFile].length === 0) {
          delete this.asc[importedFile]
        }
      })
    }

  }

})()

const EventHandler = (() => {

  const toVinyl = (file) => vinylFile.readSync(file)

  const toFile = (vinyl) => vinyl.history[0]

  const addToStream = (files, stream) => {
    files.forEach((file) => {
      stream.push(toVinyl(file))
    })
  }

  return class {

    constructor(tree) {
      this.tree = tree
    }

    add(vinyl, stream) {
      stream.push(vinyl)
      const file = toFile(vinyl)
      this.tree.readFile(file)
      addToStream(this.tree.findImportingFiles(file), stream)
      return stream
    }

    change(vinyl, stream) {
      stream.push(vinyl)
      const file = toFile(vinyl)
      this.tree.removeImportingFile(file)
      this.tree.readFile(file)
      addToStream(this.tree.findImportingFiles(file), stream)
      return stream
    }

    unlink(vinyl, stream) {
      const file = toFile(vinyl)
      const importingFiles = this.tree.findImportingFiles(file)
      this.tree.removeImportingFile(file)
      this.tree.removeImportedFile(file)
      addToStream(importingFiles, stream)
      return stream
    }

  }

})()

const cwd = process.cwd()
const warn = (message) => gutil.log(gutil.colors.yellow(message))

const watchSass = (globs, options = {}) => {
  options.cwd = options.cwd || cwd
  options.warn = options.warn || warn
  const tree = new ImportTree(options.cwd, globs, options.warn).build()
  const handler = new EventHandler(tree)
  return watch(globs)
    .pipe(fn(function (vinyl) {
      handler[vinyl.event](vinyl, this)
    }, false))
}

module.exports = Object.assign(watchSass, { ImportTree, EventHandler })
