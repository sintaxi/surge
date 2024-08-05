var parse = require("url-parse-as-address")

module.exports = function(req, next){
  req.endpoint = parse(req.argv.endpoint || req.configuration.endpoint || "surge." + req.configuration.platform)
  next()
}
