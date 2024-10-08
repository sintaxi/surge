var helpers     = require("../util/helpers")
var creds     = require("../util/creds")

module.exports = function(req, next){
  if (req.creds && req.creds.token) {
    helpers.fetchAccount(req.endpoint)(req.creds.email, req.creds.token, function(error, account){
      if (account){
        req.account = account
        helpers.space()
        var str = req.account.email.underline.grey
        if (req.account.plan){
          str = str + (" - " + req.account.plan.name).grey
          if (req.account.plan.comped === true){
            str = str + " (comped by surge)".grey
          }
        }
        helpers.trunc(str)


        helpers.space()
        return next()
      } else {
        creds(req.endpoint).set(req.creds.email, null)
        helpers.space()
        helpers.trunc("Not Authenticated!".grey)
        helpers.space()
        process.exit()
      }
    })
  } else {
    helpers.space()
    helpers.trunc("Not Authenticated".grey)
    helpers.space()
    process.exit()
  }
  
}
