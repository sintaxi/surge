
var spawn       = require("child_process").spawn
var surgeSDK    = require("surge-sdk")
var helpers     = require("../util/helpers")

// two-factor setup and management happen in the browser — the terminal
// never touches a secret, a code, or a recovery code. This opens the
// ceremony and gets out of the way: the page decides whether you get
// setup (mfa off) or the manage screen (mfa on), and a stolen token
// alone can open the page but never finish either ceremony.
module.exports = function(req, next){
  var sdk = surgeSDK({ endpoint: req.endpoint.format() })

  sdk.mfaSession({ user: "token", pass: req.creds.token }, function(error, session){
    if (error || !session || !session.url){
      helpers.space()
      helpers.trunc("Error".red + " - Could not start a two-factor session. Try again.".grey)
      helpers.space()
      process.exit(1)
    }

    helpers.trunc("Continue in the browser to manage two-factor auth.".grey)
    helpers.space()
    helpers.trunc("        url: ".grey + session.url.underline)

    // best effort — over ssh the url does the work on any browser
    var opener = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "explorer" : "xdg-open"
    try {
      spawn(opener, [session.url], { stdio: "ignore", detached: true }).on("error", new Function).unref()
    } catch(e){}

    next()
  })
}
