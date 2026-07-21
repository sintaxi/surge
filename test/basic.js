var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')
var fs = require('fs')
var os = require('os')
var path = require('path')

// isolate every spawned CLI in a throwaway HOME so the tests never
// touch the developer's real ~/.netrc (nixt clones process.env)
process.env.HOME = process.env.USERPROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-test-'))

var endpoint = typeof process.env.ENDPOINT !== 'undefined' ? ' -e ' + process.env.ENDPOINT + ' ' : ' '
var surge = 'node ' + pkg.bin + endpoint

console.log(surge)

var opts = {
  colors: false,
  newlines: false
}

var testts = (new Date()).getTime()
var testid = "cli-test-" + testts
var user = "brock"+ testid + "@chloi.io"

// random so it is unguessable, and never a substring of the testid,
// domain, or email — the publish tests assert it is not echoed in output
var pass = "pw-" + require('crypto').randomBytes(12).toString('hex')

describe("surge " + testid + " using " + user, function () {

  describe ("prepare", function(){
    it('logout', function (done) {
      nixt({ colors: false })
      .run(surge + 'logout') // Logout again afterwards
      .expect(function (result) {
        should(result.stdout).match(/(Not Authenticated)|(Token removed from )/)
      }).end(done)
    })
  })

  describe("helpers", function(){

    it('should catch invalid arguments', function (done) {
      nixt({ colors: false })
      .run(surge + '--foo')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`foo` is not a surge argument/)
      }).end(done)
    })

    it('should return version when --version is used', function (done) {
      nixt(opts)
      .run(surge + '--version')
      .expect(function(result) {
        should(result.stdout).match(new RegExp(pkg.version))
      }).end(done)
    })

    it('should return version when -V is used', function (done) {
      nixt(opts)
      .run(surge + '-V')
      .expect(function(result) {
        should(result.stdout).match(new RegExp(pkg.version))
      }).end(done)
    })

  })

  describe("wizards", function(){
    var subdomain = testid + "-one"
    var domain = subdomain + ".surge.sh"
    var resultedDomain

    it('should create project', function (done) {
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge)
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        resultedDomain = result.stdout.split('Success! - Published to')[1].trim().split(/\s+/)[0]
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should have project in list', function (done) {
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'list')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(resultedDomain).be.ok()
        should(result.stdout).match(new RegExp(resultedDomain))
      }).end(done)
    })

    it('should update project', function (done) {
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge)
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        resultedDomain = result.stdout.split('Success! - Published to')[1].trim().split(/\s+/)[0]
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should teardown project', function (done) {
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
      }).end(done)
    })

    it('should no longer have project in list', function (done) {
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'list')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .expect(function (result) {
        should(resultedDomain).be.ok()
        should(result.stdout).not.match(new RegExp(resultedDomain))
      }).end(done)
    })

  })

  describe('auth', function (done) {

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
        should(result.stdout).match(new RegExp(user))
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
        should(result.stdout).match(/Not Authenticated/)
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
      nixt(opts)
      .run(surge)
      .on(/.*project:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        resultedDomain = result.stdout.split('Success! - Published to')[1].trim().split(/\s+/)[0]
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should have project in list', function (done) {
      nixt(opts)
      .run(surge + 'list')
      .expect(function (result) {
        should(resultedDomain).be.ok()
        should(result.stdout).match(new RegExp(resultedDomain))
      }).end(done)
    })

    it('should update project', function (done) {
      nixt(opts)
      .run(surge)
      .on(/.*project:.*/).respond('./test/fixtures/projects/hello-world\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        resultedDomain = result.stdout.split('Success! - Published to')[1].trim().split(/\s+/)[0]
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should teardown project', function (done) {
      nixt(opts)
      .run(surge + 'teardown')
      .on(/.*domain:.*/).respond(domain + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/has been removed/)
        should(result.stdout).match(new RegExp(subdomain))
      }).end(done)
    })

    it('should no longer have project in list', function (done) {
      nixt(opts)
      .run(surge + 'list')
      .expect(function (result) {
        should(resultedDomain).be.ok()
        should(result.stdout).not.match(new RegExp(resultedDomain))
      }).end(done)
    })

  })

  describe('token', function () {
    it('`surge token`', function (done) {
      nixt(opts)
        .run(surge + 'token')
        .expect(function (result) {
          should(result.stdout).match(/([\w]{32})/)
        }).end(done)
    })

    // Failing
    // it('should not list the token twice', function (done) {
    //   this.timeout(1500)
    //
    //   nixt(opts)
    //     .run(surge + 'token')
    //     .expect(function (result) {
    //       should(result.stdout).not.match(/.*token: (\**)*./)
    //     })
    //     .end(done)
    // })
  })

  describe('scoped token', function () {
    var subdomain = testid + "-three"
    var domain = subdomain + ".surge.sh"
    var otherDomain = testid + "-other.surge.sh"
    var netrcPath = path.join(process.env.HOME, '.netrc')
    var loginNetrc, scopedToken

    it('should mint a token scoped to the domain', function (done) {
      nixt(opts)
        .run(surge + 'token add -d ' + domain + ' -m scoped-ci')
        .expect(function (result) {
          should(result.stdout).match(/([0-9a-f]{32})/)
          should(result.stdout).match(new RegExp("Scoped to " + domain))
          scopedToken = result.stdout.match(/([0-9a-f]{32})/)[1]
        }).end(done)
    })

    it('should list the scoped token by id without exposing the value', function (done) {
      nixt(opts)
        .run(surge + 'tokens')
        .expect(function (result) {
          should(scopedToken).be.ok()
          should(result.stdout).match(new RegExp("tok-" + scopedToken.slice(0, 8)))
          should(result.stdout).match(/scoped-ci/)
          should(result.stdout).not.match(new RegExp(scopedToken))
        }).end(done)
    })

    it('should publish in scope on the scoped token alone', function (done) {
      // swap the login token out of the netrc so this publish can only
      // succeed on the scoped token's own authority — this is the path
      // that breaks if scoped tokens lose the GET /account identity check
      loginNetrc = fs.readFileSync(netrcPath, 'utf-8')
      fs.writeFileSync(netrcPath, loginNetrc.replace(/password .*/, 'password ' + scopedToken))
      nixt(opts)
        .run(surge + './test/fixtures/projects/hello-world ' + domain)
        .expect(function (result) {
          should(result.stdout).not.match(/email:/)
          should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        }).end(done)
    })

    it('should not publish out of scope', function (done) {
      nixt(opts)
        .run(surge + './test/fixtures/projects/hello-world ' + otherDomain)
        .expect(function (result) {
          should(result.stdout).match(/do not have permission/)
          should(result.stdout).not.match(/Success/)
        }).end(done)
    })

    it('should restore the login token and teardown', function (done) {
      fs.writeFileSync(netrcPath, loginNetrc)
      nixt(opts)
        .run(surge + 'teardown ' + domain)
        .expect(function (result) {
          should(result.stdout).match(/has been removed/)
        }).end(done)
    })

    it('should remove the scoped token by id', function (done) {
      nixt(opts)
        .run(surge + 'token rem tok-' + scopedToken.slice(0, 8))
        .expect(function (result) {
          should(result.stdout).match(/removed/)
        }).end(done)
    })
  })

  describe('status', function () {
    var customDomain = testid + "-status.lvh.me"

    it('should refuse status for an unpublished domain', function (done) {
      nixt(opts)
        .run(surge + 'status ' + testid + '-nowhere.surge.sh')
        .code(1)
        .expect(function (result) {
          // the shared 404 handler speaks first — the api body still
          // carries "domain not published" for programmatic consumers
          should(result.stdout).match(/Not Found/)
        }).end(done)
    })

    it('should carry the unpointed-domain state in the verdicts box plus one cta line', function (done) {
      nixt(opts)
        .run(surge + './test/fixtures/projects/hello-world ' + customDomain)
        .expect(function (result) {
          should(result.stdout).match(new RegExp("Success! - Published to " + customDomain))
          should(result.stdout).match(/not resolving to Surge/)
          should(result.stdout).match(/waiting on dns/)
          should(result.stdout).match(/CNAME geo\.surge\.sh/)
          // the old records block below the result is gone
          should(result.stdout).not.match(/not pointed at surge yet/)
        }).end(done)
    })

    it('should show the one action for the published unpointed domain', function (done) {
      nixt(opts)
        .run(surge + 'status ' + customDomain)
        .expect(function (result) {
          should(result.stdout).match(/waiting on dns/)
          should(result.stdout).match(/CNAME/)
          should(result.stdout).match(/A \(apex\)/)
        }).end(done)
    })

    it('should report geo-aware dns in the table for a platform subdomain publish', function (done) {
      var domain = testid + "-quiet.surge.sh"
      nixt(opts)
        .run(surge + './test/fixtures/projects/hello-world ' + domain)
        .expect(function (result) {
          should(result.stdout).match(new RegExp("Success! - Published to " + domain))
          should(result.stdout).match(/using Surge Name Servers/)
          should(result.stdout).match(/geo-aware/)
          should(result.stdout).not.match(/waiting on dns/)
        }).end(done)
    })

    it('should teardown the status test projects', function (done) {
      nixt(opts)
        .run(surge + 'teardown ' + customDomain)
        .expect(function (result) {
          should(result.stdout).match(/has been removed/)
        }).end(done)
    })

    it('should teardown the quiet project', function (done) {
      nixt(opts)
        .run(surge + 'teardown ' + testid + '-quiet.surge.sh')
        .expect(function (result) {
          should(result.stdout).match(/has been removed/)
        }).end(done)
    })
  })

  describe('cleanup', function () {
    it('should nuke the test account', function (done) {
      nixt(opts)
        .run(surge + 'nuke')
        .on(/.*email:.*/).respond(user + '\n')     // only fires if a prior
        .on(/.*password:.*/).respond(pass + '\n')  // failure left us logged out
        .expect(function (result) {
          should(result.stdout).match(/Success/)
        }).end(done)
    })

    it('should not be authenticated after nuke', function (done) {
      nixt({ colors: false })
        .run(surge + 'whoami')
        .expect(function (result) {
          should(result.stdout).match(/Not Authenticated/)
        }).end(done)
    })
  })

})
