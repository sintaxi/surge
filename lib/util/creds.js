var path        = require("path")
var fs          = require("fs")
var netrc       = require("netrc")
var os          = require("os")
require("colors")

module.exports = function(endpoint){
  var host = endpoint.host

  var getFile = function() {
    var home = process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME']
    return path.join(home, ".netrc")
  }

  // returns {} when the file is missing, null when it exists but can't be
  // parsed — callers must not write anything back in the null case.
  var read = function(file){
    try {
      return netrc(file)
    }catch(e){
      return null
    }
  }

  var get = function(){
    var obj = read(getFile()) || {}

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
    var file = getFile()
    var obj = read(file)

    if (obj === null){
      console.log()
      console.log("   Aborted".red + (" - could not read " + file).grey)
      console.log(("   Refusing to modify it. Please fix or remove the file and try again.").grey)
      console.log()
      process.exit(1)
    }

    if (email === null){
      delete obj[host]
    } else {
      obj[host] = {
        "login": email,
        "password": token
      }
    }

    fs.writeFileSync(file, netrc.format(obj) + os.EOL, { mode: 0o600 })
    return email === null ? null : get()
  }

  return {
    set: set,
    get: get
  }

}
