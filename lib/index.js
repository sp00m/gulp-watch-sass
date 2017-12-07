const fn = require("gulp-fn")
const watch = require("gulp-watch")

const ImportTree = require("./ImportTree")
const EventHandler = require("./EventHandler")

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
