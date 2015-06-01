var helpers     = require("./util/helpers")

module.exports = function(req, next){
  if (req.argv["_"]["0"] === "token") {

    if (req.creds) {
      helpers.log("              token: ".grey + req.creds.token)
      helpers.log()
    } else {
      helpers.log("    Not currently authenticated. Try running `surge login` first!")
      helpers.log()
    }
    process.exit()
  } else {
    next()
  }
}
