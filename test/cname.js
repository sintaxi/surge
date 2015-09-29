var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: false
}

describe('CNAME', function (done) {

  it('`surge` with CNAME file', function (done) {
    this.timeout(5000)
    nixt(opts)
      .exec(surge + 'logout')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .run(surge + './test/fixtures/cli-test-2.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/2 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test-2/)
      })
      .end(done)
  })
  it('`surge` with CNAME file and protocol', function (done) {
    this.timeout(5000)
    nixt(opts)
      .run(surge + './test/fixtures/cli-test-3.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/2 file/)
        should(result.stdout).match(/Success! Project is published and running at cli-test-3/)
      })
      .end(done)
  })
  it('`surge` with CNAME file and subdomain', function (done) {
    this.timeout(5000)
    nixt(opts)
      .run(surge + './test/fixtures/cli-test-4.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/2 file/)
        should(result.stdout).match(/Success! Project is published and running at www\.cli-test-4/)
      })
      .end(done)
  })

})
