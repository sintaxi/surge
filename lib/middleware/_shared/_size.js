var helpers     = require("../../util/helpers")
var fs          = require("fs")
var path        = require("path")
var Ignore      = require("ignore")
var surgeIgnore = require("surge-ignore")

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

function walkDir(dir, ig, prefix, stats) {
  var entries = fs.readdirSync(dir)
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    var fullPath = path.join(dir, entry)
    var relativePath = prefix ? prefix + "/" + entry : entry
    var stat = fs.lstatSync(fullPath)

    if (stat.isDirectory()) {
      if (!ig.ignores(relativePath + "/")) {
        walkDir(fullPath, ig, relativePath, stats)
      }
    } else {
      if (!ig.ignores(relativePath)) {
        stats.fileCount++
        stats.totalSize += stat.size
      }
    }
  }
}

module.exports = function(req, next){
  req.projectSize = 0
  req.fileCount = 0

  // Create ignore filter with default surge rules
  var ig = Ignore().add(surgeIgnore)

  // Load .surgeignore if it exists
  var surgeignorePath = path.join(req.project, ".surgeignore")
  if (fs.existsSync(surgeignorePath)) {
    ig.add(fs.readFileSync(surgeignorePath, "utf8"))
  }

  // Walk directory and collect stats
  var stats = { fileCount: 0, totalSize: 0 }
  walkDir(req.project, ig, "", stats)

  req.projectSize = stats.totalSize
  req.fileCount = stats.fileCount

  helpers.log(helpers.smart('size:').grey + " " + req.fileCount + " files, " + humanFileSize(req.projectSize))
  next()
}
