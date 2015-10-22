var helpers     = require("./util/helpers")

module.exports = function(req, next){
  //if (req.argv["_"]["0"] === "whoami") {
    if (req.creds) {
      helpers.log("    Logged in as " + req.creds.email.green + ".")
      helpers.log()
    } else {
      helpers.log("    Not currently authenticated.")
      helpers.log()
    }

    process.exit()
  // } else {
  //   next()
  // }
}
