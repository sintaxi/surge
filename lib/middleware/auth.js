var request     = require("request")
var localCreds  = require("./util/creds.js")
var helpers     = require("./util/helpers.js")
var prompt      = helpers.prompt
var os          = require('os') 

var auth = module.exports = function(req, next){

  var fetchToken = function(email, pass, callback){
    var options = {
      'url': 'http://' + req.argv.endpoint + '/token',
      'method': 'post',
      'auth': {
        'user': email,
        'pass': pass,
        'sendImmediately': true
      }
    }
    request(options, function(e, r, obj){
      if (e) throw e

      if(r.statusCode == 401){
        var obj = JSON.parse(obj)
        callback(obj, null)
      }else{
        var obj = JSON.parse(obj)
        var c   = localCreds(req.argv.endpoint).set(obj.email, obj.token.replace(os.EOL, ""))
        callback(null, c)
      }
    })
  }

  // TODO: check that the creds are good
  // if (req.creds) return next()

  // helpers.log("please authenticate or signup by providing email and password".green)

  prompt.start()

  var schema = {
    properties: {
      email: {
        required: true,
        description: "              email:",
        format: "email",
      },
      password: {
        description: "           password:",
        required: true,
        hidden: true
      }
    }
  }

  if (req.creds) {
    // ensure token is valid
    fetchToken("token", req.creds.token, function(err, obj){
      if (err) {
        localCreds(req.argv.endpoint).set(null)
        req.creds = null
        auth(req, next)
      } else {
        req.creds = localCreds(req.argv.endpoint).set(obj.email, obj.token)
        next()
      }
    })
  } else {
    prompt.get(schema, function (err, result) {
      fetchToken(result.email, result.password, function(err, obj){
        if (err) {
          helpers.log(err)
          auth(req, next)
        } else {
          req.creds = localCreds(req.argv.endpoint).set(obj.email, obj.token)
          next()
        }
      })
    })
  }


}

