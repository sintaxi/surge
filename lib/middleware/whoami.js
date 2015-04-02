var helpers     = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv["_"]["0"] === "whoami") {

    if (req.creds) {
      helpers.log("       email:".grey,  req.creds.email)
      helpers.log()
    } else {
      helpers.log("       Not currently authenticated.")
      helpers.log()
    }

    process.exit()
  } else {
    next()
  }
}
