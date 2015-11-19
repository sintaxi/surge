var should = require('should')
var minimist = require('minimist')(process.argv.slice(2))
var yargs = require('yargs')
var commander = require('commander')
var Surge = require('../')
var surge = new Surge
var pkg = require('../package.json')
var hooks = {}

describe('actions', function (done) {

  describe('login', function (done) {

    it('action', function (done) {
      should(surge.login(hooks)).type('function')
      done()
    })

    it('commander', function (done) {
      var program = commander
      program
        .command('login')
        .action(surge.login(hooks))
      should(program.commands.length).equal(1)
      done()
    })

    it('minimist', function (done) {
      var program = minimist
      should(program._.length).equal(1)
      done()
    })

    it('yargs', function (done) {
      var program = yargs
      program
        .command('teardown', 'Login to Surge.', surge.login(hooks))
        .argv
      should(program.argv._.length).equal(1)
      done()
    })
  })

  // publish
  // teardown
  // whoami
  // list
  // plus
  // logout

})
