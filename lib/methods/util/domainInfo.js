var url = require('url')
var helpers = require('../../middleware/util/helpers.js')

module.exports = function (domain) {

    var u = url.parse(domain)
    var domainInfo = {
        ssl: false,
        domain: domain
    }

    if (u.protocol !== null) {
        if (u.protocol == 'https:') domainInfo.ssl = true
        if (u.protocol == 'http:') domainInfo.ssl = false
        domainInfo.domain = u.hostname
    }

    if (!helpers.validDomain(domainInfo.domain)) domainInfo.domain = false

    return domainInfo
}
