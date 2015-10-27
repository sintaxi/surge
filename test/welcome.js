var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: false
}

describe('welcome message', function (done) {

  before(function (done) {
    nixt(opts)
      .run(surge + 'logout') // Logout before the test starts
      .end(done)
  })

  it('Run `surge`', function (done) {
    this.timeout(5000)
    nixt(opts)
      .run(surge)
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .expect(function (result) {
        should(result.stdout).match(/Welcome/)
        should(result.stdout).match(/Surge/)
      })
      .end(done)
  })

  it('Run `surge login` when already logged in', function (done) {
    this.timeout(5000)
    nixt(opts)
      .run(surge + 'login')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .expect(function (result) {
        should(result.stdout).match(/Surge/)
        should(result.stdout).match(/kenneth\+test@chloi\.io/)
      })
      .end(done)
  })

  it('Run `surge login`', function (done) {
    this.timeout(5000)
    nixt(opts)
      .exec(surge + 'logout')
      .run(surge + 'login')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .expect(function (result) {
        should(result.stdout).match(/Surge/)
        should(result.stdout).match(/kenneth\+test@chloi\.io/)
      })
      .end(done)
  })


  after(function (done) {
    nixt(opts)
      .run(surge + 'logout') // Logout after the test is over
      .end(done)
  })

})
