var path = require("path")
var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var argv = req.argv
  var cmd  = argv["_"][0]

  // surge token — print the token in use (original behaviour)
  if (cmd !== "add" && cmd !== "rem"){
    helpers.space()
    helpers.trunc(req.creds.token.grey)
    return next()
  }

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var auth = { user: "token", pass: req.creds.token }

  // surge token rem <id>
  if (cmd === "rem"){
    var id = argv["_"][1]
    if (!id) return next({ messages: ["token id must be present"] })
    return sdk.tokenRem(id, auth, function(error){
      if (error) return next(error)
      helpers.space()
      helpers.trunc("Success".green + (" - Token " + id + " removed.").grey)
      return next()
    })
  }

  // surge token add [--domain <domain>] [-m "..."]
  var args = {}
  if (argv.message) args.msg = String(argv.message)
  if (argv.domain){
    args.scope = (Array.isArray(argv.domain) ? argv.domain : [argv.domain]).map(function(d){
      return String(d)
    })
  }

  sdk.tokenAdd(args, auth, function(error, record){
    if (error) return next(error)
    helpers.space()
    helpers.trunc(record.token)
    helpers.space()
    var details = record.scope.length > 0
      ? "Scoped to " + record.scope.join(", ")
      : "Full account token"
    if (record.msg) details += " — " + record.msg
    helpers.trunc(details.grey)
    return next()
  })

}
