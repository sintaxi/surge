var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")


var parseArgs = function(argv){
  var args = JSON.parse(JSON.stringify(argv))

  if (argv["_"][0] && argv["_"][0].indexOf(".") !== -1){
    args.domain  = argv["_"][0]
    args.cmd     = argv["_"][1]
    args.type    = argv.type  || argv["_"][2]
    args.name    = argv.name  || argv["_"][3]
    args.value   = argv.value || argv["_"][4]
    if (args.type === "MX"){ 
      if (argv["_"].length === 5){
        args.name     = argv.name     || "@"
        args.priority = argv.priority || argv["_"][3]
        args.value    = argv.value    || argv["_"][4]
      }else if (argv["_"].length === 6){
        args.name     = argv.name     || argv["_"][3]
        args.priority = argv.priority || argv["_"][4]
        args.value    = argv.value    || argv["_"][5]
      }
    }
  }

  return args
}

module.exports = function(type){

  return function(req, next){
    var add, rem, get

    var sdk = surgeSDK({
      endpoint: req.endpoint.format(),
      defaults: helpers.defaults
    })

    if (type === "dns"){
      add = sdk.dnsAdd
      rem = sdk.dnsRem
      get = sdk.dns
    } else if(type === "zone"){
      add = sdk.zoneAdd
      rem = sdk.zoneRem
      get = sdk.zone
    }

    var args = parseArgs(req.argv)

    if (args.cmd === "add") {
      add(args.domain, args, { user: "token", pass: req.creds.token }, function(error, rsp){
        if (error) {
          if (error.status === 405){
            helpers.space()
            helpers.trunc("Invalid".yellow + (" - " + error.message).grey)
            helpers.space()
            process.exit(1)
          }else{
            helpers.space()
            error.messages.forEach(function(m){ helpers.trunc("Error".red + (" - " + m).grey); })
            helpers.space()
            process.exit(1)
          }
        } else {
          helpers.space()
          helpers.displayRecords(rsp, type)
          helpers.space()
          helpers.trunc("Success".green + " - record added".grey)
          helpers.space()
          process.exit()
        }
      })
    } else if (args.cmd === "rem") {
      rem(args.domain, args.type, { user: "token", pass: req.creds.token }, function(error, rsp){
        if (error) {
          if (error.status === 405){
            helpers.space()
            helpers.trunc("Invalid".yellow + (" - " + error.message).grey)
            helpers.space()
            process.exit(1)
          }else{
            helpers.space()
            helpers.displayRecords(rsp, type)
            helpers.space()
            error.messages.forEach(function(m){ helpers.trunc("Error".red + (" - " + m).grey); })
            helpers.space()
            process.exit(1)
          }
        } else {
          helpers.space()
          helpers.displayRecords(rsp, type)
          helpers.space()
          helpers.trunc("Success".green + " - record removed".grey)
          helpers.space()
        }
      })
    } else {
      get(args.domain, { user: "token", pass: req.creds.token }, function(error, rsp){
        if (error) {
          if (error.status === 405){
            helpers.space()
            helpers.trunc("Invalid".yellow + (" - " + error.message).grey)
            helpers.space()
            process.exit(1)
          }else{
            helpers.space()
            if (rsp){
              helpers.displayRecords(rsp, type)
              helpers.space()  
            }
            helpers.trunc("Error".red + (" - " + error.message).grey)
            helpers.space()
            process.exit(1)
          }
        } else {
          var keys = Object.keys(rsp)
          if (keys.length == 0){
            helpers.space()
            helpers.trunc(("Empty").grey)
            helpers.space()
          }else{
            helpers.space()
            helpers.displayRecords(rsp, type)
            helpers.space()
          }
          return next()
        }
      })
    }

  }
}
