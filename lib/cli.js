#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var surge       = require('./surge')

var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .alias('b', 'build', false)
  .alias('a', 'add')
  .alias('r', 'rem')
  .default('e', 'http://surge.sh')
  .argv

try {
  console.log()
  return surge({ argv: argv })
} catch(e) {
  console.log(e)
  console.log("    Invalid command.")
  console.log()
  require("./middleware/help")({ argv: argv }, new Function)
}

