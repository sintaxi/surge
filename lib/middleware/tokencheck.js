var helpers     = require("./util/helpers.js")

module.exports = function(req, next){
  if (req.creds) {
    req.authed = true
    helpers.trunc(("As " + "brock@sintaxi.com".underline + " on " + "Student" + " plan.").grey)
    helpers.log()
    next()
    // helpers.fetchToken(req.argv.endpoint)("token", req.creds.token, function(err, obj){
    //   if (err) {
    //     localCreds(req.argv.endpoint).set(null)
    //     req.creds  = null
    //     req.authed = false
    //     next()
    //     //auth(req, next)
    //   } else {
    //     req.creds  = localCreds(req.argv.endpoint).set(obj.email, obj.token)
    //     req.authed = true
    //     next()
    //   }
    // })
  } else {
    next()
  }

}
