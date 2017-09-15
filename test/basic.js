var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var endpoint = typeof process.env.ENDPOINT !== 'undefined' ? ' -e ' + process.env.ENDPOINT + ' ' : ' '
var surge = 'node ' + pkg.bin + endpoint

var opts = {
  colors: false,
  newlines: false
}

var testts = (new Date()).getTime()
var testid = "cli-test-" + testts
var user = "brock+test@chloi.io"
var pass = "12345"

describe("surge " + testid, function () {

  describe ("prepare", function(){
    it('logout', function (done) {
      nixt({ colors: false })
      .run(surge + 'logout') // Logout again afterwards
      .expect(function (result) {
        should(result.stdout).match(/Token removed from /)
      }).end(done)
    })
  })

  describe("helpers", function(){

    it('should catch invalid arguments', function (done) {
      nixt({ colors: false })
      .run(surge + '--foo')
      .expect(function (result) {
        should(result.stdout).match(/--foo/)
        should(result.stdout).match(/not/)
      }).end(done)
    })

    it('should return version when --version is used', function (done) {
      nixt(opts)
      .run(surge + '--version')
      .expect(function(result) {
        should(result.stdout).be.equal(pkg.version)
      }).end(done)
    })

    it('should return version when -V is used', function (done) {
      nixt(opts)
      .run(surge + '-V')
      .expect(function(result) {
        should(result.stdout).be.equal(pkg.version)
      }).end(done)
    })

  })

  describe("wizards", function(){
    var subdomain = testid + "-one"
    var domain = subdomain + ".surge.sh"
    var resultedDomain

    it('should create project', function (done) {
      this.timeout(9999)
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge)
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project path:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(pass)
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(new RegExp("Success! Project is published and running at " + domain))
        resultedDomain = result.stdout.split('Project is published and running at')[1].trim()
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should have project in list', function (done) {
      this.timeout(9999)
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'list')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(result.stdout).match(new RegExp(resultedDomain))
      }).end(done)
    })

    it('should update project', function (done) {
      this.timeout(9999)
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge)
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project path:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(pass)
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(new RegExp("Success! Project is published and running at " + domain))
        resultedDomain = result.stdout.split('Project is published and running at')[1].trim()
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should teardown project', function (done) {
      this.timeout(9999)
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'teardown')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*domain:.*/).respond(domain + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/has been removed/)
        should(result.stdout).match(new RegExp(subdomain))
        should(result.stdout).not.match(subdomain)
      }).end(done)
    })

    it('should no longer have project in list', function (done) {
      this.timeout(9999)
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'list')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(resultedDomain))
      }).end(done)
    })

  })

  describe('auth', function (done) {
    this.timeout(9999)

    it('should be able to login', function (done) {
      nixt({ colors: false })
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'login')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Logged in as brock/)
        // should(result.code).equal(1)
      }).end(done)
    })

    it('should return current user when checking whoami', function (done) {
      nixt({ colors: false })
      .run(surge + 'whoami')
      .expect(function (result) {
        should(result.stdout).match(/Logged in as brock/)
      }).end(done)
    })

    it('should logout', function (done) {
      nixt({ colors: false })
      .run(surge + 'logout') // Logout again afterwards
      .expect(function (result) {
        should(result.stdout).match(/Token removed from /)
      }).end(done)
    })

    it('should not return user when not authenticated', function (done) {
      nixt({ colors: false })
      .run(surge + 'whoami')
      .expect(function (result) {
        should(result.stdout).match(/Not currently authenticated/)
      }).end(done)
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

  describe("session", function(){
    var subdomain = testid + "-two"
    var domain = subdomain + ".surge.sh"
    var resultedDomain

    it('login', function (done) {
      nixt({ colors: false })
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'login')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Logged in as brock/)
        // should(result.code).equal(1)
      }).end(done)
    })

    it('should create second project using session', function (done) {
      this.timeout(9999)
      nixt(opts)
      .run(surge)
      .on(/.*project path:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(pass)
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(new RegExp("Success! Project is published and running at " + domain))
        resultedDomain = result.stdout.split('Project is published and running at')[1].trim()
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should have project in list', function (done) {
      this.timeout(9999)
      nixt(opts)
      .run(surge + 'list')
      .expect(function (result) {
        should(result.stdout).match(new RegExp(resultedDomain))
      }).end(done)
    })

    it('should update project', function (done) {
      this.timeout(9999)
      nixt(opts)
      .run(surge)
      .on(/.*project path:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(pass)
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(new RegExp("Success! Project is published and running at " + domain))
        resultedDomain = result.stdout.split('Project is published and running at')[1].trim()
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should teardown project', function (done) {
      this.timeout(9999)
      nixt(opts)
      .run(surge + 'teardown')
      .on(/.*domain:.*/).respond(domain + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/has been removed/)
        should(result.stdout).match(new RegExp(subdomain))
        should(result.stdout).not.match(subdomain)
      }).end(done)
    })

    it('should no longer have project in list', function (done) {
      this.timeout(9999)
      nixt(opts)
      .run(surge + 'list')
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(resultedDomain))
      }).end(done)
    })

  })

  describe('token', function () {

    it('`surge token`', function (done) {
      this.timeout(5000)

      nixt(opts)
        .run(surge + 'token')
        .expect(function (result) {
          should(result.stdout).match(/.*email: brock\+test@chloi\.io/)
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
