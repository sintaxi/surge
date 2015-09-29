var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: false
}

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
    this.timeout(2500)
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
        .end(done)
    })
    it('`surge whoami`', function (done) {
      nixt({ colors: false })
        .run(surge + 'whoami')
        .expect(function (result) {
          should(result.stdout).match(/Logged in as kenneth/)
        })
        .end(done)
    })

    it('`surge logout`', function (done) {
      nixt({ colors: false })
        .run(surge + 'logout') // Logout again afterwards
        .expect(function (result) {
          should(result.stdout).match(/Token removed from /)
        })
        .end(done)
    })
  })

  it('`surge list`', function (done) {
    nixt({ colors: false, newlines: true })
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'list')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .expect(function (result) {
        should(result.stdout).match(/cli-test-2\.surge\.sh/)
        should(result.stdout).match(/cli-test-3\.surge\.sh/)
        should(result.stdout).not.match(/www\.cli-test-3\.surge\.sh/)
        should(result.stdout).match(/www\.cli-test-4\.surge\.sh/)
        should(result.stdout).not.match(/cli-test-0\.surge\.sh/)
      })
      .end(done)
  })

})
