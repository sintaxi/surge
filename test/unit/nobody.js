var should = require('should')
var helpers = require('../../lib/util/helpers')

describe('nobodyToAsk', function () {

  var saved = {}
  var keys = ['CI', 'SURGE_INTERACTIVE', 'TERM_PROGRAM']
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

  it('lets git bash (mintty) prompt from its pipe, unless CI is set', function () {
    process.stdin.isTTY = undefined
    process.env.TERM_PROGRAM = 'mintty'
    should(helpers.nobodyToAsk(req)).equal(null)
    process.env.CI = 'true'
    helpers.nobodyToAsk(req).should.match(/CI is set/)
  })

  it('trusts an embedder that passes its own input stream', function () {
    process.stdin.isTTY = undefined
    should(helpers.nobodyToAsk({ configuration: { input: {} } })).equal(null)
  })
})

describe('redraws', function () {

  var saved
  var tty

  beforeEach(function () {
    saved = process.env.CI
    delete process.env.CI
    tty = process.stderr.isTTY
  })

  afterEach(function () {
    if (saved === undefined) delete process.env.CI
    else process.env.CI = saved
    process.stderr.isTTY = tty
  })

  it('redraws bars on a terminal', function () {
    process.stderr.isTTY = true
    helpers.redraws().should.equal(true)
  })

  it('prints lines when stderr is not a terminal', function () {
    process.stderr.isTTY = undefined
    helpers.redraws().should.equal(false)
  })

  it('prints lines when CI is set, even with a terminal', function () {
    process.stderr.isTTY = true
    process.env.CI = 'true'
    helpers.redraws().should.equal(false)
    process.env.CI = '0'
    helpers.redraws().should.equal(true)
  })
})
