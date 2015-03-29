var helpers = require("./util/helpers")
var pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i

module.exports = function(req, next){
  var label = "              email: ".grey
  req.readline.setPrompt(label)

  if (req.authed) {
    console.log(label + req.creds.email)
    next()
  } else {
    var ask = function(suggestion){
      setTimeout(function(){
        req.readline.write(suggestion)
      }, 5)
      req.readline.question(label, function(answer){
        if (!pattern.test(answer)){
          return ask(answer)
        } else {
          req.email = answer
          return next()
        }
      })
    }
    return ask()
  }

}