var should = require('should')
var helpers = require('../../lib/util/helpers')
var whoami = require('../../lib/middleware/whoami')

// whoami names the token in use when the api sends one, and says nothing
// extra when it doesn't (older apis)
describe('whoami token line', function () {

  var realFetch, realTrunc, realSpace, lines

  beforeEach(function () {
    realFetch = helpers.fetchAccount
    realTrunc = helpers.trunc
    realSpace = helpers.space
    lines = []
    helpers.trunc = function (s) { lines.push(String(s).replace(/\u001b\[\d+m/g, '')) }
    helpers.space = function () {}
  })

  afterEach(function () {
    helpers.fetchAccount = realFetch
    helpers.trunc = realTrunc
    helpers.space = realSpace
  })

  var run = function (account, done) {
    helpers.fetchAccount = function () {
      return function (email, token, cb) { cb(null, account) }
    }
    whoami({ creds: { email: 'token', token: 'x' }, endpoint: {} }, function () { done(lines) })
  }

  it('names a scoped token by id and scope', function (done) {
    run({ email: 'a@b.com', token: { id: 'tok-1a2b3c4d', scope: ['foo.surge.sh'] } }, function (lines) {
      lines.should.containEql('tok-1a2b3c4d · scoped to foo.surge.sh')
      done()
    })
  })

  it('names an account-wide token as the full account', function (done) {
    run({ email: 'a@b.com', token: { id: 'tok-1a2b3c4d', scope: [] } }, function (lines) {
      lines.should.containEql('tok-1a2b3c4d · full account')
      done()
    })
  })

  it('prints only the email when the api sends no token', function (done) {
    run({ email: 'a@b.com' }, function (lines) {
      lines.should.eql(['a@b.com'])
      done()
    })
  })
})
