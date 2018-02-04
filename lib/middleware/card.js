var helpers     = require("./util/helpers")

// return token to be used for payment
module.exports = function(req, next, abort){
  helpers.space()
  helpers.payment(req, req.plans.stripe_pk, req.plans.card || null)(function(token){
    req.paymentToken = token
    next()
  })
}
