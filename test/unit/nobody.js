var should = require('should')
var helpers = require('../../lib/util/helpers')

describe('nobodyToAsk', function () {

  var saved = {}
  var keys = ['CI', 'SURGE_INTERACTIVE']
  var tty

  beforeEach(function () {
    keys.forEach(function (k) { saved[k] = process.env[k]; delete process.env[k] })
    tty = process.stdin.isTTY
  })

  afterEach(function () {
    keys.forEach(function (k) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    })
    process.stdin.isTTY = tty
  })

  var req = { configuration: {} }

  it('lets a terminal prompt', function () {
    process.stdin.isTTY = true
    should(helpers.nobodyToAsk(req)).equal(null)
  })

  it('refuses when stdin is not a terminal', function () {
    process.stdin.isTTY = undefined
    helpers.nobodyToAsk(req).should.equal('no terminal to ask')
  })

  it('refuses when CI is set, even with a terminal', function () {
    process.stdin.isTTY = true
    process.env.CI = 'true'
    helpers.nobodyToAsk(req).should.match(/CI is set/)
  })

  it('ignores CI set to false or 0', function () {
    process.stdin.isTTY = true
    process.env.CI = 'false'
    should(helpers.nobodyToAsk(req)).equal(null)
    process.env.CI = '0'
    should(helpers.nobodyToAsk(req)).equal(null)
  })

  it('lets SURGE_INTERACTIVE=1 prompt from a pipe, even in CI', function () {
    process.stdin.isTTY = undefined
    process.env.CI = 'true'
    process.env.SURGE_INTERACTIVE = '1'
    should(helpers.nobodyToAsk(req)).equal(null)
  })

  it('trusts an embedder that passes its own input stream', function () {
    process.stdin.isTTY = undefined
    should(helpers.nobodyToAsk({ configuration: { input: {} } })).equal(null)
  })
})
