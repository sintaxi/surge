var surgeSDK    = require("surge-sdk")
var helpers     = require("../util/helpers")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format()
  })

  sdk.verification({ user: "token", pass: req.creds.token }, function(error, reply){
    if (error){
      var msg = (error.messages && error.messages[0]) || error.error || "could not send verification email"
      helpers.space()
      helpers.trunc("Error".red + (" - " + msg).grey)
      helpers.space()
      process.exit(1)
    }

    helpers.space()
    if (reply.verified === true){
      helpers.trunc("Success".green + (" - " + (reply.email || req.creds.email) + " is already verified.").grey)
    } else if (reply.sent === true){
      helpers.trunc("Email sent".green + (" - follow the link sent to " + (reply.email || req.creds.email) + " to verify.").grey)
    } else {
      helpers.trunc("Hold on".yellow + (" - " + (reply.msg || "verification email already sent. Check your inbox.")).grey)
    }
    helpers.space()
    return next()
  })

}
