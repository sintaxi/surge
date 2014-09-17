#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var surge       = require('./surge')

var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .default('endpoint', 'surge.sh')
  .argv

return surge({ argv: argv })
