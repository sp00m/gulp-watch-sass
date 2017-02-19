const fs = require("fs")

const version = require("../package").version
const message = fs.readFileSync("./.git/COMMIT_EDITMSG", "utf8") // eslint-disable-line no-sync

if (!message.startsWith(`[${version}] `) || message.includes("  ")) {
  throw new Error("[POLICY] Wrong commit message format")
}
