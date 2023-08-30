
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){
  
  var plansUrl = req.domain
    ? new URL(path.join(req.domain, "plans"), req.endpoint)
    : new URL("plans", req.endpoint)

  var authorization = `Basic ${
    Buffer.from(`token:${req.creds.token}`).toString('base64')
  }`
  var headers = {
    authorization
  }
  if (req.argv.promo) headers.promo = req.argv.promo

  var options = {
    'headers': headers,
  }

  fetch(plansUrl, options).then(async function(r) {
    if (r.status == 200){
      req.plans = await r.json()
    } 
    return next()
  })

}
