var should = require('should')
var commander = require('commander')
var nixt = require('nixt')
var Surge = require('../')
var surge = new Surge
var pkg = require('../package.json')
var minimist = 'node ./test/fixtures/bin/minimist.js'
var yargs = 'node ./test/fixtures/bin/yargs.js'
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

    it('commander without args', function (done) {
      var commander = 'node ./test/fixtures/bin/commander-no-args.js'
      nixt({ colors: false })
        .exec(commander + ' logout')
        .run(commander + ' publish')
        .on(/.*email:.*/).respond('brock+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .on(/.*domain:.*/).respond('\n')
        .expect(function (result) {
          should(result.stdout).match(/publish/)
        })
        .exec(commander + ' logout')
        .end(done)
    })

    it('commander without hooks object', function (done) {
      var commander = 'node ./test/fixtures/bin/commander-no-hooks.js'
      nixt({ colors: false })
        .exec(commander + ' logout')
        .run(commander + ' login')
        .on(/.*email:.*/).respond('brock+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .expect(function (result) {
          should(result.stdout).match(/Success - Logged in as brock+test@chloi.io/)
        })
        .exec(commander + ' logout')
        .end(done)
    })

    it('minimist', function (done) {
      nixt({ colors: false })
        .run(minimist + ' login')
        .on(/.*email:.*/).respond('brock+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .expect(function (result) {
          should(result.stdout).match(/Success - Logged in as brock+test@chloi.io/)
        })
        .exec(minimist + ' logout')
        .end(done)
    })

    it('yargs', function (done) {
      nixt({ colors: false })
        .run(yargs + ' login')
        .on(/.*email:.*/).respond('brock+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .expect(function (result) {
          should(result.stdout).match(/Success - Logged in as brock+test@chloi.io/)
          should(result.stdout).match(/surge.sh/)
        })
        .exec(yargs + ' logout')
        .end(done)
    })
  })

  // publish
  // teardown
  // whoami
  // list
  // plus
  // logout

})
