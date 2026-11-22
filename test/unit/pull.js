var should = require('should')
var fs = require('fs')
var os = require('os')
var path = require('path')
var { execFileSync } = require('child_process')

var root = path.join(__dirname, '..', '..')
var pull = require('../../lib/middleware/pull')

// pull: where it goes (target), and what it prints. The comparing and
// writing are surge-stream's and tested there; here the sdk is a stand-in

describe('pull', function () {
  var tmp

  before(function () { tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'surge-pull-'))) })
  after(function () { fs.rmSync(tmp, { recursive: true, force: true }) })

  var n = 0
  // a directory with these files; { CNAME: "a.com\n" } makes it a project
  var dir = function (files, name) {
    var d = path.join(tmp, name || 'd' + (n++))
    fs.mkdirSync(d, { recursive: true })
    Object.keys(files || {}).forEach(function (f) { fs.writeFileSync(path.join(d, f), files[f]) })
    return d
  }

  describe('target', function () {

    it('pulls a project from its own domain when nothing is named', function () {
      var cwd = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: [] }, cwd).should.eql({ domain: 'a.example.com', dir: cwd, rev: null, fresh: false })
    })

    it('takes a revision', function () {
      var cwd = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: ['1690123456789'] }, cwd).rev.should.equal('1690123456789')
      pull.target({ _: [1690123456789] }, cwd).rev.should.equal('1690123456789')
      pull.target({ _: ['a.example.com', '1690123456789'] }, cwd).should.eql({ domain: 'a.example.com', dir: cwd, rev: '1690123456789', fresh: false })
    })

    it('reads the domain from package.json when there is no CNAME', function () {
      var cwd = dir({ 'package.json': JSON.stringify({ surge: { domain: 'pkg.example.com' } }) })
      pull.target({ _: [] }, cwd).domain.should.equal('pkg.example.com')
    })

    it('pulls in place when the domain named is the project\'s own', function () {
      var cwd = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: ['a.example.com'] }, cwd).should.eql({ domain: 'a.example.com', dir: cwd, rev: null, fresh: false })
    })

    it('never pulls one project\'s domain into another\'s directory', function () {
      var cwd = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: ['b.example.com'] }, cwd).abort.should.match(/this project is a\.example\.com, not b\.example\.com/)
      var other = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: ['b.example.com'], project: other }, dir()).abort.should.match(/is a\.example\.com, not b\.example\.com/)
    })

    it('makes ./<domain> when the cwd is not a project', function () {
      var cwd = dir({ 'notes.txt': 'unrelated' })
      pull.target({ _: ['a.example.com'] }, cwd).should.eql({ domain: 'a.example.com', dir: path.join(cwd, 'a.example.com'), rev: null, fresh: true })
    })

    it('goes back into a ./<domain> that is already this project', function () {
      var cwd = dir()
      var there = dir({ CNAME: 'a.example.com\n', 'index.html': 'x' }, path.basename(cwd) + '/a.example.com')
      pull.target({ _: ['a.example.com'] }, cwd).should.eql({ domain: 'a.example.com', dir: there, rev: null, fresh: false })
    })

    it('takes an empty ./<domain>, or one holding only what a pull leaves', function () {
      var cwd = dir()
      fs.mkdirSync(path.join(cwd, 'a.example.com', '.surge'), { recursive: true })
      pull.target({ _: ['a.example.com'] }, cwd).fresh.should.equal(true)
    })

    it('refuses a ./<domain> that has other things in it', function () {
      var cwd = dir()
      dir({ 'index.html': 'something else' }, path.basename(cwd) + '/a.example.com')
      pull.target({ _: ['a.example.com'] }, cwd).abort.should.match(/exists and isn't this project - `-p <dir>`/)
      dir({ CNAME: 'b.example.com\n' }, path.basename(cwd) + '/c.example.com')
      pull.target({ _: ['c.example.com'] }, cwd).abort.should.match(/is b\.example\.com, not c\.example\.com/)
    })

    it('pulls into the directory -p names, whatever is in it', function () {
      var cwd = dir()
      var named = dir({ 'index.html': 'something else' })
      pull.target({ _: ['a.example.com'], project: named }, cwd).should.eql({ domain: 'a.example.com', dir: named, rev: null, fresh: true })
      var missing = path.join(cwd, 'not-yet')
      pull.target({ _: ['a.example.com'], project: missing }, cwd).should.eql({ domain: 'a.example.com', dir: missing, rev: null, fresh: true })
    })

    it('reads a path target as the project', function () {
      var cwd = dir()
      var proj = dir({ CNAME: 'a.example.com\n' }, path.basename(cwd) + '/proj')
      pull.target({ _: ['./proj'] }, cwd).should.eql({ domain: 'a.example.com', dir: proj, rev: null, fresh: false })
      pull.target({ _: ['./proj', '1690123456789'] }, cwd).rev.should.equal('1690123456789')
    })

    it('takes -d as the domain', function () {
      var cwd = dir()
      pull.target({ _: [], domain: 'a.example.com' }, cwd).dir.should.equal(path.join(cwd, 'a.example.com'))
    })

    it('drops an org prefix: a pull is about the domain', function () {
      var cwd = dir()
      pull.target({ _: ['acme:a.example.com'] }, cwd).domain.should.equal('a.example.com')
    })

    it('says so when there is nothing to go on', function () {
      var cwd = dir()
      pull.target({ _: [] }, cwd).abort.should.match(/No domain found/)
      dir({}, path.basename(cwd) + '/plain')
      pull.target({ _: ['./plain'] }, cwd).abort.should.match(/is not a surge project/)
      pull.target({ _: ['./nope'] }, cwd).abort.should.match(/No such directory/)
    })

    it('refuses what is not a revision', function () {
      var cwd = dir({ CNAME: 'a.example.com\n' })
      pull.target({ _: ['a.example.com', 'latest'] }, cwd).abort.should.match(/`latest` is not a revision/)
      pull.target({ _: ['a.example.com', '1', '2'] }, cwd).abort.should.match(/one revision/)
    })
  })

  describe('output', function () {

    // runs the middleware with an sdk whose pull emits these events
    var run = function (events, argv, pulled) {
      var script = `
        var EventEmitter = require("events")
        var sdkPath = require.resolve("surge-sdk")
        var seen = {}
        require.cache[sdkPath] = { exports: function(){ return {
          pull: function(dir, domain, auth, opts){
            console.log("CALL " + JSON.stringify([domain, auth, opts]))
            var em = new EventEmitter()
            process.nextTick(function(){
              ${JSON.stringify(events)}.forEach(function(e){ em.emit(e[0], e[1]) })
            })
            return em
          }
        }}}
        var skin = require("./lib/util/skin")
        var pull = require("./lib/middleware/pull")
        skin({
          endpoint: { format: function(){ return "https://x" } },
          configuration: { name: "surge" },
          pull: ${JSON.stringify(pulled)},
          argv: ${JSON.stringify(argv || { _: [] })},
          creds: { token: "t" }
        }, [pull.pull, function(){ console.log("NEXT") }])
      `
      try {
        return { out: execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8', env: Object.assign({}, process.env, { CI: '1' }) }), code: 0 }
      } catch (e) {
        return { out: String(e.stdout), code: e.status }
      }
    }

    var plan = function (over) {
      return Object.assign({
        rev: '1690123456789', metadata: { rev: 1690123456789, message: 'fix nav' },
        add: [], update: [], remove: [], unchanged: [], kept: [], extra: [], ignored: []
      }, over)
    }

    var into = function (fresh) {
      return { domain: 'a.example.com', dir: dir(), rev: null, fresh: !!fresh }
    }

    it('prints the revision, the counts and the result', function () {
      var p = plan({ add: ['/new.txt'], update: ['/a', '/b', '/c', '/d'], remove: ['/x', '/y'], unchanged: new Array(37).fill('/u') })
      var r = run([['plan', p], ['progress', { bytes: 10, total: 10, files: 5, of: 5 }], ['success', p]], null, into())
      r.code.should.equal(0)
      r.out.should.match(/domain:.* a\.example\.com/)
      r.out.should.match(/revision:.* 1690123456789.*fix nav/)
      r.out.should.match(/changed:.* 4 updated, 1 added, 2 removed.*\(37 unchanged\)/)
      r.out.should.match(/download:.* done/)
      r.out.should.match(/Success!.* - Pulled .*a\.example\.com.* into /)
      r.out.should.match(/NEXT/)
      r.out.should.not.match(/kept:|ignored:|--force/)
    })

    it('passes the token, the revision and force along', function () {
      var p = plan()
      var target = Object.assign(into(), { rev: '1690123456789' })
      run([['plan', p], ['success', p]], { _: [], force: true }, target).out
        .should.match(/CALL \["a\.example\.com",\{"user":"token","pass":"t"\},\{"rev":"1690123456789","force":true\}\]/)
      run([['plan', p], ['success', p]], { _: [] }, into()).out
        .should.match(/\{"rev":null,"force":false\}/)
    })

    it('says unchanged when there was nothing to pull', function () {
      var p = plan({ unchanged: ['/a', '/b'] })
      var r = run([['plan', p], ['success', p]], null, into())
      r.code.should.equal(0)
      r.out.should.match(/changed:.* 0 files.*\(2 unchanged\)/)
      r.out.should.match(/Unchanged.* has nothing to pull from /)
      r.out.should.not.match(/Success/)
    })

    it('names what was kept and how to take the domain\'s copy', function () {
      var p = plan({ update: ['/a'], kept: [{ path: '/index.html', why: 'modified' }, { path: '/css/app.css', why: 'deleted' }] })
      var r = run([['plan', p], ['success', p]], null, into())
      r.out.should.match(/kept:.* index\.html, css\/app\.css.*\(changed here\)/)
      r.out.should.match(/`--force` takes the domain's copy/)
    })

    it('doesn\'t offer force for a file the domain dropped', function () {
      var p = plan({ update: ['/a'], kept: [{ path: '/old.html', why: 'gone' }] })
      var r = run([['plan', p], ['success', p]], null, into())
      r.out.should.match(/kept:.* old\.html/)
      r.out.should.not.match(/--force/)
    })

    it('shortens a long list', function () {
      var p = plan({ update: ['/a'], ignored: ['/.a', '/.b', '/.c', '/.d', '/.e', '/.f', '/.g'] })
      run([['plan', p], ['success', p]], null, into()).out
        .should.match(/ignored:.* \.a, \.b, \.c, \.d, \.e \+2 more.*\(never pulled\)/)
    })

    it('writes the CNAME into a directory that wasn\'t a project', function () {
      var target = into(true)
      var p = plan({ add: ['/index.html'] })
      run([['plan', p], ['success', p]], null, target)
      fs.readFileSync(path.join(target.dir, 'CNAME'), 'utf8').should.equal('a.example.com\n')
    })

    it('leaves the CNAME to the revision when it brings one, and to a project that has one', function () {
      var target = into(true)
      var p = plan({ add: ['/CNAME', '/index.html'] })
      run([['plan', p], ['success', p]], null, target)
      fs.existsSync(path.join(target.dir, 'CNAME')).should.equal(false)

      var existing = into(false)
      run([['plan', plan()], ['success', plan()]], null, existing)
      fs.existsSync(path.join(existing.dir, 'CNAME')).should.equal(false)
    })

    it('aborts with the reason and a non-zero exit', function () {
      var r = run([['error', { error: { message: 'a.example.com has not been published' } }], ['fail']], null, into())
      r.code.should.equal(1)
      r.out.should.match(/Aborted.* - a\.example\.com has not been published/)
      r.out.should.not.match(/NEXT/)
    })

    it('says who can\'t pull', function () {
      var r = run([['forbidden', 'Forbidden'], ['fail']], null, into())
      r.code.should.equal(1)
      r.out.should.match(/you do not have permission to pull /)
      run([['forbidden', 'token scope does not permit this'], ['fail']], null, into()).out
        .should.match(/Aborted.* - token scope does not permit this/)
      run([['ratelimited', 'Rate limited. Try again later.'], ['fail']], null, into()).out
        .should.match(/Aborted.* - Rate limited/)
      run([['unauthorized', 'Unauthorized'], ['fail']], null, into()).out
        .should.match(/not signed in/)
    })

    it('aborts on a bare fail', function () {
      var r = run([['fail']], null, into())
      r.code.should.equal(1)
      r.out.should.match(/pull did not complete/)
    })
  })
})
