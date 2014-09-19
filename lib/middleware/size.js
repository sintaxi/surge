var du = require("du")
var helpers = require("./util/helpers")

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
};

module.exports = function(req, next){
  du(req.project, {
    filter: function (f) {
      return /\.git/.test(f)
    }
  }, function(err, size){
    helpers.log("               size:".grey, humanFileSize(size))
    next()
  })

}