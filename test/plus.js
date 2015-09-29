var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: false
}

describe('plus', function () {

  var subdomain = ''

  before(function (done) {
    nixt(opts)
      .exec(surge + 'logout') // Logout before the test starts
      .run(surge + 'login')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .end(done)
  })

  it('`surge plus`', function (done) {
    this.timeout(10000)

    nixt(opts)
      .run(surge + 'plus')
      .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
      .on(/.*card number:.*/).respond('4242-4242-4242-4242\n')
      .on(/.*exp \(mo\/yr\):.*/).respond('01/19\n')
      .on(/.*cvc:.*/).respond('012')

      .expect(function (result) {
        should(result.stdout).not.match(/Success/)
        should(result.stdout).match(/invalid/)
        should(result.stdout).match(/Please try again\./)
      })
      .end(done)
  })
})
