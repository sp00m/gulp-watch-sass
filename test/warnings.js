require("should")
const sinon = require("sinon")
const globby = require("globby")

const { ImportTree } = require("../")
const { cwd, create, remove } = require("./_utils")

describe("gulp-watch-sass", () => {

  it("should warn when @import is duplicated", () => {

    const warn = sinon.spy()

    create("a.scss", ["@import 'b.scss';", "@import 'b.scss';", "@import 'b.scss';"].join("\n"))
    create("b.scss", "div { margin: 0; }")

    new ImportTree(cwd, "*.scss", warn).build()

    warn.called.should.be.true()

  })

  it("should warn when @import is not found", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b.scss';")

    new ImportTree(cwd, "*.scss", warn).build()

    warn.called.should.be.true()

  })

  afterEach(() => {
    globby.sync("*.{css,scss}", { cwd }).forEach((fileName) => {
      remove(fileName)
    })
  })

})
