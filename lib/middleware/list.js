
var url         = require("url")
var request     = require("request")

module.exports = function(req, next){

  if (req.argv["_"] && req.argv["_"]["0"] === "list") {

    var options = {
      'url': url.resolve(req.endpoint, '/list'),
      'method': 'get',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }

    request(options, function(e, r, obj){
      if (e) throw e

      var list = JSON.parse(obj)

      console.log()
      list.forEach(function(project){
        console.log("      " + project)
      })
      console.log()

      process.exit()
    })
  } else {
    next()
  }
}