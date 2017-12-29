var helpers     = require("./util/helpers")

// return token to be used for payment
module.exports = function(req, next, abort){
  console.log()
  helpers.payment(req, req.stripe_pk, req.card || null)(function(token){
    req.paymentToken = token
    next()
  })
}
