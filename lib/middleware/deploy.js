var fs = require("fs")
var request   = require("request")
var fsReader  = require('fstream-ignore')
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var prompt      = helpers.prompt

var surge    = require('../surge')

module.exports = function(req, next){
  var upload = request.put("http://" + req.argv.endpoint + "/" + req.domain)
    .auth("token", req.creds.token, true)

  process.stdout.write("        upload: ".grey)

  upload.on('response', function(rsp){
    if (rsp.statusCode == 200) {

      rsp.on('data', function(chunk){
        process.stdout.write(".".grey)
        //helpers.log(chunk.toString().grey)
      })

      rsp.on('end', function() {
        helpers.log(" done")
        helpers.log("    ip address:".grey, "192.241.214.148")
        helpers.log()
        next()
      })

    } else {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      helpers.log("    Error:", rsp.statusCode.toString().red)
      helpers.log()
    }
  })

  var tarball = fs.createReadStream(req.tarballPath)

  tarball.pipe(upload)

}
