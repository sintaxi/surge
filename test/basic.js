var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')
var fs = require('fs')
var os = require('os')
var path = require('path')

// isolate every spawned CLI in a throwaway HOME so the tests never
// touch the developer's real ~/.netrc (nixt clones process.env)
process.env.HOME = process.env.USERPROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-test-'))

// nixt answers prompts through a pipe, not a terminal - let the spawned
// CLI prompt anyway. the no-terminal tests unset it per run.
process.env.SURGE_INTERACTIVE = '1'

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

// publishes write a CNAME into the project, so every publish test works
// on a throwaway copy of the fixture — never the git-tracked original
var fixture = path.join(__dirname, 'fixtures', 'projects', 'hello-world')
var makeProject = function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-proj-'))
  fs.readdirSync(fixture).forEach(function (f) {
    fs.copyFileSync(path.join(fixture, f), path.join(dir, f))
  })
  return dir
}

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

    it('should abort, not prompt, when not logged in and there is no terminal', function (done) {
      nixt({ colors: false })
      .env('SURGE_INTERACTIVE', '').env('CI', '').env('SURGE_TOKEN', '')
      .run(surge + makeProject() + ' nobody-' + testid + '.surge.sh')
      .code(1)
      .expect(function (result) {
        should(result.stderr).match(/not logged in and no terminal to ask\. Run `surge login` in a terminal, or set SURGE_TOKEN\./)
        should(result.stdout).not.match(/email:/)
      }).end(done)
    })

    it('should abort, not prompt, when not logged in and CI is set', function (done) {
      nixt({ colors: false })
      .env('SURGE_INTERACTIVE', '').env('CI', 'true').env('SURGE_TOKEN', '')
      .run(surge + makeProject() + ' nobody-' + testid + '.surge.sh')
      .code(1)
      .expect(function (result) {
        should(result.stderr).match(/not logged in and CI is set, so nobody to ask\. Set SURGE_TOKEN, or unset CI to log in here\./)
        should(result.stdout).not.match(/email:/)
      }).end(done)
    })

    it('should never fall back to the email prompt when a token is rejected', function (done) {
      nixt({ colors: false })
      .env('SURGE_TOKEN', 'bogus-' + testid)
      .run(surge + makeProject() + ' nobody-' + testid + '.surge.sh')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/Invalid token/)
        should(result.stdout).not.match(/email:/)
      }).end(done)
    })

    it('should exit 1 from whoami when a token is rejected', function (done) {
      nixt({ colors: false })
      .env('SURGE_TOKEN', 'bogus-' + testid)
      .run(surge + 'whoami')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/Not Authenticated - token rejected/)
      }).end(done)
    })

    it('should refuse --private and --public together', function (done) {
      nixt({ colors: false })
      .run(surge + '--private --public')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/use `--private` or `--public`, not both/)
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

    it('should point plus at account plans', function (done) {
      nixt({ colors: false })
      .run(surge + 'plus')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/Plus plan is legacy/)
        should(result.stdout).match(/surge plan/)
      }).end(done)
    })

    it('should no longer know select', function (done) {
      nixt({ colors: false })
      .run(surge + 'select')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`select` is not a surge command/)
      }).end(done)
    })

    // both grammars are first-class. the verb-first, flat, and namespaced
    // spellings all dispatch silently - no nudge, no abort. --help so
    // routing is asserted alone: no network, nothing left behind.
    // --help after a verb prints that verb's usage, so the usage line
    // proves which command the form routed to
    var silent = function(form, usage){
      return function(done){
        nixt({ colors: false })
        .run(surge + form + ' --help')
        .code(0)
        .expect(function (result) {
          should(result.stdout).match(usage)
          should(result.stdout).not.match(/is now/)
          should(result.stdout).not.match(/Aborted/)
        }).end(done)
      }
    }

    it('should route the flat debug verbs silently', silent('status', /surge <domain> status/))
    it('should route the flat stats verbs silently', silent('usage', /surge <domain> usage/))
    it('should route verb-first with a trailing domain silently', silent('status hitthefrontpage.com', /surge hitthefrontpage\.com status/))
    it('should route target-first with a flat verb silently', silent('hitthefrontpage.com status', /surge hitthefrontpage\.com status/))
    it('should route target-first with a namespaced verb silently', silent('hitthefrontpage.com debug status', /surge hitthefrontpage\.com debug status/))
    it('should route `list <domain>` silently', silent('list hitthefrontpage.com', /lists revisions/))
    it('should route `token add` silently', silent('token add', /surge token\n/))
    it('should route `token rem` silently', silent('token rem tok-1a2b3c4d', /surge token\n/))
    it('should route bare `token` silently', silent('token', /surge token\n/))
    it('should leave the identity verbs flat and silent', silent('whoami', /surge whoami/))
    it('should keep `surge account <verb>` working as a silent alias', silent('account whoami', /surge account <verb>` is the same as/))

    it('should let a valid domain beat a same-named directory in help', function (done) {
      var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-shadow-'))
      fs.mkdirSync(path.join(dir, 'shadow.example.com'))
      nixt({ colors: false })
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + 'shadow.example.com --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/shadow\.example\.com \(given\)/)
        should(result.stdout).not.match(/not a surge project/)
      }).end(done)
    })

    // a file that exists is never a domain target - page.html looks like a
    // domain, but `surge page.html <domain>` publishes the page
    it('should route an existing file to publish, not read it as a domain', function (done) {
      var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-file-'))
      fs.writeFileSync(path.join(dir, 'page.html'), '<h1>hi</h1>')
      nixt({ colors: false })
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + 'page.html file-route.example.com --help')
      .code(0)
      .expect(function (result) {
        // the publish pair answers --help with publish's usage
        should(result.stdout).match(/<page\.html> <domain>/)
        should(result.stdout).match(/FLAGS/)
        should(result.stdout).not.match(/is not a surge command/)
        should(result.stdout).not.match(/Aborted/)
      }).end(done)
    })

    it('should say no such directory for a missing path target', function (done) {
      nixt({ colors: false })
      .run(surge + './missing-dir-xyz --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/no such directory/)
        should(result.stdout).match(/<path> <domain>/)
        should(result.stdout).not.match(/PROJECT/)
      }).end(done)
    })

    it('should reject an unknown command', function (done) {
      nixt({ colors: false })
      .run(surge + 'tpyo')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`tpyo` is not a surge command/)
      }).end(done)
    })

    it('should print debug usage for bare surge debug', function (done) {
      nixt({ colors: false })
      .run(surge + 'debug')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/<domain> debug status/)
        should(result.stdout).match(/<domain> debug encrypt/)
      }).end(done)
    })

    it('should point at the golden path when bare in a pipeline', function (done) {
      nixt({ colors: false })
      .run(surge.trim())
      .code(1)
      .expect(function (result) {
        should(result.stderr).match(/surge requires a path/)
      }).end(done)
    })

    it('should output help with --help even in a pipeline', function (done) {
      nixt({ colors: false })
      .run(surge + '--help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/PUBLISHING/)
        should(result.stdout).match(/PROJECT/)
        should(result.stdout).match(/ADMIN/)
        should(result.stdout).match(/<path> <domain>/)
        should(result.stdout).match(/<domain> config/)
        // the money path stays discoverable from the help screen
        should(result.stdout).match(/surge plan/)
        should(result.stdout).match(/surge card/)
        // the path form is a power-user affordance, not a help line
        should(result.stdout).not.match(/<proj>/)
        should(result.stdout).not.match(/ns1\.surge\.world/)
      }).end(done)
    })

    it('should show previews, revisions and auth on the help screen', function (done) {
      nixt({ colors: false })
      .run(surge + '--help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/--preview/)
        should(result.stdout).match(/REVISIONS/)
        should(result.stdout).match(/<domain> cutover/)
        should(result.stdout).match(/<domain> revs/)
        should(result.stdout).match(/<domain> discard/)
        should(result.stdout).match(/--token <token>/)
        should(result.stdout).match(/SURGE_TOKEN/)
        should(result.stdout).match(/surge <command> --help for one command/)
      }).end(done)
    })

    it('should treat bare `surge help` as the help screen', function (done) {
      nixt({ colors: false })
      .run(surge + 'help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/PUBLISHING/)
      }).end(done)
    })

    it('should print one command\'s usage for `surge help <verb>`', function (done) {
      nixt({ colors: false })
      .run(surge + 'help cutover')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/surge <domain> cutover \[<rev>\]/)
        should(result.stdout).not.match(/PUBLISHING/)
      }).end(done)
    })

    it('should print one command\'s usage for `surge <verb> --help`', function (done) {
      nixt({ colors: false })
      .run(surge + 'tokens --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/surge tokens add \[--domain <domain>\]/)
        should(result.stdout).not.match(/PUBLISHING/)
      }).end(done)
    })

    it('should echo the target in `surge <domain> <verb> --help`', function (done) {
      nixt({ colors: false })
      .run(surge + 'example.com rollback --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/surge example\.com rollback/)
      }).end(done)
    })

    it('should list the publish flags for publish help', function (done) {
      nixt({ colors: false })
      .run(surge + 'publish --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/--preview/)
        should(result.stdout).match(/--force https\|http/)
      }).end(done)
    })

    it('should refuse help for a command that does not exist', function (done) {
      nixt({ colors: false })
      .run(surge + 'help nope')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`nope` is not a surge command/)
      }).end(done)
    })

    it('should render contextual help inside a project', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-help-'))
      fs.writeFileSync(path.join(proj, 'CNAME'), 'ctx-help.example.com\n')
      nixt({ colors: false })
      .cwd(proj)
      .run('node ' + path.resolve(pkg.bin) + endpoint + '--help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/ctx-help\.example\.com \(CNAME found\)/)
        should(result.stdout).not.match(/\[<domain>\]/)
      }).end(done)
    })

    it('should render contextual help for a passed project path', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-help-'))
      fs.writeFileSync(path.join(proj, 'CNAME'), 'ctx-path.example.com\n')
      nixt({ colors: false })
      .run(surge + proj + ' --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/ctx-path\.example\.com \(CNAME found in /)
        should(result.stdout).not.match(/\[<domain>\]/)
      }).end(done)
    })

    it('should note a non-project path in help instead of aborting', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-help-'))
      nixt({ colors: false })
      .run(surge + proj + ' --help')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/not a surge project yet/)
        should(result.stdout).match(new RegExp(proj.replace(/[/\\]/g, '.') + ' publish'))
        should(result.stdout).match(new RegExp(proj.replace(/[/\\]/g, '.') + ' <domain>'))
        should(result.stdout).match(/ADMIN/)
        should(result.stdout).not.match(/COMMANDS/)
        should(result.stdout).not.match(/rollback/)
        should(result.stdout).not.match(/CNAME found/)
      }).end(done)
    })

    it('should error loudly for a verbless target in a pipeline', function (done) {
      nixt({ colors: false })
      .run(surge + 'verbless-target.example.com')
      .code(1)
      .expect(function (result) {
        should(result.stderr).match(/nothing to do/)
        should(result.stderr).match(/<path> verbless-target\.example\.com/)
      }).end(done)
    })

    it('should refuse a dns path with no CNAME', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-dns-'))
      nixt({ colors: false })
      .run(surge + 'dns ' + proj + ' list')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/is not a surge project/)
      }).end(done)
    })

    it('should print dns usage and name servers for bare surge dns', function (done) {
      nixt({ colors: false })
      .run(surge + 'dns')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/<domain> dns add <type> <name> <value>/)
        should(result.stdout).match(/ns1\.surge\.world/)
      }).end(done)
    })

  })

  describe("wizards", function(){
    var subdomain = testid + "-one"
    var domain = subdomain + ".surge.sh"
    var resultedDomain
    var proj = makeProject()

    it('should create project', function (done) {
      nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'publish')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project:.*/).respond(proj + '\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        should(result.stdout).match(/domain written to/)
        fs.readFileSync(path.join(proj, 'CNAME'), 'utf8').should.equal(domain + '\n')
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
      .run(surge + 'publish')
      .on(/.*email:.*/).respond(user + '\n')
      .on(/.*password:.*/).respond(pass + '\n')
      .on(/.*project:.*/).respond(proj + '\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).not.match(/domain written to/)
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
      .code(1)
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
    var resultedDomain, generatedDomain
    var proj = makeProject()

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
      .run(surge + 'publish')
      .on(/.*project:.*/).respond(proj + '\n')
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
      .run(surge + 'publish')
      .on(/.*project:.*/).respond(proj + '\n')
      .on(/.*domain:.*/).respond(domain + "\n")
      .expect(function (result) {
        should(result.stdout).not.match(new RegExp(pass))
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        resultedDomain = result.stdout.split('Success! - Published to')[1].trim().split(/\s+/)[0]
        resultedDomain.should.equal(domain)
      }).end(done)
    })

    it('should refuse a --force value that is not https or http before uploading', function (done) {
      nixt(opts)
      .run(surge + proj + ' ' + domain + ' --force nope')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`--force` takes https or http/)
        should(result.stdout).not.match(/Success/)
      }).end(done)
    })

    // a new .surge.sh domain already forces https, so http is the value
    // that proves the publish flag landed
    it('should take --force at publish', function (done) {
      nixt(opts)
      .run(surge + proj + ' ' + domain + ' --force http')
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
      }).end(done)
    })

    it('should keep the published --force as configuration', function (done) {
      nixt(opts)
      .run(surge + domain + ' config')
      .expect(function (result) {
        should(result.stdout).match(/force\s*:?\s*http(?!s)/)
      }).end(done)
    })

    // bare `surge account` still answers, but the identity verbs are flat
    // now, so the screen teaches `surge whoami`, not `surge account whoami`
    it('should print account usage for bare surge account', function (done) {
      nixt(opts)
      .run(surge + 'account')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(/surge whoami/)
        should(result.stdout).match(/surge nuke/)
        should(result.stdout).not.match(/surge account whoami/)
      }).end(done)
    })

    it('should list revisions with surge revs', function (done) {
      nixt(opts)
      .run(surge + 'revs ' + domain)
      .expect(function (result) {
        should(result.stdout).match(new RegExp(subdomain))
      }).end(done)
    })

    it('should render bare debug usage against the local CNAME domain', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-cname-'))
      fs.writeFileSync(path.join(proj, 'CNAME'), domain + '\n')
      nixt(opts)
      .cwd(proj)
      .run('node ' + path.resolve(pkg.bin) + endpoint + 'debug')
      .code(0)
      .expect(function (result) {
        should(result.stdout).match(new RegExp(domain + ' \\(CNAME found\\)'))
        should(result.stdout).match(/debug status/)
        should(result.stdout).not.match(/\[<domain>\]/)
      }).end(done)
    })

    it('should infer the domain from a CNAME for debug status', function (done) {
      var proj = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-cname-'))
      fs.writeFileSync(path.join(proj, 'CNAME'), domain + '\n')
      nixt(opts)
      .cwd(proj)
      .run('node ' + path.resolve(pkg.bin) + endpoint + 'debug status')
      .expect(function (result) {
        should(result.stdout).match(new RegExp(subdomain))
      }).end(done)
    })

    it('should publish the cwd via the pair', function (done) {
      var dir = makeProject()
      nixt(opts)
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + '. ' + domain)
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        fs.readFileSync(path.join(dir, 'CNAME'), 'utf8').should.equal(domain + '\n')
      }).end(done)
    })

    it('should publish to a generated domain via _ with no prompt', function (done) {
      var dir = makeProject()
      nixt(opts)
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + '. _')
      .expect(function (result) {
        should(result.stdout).match(/Success! - Published to [a-z0-9-]+\.surge\.sh/)
        generatedDomain = result.stdout.match(/Published to ([a-z0-9-]+\.surge\.sh)/)[1]
        fs.readFileSync(path.join(dir, 'CNAME'), 'utf8').should.equal(generatedDomain + '\n')
      }).end(done)
    })

    it('should teardown the generated domain', function (done) {
      nixt(opts)
      .run(surge + generatedDomain + ' teardown')
      .expect(function (result) {
        should(result.stdout).match(/has been removed/)
      }).end(done)
    })

    it('should publish through the deploy alias', function (done) {
      var dir = makeProject()
      fs.writeFileSync(path.join(dir, 'CNAME'), domain + '\n')
      nixt(opts)
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + '. deploy')
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
      }).end(done)
    })

    // 0.40.0 regressed these: a path target with publish-intent flags
    // fell through to the verbless overview instead of publishing
    it('should publish a path target with a -d domain flag', function (done) {
      var dir = makeProject()
      nixt(opts)
      .run(surge + dir + ' -d ' + domain)
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
      }).end(done)
    })

    it('should publish a path target with a --domain flag', function (done) {
      var dir = makeProject()
      nixt(opts)
      .run(surge + dir + ' --domain ' + domain)
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
      }).end(done)
    })

    it('should preview-publish a path target with --preview', function (done) {
      var dir = makeProject()
      fs.writeFileSync(path.join(dir, 'CNAME'), domain + '\n')
      nixt(opts)
      .run(surge + dir + ' --preview')
      .expect(function (result) {
        should(result.stdout).match(/available at [0-9]+-/)
        should(result.stdout).not.match(/nothing to do/)
      }).end(done)
    })

    // flags with no -p still prompt for the project, as they always have
    it('should route to publish from publish flags alone', function (done) {
      var dir = makeProject()
      fs.writeFileSync(path.join(dir, 'CNAME'), domain + '\n')
      nixt(opts)
      .cwd(dir)
      .run('node ' + path.resolve(pkg.bin) + endpoint + '-m flags-only')
      .on(/.*project:.*/).respond(dir + '\n')
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        should(result.stdout).not.match(/requires a path/)
      }).end(done)
    })

    // Doug Donohoe's CI form: flag before the path, and the failed-build
    // case where the directory does not exist yet
    it('should publish with the domain flag before the path', function (done) {
      var dir = makeProject()
      nixt(opts)
      .run(surge + '--domain ' + domain + ' ' + dir)
      .expect(function (result) {
        should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        should(result.stdout).not.match(/nothing to do/)
      }).end(done)
    })

    it('should report a missing project dir as missing, not a bad command', function (done) {
      nixt({ colors: false })
      .run(surge + '--domain ' + domain + ' export/missing')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/No such file or directory/)
        should(result.stdout).not.match(/is not a surge command/)
      }).end(done)
    })

    it('should still catch a bad flag on a path target', function (done) {
      nixt({ colors: false })
      .run(surge + '. --badflag')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/`badflag` is not a surge argument/)
      }).end(done)
    })

    it('should refuse publish against a domain target', function (done) {
      nixt({ colors: false })
      .run(surge + domain + ' publish')
      .code(1)
      .expect(function (result) {
        should(result.stdout).match(/publish takes a path/)
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
    var proj = makeProject()

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
        .run(surge + 'tokens list')
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
        .run(surge + proj + ' ' + domain)
        .expect(function (result) {
          should(result.stdout).not.match(/email:/)
          should(result.stdout).match(new RegExp("Success! - Published to " + domain))
        }).end(done)
    })

    it('should not publish out of scope', function (done) {
      nixt(opts)
        .run(surge + proj + ' ' + otherDomain)
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

    it('should still list through the all alias', function (done) {
      nixt(opts)
        .run(surge + 'tokens all')
        .expect(function (result) {
          should(result.stdout).match(new RegExp("tok-" + scopedToken.slice(0, 8)))
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

  // the test account's email is never verified, so creating stops at the
  // verification refusal - the api suite covers create and rename
  describe('orgs', function () {
    it('should list no orgs and show the way in', function (done) {
      nixt(opts)
        .run(surge + 'orgs')
        .expect(function (result) {
          should(result.stdout).match(/Empty/)
          should(result.stdout).match(/orgs <org> create/)
          should(result.stdout).match(/orgs <org> rename <slug>/)
          should(result.stdout).match(/orgs <org> remove/)
          should(result.stdout).match(/orgs <org> invite \[--admin\]/)
          should(result.stdout).not.match(/members <email> invite/)
        }).end(done)
    })

    it('should still list through the list alias', function (done) {
      nixt(opts)
        .run(surge + 'orgs list')
        .expect(function (result) {
          should(result.stdout).match(/Empty/)
        }).end(done)
    })

    it('should refuse creating an org before the email is verified', function (done) {
      nixt(opts)
        .run(surge + 'orgs ' + testid + ' create')
        .code(1)
        .expect(function (result) {
          should(result.stdout).match(/email must be verified/)
          should(result.stdout).not.match(/Insufficient permission/)
        }).end(done)
    })

    it('should not find an org the account is not in', function (done) {
      nixt(opts)
        .run(surge + 'orgs ' + testid)
        .code(1)
        .expect(function (result) {
          should(result.stdout).match(/org does not exist/)
        }).end(done)
    })

    it('should not list members of an org the account is not in', function (done) {
      nixt(opts)
        .run(surge + 'orgs ' + testid + ' members')
        .code(1)
        .expect(function (result) {
          should(result.stdout).match(/org does not exist/)
        }).end(done)
    })

    it('should refuse joining with a code that is not valid', function (done) {
      nixt(opts)
        .run(surge + 'orgs ' + testid + ' join aaaa-bbbb-cccc-dddd')
        .code(1)
        .expect(function (result) {
          // every run spends one of the 10 failed claims an ip gets an hour;
          // past that the api says so instead, which is printed the same way
          should(result.stdout).match(/invite is not valid|too many codes that didn't work/)
        }).end(done)
    })

    it('should not remove an org the account is not in', function (done) {
      nixt(opts)
        .run(surge + 'orgs ' + testid + ' remove')
        .code(1)
        .expect(function (result) {
          should(result.stdout).match(/org does not exist/)
        }).end(done)
    })
  })

  describe('status', function () {
    var customDomain = testid + "-status.lvh.me"
    var proj = makeProject()

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
        .run(surge + proj + ' ' + customDomain)
        .expect(function (result) {
          should(result.stdout).match(new RegExp("Success! - Published to " + customDomain))
          should(result.stdout).match(/not resolving to Surge/)
          should(result.stdout).match(/waiting on dns/)
          should(result.stdout).match(/CNAME geo\.surge\.world/)
          // the old records block below the result is gone
          should(result.stdout).not.match(/not pointed at surge yet/)
        }).end(done)
    })

    it('should reach status target-first', function (done) {
      nixt(opts)
        .run(surge + customDomain + ' debug status')
        .expect(function (result) {
          should(result.stdout).match(/waiting on dns/)
        }).end(done)
    })

    it('should show debug usage for a verbless target noun', function (done) {
      nixt(opts)
        .run(surge + customDomain + ' debug')
        .code(0)
        .expect(function (result) {
          should(result.stdout).match(new RegExp(customDomain + ' debug status'))
          should(result.stdout).not.match(/waiting on dns/)
        }).end(done)
    })

    it('should render traffic target-first', function (done) {
      nixt(opts)
        .run(surge + customDomain + ' stats traffic')
        .expect(function (result) {
          should(result.stdout).match(/TRAFFIC/i)
          should(result.stdout).not.match(/Error/)
        }).end(done)
    })

    it('should reach status through the legacy verb-first order', function (done) {
      nixt(opts)
        .run(surge + 'debug ' + customDomain + ' status')
        .expect(function (result) {
          should(result.stdout).match(/waiting on dns/)
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
        .run(surge + proj + ' ' + domain)
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
        .code(1)
        .expect(function (result) {
          should(result.stdout).match(/Not Authenticated/)
        }).end(done)
    })
  })

})
