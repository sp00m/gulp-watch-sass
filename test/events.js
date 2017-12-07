/* eslint-disable no-console */

require("should")
const sinon = require("sinon")

const { ImportTree, EventHandler } = require("../")
const { cwd, toVinyl, exists, create, clean, assertStreamContainsOnly } = require("./_utils")

describe("gulp-watch-sass", () => {

  beforeEach(() => {
    sinon.spy(console, "warn")
  })

  afterEach(() => {
    console.warn.restore()
  })

  afterEach(() => {
    clean()
  })

  it("should handle 'change'", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    console.warn.called.should.be.false()

  })

  it("should handle 'change' with multiple @imports", () => {

    create("a.scss", ["@import 'b1';", "@import 'b2';"].join("\n"))
    create("b1.scss", "@import 'c';")
    create("b2.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b1.scss", "b2.scss")

    console.warn.called.should.be.false()

  })

  it("should handle 'change' with added @import", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "span { border: 0; }")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    create("b.scss", "@import 'c';")
    handler.change(toVinyl("b.scss"), [])
    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    console.warn.called.should.be.false()

  })

  it("should handle 'change' with removed @import", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    create("b.scss", "span { border: 0; }")
    handler.change(toVinyl("b.scss"), [])
    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream)

    console.warn.called.should.be.false()

  })

  it("should handle 'add'", () => {

    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    create("a.scss", "@import 'b';")
    const stream = handler.add(toVinyl("a.scss"), [])
    assertStreamContainsOnly(stream)

    console.warn.called.should.be.false()

  })

  it("should handle 'add' then 'change'", () => {

    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    create("a.scss", "@import 'b';")
    handler.add(toVinyl("a.scss"), [])
    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    console.warn.called.should.be.false()

  })

  it("should handle 'unlink'", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    const stream = handler.unlink(toVinyl("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    console.warn.called.should.be.false()

  })

  it("should delete CSS file on 'unlink'", () => {

    create("a.css", "div { margin: 0; }")
    create("a.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    exists("a.css").should.be.true()
    handler.unlink(toVinyl("a.scss"))
    exists("a.css").should.be.false()

    console.warn.called.should.be.false()

  })

  it("should handle 'unlink' with multiple @imports", () => {

    create("a.scss", ["@import 'b1';", "@import 'b2';"].join("\n"))
    create("b1.scss", "@import 'c';")
    create("b2.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    handler.unlink(toVinyl("b1.scss"), [])
    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b2.scss")

    console.warn.called.should.be.false()

  })

  it("should handle 'unlink' then 'change'", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree("**/*.scss", { cwd, warn: console.warn }).build()
    const handler = new EventHandler(tree)

    handler.unlink(toVinyl("b.scss"), [])
    const stream = handler.change(toVinyl("c.scss"), [])
    assertStreamContainsOnly(stream)

    console.warn.called.should.be.false()

  })

})
