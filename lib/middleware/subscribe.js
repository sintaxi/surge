
var request     = require("request")
var url         = require("url")

module.exports = function(req, next, abort){

  var fields = { 
    plan: req.selectedPlan.plan 
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  //console.log(fields)

  request({
    uri: url.resolve(req.endpoint, "subscription"),
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
      console.log(("   " + sub.msg).green)
      console.log()
    } else {
      console.log()
      console.log(("   Error: " + r.statusCode).red)
      console.log()
    }
  })

}
