var helpers     = require("./util/helpers")

// return token to be used for payment
module.exports = function(req, next, abort){
  if (req.selectedPlan.plan.indexOf("student") !== -1){
    req.paymentToken = null
    return next()
  } else {
    helpers.payment(req, req.stripe_pk, req.subscription.card || null)(function(token){
      req.paymentToken = token
      next()
    })
  }
}
