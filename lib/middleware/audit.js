
var helpers      = require("../util/helpers")
var surgeSDK     = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain  = req.argv["_"][0]
  var rev     = req.argv["_"][1] || null
  
  sdk.audit(domain, { user: "token", pass: req.creds.token }, function(error, response){
    if (!response){
      helpers.trunc("coming soon".grey)
      return next()
    } else {
      var edgenodes = Object.keys(response)
      
      edgenodes.forEach(function(edgenode){
        var en = edgenode.split(".")[0]
        var files = Object.keys(response[edgenode]["manifest"])
        files.forEach(function(file){
          console.log(
            en.green
            + " " +
            response[edgenode]["rev"].toString().yellow
            + " " + 
            response[edgenode]["manifest"][file]["md5sum"].grey
            + " " +
            domain.cyan + file.blue
          )
        })
      })
    }
  })
  
}