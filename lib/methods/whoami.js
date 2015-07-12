var localCreds = require('../middleware/util/creds.js')

module.exports = function () {
    return localCreds(this.defaults.endpoint).get()
}
