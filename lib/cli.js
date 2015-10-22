#!/usr/bin/env node

var surge = require("../")({ default: "publish" })

surge(process.argv.slice(2))

process.on('SIGINT', function() {
  console.log("\n")
  global.ponr == true
    ? console.log("    Disconnected".green, "-", "Past point of no return, completing in background.")
    : console.log("    Cancelled".yellow, "-", "Upload aborted, publish not initiated.")
  console.log()
  process.exit(1)
})

