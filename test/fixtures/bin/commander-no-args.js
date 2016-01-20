#! /usr/bin/env node

var program = require('commander')
var Surge = require('../../../')
var surge = new Surge
var path = require('path')

program
  .command('up')
  .action(surge.publish({
    preProject: function (req, next) {
      req.project = path.resolve('./test/fixtures/cli-test.surge.sh')
      next()
    }
  }))

program
  .command('logout')
  .action(surge.logout({}))

program
  .command('hi')
  .action(function () {
    console.log('hi')
  })

program.parse(process.argv)
