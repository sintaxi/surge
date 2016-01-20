#! /usr/bin/env node

var program = require('commander')
var Surge = require('../../../')
var surge = new Surge

program
  .command('whoami')
  .action(surge.whoami())

program.parse(process.argv)
