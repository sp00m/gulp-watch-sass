/* eslint-disable no-console */

const fs = require("fs")
const mkdirp = require("mkdirp")
const path = require("path")
const vinylFile = require("vinyl-file")

const cwd = path.resolve(process.cwd(), "test/")

const toPath = (fileName) => path.resolve(cwd, fileName)

const toVinyl = (fileName) => vinylFile.readSync(toPath(fileName))

const exists = (fileName) => fs.existsSync(toPath(fileName))

const create = (fileName, content) => {
  const filePath = toPath(fileName)
  mkdirp.sync(path.dirname(filePath))
  fs.writeFileSync(filePath, content)
}

const remove = (fileName) => fs.unlinkSync(toPath(fileName))

const assertStreamContainsOnly = (stream, ...fileNames) => {
  const files = stream.map((vinyl) => vinyl.history[0])
  fileNames.forEach((fileName) => {
    files.should.containEql(path.resolve(cwd, fileName))
  })
  files.should.have.length(fileNames.length)
}

module.exports = { cwd, toPath, toVinyl, exists, create, remove, assertStreamContainsOnly }
