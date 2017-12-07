const fs = require("fs")
const globby = require("globby")
const path = require("path")
const gutil = require("gulp-util")

const MULTILINE_COMMENTS = /\/\*[\s\S]*?\*\//g
const SINGLELINE_COMMENTS = /[ \t]*\/\/[^\r\n]*/g
const IMPORT_STATEMENTS = /^[ \t]*@import[ \t]+(["'])([^\r\n]+?)\1/gm
const STYLESHEET_EXTENSION = /\.s?css$/
const FILENAME = /([^/\\]+)$/
const FILENAME_WITHOUT_LEADING_UNDERSCORE = /[/\\][^_/\\][^/\\]*$/
const SCSS_FILENAME_WITHOUT_LEADING_UNDERSCORE = /[/\\][^_/\\][^/\\]*\.scss$/

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
    return null

  case 1:
    return existingCandidates[0]

  default:
    throw new Error(`Could not resolve ambiguous '${importedPath}' from file '${importingFile}', following candidates exist:\n- ${existingCandidates.join("\n- ")}`)

  }
}

function resolveImportWithExtension(importingFile, importedPath, importedFile) {
  const candidates = [importedFile]
  if (SCSS_FILENAME_WITHOUT_LEADING_UNDERSCORE.test(importedFile)) {
    candidates.push(importedFile.replace(FILENAME, "_$1"))
  }
  return resolveImportCandidates.call(this, importingFile, importedPath, candidates)
}

function resolveImportWithoutExtension(importingFile, importedPath, importedFile) {
  const candidates = [`${importedFile}.scss`, `${importedFile}.css`]
  if (FILENAME_WITHOUT_LEADING_UNDERSCORE.test(importedFile)) {
    candidates.push(importedFile.replace(FILENAME, "_$1.scss"))
  }
  return resolveImportCandidates.call(this, importingFile, importedPath, candidates)
}

function tryResolveImport(importingFile, parent, importedPath) {
  const importedFile = path.resolve(parent, importedPath)
  const resolvedImportedFile = STYLESHEET_EXTENSION.test(importedFile)
    ? resolveImportWithExtension.call(this, importingFile, importedPath, importedFile)
    : resolveImportWithoutExtension.call(this, importingFile, importedPath, importedFile)
  let resolved = false
  if (resolvedImportedFile) {
    gatherImport.call(this, importingFile, resolvedImportedFile)
    resolved = true
  }
  return resolved
}

function buildCandidatingParents(importingFile) {
  const candidatingParents = this.includePaths.map((includePath) => path.resolve(this.cwd, includePath))
  candidatingParents.unshift(importingFile.replace(FILENAME, ""))
  return candidatingParents
}

function resolveImport(importingFile, importedPath) {
  // if ends with .css, then SASS will translate it into CSS rule "@import url(...)"
  if (!importedPath.endsWith(".css")) {
    const candidatingParents = buildCandidatingParents.call(this, importingFile)
    const resolved = candidatingParents.reduce(
      (alreadyResolved, candidatingParent) =>
        alreadyResolved || tryResolveImport.call(this, importingFile, candidatingParent, importedPath),
      false
    )
    if (!resolved) {
      throw new Error(`Could not resolve '${importedPath}' from file '${importingFile}': file not found`)
    }
  }
}

module.exports = class ImportTree {

  constructor(globs, options = {}) {
    this.globs = globs
    this.cwd = options.cwd || process.cwd()
    this.warn = options.warn || ((message) => gutil.log(gutil.colors.yellow(message)))
    this.includePaths = options.includePaths || []
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