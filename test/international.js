var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: false
}

describe('international', function (done) {

  before(function (done) {
    nixt(opts)
      .run(surge + 'logout') // Logout before the test starts
      .end(done)
  })

  it('Should teardown a project with an IRI domain', function (done) {
    this.timeout(5000)

    nixt(opts)
      .run(surge + 'teardown bølgebad-test-2.surge.sh')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .expect(function (result) {
        console.log(result)
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/has been removed/)
        should(result.stdout).match(new RegExp('bølgebad-test-2.surge.sh'))
        should(result.stdout).not.match('cli-test')
      })
      .end(done)
  })

  it('Should publish an IRI domain', function (done) {
    this.timeout(5000)
    nixt(opts)
      .run(surge)
      .on(/.*project path:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('bølgebad-test-2.surge.sh\n')
      .expect(function (result) {
        should(result.stdout).not.match('12345')
        should(result.stdout).match(/1 file/)
        should(result.stdout).match(/Success! Project is published and running at bølgebad-test-2/)
      })
      .end(done)
  })

  after(function (done) {
    nixt(opts)
      .run(surge + 'logout') // Logout after the test is over
      .end(done)
  })
})
