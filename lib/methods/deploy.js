var projectInfo = require('./util/projectInfo.js')
var domainInfo = require('./util/domainInfo.js')
var surgePkg = require(__dirname + "/../../package.json")
var EventEmitter = require('events').EventEmitter

var url = require("url")
var request   = require("request")
var fsReader  = require('fstream-ignore')
var tar  = require('tar')
var zlib = require('zlib')
var ignore = require("surge-ignore")
var split = require("split")

module.exports = function (options) {

    var defaults = this.defaults
    var opts = {
        project: options.project || false,
        token: options.token || false,
        domain: options.domain || false,
        add: options.add || false,
        rem: options.rem || false,
        build: options.build || false
    }

    var emitter = new EventEmitter();

    var tick = function tick (d) {

        var payload;

        try {
            payload = JSON.parse(d.toString())
        } catch(e) {
            return;
        }

        if (payload.hasOwnProperty("type") && payload.type === "error") {
            emitter.emit('error', payload.error)
        }

        if (payload.hasOwnProperty("type") && payload.type === "users") {
            // helpers.log("users:".grey, payload.users.join(", "))
        }

        if (payload.hasOwnProperty("type") && payload.type === "collect") {
            emitter.emit('error',
                "Project requires the " +
                payload.plan.name + " plan. " +
                ("$" + (payload.plan.amount / 100) + "/mo") + " (cancel anytime)."
            )
        }

        if (payload.hasOwnProperty("type") && payload.type === "progress") {
            emitter.emit('progress', {
                file: payload.file,
                percent: payload.written / payload.total,
                written: payload.written,
                total: payload.total,
                type: payload.id,
                payload: payload
            })
        }
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

        // create upload
        var uri = url.resolve(defaults.endpoint, urlInfo.domain)
        var handshake = request.put(uri, { headers: headers })

        // apply basic auth
        handshake.auth("token", opts.token, true)

        // catch errors
        handshake.on('error', function (e) {
            emitter.emit('error', e)
        })

        // split replies on new line
        handshake.pipe(split())

        // output result
        handshake.on("data", tick)

        // done
        handshake.on("end", function () {
            emitter.emit('end')
        })

        handshake.on("response", function(rsp){
            if (rsp.statusCode == 403) {
                emitter.emit('error', 'Aborted - you must be granted access to publish to, ' + urlInfo.domain)
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

    return emitter

}
