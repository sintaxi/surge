var should = require('should')
var list = require('../../lib/middleware/list')

// cells compare as plain text
var strip = function (cells) {
  return cells.map(function (s) { return s.replace(/\u001b\[\d+m/g, '') })
}
var row = function (project, wide) { return strip(list.row(project, wide)) }

describe('list', function () {

  it('names the owner by email, org slug, or shared', function () {
    row({ domain: 'a.com', owner: { account: 'brock@example.com' } })[1].should.equal('brock@example.com')
    row({ domain: 'b.com', owner: { org: { slug: 'acme', name: 'Acme' } } })[1].should.equal('acme')
    row({ domain: 'c.com', owner: 'someone else' })[1].should.equal('shared')
    row({ domain: 'd.com' })[1].should.equal('')
  })

  it('shows domain, owner, age and publisher, with files and size when wide', function () {
    var project = { domain: 'a.com', owner: { account: 'a@example.com' }, timeAgoInWords: '2 days ago',
      email: 'b@example.com', publicFileCount: 12, friendlySize: '1.2MB' }
    row(project, false).should.eql(['a.com', 'a@example.com', '2 days ago', 'b@example.com'])
    row(project, true).should.eql(['a.com', 'a@example.com', '2 days ago', 'b@example.com', '12 files', '1.2MB'])
  })

  it('reads acme: as an org, never a domain', function () {
    list.isOrg('acme:').should.be.true()
    list.isOrg('acme-co:').should.be.true()
    list.isOrg('acme:foo.com').should.be.false()
    list.isOrg('foo.com').should.be.false()
    list.isOrg(undefined).should.be.false()
  })

})
