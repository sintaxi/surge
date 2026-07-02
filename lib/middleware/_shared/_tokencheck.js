var helpers = require("../../util/helpers")

module.exports = function(req, next){
  if (req.creds) {
    req.authed = true
    helpers.trunc(("As " + req.creds.email.underline + ".").grey)
    helpers.log()
    return next()
  } else {
    next()
  }
}
