
var helpers     = require("./util/helpers")
var parseUrl    = require("url-parse-as-address")

module.exports = function(req, next, abort){

  var remove = function(domain){
    var url = new URL(domain, req.endpoint)
    var authorization = `Basic ${
      Buffer.from(`token:${req.creds.token}`).toString('base64')
    }`
    var options = {
      'method': 'DELETE',
      headers: { authorization }
    }

    fetch(url, options).then(async function(r) {
      if (r.status == 200 || r.status == 204 || r.status == 210) {
        helpers.space()
        helpers.trunc("Success".green + (" - " + domain.underline + " has been removed.").grey)
        helpers.space()
        process.exit()
      } else if (r.status == 403) {
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - Unable to remove " + domain.underline + ".").grey)
        helpers.space()
        process.exit(1)
      } else {
        helpers.space()
        helpers.log(await r.json())
        helpers.space()
        process.exit()
      }
    })
  }

  return remove(parseUrl(req.domain).host)

}
