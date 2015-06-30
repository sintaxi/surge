var ignore    = require("surge-ignore")
var fsReader  = require('fstream-ignore')
var fs        = require("fs")

module.exports = function (project) {
    return new Promise(function (resolve, reject) {
        var projectSize = 0;
        var fileCount = 0
        var project = fsReader({ 'path': project, ignoreFiles: [".surgeignore"] })
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
        }).on("error", function(e) {
            reject(e)
        })
    })
}
