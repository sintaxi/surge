
var request     = require("request")
var url         = require("url")
var path        = require("path")

module.exports = function(req, next, abort){

  var fields = { 
    plan: req.selectedPlan
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  var subscribeUrl = req.domain
    ? url.resolve(req.endpoint, path.join(req.domain, "plan"))
    : url.resolve(req.endpoint, "subscription")

  request({
    uri: subscribeUrl,
    method: "PUT",
    auth: {
      'user': 'token',
      'pass': req.creds.token,
      'sendImmediately': true
    },
    form: fields
  }, function(e,r,b){
    if ([200,201].indexOf(r.statusCode) !== -1) {
      var sub = JSON.parse(b)
      console.log()
      console.log("   Success".green + (" - " + sub.msg).grey)
      console.log()
    } else {
      console.log()
      console.log(("   Error: " + r.statusCode).red)
      console.log()
    }
  })

}
