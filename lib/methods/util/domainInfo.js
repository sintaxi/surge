var url = require('url')

module.exports = function (domain) {

    var u = url.parse(domain)
    var domainInfo = {
        ssl: false,
        domain: false
    }

    if (u.protocol !== null) {
        if (u.protocol == 'https:') domainInfo.ssl = true
        if (u.protocol == 'http:') domainInfo.ssl = false
        domainInfo.domain = u.hostname
    }

    return domainInfo
}
