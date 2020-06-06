var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")


var parseArgs = function(argv){
  var args = JSON.parse(JSON.stringify(argv))

  if (argv["_"][0] && argv["_"][0].indexOf(".") !== -1){
    args.domain  = argv["_"][0]
    args.cmd     = argv["_"][1]
    args.type    = argv["_"][2]
    args.name    = argv["_"][3]
    args.value   = argv["_"][4]
  }

  return args
}


module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var args = parseArgs(req.argv)

  if (args.cmd === "add") {
    sdk.dnsAdd(args.domain, args, { user: "token", pass: req.creds.token }, function(error, rsp){
      if (error) {
        helpers.space()
        process.exit(1)
      } else {
        console.log(rsp)
        return next()
      }
    })
  } else if (args.cmd === "rem") {
    sdk.dnsRem(args.domain, args.type, { user: "token", pass: req.creds.token }, function(error, rsp){
      if (error) {
        helpers.space()
        process.exit(1)
      } else {
        console.log(rsp)
        return next()
      }
    })
  } else {
    sdk.dns(args.domain, { user: "token", pass: req.creds.token }, function(error, rsp){
      if (error) {
        helpers.space()
        process.exit(1)
      } else {
        console.log(rsp)
        return next()
      }
    })
  }

}
