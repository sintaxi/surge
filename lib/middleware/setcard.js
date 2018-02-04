
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")

module.exports = function(req, next, abort){

  if (!req.paymentToken){
    helpers.log()
    if (req.card){
      helpers.trunc("Success".green + " - Using existing card.".grey)
    } else {
      helpers.trunc("Aborted".yellow + " - No card set.".grey)
    }
    helpers.space()
  } else {

    var fields = {}

    if (req.paymentToken){
      fields.token = req.paymentToken
    }

    request({
      uri: url.resolve(req.endpoint, "card"),
      method: "PUT",
      auth: {
        'user': 'token',
        'pass': req.creds.token,
        'sendImmediately': true
      },
      form: fields
    }, function(e,r,b){
      if ([200,201].indexOf(r.statusCode) !== -1) {
        var obj = JSON.parse(b)
        console.log()
        console.log(("   Success".green + " - ".grey + obj.msg.grey))
        console.log()
      } else {
        var obj = JSON.parse(b)
        console.log()
        console.log("   Error ".red + " - " + obj.msg.grey)
        console.log()
      }
    })

  }
}
