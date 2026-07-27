var helpers = require("../util/helpers")

// the bare `surge account` panel - the noun's default read
module.exports = function(req, next){
  var acct = req.account

  helpers.log(helpers.smart("email:").grey + " " + acct.email)
  if (acct.plan){
    helpers.log(helpers.smart("plan:").grey + " " + acct.plan.name)
  }
  return next()
}
