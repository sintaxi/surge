var du        = require("du")
var helpers   = require("./util/helpers")
var fsReader  = require('fstream-ignore')
var fs        = require("fs")
var ignore    = require("surge-ignore")

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' bytes';
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
}

module.exports = function(req, next){
  //process.stdout.write("               size:".grey, "checking...")
  //process.stdout.write("               size: ".grey)

  req.projectSize = 0;
  req.fileCount = 0
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })
  project.addIgnoreRules(ignore)

  project.on("child", function (c) {
    fs.lstat(c.path, function(err, stats) {
      req.projectSize += stats.size
      if (!stats.isDirectory()) req.fileCount++
    })
  }).on("close", function(){
    //helpers.log(req.fileCount + " files,", humanFileSize(req.projectSize))
    next()
  })

}
