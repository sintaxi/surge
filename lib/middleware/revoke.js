
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var args = req.domain && req.argv["_"].indexOf(req.domain) === -1
    ? [req.domain].concat(req.argv["_"])
    : req.argv["_"]

  sdk.revoke(args, { user: "token", pass: req.creds.token }, function(error, reply){
    if (error) {
      return next(error)
    } else {
      helpers.space()
      helpers.trunc("Success".green + " - ".grey + reply.successes.join(", ") + " have been revoked.")
      helpers.space()
      return next()
    }
  })

}
