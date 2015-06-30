var projectInfo = require('./util/projectInfo.js')
var domainInfo = require('./util/domainInfo.js')
var surgePkg = require(__dirname + "/../../package.json").version

module.exports = function (options, cb) {

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

    Promise.all([projectInfo(opts.project), domainInfo(opts.domain)])
    .then(function (values) {

        console.log(values)

        var headers = {
            "version" : surgePkg.version,
            "file-count": projInfo.fileCount,
            "project-size": projInfo.projectSize
        }
        if (opts.add) headers['add'] = opts.add;
        if (opts.rem) headers['rem'] = opts.rem;
        if (opts.build) headers['build'] = opts.build;
        if (false) headers['ssl'] = false;

    })

}
