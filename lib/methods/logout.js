var localCreds = require('../middleware/util/creds.js')

module.exports = function () {
    localCreds(this.defaults.endpoint).set(null)
}
