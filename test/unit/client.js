var should = require('should')
var client = require('../../lib/util/client')

describe('client', function () {

  it('names where the credential came from', function () {
    client.authOf({ token: "abc" }, {}).should.equal("flag")
    client.authOf({}, { SURGE_TOKEN: "abc" }).should.equal("env")
    client.authOf({}, { TRAVIS_SURGE_TOKEN: "abc" }).should.equal("env")
    client.authOf({}, {}).should.equal("netrc")
  })

  it('describes an agent publishing with a pasted token through npx', function () {
    client.userAgent("0.54.0", {}, { SURGE_TOKEN: "abc", npm_command: "exec" }, false)
      .should.equal("surge/0.54.0 (auth=env; ci=0; tty=0; via=npx)")
  })

  it('describes a person at a terminal with a saved login', function () {
    client.userAgent("0.54.0", {}, {}, true).should.equal("surge/0.54.0 (auth=netrc; ci=0; tty=1; via=installed)")
  })

  it('reads CI the way the prompts do', function () {
    client.userAgent("0.54.0", {}, { CI: "true" }, false).should.match(/ci=1/)
    client.userAgent("0.54.0", {}, { CI: "false" }, false).should.match(/ci=0/)
    client.userAgent("0.54.0", {}, { CI: "0" }, false).should.match(/ci=0/)
  })

  it('names a known agent', function () {
    client.userAgent("0.54.0", {}, { CLAUDECODE: "1" }, false).should.match(/; agent=claude-code\)$/)
    client.userAgent("0.54.0", {}, { GEMINI_CLI: "1" }, false).should.match(/; agent=gemini\)$/)
    client.userAgent("0.54.0", {}, {}, false).should.not.match(/agent=/)
  })

  it('takes AI_AGENT as the name, cleaned', function () {
    client.userAgent("0.54.0", {}, { AI_AGENT: "Grok Bot!", CLAUDECODE: "1" }, false).should.match(/; agent=grokbot\)$/)
    client.userAgent("0.54.0", {}, { AI_AGENT: "claude-code_2-1-300_agent" }, false).should.match(/; agent=claude-code\)$/)
    client.userAgent("0.54.0", {}, { AI_AGENT: "cursor/1.7" }, false).should.match(/; agent=cursor\)$/)
  })

  it('never carries the token or any value from the environment', function () {
    var ua = client.userAgent("0.54.0", { token: "secret-1" }, { SURGE_TOKEN: "secret-2", HOME: "/home/x", REPL_ID: "secret-3" }, false)
    ua.should.not.match(/secret|home/)
    ua.should.equal("surge/0.54.0 (auth=flag; ci=0; tty=0; via=installed; agent=replit)")
  })

})
