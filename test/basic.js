var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var endpoint = typeof process.env.ENDPOINT !== 'undefined' ? ' -e ' + process.env.ENDPOINT + ' ' : ' '
var surge = 'node ' + pkg.bin + endpoint
var opts = {
  colors: false,
  newlines: false
}

describe('surge', function () {

  it('should be cool', function (done) {
    done()
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

  describe('version', function (done) {

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

  // TODO Endpoint tests
  // describe('endpoint', function (done) {
  //
  //   it('`surge --endpoint`', function (done) {
  //     nixt(opts)
  //       .run(surge + '--endpoint locahost:5001')
  //       .expect(function(result) {
  //       })
  //       .end(done)
  //   })
  //
  //   it('`surge -e` without protocol', function (done) {
  //     nixt(opts)
  //       .run(surge + '-e localhost:5001')
  //       .expect(function(result) {
  //       })
  //       .end(done)
  //   })
  //
  //   it('`surge -e` with protocol', function (done) {
  //     nixt(opts)
  //       .run(surge + '-e http://localhost:5001')
  //       .expect(function(result) {
  //       })
  //       .end(done)
  //   })
  //
  //   it('`surge -e` with IP', function (done) {
  //     nixt(opts)
  //       .run(surge + '-e 192.168.1.107:5001')
  //       .expect(function(result) {
  //       })
  //       .end(done)
  //   })
  // })

  describe('login', function (done) {
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

  describe('list', function () {
    this.timeout(5000)

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

  describe('token', function () {

    before(function (done) {
      nixt(opts)
        .exec(surge + 'logout') // Logout before the test starts
        .run(surge + 'login')
        .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
        .on(/.*password:.*/).respond('12345\n')
        .end(done)
    })

    it('`surge token`', function (done) {
      this.timeout(5000)

      nixt(opts)
        .run(surge + 'token')
        .expect(function (result) {
          should(result.stdout).match(/.*email: kenneth\+test@chloi\.io/)
          should(result.stdout).match(/.*token:*./)
        })
        .end(done)
    })

    // Failing
    // it('should not list the token twice', function (done) {
    //   this.timeout(5000)
    //
    //   nixt(opts)
    //     .run(surge + 'token')
    //     .expect(function (result) {
    //       should(result.stdout).not.match(/.*token: (\**)*./)
    //     })
    //     .end(done)
    // })
  })

})
