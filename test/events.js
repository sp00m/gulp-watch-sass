require("should")
const sinon = require("sinon")
const globby = require("globby")

const { ImportTree, EventHandler } = require("../")
const { cwd, toPath, create, remove, assertStreamContainsOnly } = require("./_utils")

describe("gulp-watch-sass", () => {

  it("should handle 'change'", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    warn.called.should.be.false()

  })

  it("should handle 'change' with multiple @imports", () => {

    const warn = sinon.spy()

    create("a.scss", ["@import 'b1';", "@import 'b2';"].join("\n"))
    create("b1.scss", "@import 'c';")
    create("b2.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b1.scss", "b2.scss")

    warn.called.should.be.false()

  })

  it("should handle 'change' with added @import", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "span { border: 0; }")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    create("b.scss", "@import 'c';")
    handler.change(toPath("b.scss"), [])
    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    warn.called.should.be.false()

  })

  it("should handle 'change' with removed @import", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    create("b.scss", "span { border: 0; }")
    handler.change(toPath("b.scss"), [])
    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream)

    warn.called.should.be.false()

  })

  it("should handle 'add'", () => {

    const warn = sinon.spy()

    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    create("a.scss", "@import 'b';")
    const stream = handler.add(toPath("a.scss"), [])
    assertStreamContainsOnly(stream)

    warn.called.should.be.false()

  })

  it("should handle 'add' then 'change'", () => {

    const warn = sinon.spy()

    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    create("a.scss", "@import 'b';")
    handler.add(toPath("a.scss"), [])
    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b.scss")

    warn.called.should.be.false()

  })

  it("should handle 'unlink'", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    const stream = handler.unlink(toPath("b.scss"), [])
    assertStreamContainsOnly(stream, "a.scss")

    warn.called.should.be.false()

  })

  it("should handle 'unlink' with multiple @imports", () => {

    const warn = sinon.spy()

    create("a.scss", ["@import 'b1';", "@import 'b2';"].join("\n"))
    create("b1.scss", "@import 'c';")
    create("b2.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    handler.unlink(toPath("b1.scss"), [])
    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream, "a.scss", "b2.scss")

    warn.called.should.be.false()

  })

  it("should handle 'unlink' then 'change'", () => {

    const warn = sinon.spy()

    create("a.scss", "@import 'b';")
    create("b.scss", "@import 'c';")
    create("c.scss", "div { margin: 0; }")

    const tree = new ImportTree(cwd, "*.scss", warn).build()
    const handler = new EventHandler(tree)

    handler.unlink(toPath("b.scss"), [])
    const stream = handler.change(toPath("c.scss"), [])
    assertStreamContainsOnly(stream)

    warn.called.should.be.false()

  })

  afterEach(() => {
    globby.sync("*.scss", { cwd }).forEach((fileName) => {
      remove(fileName)
    })
  })

})
