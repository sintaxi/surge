var axios       = require("axios")
var helpers     = require("../util/helpers")

module.exports = function(req, next){

  axios.post(req.endpoint.format() + "verification", {}, {
    auth: { username: "token", password: req.creds.token },
    validateStatus: function(){ return true },
    timeout: 30000
  }).then(function(rsp){
    var body = rsp.data || {}
    helpers.space()
    if (rsp.status === 200 && body.verified === true){
      helpers.trunc("Success".green + (" - " + (body.email || req.creds.email) + " is already verified.").grey)
    } else if (rsp.status === 201 && body.sent === true){
      helpers.trunc("Email sent".green + (" - follow the link sent to " + (body.email || req.creds.email) + " to verify.").grey)
    } else if (rsp.status === 200 && body.sent === false){
      helpers.trunc("Hold on".yellow + (" - " + (body.msg || "verification email already sent. Check your inbox.")).grey)
    } else {
      helpers.trunc("Error".red + (" - " + (body.error || "could not send verification email (" + rsp.status + ")")).grey)
    }
    helpers.space()
    return next()
  }).catch(function(err){
    helpers.space()
    helpers.trunc("Error".red + (" - " + err.message).grey)
    helpers.space()
    process.exit(1)
  })

}
