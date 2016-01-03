var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var endpoint = typeof process.env.ENDPOINT !== 'undefined' ? ' -e ' + process.env.ENDPOINT + ' ' : ' '
var surge = 'node ' + pkg.bin + endpoint
var opts = {
  colors: false,
  newlines: false
}

describe('teardown', function () {

  var subdomain = ''

  before(function (done) {
    this.timeout(25000)

    nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge)
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .on(/.*project path:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('\n')
      .expect(function (result) {
        subdomain = result.stdout.split('Project is published and running at')[1].trim()
      })
      .end(done)
  })

  it('`surge teardown`', function (done) {
    this.timeout(25000)

    nixt(opts)
      .run(surge + 'teardown')
      .on(/.*domain:.*/).respond(subdomain + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/has been removed/)
        should(result.stdout).match(new RegExp(subdomain))
        should(result.stdout).not.match('cli-test')
      })
      .end(done)
  })
})
