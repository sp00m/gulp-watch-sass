/* eslint-disable no-console */

require("should")
const sinon = require("sinon")

const { ImportTree, EventHandler } = require("../")
const { cwd, toRelativePath, toVinyl, create, clean, assertStreamContainsOnly } = require("./_utils")

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

  const testChanges = (changes, includePaths = []) => {
    const tree = new ImportTree("**/*.scss", {
      cwd,
      warn: console.warn,
      includePaths: includePaths.map((includePath) => toRelativePath(includePath))
    }).build()
    const handler = new EventHandler(tree)
    changes.forEach((change) => {
      const stream = handler.change(toVinyl(change.change), [])
      assertStreamContainsOnly(stream, change.expect)
    })
    console.warn.called.should.be.false()
  }

  it("should handle both single and double quotes", () => {
    create("a.scss", "@import 'b.scss';\n@import \"c.scss\";")
    create("b.scss", "div { margin: 0; }")
    create("c.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
    testChanges([
      { change: "c.scss", expect: "a.scss" }
    ])
  })

  it("should handle multiple imports on a single line", () => {
    create("a.scss", "@import 'b.scss'; @import 'c.scss';")
    create("b.scss", "div { margin: 0; }")
    create("c.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
    testChanges([
      { change: "c.scss", expect: "a.scss" }
    ])
  })

  it("should handle SASS files with .scss extension", () => {
    create("a.scss", "@import 'b.scss';")
    create("b.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
  })

  it("should handle SASS files without .scss extension", () => {
    create("a.scss", "@import 'b';")
    create("b.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
  })

  it("should handle partials without underscore with .scss extension", () => {
    create("a.scss", "@import 'b.scss';")
    create("_b.scss", "div { margin: 0; }")
    testChanges([
      { change: "_b.scss", expect: "a.scss" }
    ])
  })

  it("should handle partials without underscore without .scss extension", () => {
    create("a.scss", "@import 'b';")
    create("_b.scss", "div { margin: 0; }")
    testChanges([
      { change: "_b.scss", expect: "a.scss" }
    ])
  })

  it("should handle partials with underscore with .scss extension", () => {
    create("a.scss", "@import '_b.scss';")
    create("_b.scss", "div { margin: 0; }")
    testChanges([
      { change: "_b.scss", expect: "a.scss" }
    ])
  })

  it("should handle partials with underscore without .scss extension", () => {
    create("a.scss", "@import '_b';")
    create("_b.scss", "div { margin: 0; }")
    testChanges([
      { change: "_b.scss", expect: "a.scss" }
    ])
  })

  it("should leave CSS files with .css extension", () => {
    create("a.scss", "@import 'b.css';")
    create("b.css", "div { margin: 0; }")
    testChanges([
      { change: "b.css", expect: null }
    ])
  })

  it("should handle CSS files without .css extension", () => {
    create("a.scss", "@import 'b';")
    create("b.css", "div { margin: 0; }")
    testChanges([
      { change: "b.css", expect: "a.scss" }
    ])
  })

  it("should ignore commented lines", () => {
    create("a.scss", "// @import 'b';")
    create("b.scss", "/* @import 'c'; */")
    create("c.scss", "div { margin: 0; }")
    testChanges([
      { change: "c.scss", expect: null }
    ])
  })

  it("should follow includePaths declaration order", () => {
    create("dir1/a.scss", "@import 'b.scss';")
    create("dir2/b.scss", "div { margin: 0; }")
    create("dir3/b.scss", "div { margin: 0; }")
    testChanges([
      { change: "dir2/b.scss", expect: "dir1/a.scss" },
      { change: "dir3/b.scss", expect: null }
    ], ["dir2", "dir3"])
    testChanges([
      { change: "dir3/b.scss", expect: "dir1/a.scss" },
      { change: "dir2/b.scss", expect: null }
    ], ["dir3", "dir2"])
  })

  it("should ignore includePaths if file is resolvable without it", () => {
    create("dir1/a.scss", "@import 'b.scss';")
    create("dir1/b.scss", "div { margin: 0; }")
    create("dir2/b.scss", "div { margin: 0; }")
    testChanges([
      { change: "dir1/b.scss", expect: "dir1/a.scss" },
      { change: "dir2/b.scss", expect: null }
    ], ["dir2"])
  })

  it("should handle comma-separated imports", () => {
    create("a.scss", "@import 'b.scss',\n'c.scss';")
    create("b.scss", "div { margin: 0; }")
    create("c.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
    testChanges([
      { change: "c.scss", expect: "a.scss" }
    ])
  })

  it("should handle comma-separated imports on a single line", () => {
    create("a.scss", "@import 'b.scss', 'c.scss';")
    create("b.scss", "div { margin: 0; }")
    create("c.scss", "div { margin: 0; }")
    testChanges([
      { change: "b.scss", expect: "a.scss" }
    ])
    testChanges([
      { change: "c.scss", expect: "a.scss" }
    ])
  })

})
