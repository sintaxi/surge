var ignore    = require("surge-ignore")
var fsReader  = require('fstream-ignore')
var fs        = require("fs")

module.exports = function (path) {
    return new Promise(function (resolve, reject) {
        var projectSize = 0;
        var fileCount = 0
        var project = fsReader({ 'path': path, ignoreFiles: [".surgeignore"] })
        project.addIgnoreRules(ignore)

        project.on("child", function (c) {
            fs.lstat(c.path, function(err, stats) {
                projectSize += stats.size
                if (!stats.isDirectory()) fileCount++
            })
        }).on("close", function() {
            resolve({
                projectSize: projectSize,
                fileCount: fileCount
            })
        }).on("error", function (err) {
            reject(err)
        })
    })
}
