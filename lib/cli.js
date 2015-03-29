#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var surge       = require('./surge')
var readline    = require('readline')

var rl = readline.createInterface({
  input   : process.stdin,
  output  : process.stdout
}).on('close', function() {
  console.log()
  console.log()
  console.log('      Aborted'.yellow, "– have a nice day.")
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
  return surge({ argv: argv, readline: rl })
} catch(e) {
  console.log(e)
  console.log("    Invalid command.")
  console.log()
  require("./middleware/help")({ argv: argv }, new Function)
}

