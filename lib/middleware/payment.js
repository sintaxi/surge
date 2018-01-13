var helpers     = require("./util/helpers")

// return token to be used for payment
module.exports = function(req, next, abort){
  var prettyPlanName = req.selectedPlan.id.split("-")[0]

  if (req.selectedPlan.dummy){
    req.paymentToken = null
    return next()
  } else {
    helpers.payment(req, req.plans.stripe_pk, req.plans.card || null)(function(token){
      req.paymentToken = token
      next()
    })
  }
}
