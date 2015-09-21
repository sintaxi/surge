var nixt = require('nixt')
var should = require('should')
var surge = 'node ./lib/cli.js '
var opts = {
  colors: false,
  newlines: false
}
var pkg = require('../package.json')

describe('surge', function () {

  it('should be cool', function (done) {
    done()
  })

  describe('should return the version number', function (done) {

    it('`surge --version`', function (done) {
      nixt(opts)
        .run(surge + '--version')
        .expect(function(result) {
          should(result.stdout).be.equal(pkg.version)
        })
        .end(done)
    })

    it('`surge -V`', function (done) {
      nixt(opts)
        .run(surge + '-V')
        .expect(function(result) {
          should(result.stdout).be.equal(pkg.version)
        })
        .end(done)
    })

  })

})
