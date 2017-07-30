/* eslint-disable no-console */

require("should")
const sinon = require("sinon")
const globby = require("globby")

const { ImportTree } = require("../")
const { cwd, create, remove } = require("./_utils")

describe("gulp-watch-sass", () => {

  beforeEach(() => {
    sinon.spy(console, "warn")
  })

  afterEach(() => {
    console.warn.restore()
  })

  afterEach(() => {
    globby.sync("*.{css,scss}", { cwd }).forEach(remove)
  })

  it("should warn when @import is duplicated", () => {

    create("a.scss", ["@import 'b.scss';", "@import 'b.scss';"].join("\n"))
    create("b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is not found", () => {

    create("a.scss", "@import 'b.scss';")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is ambiguous (SASS vs partial with extension)", () => {

    create("a.scss", "@import 'b.scss';")
    create("b.scss", "div { margin: 0; }")
    create("_b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is ambiguous (SASS vs partial without extension)", () => {

    create("a.scss", "@import 'b';")
    create("b.scss", "div { margin: 0; }")
    create("_b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is ambiguous (CSS vs partial without extension)", () => {

    create("a.scss", "@import 'b';")
    create("b.css", "div { margin: 0; }")
    create("_b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is ambiguous (CSS vs SASS without extension)", () => {

    create("a.scss", "@import 'b';")
    create("b.css", "div { margin: 0; }")
    create("b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

  it("should warn when @import is ambiguous (CSS vs SASS vs partial without extension)", () => {

    create("a.scss", "@import 'b';")
    create("b.css", "div { margin: 0; }")
    create("b.scss", "div { margin: 0; }")
    create("_b.scss", "div { margin: 0; }")

    new ImportTree("*.scss", { cwd, warn: console.warn }).build()

    console.warn.called.should.be.true()

  })

})
