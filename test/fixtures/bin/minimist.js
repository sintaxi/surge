#! /usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))
var surge = require('../../../')({
  name: 'minimist'
})

var hooks = {}

if (argv._[0] === 'login') {
  return surge.login(hooks)(argv._.slice(1))
}

if (argv._[0] === 'whoami') {
  return surge.whoami(hooks)(argv._.slice(1))
}
