#! /usr/bin/env node

var program = require('commander')
var Surge = require('../../../')
var surge = new Surge

program
  .command('login')
  .action(surge.login())

program
  .command('logout')
  .action(surge.logout())

program.parse(process.argv)
