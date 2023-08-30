
module.exports = function(req, next, abort){

  var subscribeUrl = req.domain
    ? new URL(req.domain + '/plan', req.endpoint)
    : new URL("plan", req.endpoint)
  var authorization = `Basic ${
    Buffer.from(`token:${req.creds.token}`).toString('base64')
  }`
  fetch(subscribeUrl, { headers: { authorization }}).then(async function(r){
    var obj = await r.json()
    //console.log("SUBSCRIPTION", JSON.parse(obj))
    if (r.status == 200){
      req.card = obj.card
      req.subscription = obj.subscription
      req.stripe_pk = obj.stripe_pk
    } else {
      console.log(obj)
    }
    return next()
  })

}
