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

  it('should provide an error message when the command isn’t valid', function (done) {
    nixt({ colors: false })
      .run(surge + '--deploy')
      .expect(function (result) {
        // Something like…
        // `--deploy` is not a surge command
        should(result.stdout).match(/--deploy/)
        should(result.stdout).match(/not/)
      })
      .end(done)
  })

  describe('should be able to login', function (done) {
    it('`surge login`', function (done) {
      nixt({ colors: false })
        .exec(surge + 'logout') // Logout before the test starts
        .run(surge + 'login')
        .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .expect(function (result) {
          should(result.stdout).match(/Logged in as kenneth/)

          // Possibly not returning the right codes right now?
          // should(result.code).equal(1)
        })
        .exec(surge + 'logout') // Logout again afterwards
        .end(done)
    })
  })

})
