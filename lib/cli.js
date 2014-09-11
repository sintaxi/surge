#!/usr/bin/env node

var path        = require('path')
var yargs       = require('yargs')
var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')

var argv =
  yargs
  .alias('d', 'domain')
  .alias('e', 'endpoint')
  .alias('p', 'project')
  .default('endpoint', 'surge.sh')
  .argv
skin({ argv: argv }, middleware, process.exit)
