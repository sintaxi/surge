
var request     = require("request")
var url         = require("url")
var path        = require("path")
var helpers = require("./util/helpers")

module.exports = function(req, next, abort){

  var fields = { 
    plan: req.selectedPlan.id
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  var subscribeUrl = req.domain
    ? url.resolve(req.endpoint, path.join(req.domain, "plan"))
    : url.resolve(req.endpoint, "plan")

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
      helpers.space()
      helpers.trunc("Success".green + (" - " + sub.msg).grey)
      helpers.space()
    } else {
      helpers.space()
      helpers.trunc(("Error: " + r.statusCode).red)
      helpers.space()
    }
  })

}
