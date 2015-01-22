
var helpers     = require("./util/helpers")
var localCreds  = require("./util/creds.js")

module.exports = function(req, next){
  if (req.argv["_"] && req.argv["_"]["0"] === "whoami") {
    var creds = localCreds(req.argv.endpoint).get()

    if (creds) {
      helpers.log()
      helpers.log("       email:".grey,  creds.email)
      helpers.log()
    } else {
      helpers.log()
      helpers.log("       Not currently authenticated.")
      helpers.log()
    }

    process.exit()
  } else {
    next()
  }
}
