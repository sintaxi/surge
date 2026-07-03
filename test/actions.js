var should = require('should')
var Surge = require('../')
var surge = new Surge
var hooks = {}

describe('actions', function (done) {

  describe('login', function (done) {

    it('action', function (done) {
      should(surge.login(hooks)).type('function')
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
