var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var os          = require("os")
var url         = require("url")
var address     = require("url-parse-as-address")

module.exports = function(endpoint){
  var host = endpoint.host
  
  var getFile = function() {
    var home = process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME']
    return path.join(home, ".netrc")
  }

  var get = function(){
    try {
      var obj = netrc(getFile())
    }catch(e){
      var obj = {}
    }

    if (process.env['SURGE_LOGIN'] && process.env['SURGE_TOKEN']) {
      return {
        "email": process.env['SURGE_LOGIN'],
        "token": process.env['SURGE_TOKEN']
      }
    // Fallback to original implementation
    } else if (process.env['TRAVIS_SURGE_LOGIN'] && process.env['TRAVIS_SURGE_TOKEN']) {
      return {
        "email": process.env['TRAVIS_SURGE_LOGIN'],
        "token": process.env['TRAVIS_SURGE_TOKEN']
      }
    }

    if (obj.hasOwnProperty(host)) {
      return {
        "email": obj[host]["login"],
        "token": obj[host]["password"]
      }
    } else {
      return null
    }
  }

  var set = function(email, token){
    var file = getFile();

    try {
      var obj = netrc(file)
    }catch(e){
      var obj = {}
    }

    if(email === null){
      delete obj[host]
      fs.writeFileSync(file, netrc.format(obj) + os.EOL)
      return null
    } else {
      obj[host] = {
        "login": email,
        "password": token
      }
      fs.writeFileSync(file, netrc.format(obj) + os.EOL)
      return get()
    }
  }

  return {
    set: set,
    get: get
  }

}
