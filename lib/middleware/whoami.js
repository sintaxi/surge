var helpers     = require("../util/helpers")
var creds     = require("../util/creds")

// not authenticated exits 1 - whoami is the "check auth first" step a
// pipeline or agent runs, and it must fail when there is no identity
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
        // the token in use, by id - an agent can check it holds a scoped
        // token without printing the secret (older apis send no token)
        if (req.account.token){
          var scope = req.account.token.scope || []
          var reach = req.account.token.org ? "org token for " + req.account.token.org : "full account"
          helpers.trunc((req.account.token.id + " · " + (scope.length > 0 ? "scoped to " + scope.join(", ") : reach)).grey)
        }

        helpers.space()
        return next()
      } else {
        // a rejected SURGE_TOKEN/--token says nothing about the saved
        // login, so only a stale saved token is cleared
        if (!req.passintoken) creds(req.endpoint).set(null)
        helpers.space()
        helpers.trunc(req.passintoken ? "Not Authenticated - token rejected.".grey : "Not Authenticated!".grey)
        helpers.space()
        process.exit(1)
      }
    })
  } else {
    helpers.space()
    helpers.trunc("Not Authenticated".grey)
    helpers.space()
    process.exit(1)
  }

}
