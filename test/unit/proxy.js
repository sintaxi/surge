var should = require('should')
var path = require('path')

var root = path.join(__dirname, '..', '..')
var proxyPath = path.join(root, 'lib', 'middleware', '_shared', '_proxy.js')

// the notice fires when a proxy is configured but node will not use it. it has
// to stay quiet otherwise, because a warning that shows up when nothing is
// wrong is one people learn to scroll past.

describe('proxy notice', function () {

  var VARS = [
    'HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy',
    'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy', 'NODE_USE_ENV_PROXY'
  ]

  var saved = {}

  beforeEach(function () {
    VARS.forEach(function (k) { saved[k] = process.env[k]; delete process.env[k] })
  })

  afterEach(function () {
    VARS.forEach(function (k) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    })
  })

  var proxy = function () {
    delete require.cache[require.resolve(proxyPath)]
    return require(proxyPath)
  }

  var req = function (host, argv) {
    return { argv: argv || {}, endpoint: { hostname: host || 'surge.surge.sh' } }
  }

  // the notice prints, so swallow output while asserting the return value
  var quietly = function (fn) {
    var log = console.log
    console.log = function () {}
    try { return fn() } finally { console.log = log }
  }

  var major = parseInt(process.versions.node.split('.')[0], 10)

  it('stays quiet when no proxy is configured', function () {
    quietly(function () { proxy()(req()).should.equal(false) })
  })

  it('warns when a proxy is set and node is not told to use it', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    quietly(function () { proxy()(req()).should.equal(true) })
  })

  it('picks up the lowercase spelling too', function () {
    process.env.https_proxy = 'http://corp:3128'
    quietly(function () { proxy()(req()).should.equal(true) })
  })

  it('picks up HTTP_PROXY and ALL_PROXY', function () {
    process.env.HTTP_PROXY = 'http://corp:3128'
    quietly(function () { proxy()(req()).should.equal(true) })
    delete process.env.HTTP_PROXY

    process.env.ALL_PROXY = 'http://corp:3128'
    quietly(function () { proxy()(req()).should.equal(true) })
  })

  it('stays quiet once node is told to use the proxy', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    process.env.NODE_USE_ENV_PROXY = '1'
    // below node 22 the variable has no effect, so the notice is still right
    quietly(function () { proxy()(req()).should.equal(major >= 22 ? false : true) })
  })

  it('stays quiet when NO_PROXY exempts the endpoint', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    process.env.NO_PROXY = 'localhost,surge.sh'
    quietly(function () { proxy()(req('surge.surge.sh')).should.equal(false) })
  })

  it('matches NO_PROXY entries with a leading dot and a port', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    process.env.NO_PROXY = '.surge.sh:443'
    quietly(function () { proxy()(req('surge.surge.sh')).should.equal(false) })
  })

  it('does not treat a suffix that is not a domain boundary as exempt', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    process.env.NO_PROXY = 'urge.sh'
    quietly(function () { proxy()(req('surge.surge.sh')).should.equal(true) })
  })

  it('treats NO_PROXY=* as exempting everything', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    process.env.NO_PROXY = '*'
    quietly(function () { proxy()(req()).should.equal(false) })
  })

  it('stays quiet for --help and --version', function () {
    process.env.HTTPS_PROXY = 'http://corp:3128'
    quietly(function () {
      proxy()(req('surge.surge.sh', { help: true })).should.equal(false)
      proxy()(req('surge.surge.sh', { version: true })).should.equal(false)
      proxy()(req('surge.surge.sh', { h: true })).should.equal(false)
    })
  })

})
