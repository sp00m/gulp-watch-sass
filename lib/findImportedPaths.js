const fs = require("fs")

const MULTILINE_COMMENTS = /\/\*[^]*?\*\//g
const SINGLELINE_COMMENTS = /\/\/.*/g
const IMPORT_STATEMENTS = (() => {
  const stringLiteral = "(?:'[^'\\r\\n]*'|\"[^\"\\r\\n]*\")"
  const importStatement = `@import\\s*(${stringLiteral}(?:\\s*,\\s*${stringLiteral})*)`
  return new RegExp(importStatement, "g")
})()
const COMMA = /\s*,\s*/

const removeComments = (content) => content
  .replace(MULTILINE_COMMENTS, "")
  .replace(SINGLELINE_COMMENTS, "")

const findImportValues = (content) => {
  const cleanedContent = removeComments(content)
  IMPORT_STATEMENTS.lastIndex = 0
  let match = null
  const importValues = []
  while (null !== (match = IMPORT_STATEMENTS.exec(cleanedContent))) {
    importValues.push(match[1])
  }
  return importValues
}

const findImportedPaths = (content) => findImportValues(content)
  .reduce((stringLiterals, importValue) => stringLiterals.concat(importValue.split(COMMA)), [])
  .map((stringLiteral) => stringLiteral.slice(1, stringLiteral.length - 1))

module.exports = (file) => findImportedPaths(fs.readFileSync(file, "utf8"))
