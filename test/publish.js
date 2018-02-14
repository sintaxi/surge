var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var endpoint = typeof process.env.ENDPOINT !== 'undefined' ? ' -e ' + process.env.ENDPOINT + ' ' : ' '
var surge = 'node ' + pkg.bin + endpoint
var opts = {
  colors: false,
  newlines: false
}

describe('publish', function (done) {

  before(function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + 'logout') // Logout before the test starts
      .end(done)
  })

  it('Run `surge` to login and publish', function (done) {
    this.timeout(1500)
    nixt(opts)
      .run(surge)
      .on(/.*email:.*/).respond('brock+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .on(/.*project:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
      .expect(function (result) {
        should(result.stdout).not.match('12345')
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('Run `surge` when already logged in', function (done) {
    this.timeout(1500)
    nixt(opts)
      .run(surge)
      .on(/.*project:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('`surge`', function (done) {
    this.timeout(1500)
    nixt(opts)
      .run(surge + './test/fixtures/cli-test.surge.sh cli-test.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('`surge ./`', function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + './test/fixtures/cli-test.surge.sh')
      .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('`surge --project`', function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + '--project ./test/fixtures/cli-test.surge.sh')
      .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('`surge --domain`', function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + '--domain cli-test.surge.sh')
      .on(/.*project:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('\n')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('`surge --project --domain`', function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + '--domain cli-test.surge.sh --project ./test/fixtures/cli-test.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test/)
      })
      .end(done)
  })
  it('Should not publish a project a nonexistent directory', function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + '--project ./test/fixtures/cli-test-0.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/No such file or directory/)
        should(result.stdout).not.match(/{[1-9]+:[1-9]+}/)
        should(result.stdout).match(/cli-test-0.surge.sh/)
      })
      .end(done)
  })
  it('Should not publish a project it doesn’t have access to', function (done) {
    this.timeout(1500)
    nixt(opts)
      .run(surge + './test/fixtures/cli-test.surge.sh cli-test-5.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/Aborted/)
        should(result.stdout).match(/cli-test-5\.surge\.sh/)
        should(result.stdout).match(/cli-test\.surge\.sh/)
      })
      .end(done)
  })

  after(function (done) {
    this.timeout(1500)

    nixt(opts)
      .run(surge + 'logout') // Logout after the test is over
      .end(done)
  })

})
