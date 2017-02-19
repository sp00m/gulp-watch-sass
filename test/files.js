require("should")
const sinon = require("sinon")
const globby = require("globby")

const { ImportTree, EventHandler } = require("../")
const { cwd, toVinyl, create, remove, assertStreamContainsOnly } = require("./_utils")

describe("gulp-watch-sass", () => {

  it("should handle SASS files with .scss extension", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b.scss';")
    create("b.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    warn.called.should.be.false()

  })

  it("should handle SASS files without .scss extension", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    warn.called.should.be.false()

  })

  it("should handle partials with .scss extension", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b.scss';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "_b.scss")

    warn.called.should.be.false()

  })

  it("should handle partials without .scss extension", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "_b.scss")

    warn.called.should.be.false()

  })

  it("should handle CSS files with .css extension", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b.css';")
    create("b.css", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("a.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    warn.called.should.be.false()

  })

  it("should ignore commented lines", () => {

    const warn = sinon.spy()

    create("a.scss", "// @import 'b';")
    create("b.scss", "/* @import 'c'; */")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss").build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "c.scss")

    warn.called.should.be.false()

  })

  afterEach(() => {
    globby.sync("*.scss", { cwd }).forEach((fileName) => {
      remove(fileName)
    })
  })

})
