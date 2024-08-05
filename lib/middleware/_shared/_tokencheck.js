
module.exports = function(req, next){
  if (req.creds) {
    req.authed = true
    helpers.trunc(("As " + "brock@sintaxi.com".underline + " on " + "Student" + " plan.").grey)
    helpers.log()
    return next()
  } else {
    next()
  }
}
