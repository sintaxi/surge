var fs = require("fs")
var request   = require("request")
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var prompt      = helpers.prompt
var tar  = require('tar')
var zlib = require('zlib')
var fsReader  = require('fstream-ignore')
var surge    = require('../surge')



module.exports = function(req, next){
  //var bar = new ProgressBar('             upload: [:bar] :percent :etas', { total: 20, incomplete: ' ' });

  // var timer = setInterval(function () {
  //   bar.tick();
  //   if (bar.complete) {
  //     console.log('\ncomplete\n');
  //     clearInterval(timer);
  //   }
  // }, 100);

  // var upload = request.put("http://" + req.argv.endpoint + "/" + req.domain)
  //   .auth("token", req.creds.token, true)


  headers = {
    "version" : req.pkg.version
  }

  if (req.argv.a)
    headers["add"] = req.argv.a.join(",")

  if (req.argv.r)
    headers["rem"] = req.argv.r.join(",")

  var upload = request({
    method: "PUT",
    headers: headers,
    uri: "http://" + req.argv.endpoint + "/" + req.domain
  }).auth("token", req.creds.token, true)

  process.stdout.write("             upload: ".grey)

  upload.on('response', function(rsp){
    if (rsp.statusCode == 200) {

      rsp.on('data', function(chunk){
        process.stdout.write(".".grey)
        //bar.tick();
        //helpers.log(chunk.toString().grey)
      })

      rsp.on('end', function(stuff) {
        //bar.tick(100);
        helpers.log(" done")
        helpers.log("         ip address:".grey, "192.241.214.148")
        helpers.log()
        next()
      })

    } else if (rsp.statusCode == 403) {
      helpers.log()
      helpers.log("    Error:", "Forbidden to push to this project".red)
      helpers.log()
    } else {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      helpers.log("    Error:", rsp.statusCode.toString().red)
      helpers.log()
    }
  })

  // var tarball = fs.createReadStream(req.tarballPath)
  // tarball.pipe(upload)

  var pack = tar.Pack()
  var zip = zlib.Gzip()
  var total = 0
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })
  project.addIgnoreRules([".git"])

  project.pipe(pack).pipe(zip).pipe(upload)

}
