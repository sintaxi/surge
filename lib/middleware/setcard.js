
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

    var fields = new FormData()

    if (req.paymentToken){
      fields.set('token', req.paymentToken)
    }
    var authorization = `Basic ${
      Buffer.from(`token:${req.creds.token}`).toString('base64')
    }`

    fetch(new URL('card', req.entrypoint), {
      method: "PUT",
      headers: { authorization },
      body: fields
    }).then(async function(r){
      if ([200,201].indexOf(r.status) !== -1) {
        var obj = await r.json()
        console.log()
        console.log(("   Success".green + " - ".grey + obj.msg.grey))
        console.log()
      } else {
        var obj = await r.json()
        console.log()
        console.log("   Error ".red + " - " + (obj.message || obj.msg).grey)
        console.log()
      }
    })

  }
}
