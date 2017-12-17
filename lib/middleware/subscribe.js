
var request     = require("request")
var url         = require("url")

module.exports = function(req, next, abort){

  var fields = { 
    plan: req.selectedPlan.plan 
  }

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

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
    if (r.statusCode == 201) {
      if (token === null) console.log()
      var sub = JSON.parse(b)
      console.log()
      console.log(("      You are now upgraded to " + sub.plan.name + "!").green)
      console.log()
    } else if (r.statusCode == 200) {
      var sub = JSON.parse(b)
      console.log()
      console.log(("      No charge created. You are already upgraded to " + sub.plan.name + "!").green)
      console.log()
    } else {
      console.log(r.statusCode)
    }
  })

}
