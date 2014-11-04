#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var surge       = require('./surge')

var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .alias('v', 'verbose').count('verbose')
  .alias('a', 'adduser')
  .alias('r', 'remuser')
  .default('e', 'surge.sh')
  .argv

return surge({ argv: argv })
