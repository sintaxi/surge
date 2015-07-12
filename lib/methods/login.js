var helpers = require('../middleware/util/helpers.js')
var localCreds  = require('../middleware/util/creds.js')

module.exports = function (email, password, cb) {
    var defaults = this.defaults;
    var creds = new Promise(function (resolve, reject) {
        helpers.fetchToken(defaults.endpoint)(email, password, function(err, obj){
            if (err) reject(err);
            else resolve(localCreds(defaults.endpoint).set(obj.email, obj.token))
        })
    })

    if (typeof cb === 'function') {
        creds.then(function (c) {
            cb(null, c)
        })
        .catch(function (e) {
            cb(e, null)
        })
    }

    return creds
}
