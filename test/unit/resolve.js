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

  it('shifts a consumed positional domain off argv._', function (done) {
    var r = req(['example.com', 'a@b.com'])
    run({}, r, function () {
      r.argv._.should.eql(['a@b.com'])
      done()
    })
  })

  it('shifts a consumed path argument off argv._', function (done) {
    dir('proj', { CNAME: 'from-cname.com\n' })
    var r = req(['proj', '12345'])
    run({}, r, function () {
      r.argv._.should.eql(['12345'])
      done()
    })
  })

  it('leaves a trailing arg alone in extras mode and infers instead', function (done) {
    fs.writeFileSync(path.join(tmp, 'CNAME'), 'cwd-cname.com\n')
    var r = req(['12345'])
    run({ extras: true }, r, function (err, res) {
      res.should.eql({ domain: 'cwd-cname.com', source: 'cname' })
      r.argv._.should.eql(['12345'])
      done()
    })
  })

  it('never reads an email as the domain', function (done) {
    fs.writeFileSync(path.join(tmp, 'CNAME'), 'cwd-cname.com\n')
    var r = req(['a@b.com'])
    run({ extras: true }, r, function (err, res) {
      res.should.eql({ domain: 'cwd-cname.com', source: 'cname' })
      r.argv._.should.eql(['a@b.com'])
      done()
    })
  })

  it('picks up a --domain flag', function (done) {
    var r = req([])
    r.argv.domain = 'flagged.com'
    run({}, r, function (err, res) {
      res.should.eql({ domain: 'flagged.com', source: 'arg' })
      done()
    })
  })

  it('exposes local() for dispatchers', function (done) {
    dir('proj', { CNAME: 'local-cname.com\n' })
    should(discovery.local(path.join(tmp, 'proj'))).eql({ domain: 'local-cname.com', source: 'cname' })
    should(discovery.local(tmp)).equal(null)
    done()
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

  it('suggests the project directory name as the subdomain', function (done) {
    var d = dir('coolapp')
    var suggested
    helpers.read = function (opts, cb) { suggested = opts.default; cb(null, 'typed.com') }
    run({ prompt: true, generate: true }, req([], { project: d }), function () {
      suggested.should.equal('coolapp.surge.sh')
      done()
    })
  })

  it('climbs out of a build-output dir to the project name', function (done) {
    var d = dir('coolapp/dist')
    var suggested
    helpers.read = function (opts, cb) { suggested = opts.default; cb(null, 'typed.com') }
    run({ prompt: true, generate: true }, req([], { project: d }), function () {
      suggested.should.equal('coolapp.surge.sh')
      done()
    })
  })

  it('slugifies awkward directory names', function (done) {
    var d = dir('My App!')
    var suggested
    helpers.read = function (opts, cb) { suggested = opts.default; cb(null, 'typed.com') }
    run({ prompt: true, generate: true }, req([], { project: d }), function () {
      suggested.should.equal('my-app.surge.sh')
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

  it('does not re-log a prompted domain - the prompt echo already shows it', function (done) {
    var logged = []
    var realLog = helpers.log
    helpers.log = function () { logged.push([].slice.call(arguments).join(' ')) }
    helpers.read = function (opts, cb) { cb(null, 'typed.com') }
    run({ prompt: true, log: true }, req([]), function (err, r) {
      helpers.log = realLog
      r.domain.should.equal('typed.com')
      logged.filter(function (l) { return l.indexOf('typed.com') !== -1 }).should.have.length(0)
      done()
    })
  })

  it('logs an inferred domain when log is on', function (done) {
    var logged = []
    var realLog = helpers.log
    helpers.log = function () { logged.push([].slice.call(arguments).join(' ')) }
    dir('proj', { CNAME: 'from-cname.com\n' })
    run({ log: true }, req(['proj']), function (err, r) {
      helpers.log = realLog
      logged.filter(function (l) { return l.indexOf('from-cname.com') !== -1 }).should.have.length(1)
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
