
var helpers      = require("../util/helpers")
var localCreds   = require("../util/creds.js")
var surgeSDK     = require("surge-sdk")
var path         = require("path")
var pkg          = require("../../package.json")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.argv["_"][0]
  var rev     = req.argv["_"][1] || null

  helpers.space()
  sdk.nuke({ user: "token", pass: req.creds.token }, function(error, response){
    
    if (error){
      console.log("error", error)
    }  

    var creds = localCreds(req.endpoint).set(null)
    
    if (req.creds) {
      var filePath = path.join(process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME'], ".netrc")
      helpers.trunc(("Success").green + (" - " + response.msg).grey)
    }


    return next()
    

    
  })
  
}