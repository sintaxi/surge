var helpers = require("./util/helpers")

module.exports = function(req, next){
  helpers.prompt.get({
    name: "email",
    description: "              email:",
    format: "email",
    required: true,
    conform: function(val){
      return val
    },
    before: function(val){
      process.stdout.clearLine()
      return val
    }
  }, function(err, result){
    req.email = result.email
    next()
  })
}