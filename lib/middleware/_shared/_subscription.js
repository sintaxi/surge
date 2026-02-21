
var axios       = require("axios")
var url         = require("url")
var helpers     = require("../../util/helpers")
var path        = require("path")

module.exports = function(req, next, abort){

  var subscribeUrl = req.domain
    ? url.resolve(req.endpoint.format ? req.endpoint.format() : req.endpoint, path.join(req.domain, "plan"))
    : url.resolve(req.endpoint.format ? req.endpoint.format() : req.endpoint, "plan")

  axios.get(subscribeUrl, {
    auth: { username: "token", password: req.creds.token }
  }).then(function(response) {
    req.card = response.data.card
    req.subscription = response.data.subscription
    req.stripe_pk = response.data.stripe_pk
    return next()
  }).catch(function(error) {
    if (error.response) {
      console.log(error.response.data)
    } else {
      console.log(error.message)
    }
    return next()
  })

}
