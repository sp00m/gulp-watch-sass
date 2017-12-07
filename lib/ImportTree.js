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
  if (this.desc.has(importingFile) && this.desc.get(importingFile).has(importedFile)) {
    this.warn(`Duplicated @import in file '${importingFile}': '${importedFile}'`)
  } else {
    if (!this.desc.has(importingFile)) {
      this.desc.set(importingFile, new Set())
    }
    if (!this.asc.has(importedFile)) {
      this.asc.set(importedFile, new Set())
    }
    this.desc.get(importingFile).add(importedFile)
    this.asc.get(importedFile).add(importingFile)
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
  if (resolvedImportedFile) {
    gatherImport.call(this, importingFile, resolvedImportedFile)
    return true
  } else {
    return false
  }
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
    this.desc = new Map()
    this.asc = new Map()
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

  findImportingFiles(importedFile) {
    if (this.asc.has(importedFile)) {
      const importingFiles = this.asc.get(importedFile)
      return [...importingFiles]
        .filter((importingFile) => this.asc.has(importingFile))
        .reduce(
          (currentlyImportingFiles, importingFile) =>
            new Set([...currentlyImportingFiles, ...this.findImportingFiles(importingFile)]),
          new Set(importingFiles)
        )
    } else {
      return new Set()
    }
  }

  removeImportedFile(file) {
    this.asc.delete(file)
    this.desc.forEach((importedFiles, importingFile) => {
      importedFiles.delete(file)
      if (0 === importedFiles.size) {
        this.desc.delete(importingFile)
      }
    })
  }

  removeImportingFile(file) {
    this.desc.delete(file)
    this.asc.forEach((importingFiles, importedFile) => {
      importingFiles.delete(file)
      if (0 === importingFiles.size) {
        this.asc.delete(importedFile)
      }
    })
  }

}
