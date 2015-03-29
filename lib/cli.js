#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var surge       = require('./surge')
//var readline    = require('readline')
var read = require("read")

// var rl = readline.createInterface({
//   input   : process.stdin,
//   output  : process.stdout
// }).on('close', function() {
//   console.log()
//   console.log()
//   console.log('    Aborted - you have disconnected from publishing.')
//   console.log()
//   process.exit(0)
// })

process.on('uncaughtException', function(e) {
  console.log()
  console.log()
  console.log('    Aborted - you have disconnected from publishing.')
  console.log()
  process.exit(0)
})


var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .alias('b', 'build', false)
  .alias('a', 'add')
  .alias('r', 'remove')
  .default('e', 'https://surge.sh')
  .argv

try {
  console.log()
  return surge({ argv: argv, read: read })
} catch(e) {
  console.log(e)
  console.log("    Invalid command.")
  console.log()
  require("./middleware/help")({ argv: argv }, new Function)
}

