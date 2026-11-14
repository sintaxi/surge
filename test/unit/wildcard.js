var should = require('should')
var path = require('path')

var root = path.join(__dirname, '..', '..')
var helpers = require(path.join(root, 'lib', 'util', 'helpers.js'))

// *.acme.com publishes the zone's wildcard (slushi plans/wildcard-spa.md)
describe('wildcard domains', function () {

  it('reads a leading *. on a real zone as a domain', function () {
    helpers.validDomain('*.acme.com').should.be.true()
    helpers.validDomain('*.docs.acme.co.uk').should.be.true()
  })

  it('refuses any other *', function () {
    helpers.validDomain('*.com').should.be.false()
    helpers.validDomain('*.*.acme.com').should.be.false()
    helpers.validDomain('a.*.acme.com').should.be.false()
    helpers.validDomain('*acme.com').should.be.false()
    helpers.validDomain('*').should.be.false()
  })
})
