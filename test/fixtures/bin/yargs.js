#! /usr/bin/env node

var program = require('yargs')
var surge = require('../../../')({
  name: 'yargs'
})

var hooks = {}

program
  .command('login', 'Login to your account', surge.login(hooks))
  .usage('$0 <command>')
  .argv

program
  .command('whoami', 'Check who you are logged in as.', surge.whoami(hooks))
  .usage('$0 <command>')
  .argv
