var should = require('should')
var fs = require('fs')
var os = require('os')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')
var credsPath = path.join(root, 'lib', 'util', 'creds.js')
var endpoint = { host: 'surge.surge.sh' }

describe('creds', function () {

  var home, netrcPath

  var creds = function () {
    delete require.cache[require.resolve(credsPath)]
    return require(credsPath)(endpoint)
  }

  beforeEach(function () {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-creds-'))
    netrcPath = path.join(home, '.netrc')
    process.env.HOME = process.env.USERPROFILE = home
  })

  it('creates a new .netrc with mode 600 and round-trips get()', function () {
    creds().set('a@b.com', 'tok123')
    var mode = fs.statSync(netrcPath).mode & parseInt('777', 8)
    mode.should.equal(parseInt('600', 8))
    creds().get().should.eql({ email: 'a@b.com', token: 'tok123' })
  })

  it('preserves other machine entries on set()', function () {
    fs.writeFileSync(netrcPath, 'machine github.com\n    login gh\n    password ghtoken\n')
    creds().set('a@b.com', 'tok456')
    var content = fs.readFileSync(netrcPath, 'utf8')
    content.should.match(/machine github\.com/)
    content.should.match(/ghtoken/)
    content.should.match(/tok456/)
  })

  it('set(null) removes only the surge entry', function () {
    fs.writeFileSync(netrcPath, 'machine github.com\n    login gh\n    password ghtoken\n')
    creds().set('a@b.com', 'tok456')
    creds().set(null)
    var content = fs.readFileSync(netrcPath, 'utf8')
    content.should.match(/ghtoken/)
    content.should.not.match(/tok456/)
  })

  it('get() returns null when .netrc is missing', function () {
    should(creds().get()).equal(null)
  })

  it('get() returns null when .netrc cannot be parsed', function () {
    fs.writeFileSync(netrcPath, 'default login foo password bar\n')
    should(creds().get()).equal(null)
  })

  it('set() refuses to rewrite an unparseable .netrc and exits 1', function () {
    fs.writeFileSync(netrcPath, 'default login foo password bar\n')
    var before = fs.readFileSync(netrcPath, 'utf8')

    // set() calls process.exit(1), so exercise it in a subprocess
    var script = 'require(' + JSON.stringify(credsPath) + ')({host:"surge.surge.sh"}).set("x@y.com","t")'
    var code = 0, out = ''
    try {
      execFileSync(process.execPath, ['-e', script], {
        env: Object.assign({}, process.env, { HOME: home, USERPROFILE: home }),
        encoding: 'utf8'
      })
    } catch (e) {
      code = e.status
      out = (e.stdout || '') + (e.stderr || '')
    }
    code.should.equal(1)
    out.should.match(/Refusing to modify/)
    fs.readFileSync(netrcPath, 'utf8').should.equal(before)
  })

})
