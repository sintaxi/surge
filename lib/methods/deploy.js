var projectInfo = require('./util/projectInfo.js')
var domainInfo = require('./util/domainInfo.js')
var surgePkg = require(__dirname + "/../../package.json")

var url = require("url")
var request   = require("request")
var fsReader  = require('fstream-ignore')
var tar  = require('tar')
var zlib = require('zlib')
var ignore = require("surge-ignore")
var split = require("split")

module.exports = function (options, cb) {

    var defaults = this.defaults
    var opts = {
        project: options.project || false,
        token: options.token || false,
        domain: options.domain || false,
        add: options.add || false,
        rem: options.rem || false,
        build: options.build || false
    }

    var cbIsFunction = (typeof cb === 'function')

    if (!opts.project && !opts.token) {
        if (cbIsFunction) cb('You must pass in both a project dir and an auth token', null)
        return false
    }

    projectInfo(opts.project)
    .then(function (projInfo) {

        var urlInfo = domainInfo(opts.domain);

        var headers = {
            "version" : surgePkg.version,
            "file-count": projInfo.fileCount,
            "project-size": projInfo.projectSize
        }
        if (opts.add) headers['add'] = opts.add;
        if (opts.rem) headers['rem'] = opts.rem;
        if (opts.build) headers['build'] = opts.build;
        if (urlInfo.ssl) headers['ssl'] = urlInfo.ssl;

        console.log(opts.domain, urlInfo)

        // create upload
        var uri = url.resolve(defaults.endpoint, urlInfo.domain)
        var handshake = request.put(uri, { headers: headers })


        // apply basic auth
        handshake.auth("token", opts.token, true)

        // catch errors
        handshake.on('error', console.log)

        // split replies on new line
        handshake.pipe(split())

        // output result
        handshake.on("data", function (d) {
            console.log(d)
        })

        // done
        handshake.on("end", function () {
            console.log('COMPLETE')
        })

        handshake.on("response", function(rsp){
            if (rsp.statusCode == 403) {
                console.log(403)
            }
        })

        // Read Project
        var project = fsReader({ 'path': opts.project, ignoreFiles: [".surgeignore"] })

        // we always ignore .git directory
        project.addIgnoreRules(ignore)

        // chain all this together...
        project
        .pipe(tar.Pack())
        .pipe(zlib.Gzip())
        .pipe(handshake)


    })

}
