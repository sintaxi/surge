var url = require("url")

module.exports = function(req, next){
  req.ssl = null
  var u   = url.parse(req.domain)

  if (u.protocol !== null) {
    if (u.protocol == "https:") req.argv.force = "https"
    if (u.protocol == "http:") req.argv.force = "http"
    req.domain = u.hostname
  }

  next()
}