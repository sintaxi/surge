var should = require('should')
var fs = require('fs')
var os = require('os')
var path = require('path')

var root = path.join(__dirname, '..', '..')
var helpers = require(path.join(root, 'lib', 'util', 'helpers.js'))
var discovery = require(path.join(root, 'lib', 'middleware', '_shared', 'discovery.js'))

describe('discovery.resolve', function () {

  var tmp, cwd, realRead

  var req = function (args, extra) {
    return Object.assign({
      argv: { _: args || [] },
      configuration: { platform: 'surge.sh' },
      domain: null,
      project: null
    }, extra || {})
  }

  // runs the middleware and reports which way it exited
  var run = function (opts, r, done) {
    discovery.resolve(opts)(r,
      function () { done(null, { domain: r.domain, source: r.domainSource }) },
      function (msg) { done(null, { aborted: String(msg) }) })
  }

  var dir = function (name, files) {
    var d = path.join(tmp, name)
    fs.mkdirSync(d, { recursive: true })
    Object.keys(files || {}).forEach(function (f) {
      fs.writeFileSync(path.join(d, f), files[f])
    })
    return d
  }

  beforeEach(function () {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'surge-resolve-'))
    cwd = process.cwd()
    process.chdir(tmp)
    realRead = helpers.read
  })

  afterEach(function () {
    process.chdir(cwd)
    helpers.read = realRead
  })

  it('uses a valid positional domain', function (done) {
    run({}, req(['example.com']), function (err, r) {
      r.should.eql({ domain: 'example.com', source: 'arg' })
      done()
    })
  })

  it('uses a pre-set req.domain from a flag or shorthand', function (done) {
    run({}, req([], { domain: 'flagged.com' }), function (err, r) {
      r.should.eql({ domain: 'flagged.com', source: 'arg' })
      done()
    })
  })

  it('generates a platform domain for "_"', function (done) {
    run({}, req(['_']), function (err, r) {
      r.source.should.equal('generated')
      r.domain.should.endWith('.surge.sh')
      done()
    })
  })

  it('reads CNAME from a path argument', function (done) {
    dir('proj', { CNAME: 'from-cname.com\n' })
    run({}, req(['proj']), function (err, r) {
      r.should.eql({ domain: 'from-cname.com', source: 'cname' })
      done()
    })
  })

  it('reads package.json surge.domain when the path has no CNAME', function (done) {
    dir('proj', { 'package.json': JSON.stringify({ surge: { domain: 'from-pkg.com' } }) })
    run({}, req(['proj']), function (err, r) {
      r.should.eql({ domain: 'from-pkg.com', source: 'pkg' })
      done()
    })
  })

  it('CNAME wins over package.json', function (done) {
    dir('proj', {
      CNAME: 'from-cname.com\n',
      'package.json': JSON.stringify({ surge: { domain: 'from-pkg.com' } })
    })
    run({}, req(['proj']), function (err, r) {
      r.domain.should.equal('from-cname.com')
      done()
    })
  })

  it('a valid domain beats a same-named directory', function (done) {
    dir('example.com', { CNAME: 'other.com\n' })
    run({}, req(['example.com']), function (err, r) {
      r.should.eql({ domain: 'example.com', source: 'arg' })
      done()
    })
  })

  it('a ./ prefix forces the path reading', function (done) {
    dir('example.com', { CNAME: 'other.com\n' })
    run({}, req(['./example.com']), function (err, r) {
      r.should.eql({ domain: 'other.com', source: 'cname' })
      done()
    })
  })

  it('aborts when a path argument has no CNAME', function (done) {
    dir('empty')
    run({}, req(['empty']), function (err, r) {
      r.aborted.should.match(/No CNAME found in empty/)
      done()
    })
  })

  it('aborts on a forced path that does not exist', function (done) {
    run({}, req(['./missing']), function (err, r) {
      r.aborted.should.match(/No such directory/)
      done()
    })
  })

  it('takes only the first line of a CNAME', function (done) {
    dir('proj', { CNAME: 'first.com\nsecond.com\n' })
    run({}, req(['proj']), function (err, r) {
      r.domain.should.equal('first.com')
      done()
    })
  })

  it('ignores an invalid CNAME and falls through to package.json', function (done) {
    dir('proj', {
      CNAME: 'not a domain\n',
      'package.json': JSON.stringify({ surge: { domain: 'from-pkg.com' } })
    })
    run({}, req(['proj']), function (err, r) {
      r.should.eql({ domain: 'from-pkg.com', source: 'pkg' })
      done()
    })
  })

  it('with no argument infers from req.project', function (done) {
    var d = dir('proj', { CNAME: 'project-cname.com\n' })
    run({}, req([], { project: d }), function (err, r) {
      r.should.eql({ domain: 'project-cname.com', source: 'cname' })
      done()
    })
  })

  it('falls back to cwd when the project directory has nothing', function (done) {
    var d = dir('dist')
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ surge: { domain: 'cwd-pkg.com' } }))
    run({}, req([], { project: d }), function (err, r) {
      r.should.eql({ domain: 'cwd-pkg.com', source: 'pkg' })
      done()
    })
  })

  it('positional false leaves argv._ alone', function (done) {
    var d = dir('dist', { CNAME: 'dist-cname.com\n' })
    run({ positional: false }, req(['ignored.com'], { project: d }), function (err, r) {
      r.should.eql({ domain: 'dist-cname.com', source: 'cname' })
      done()
    })
  })

  it('aborts when unresolved and prompting is off', function (done) {
    run({}, req([]), function (err, r) {
      r.aborted.should.match(/No domain found/)
      done()
    })
  })

  it('prompts when unresolved and prompting is on', function (done) {
    helpers.read = function (opts, cb) { cb(null, 'typed.com') }
    run({ prompt: true }, req([]), function (err, r) {
      r.should.eql({ domain: 'typed.com', source: 'prompt' })
      done()
    })
  })

  it('marks an accepted generated suggestion as generated', function (done) {
    helpers.read = function (opts, cb) { cb(null, opts.default) }
    run({ prompt: true, generate: true }, req([]), function (err, r) {
      r.source.should.equal('generated')
      r.domain.should.endWith('.surge.sh')
      done()
    })
  })

  it('re-prompts until the domain is valid', function (done) {
    var answers = ['not a domain', 'valid.com']
    helpers.read = function (opts, cb) { cb(null, answers.shift()) }
    run({ prompt: true }, req([]), function (err, r) {
      r.should.eql({ domain: 'valid.com', source: 'prompt' })
      done()
    })
  })

  it('prompts with a non-domain non-path argument as the draft', function (done) {
    var drafts = []
    helpers.read = function (opts, cb) { drafts.push(opts.default); cb(null, 'fixed.com') }
    run({ prompt: true }, req(['not_a_domain']), function (err, r) {
      drafts[0].should.equal('not_a_domain')
      r.domain.should.equal('fixed.com')
      done()
    })
  })

  it('aborts when the prompt is cancelled', function (done) {
    helpers.read = function (opts, cb) { cb(null, undefined) }
    run({ prompt: true }, req([]), function (err, r) {
      r.aborted.should.match(/Not initiated/)
      done()
    })
  })

})
