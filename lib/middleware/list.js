var url         = require("url")
var request     = require("request")

module.exports = function(req, next){

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
    if (list.length != 0) {
      list.forEach(function(project){
        console.log("      " + project)
      })
    } else {
      console.log("    Empty".yellow, "- No Projects found.")
    }
    next()
  })

}