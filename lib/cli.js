#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
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

var argv = minimist(process.argv.slice(2), options)

// process.on('uncaughtException', function(e) {
//   console.log(e)
//   console.log()
//   console.log('    Aborted.'.yellow)
//   console.log()
//   process.exit(0)
// })

try {
  console.log()
  return surge({ argv: argv, read: read })
} catch(e) {
  console.log(e)
  console.log("    Invalid command.")
  console.log()
  require("./middleware/help")({ argv: argv }, new Function)
}

