const fs = require("fs")
const path = require("path")
const vinylFile = require("vinyl-file")

const cwd = path.resolve(process.cwd(), "test/")

const toPath = (fileName) => path.resolve(cwd, fileName)

const toVinyl = (fileName) => vinylFile.readSync(toPath(fileName))

const create = (fileName, content) => fs.writeFileSync(toPath(fileName), content)

const remove = (fileName) => fs.unlinkSync(toPath(fileName))

const assertStreamContainsOnly = (stream, ...fileNames) => {
  const files = stream.map((vinyl) => vinyl.history[0])
  fileNames.forEach((fileName) => {
    files.should.containEql(path.resolve(cwd, fileName))
  })
  files.should.have.length(fileNames.length)
}

module.exports = { cwd, toPath, toVinyl, create, remove, assertStreamContainsOnly }
