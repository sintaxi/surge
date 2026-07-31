var parse = require("url-parse-as-address")
var proxy = require("./_proxy")

module.exports = function(req, next){
  req.endpoint = parse(req.argv.endpoint || req.configuration.endpoint || "surge." + req.configuration.platform)

  // every chain that talks to the api resolves an endpoint first, so this is
  // the one place the notice cannot be left out of by accident
  proxy(req)

  next()
}
