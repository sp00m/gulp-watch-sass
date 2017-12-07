/* eslint-disable no-console */

const fs = require("fs")
const mkdirp = require("mkdirp")
const path = require("path")
const rimraf = require("rimraf")
const vinylFile = require("vinyl-file")

const cwd = path.resolve(process.cwd(), "test/")

const toRelativePath = (fileName) => `data/${fileName}`

const toPath = (fileName) => path.resolve(cwd, toRelativePath(fileName))

const toVinyl = (fileName) => vinylFile.readSync(toPath(fileName))

const exists = (fileName) => fs.existsSync(toPath(fileName))

const create = (fileName, content) => {
  const filePath = toPath(fileName)
  mkdirp.sync(path.dirname(filePath))
  fs.writeFileSync(filePath, content)
}

const clean = () => rimraf.sync(toPath("."))

const assertStreamContainsOnly = (stream, ...fileNames) => {
  const files = stream.map((vinyl) => vinyl.history[0])
  const valuedFileNames = fileNames.filter((fileName) => fileName)
  valuedFileNames.forEach((fileName) => {
    files.should.containEql(toPath(fileName))
  })
  files.should.have.length(valuedFileNames.length)
}

module.exports = { cwd, toRelativePath, toPath, toVinyl, exists, create, clean, assertStreamContainsOnly }
