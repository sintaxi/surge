var should = require('should')
var fs = require('fs')
var os = require('os')
var path = require('path')

var root = path.join(__dirname, '..', '..')
var project = require(path.join(root, 'lib', 'middleware', '_shared', '_project.js'))

// the cwd may only become the publish root on the strength of a CNAME.
// surge writes that file into the directory it published, so it is
// evidence of the content root. a package.json domain names a domain
// without saying which directory holds the content - and it lives in the
// source root - so it must fall through to the prompt instead of putting
// a source tree on the public internet.
describe('_project cwd inference', function () {

  var tmp, cwd

  var run = function (files, done) {
    Object.keys(files).forEach(function (f) {
      fs.writeFileSync(path.join(tmp, f), files[f])
    })
    var req = {
      argv: { _: [] },
      configuration: {},
      project: null,
      read: function (opts, cb) { done(null, { prompted: true, def: opts.default }) }
    }
    project(req, function () { done(null, { project: req.project }) }, function (msg) {
      done(null, { aborted: String(msg) })
    })
  }

  beforeEach(function () {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-root-'))
    cwd = process.cwd()
    process.chdir(tmp)
  })

  afterEach(function () { process.chdir(cwd) })

  it('publishes the cwd when it carries a CNAME', function (done) {
    run({ CNAME: 'root-check.example.com\n' }, function (err, r) {
      should(r.prompted).equal(undefined)
      r.project.should.equal(fs.realpathSync(tmp))
      done()
    })
  })

  it('prompts when the cwd only declares a domain in package.json', function (done) {
    run({ 'package.json': JSON.stringify({ surge: { domain: 'root-check.example.com' } }) }, function (err, r) {
      r.prompted.should.equal(true)
      should(r.project).not.be.ok()
      done()
    })
  })

  it('prompts in a directory with no identity at all', function (done) {
    run({ 'index.html': '<h1>hi</h1>' }, function (err, r) {
      r.prompted.should.equal(true)
      done()
    })
  })

  it('prompts when the CNAME is not a valid domain', function (done) {
    run({ CNAME: 'not a domain\n' }, function (err, r) {
      r.prompted.should.equal(true)
      done()
    })
  })

})
