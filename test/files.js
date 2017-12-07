/* eslint-disable no-console */

require("should")
const sinon = require("sinon")
const globby = require("globby")

const { ImportTree, EventHandler } = require("../")
const { cwd, toVinyl, create, remove, assertStreamContainsOnly } = require("./_utils")

describe("gulp-watch-sass", () => {

  beforeEach(() => {
    sinon.spy(console, "warn")
  })

  afterEach(() => {
    console.warn.restore()
  })

  afterEach(() => {
    globby.sync("*.scss", { cwd }).forEach(remove)
  })

  it("should handle SASS files with .scss extension", () => {

    create("a.scss", "@import 'b.scss';")
    create("b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should handle SASS files without .scss extension", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should handle partials without underscore with .scss extension", () => {

    create("a.scss", "@import 'b.scss';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should handle partials without underscore without .scss extension", () => {

    create("a.scss", "@import 'b';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should handle partials with underscore with .scss extension", () => {

    create("a.scss", "@import '_b.scss';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should handle partials with underscore without .scss extension", () => {

    create("a.scss", "@import '_b';")
    create("_b.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("_b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should leave CSS files with .css extension", () => {

    create("a.scss", "@import 'b.css';")
    create("b.css", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.css"), [])
    assertStreamContainsOnly(stream)

    console.warn.called.should.be.false()

  })

  it("should handle CSS files without .css extension", () => {

    create("a.scss", "@import 'b';")
    create("b.css", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("b.css"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should ignore commented lines", () => {

    create("a.scss", "// @import 'b';")
    create("b.scss", "/* @import 'c'; */")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream)

    console.warn.called.should.be.false()

  })

  const testChanges = (changes, includePaths) => {

    const tree = new ImportTree("*.scss", { cwd, warn: console.warn, includePaths }).build()
    const handler = new EventHandler(tree)

    changes.forEach((change) => {
      const stream = handler.change(toVinyl(change.change), [])
      assertStreamContainsOnly(stream, change.expect)
    })

    console.warn.called.should.be.false()

  }

  it("should follow includePaths declaration order", () => {

    create("dir1/a.scss", "@import 'b.scss';")
    create("dir2/b.scss", "div { margin: 0; }")
    create("dir3/b.scss", "div { margin: 0; }")

    testChanges([
      { change: "dir2/b.scss", expect: "dir1/a.scss" },
      { change: "dir3/b.scss" }
    ], ["dir2", "dir3"])
    testChanges([
      { change: "dir3/b.scss", expect: "dir1/a.scss" },
      { change: "dir2/b.scss" }
    ], ["dir3", "dir2"])

  })

  it("should ignore includePaths if file is resolvable without it", () => {

    create("dir1/a.scss", "@import 'b.scss';")
    create("dir1/b.scss", "div { margin: 0; }")
    create("dir2/b.scss", "div { margin: 0; }")

    testChanges([
      { change: "dir1/b.scss", expect: "dir1/a.scss" },
      { change: "dir2/b.scss" }
    ], ["dir2"])

  })

})
