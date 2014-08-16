var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")

module.exports = function(endpoint){

  var get = function(){
    try {
      var obj = netrc()
    }catch(e){
      var obj = {}
    }

    if (obj.hasOwnProperty(endpoint)) {
      return {
        "email": obj[endpoint]["login"],
        "token": obj[endpoint]["password"]
      }
    } else {
      return null
    }
  }

  var set = function(email, token){
    var home = process.env.HOME || process.env.HOMEPATH;
    var file = path.join(home, ".netrc")

    try {
      var obj = netrc()
    }catch(e){
      var obj = {}
    }

    if(email === null){
      delete obj[endpoint]
      fs.writeFileSync(file, netrc.format(obj) + "\n")
      return null
    } else {
      obj[endpoint] = {
        "login": email,
        "password": token
      }
      fs.writeFileSync(file, netrc.format(obj) + "\n")
      return get()
    }
  }

  return {
    set: set,
    get: get
  }

}
