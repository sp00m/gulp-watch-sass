const fs = require("fs")
const vinylFile = require("vinyl-file")

const SCSS_EXTENSION = /\.scss$/

const addToStream = (base, files, stream) => {
  files.forEach((file) => {
    stream.push(vinylFile.readSync(file, { base }))
  })
}

module.exports = class EventHandler {

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
