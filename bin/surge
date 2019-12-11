#!/usr/bin/env node

var surge = require("../")({ default: "publish" })

surge(process.argv.slice(2))

process.on('SIGINT', function() {
  console.log("\n")
  global.ponr == true
    ? console.log("   Disconnected".green + "- Expected to complete.".grey)
    : console.log("   Aborted".yellow + " - Deployment not initiated.".grey)
  console.log()
  process.exit(1)
})

