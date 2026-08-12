
var os          = require("os")
var spawn       = require("child_process").spawn
var surgeSDK    = require("surge-sdk")
var localCreds  = require("../../util/creds.js")
var helpers     = require("../../util/helpers.js")

// browser-handoff login (plans/auth-cli-mfa.md stage 1) — opt-in via
// --browser while it proves out beside the password prompt. Prints the
// hub url + code, tries to open the browser (fails soft over ssh), and
// polls with a secret that never leaves this process until the human
// approves on the sign-in page.
module.exports = function(req, next, abort){
  if (!req.argv.browser) return next()

  var sdk = surgeSDK({ endpoint: req.endpoint.format() })

  sdk.loginSession(os.hostname(), function(error, session){
    if (error || !session || !session.uuid){
      helpers.space()
      helpers.trunc("Error".red + " - Could not start a browser sign-in. Try again, or run surge login without --browser.".grey)
      helpers.space()
      process.exit(1)
    }

    helpers.trunc("Continue in the browser to sign in.".grey)
    helpers.space()
    helpers.trunc("        url: ".grey + session.url.underline)
    helpers.trunc("       code: ".grey + session.code)
    helpers.space()

    // best effort — over ssh there is nothing to open, the url does
    // the work on any browser anywhere
    var opener = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "explorer" : "xdg-open"
    try {
      spawn(opener, [session.url], { stdio: "ignore", detached: true }).on("error", new Function).unref()
    } catch(e){}

    var deadline = Date.now() + (session.expires_in || 600) * 1000
    var interval = (session.interval || 2) * 1000

    var poll = function(){
      if (Date.now() > deadline){
        helpers.trunc("Aborted".yellow + " - Sign-in timed out. Run surge login again.".grey)
        helpers.space()
        process.exit(1)
      }
      sdk.loginPoll(session.uuid, session.poll, function(error, result){
        // transient weather — keep polling until the deadline says stop
        if (error || !result) return setTimeout(poll, interval)
        if (result.status === "approved"){
          localCreds(req.endpoint).set(result.email, result.token)
          req.creds = { email: result.email, token: result.token }
          return next()
        }
        if (result.status === "gone"){
          helpers.space()
          helpers.trunc("Aborted".yellow + " - Sign-in expired or was cancelled. Run surge login again.".grey)
          helpers.space()
          process.exit(1)
        }
        return setTimeout(poll, interval)
      })
    }
    setTimeout(poll, interval)
  })
}
