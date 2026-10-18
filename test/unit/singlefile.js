var should = require('should')
var fs = require('fs')
var os = require('os')
var path = require('path')

var root = path.join(__dirname, '..', '..')
var helpers = require(path.join(root, 'lib', 'util', 'helpers.js'))
var project = require(path.join(root, 'lib', 'middleware', '_shared', '_project.js'))
var discovery = require(path.join(root, 'lib', 'middleware', '_shared', 'discovery.js'))

// a project is a directory, or a single file the sdk publishes as a
// one-file project (surge-stream lib/project.js): `surge page.html` sends
// the page as index.html; any other single file is refused here, before
// the domain prompt. A single file never takes its domain from the cwd.
describe('single-file publish', function () {

  var tmp, cwd, realRead, realLog

  var runProject = function (arg, done) {
    var req = { argv: { _: [arg] }, configuration: {}, project: null }
    project(req, function () { done(null, req) }, function (msg) { done(null, { aborted: String(msg) }) })
  }

  beforeEach(function () {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-single-'))
    cwd = process.cwd()
    process.chdir(tmp)
    realRead = helpers.read
    realLog = helpers.log
    helpers.log = function () {}
  })

  var made = []

  afterEach(function () {
    process.chdir(cwd)
    helpers.read = realRead
    helpers.log = realLog
    ;[tmp].concat(made).forEach(function (d) { fs.rmSync(d, { recursive: true, force: true }) })
    made = []
  })

  it('passes an html file through to the sdk as the project', function (done) {
    fs.writeFileSync(path.join(tmp, 'page.html'), '<h1>hi</h1>')
    runProject('page.html', function (err, req) {
      should.not.exist(req.aborted)
      req.singleFile.should.equal(path.resolve('page.html'))
      req.project.should.equal(path.resolve('page.html'))
      done()
    })
  })

  it('accepts .htm in any case', function (done) {
    fs.writeFileSync(path.join(tmp, 'OLD.HTM'), 'x')
    runProject('OLD.HTM', function (err, req) {
      should.not.exist(req.aborted)
      req.singleFile.should.equal(path.resolve('OLD.HTM'))
      done()
    })
  })

  it('refuses any other single file with the shared rule, before the domain prompt', function (done) {
    fs.writeFileSync(path.join(tmp, 'report.pdf'), '%PDF')
    runProject('report.pdf', function (err, r) {
      r.aborted.should.containEql('A project is a directory - put report.pdf in a folder and publish the folder.')
      done()
    })
  })

  it('leaves a directory exactly as before', function (done) {
    fs.mkdirSync(path.join(tmp, 'dist'))
    runProject('dist', function (err, req) {
      should.not.exist(req.singleFile)
      req.project.should.equal(path.resolve('dist'))
      done()
    })
  })

  describe('domain', function () {

    var resolve = function (r, opts, done) {
      discovery.resolve(opts)(r,
        function () { done(null, { domain: r.domain }) },
        function (msg) { done(null, { aborted: String(msg) }) })
    }

    var single = function (file) {
      return {
        argv: { _: [] }, configuration: { platform: 'surge.sh' },
        domain: null, project: made[made.push(fs.mkdtempSync(path.join(os.tmpdir(), 'surge-'))) - 1], singleFile: file
      }
    }

    it('never takes the cwd project\'s domain', function (done) {
      fs.writeFileSync(path.join(tmp, 'CNAME'), 'someone-elses.example.com\n')
      resolve(single(path.join(tmp, 'page.html')), { positional: false }, function (err, r) {
        should.not.exist(r.domain)
        r.aborted.should.containEql('No domain found')
        done()
      })
    })

    it('suggests a domain from the file name', function (done) {
      fs.writeFileSync(path.join(tmp, 'CNAME'), 'someone-elses.example.com\n')
      helpers.read = function (opts, cb) { cb(null, opts.default) }
      resolve(single(path.join(tmp, 'Launch Page.html')), { positional: false, prompt: true, generate: true }, function (err, r) {
        r.domain.should.equal('launch-page.surge.sh')
        done()
      })
    })

    it('suggests the folder name for an index.html', function (done) {
      var d = path.join(tmp, 'portfolio')
      fs.mkdirSync(d)
      helpers.read = function (opts, cb) { cb(null, opts.default) }
      resolve(single(path.join(d, 'index.html')), { positional: false, prompt: true, generate: true }, function (err, r) {
        r.domain.should.equal('portfolio.surge.sh')
        done()
      })
    })

    it('uses a domain that was given', function (done) {
      var r = single(path.join(tmp, 'page.html'))
      r.domain = 'given.example.com'
      resolve(r, { positional: false }, function (err, res) {
        res.domain.should.equal('given.example.com')
        done()
      })
    })
  })
})
