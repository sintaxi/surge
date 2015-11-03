var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: true
}

describe('plus', function () {

  var subdomain = ''

  before(function (done) {
    this.timeout(5000)

    nixt(opts)
      .exec(surge + 'logout -e localhost:5001') // Logout before the test starts
      .run(surge + ' -e localhost:5001')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .on(/.*project path:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('\n')
      .expect(function (result) {
        console.log(result.stdout)
        subdomain = result.stdout.split('Project is published and running at')[1].trim()
      })
      .end(done)
  })

  it('`surge plus`', function (done) {
    this.timeout(10000)

    nixt(opts)
      .run(surge + 'plus -e localhost:5001')
      .on(/.*domain:.*/).respond(subdomain + '.surge.sh\n')
      .on(/.*Would you like to charge.*/).respond('yes\n')
      // .on(/.*card number:.*/).respond('4242-4242-4242-4242\n')
      // .on(/.*exp \(mo\/yr\):.*/).respond('01/19\n')
      // .on(/.*cvc:.*/).respond('012')
      .expect(function (result) {
        console.log(result)
        should(result.stdout).match(/plan: Plus/)
        should(result.stdout).match(/You are now upgraded to Plus!/)
        should(result.stdout).not.match(/plan: Free/)
        should(result.stdout).not.match(/invalid/)
        should(result.stdout).not.match(/Please try again\./)
      })
      .end(done)
  })

  // it('`surge ssl`', function (done) {
  //   this.timeout(10000)
  //
  //   nixt(opts)
  //     .run(surge + 'ssl -e localhost:5001')
  //     .on(/.*domain:.*/).respond(subdomain + '.surge.sh\n')
  //     .on(/.*pem file:.*/).respond('./test/fixtures/ssl/test.pem')
  //     .on(/.*Would you like to charge.*/).respond('yes\n')
  //     .expect(function (result) {
  //       console.log(result)
  //       should(result.stdout).not.match(/No such file or directory/)
  //       should(result.stdout).not.match(/invalid/)
  //       should(result.stdout).not.match(/Please try again\./)
  //       should(result.stdout).match(/Success/)
  //       should(result.stdout).match(/applied/)
  //     })
  //     .end(done)
  // })

  // it('`surge ssl` with `CNAME` file', function (done) {
  //   this.timeout(10000)
  //
  //   nixt(opts)
  //     .run(surge + 'ssl ./test/fixtures/cli-test-4.surge.sh/')
  //     .on(/.*domain:.*/).respond('cli-test.surge.sh\n')
  //     .on(/.*pem file:.*/).respond('./test/fixtures/ssl/test.pem')
  //     .on(/.*Would you like to charge Visa ending in 4242\?.*/).respond('\n')
  //     // .on(/.*card number:.*/).respond('4242-4242-4242-4242\n')
  //     // .on(/.*exp \(mo\/yr\):.*/).respond('01/19\n')
  //     // .on(/.*cvc:.*/).respond('012')
  //
  //     .expect(function (result) {
  //       should(result.stdout).not.match(/No such file or directory/)
  //       should(result.stdout).not.match(/invalid/)
  //       should(result.stdout).not.match(/Please try again\./)
  //       should(result.stdout).match(/Success/)
  //       should(result.stdout).match(/applied/)
  //     })
  //     .end(done)
  // })

  // it('`surge ssl --domain` with no arg', function (done) {
  //   nixt(opts)
  //     .run(surge + 'ssl --domain')
  //     .expect(function (result) {
  //       should(result.stdout).not.match(/throw/)
  //       should(result.stdout).not.match(/AssertionError/)
  //     })
  // })

  after(function (done) {
    nixt(opts)
      .run(surge + 'teardown -e localhost:5001')
      .on(/.*domain:.*/).respond(subdomain + '.surge.sh')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/removed/)
      })
      .end(done)
  })
})
