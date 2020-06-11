var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var domain = req.argv["_"][0]

  sdk.props(domain, req.argv, { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) {
      helpers.space()
      if (error.hasOwnProperty("message")){
        helpers.trunc("Error".red + (" - " + error.message).grey)
      }else{
        error.messages.forEach(function(m){
          helpers.trunc("Error".red + (" - " + m).grey)
        })
      }
      helpers.space()  
      process.exit(1)
    } else {
      var keys = Object.keys(rsp)
      if (keys.length == 0){
        helpers.space()
        helpers.trunc(("Empty").grey)
      }else{
        helpers.space()
        keys.forEach(function(k){
          var key   = k
          var value = rsp[k]
        
          if (rsp[k] === null){
            key   = helpers.shortsmart(key).grey
            value = "null".grey
          } else if (!isNaN(parseInt(value))){
            key   = helpers.shortsmart(key).grey
            value = value.blue
          } else {
            key   = helpers.shortsmart(key).grey
            value = value.green
          }

          helpers.log(key + " : ".grey + value) 
        })
        helpers.space()
      }
      
      return next()
    }
  })

}