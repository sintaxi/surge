
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  sdk.revoke(req.argv["_"], { user: "token", pass: req.creds.token }, function(error, reply){
    if (error) {
      helpers.space()
      helpers.trunc("Failed".red + " - ".grey + error.messages.join(". ").grey)
      helpers.space()
      process.exit(1)
    } else {
      helpers.space()
      helpers.trunc("Success".green + " - ".grey + reply.successes.join(", ") + "have been revoked.")
      helpers.space()
      return next()
    }
  })

}
