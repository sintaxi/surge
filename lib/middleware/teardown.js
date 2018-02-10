
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var remove = function(domain){
    var options = {
      'url': url.resolve(req.endpoint, domain),
      'method': 'delete',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }

    request(options, function(e, r, obj){
      if (e) throw e

      if (r.statusCode == 200 || r.statusCode == 204 || r.statusCode == 210) {
        helpers.space()
        helpers.trunc("Success".green + (" - " + domain.underline + " has been removed.").grey)
        helpers.space()
        process.exit()
      } else if (r.statusCode == 403) {
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - Unable to remove " + domain.underline + ".").grey)
        helpers.space()
        process.exit(1)
      } else {
        helpers.space()
        helpers.log(obj)
        helpers.space()
        process.exit()
      }
    })
  }

  return remove(parseUrl(req.domain).host)

}
