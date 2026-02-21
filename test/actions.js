var should = require('should')
var nixt = require('nixt')
var Surge = require('../')
var surge = new Surge
var pkg = require('../package.json')
var minimist = 'node ./test/fixtures/bin/minimist.js'
var hooks = {}

describe('actions', function (done) {

  describe('login', function (done) {

    it('action', function (done) {
      should(surge.login(hooks)).type('function')
      done()
    })

    it('minimist', function (done) {
      nixt({ colors: false })
        .run(minimist + ' login')
        .on(/.*email:.*/).respond('brock+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .expect(function (result) {
          should(result.stdout).match(/Success - Logged in as brock\+test@chloi\.io/)
        })
        .exec(minimist + ' logout')
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
