var parse = require("url-parse-as-address")

module.exports = function(req, next){
  req.endpoint = parse(req.argv.endpoint || req.config.endpoint || "surge." + req.config.platform)
  next()
}
