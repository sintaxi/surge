var request   = require("request")
var fsReader  = require('fstream-ignore')
var tar       = require('tar')
var zlib      = require('zlib')
var prompt    = require('prompt')
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")

var skin    = require('./util/skin.js')
var m       = require('./')

module.exports = function(req, next){

  var upload = request.put("http://" + req.argv.endpoint + "/" + (req.argv.domain || "foo.lvh.me"))
    .auth("token", req.creds.token, true)

  upload.on('response', function(rsp){
    //console.log(rsp.statusCode)

    if (rsp.statusCode == 200) {
      rsp.on('data', function(chunk){
        helpers.log(chunk.toString().grey)
      })

      rsp.on('end', function() {
        helpers.log("Done".green)
        next()
      })

    } else {
      //console.log("no 200", err)
      localCreds(req.argv.endpoint).set(null)

      skin(req, [
        m.creds,
        m.log,
        m.auth,
        m.deploy,
        process.exit
      ])
    }
  })

  /**
   * Pack
   */

  var pack = tar.Pack()

  /**
   * GZip
   */

  var zip = zlib.Gzip()

  fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })
    .pipe(pack)
    .pipe(zip)
    .pipe(upload)

}
