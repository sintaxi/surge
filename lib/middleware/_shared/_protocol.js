var url = require("url")

module.exports = function(req, next, abort){
  req.ssl = null
  var u   = url.parse(req.domain)

  if (u.protocol !== null) {
    if (u.protocol == "https:") req.argv.force = "https"
    if (u.protocol == "http:") req.argv.force = "http"
    req.domain = u.hostname
  }

  // --force rides the argv to the api, which applies it after the upload
  // and drops a bad value silently - so the value is checked here, before
  // anything uploads. clearing it (null) is a config job, not a publish one
  if (req.argv.force !== undefined){
    var force = String(req.argv.force).toLowerCase()
    if (force !== "https" && force !== "http") return abort("`--force` takes https or http.".grey)
    req.argv.force = force
  }

  next()
}
