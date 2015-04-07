#!/usr/bin/env node

var path        = require('path')
var surge       = require('./surge')
var read        = require("read")
var minimist    = require('minimist')

var options = {
  alias: {
    p: 'project',
    d: 'domain',
    e: 'endpoint',
    b: 'build',
    a: 'add',
    r: 'remove'
  },
  boolean: 'b',
  default: {
    e: 'https://surge.sh'
  }
}

process.on('SIGINT', function() {
  console.log("\n")
  global.ponr == true
    ? console.log("    Disconnected".green, "-", "Past point of no return, completing in background.")
    : console.log("    Cancelled".yellow, "-", "Upload aborted, publish not initiated.")
  console.log()
  process.exit()
})

var argv = minimist(process.argv.slice(2), options)

try {
  console.log()
  return surge({ argv: argv, read: read })
} catch(e) {
  console.log(e)
  console.log("    Invalid command.")
  console.log()
  require("./middleware/help")({ argv: argv }, new Function)
}

