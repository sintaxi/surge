var helpers     = require("./util/helpers")

module.exports = function(req, next){
  if (req.creds) {
    helpers.trunc(req.creds.email.underline.grey)
    helpers.log()
  } else {
    helpers.trunc("Not Authenticated".grey)
    helpers.log()
  }

  process.exit()
}
