
var helpers = require("./util/helpers")

module.exports = function(req, next, abort){

  var form = new FormData()
  form.set('plan', req.selectedPlan.id)

  if (req.paymentToken){
    fields.token = req.paymentToken
  }

  var subscribeUrl = req.domain
    ? new URL(req.domain + '/plan', req.endpoint)
    : new URL("plan", req.endpoint)

  var authorization = `Basic ${
    Buffer.from(`token:${req.creds.token}`).toString('base64')
  }`
  fetch(subscribeUrl, {
    method: 'PUT',
    headers: { authorization },
    body: form,
  }).then(function(r) {
    if ([200,201].indexOf(r.status) !== -1) {
      var sub = JSON.parse(b)
      helpers.space()
      helpers.trunc("Success".green + (" - " + sub.msg).grey)
      helpers.space()
    } else {
      helpers.space()
      helpers.trunc(("Error: " + r.status).red)
      helpers.space()
    }
  })

}
