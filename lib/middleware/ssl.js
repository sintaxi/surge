var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var split       = require("split")

module.exports = function(req, next, abort){
  if (req.argv["_"][0] !== "ssl") {
    return next()
  } else {

    var upload = function(req, next, abort){
      var uri = url.resolve(req.endpoint, path.join(req.domain, "ssl"))
      var handshake = request.put(uri, { "version" : req.pkg.version })

      // apply basic auth
      handshake.auth("token", req.creds.token, true)

      // catch errors
      handshake.on('error', console.log)

      // split replies on new line
      handshake.pipe(split())

      // output result
      handshake.on("data", function(data){
        console.log(data)
      })

      // done
      handshake.on("end", function(){
        // console.log()
        // console.log("   Success!".green, "-", "ssl cert has been added to", req.domain)
        // console.log()
        // process.exit()
      })

      handshake.on("response", function(rsp){
        if (rsp.statusCode == 403) {
          helpers.log()
          helpers.log("    Unauthorized".yellow + " - you do not have publish access to", req.domain)
          helpers.log()
          process.exit()
        } else if (rsp.statusCode == 400) {
          helpers.log()
          helpers.log("    SSL Fail".red, "-", "pem file is invalid.")
          helpers.log()
          process.exit()
        } else if (rsp.statusCode == 202) {
          helpers.log()
          helpers.log("    SSL Pass".green, "-", "your pem file has been added to", req.domain)
          helpers.log()
          process.exit()
        }
      })

      var pem = fs.createReadStream(req.pem)
      pem.pipe(handshake)
    }


    var mPem = function(req, next, abort){
      var label = "           pem file:".grey
      var pemPath
      var getPem = function(placeholder){
        req.read({
          prompt: label,
          default: placeholder,
          edit: true,
        }, function(err, pem){
          if (pem === undefined) return abort("no PEM file provided")
          if (pem === "") return getPem()
          var pemPath = path.resolve(pem || "")
          if (!fs.existsSync(pemPath)) return getPem(pem)
          req.pem = pemPath
          return upload(req, next, abort)
        })
      }

      var pem = req.argv["pem"]
      pemPath = path.resolve(pem || "")

      if (pem && fs.existsSync(pemPath)) {
        req.pem = pemPath
        console.log(label, pemPath)
        return upload(req, next, abort)
      } else {
        return getPem()
      }

    }


    var mDomain = function(req, next, abort){
      var label = "             domain:".grey
      var getDomain = function(suggestion){
        req.read({
          prompt: label,
          default: suggestion,
          edit: true,
        }, function(err, domain, isDefault){
          if (domain === undefined) return abort("no domain provided")
          if (domain === "") return getDomain()
          if (err || domain.length < 1 || domain.split(".").length < 2) return getDomain(domain)
          req.domain = domain
          return mPem(req, next, abort)
        })
      }

      var domain = req.argv["domain"] || req.argv["d"]

      if (domain) {
        if (domain.split(".").length > 1) {
          req.domain = domain
          console.log(label, domain)
          return mPem(req, next, abort)
        } else {
          return getDomain(domain)
        }
      }

      try {
        domain = fs.readFileSync(path.join(process.cwd(), "CNAME")).toString()
        domain = domain.split(os.EOL)[0].trim()
        return getDomain(domain)
      } catch(e) {
        return getDomain()
      }
    }

    return mDomain(req, next, abort)

  }

}