var pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i

module.exports = function(req, next, abort){
  var label = "              email:".grey

  if (req.authed) {
    console.log(label, req.creds.email)
    return next()
  } else {
    var ask = function(suggestion){
      req.read({
        silent: false,
        prompt: label,
        default: suggestion,
        edit: true,
      }, function(err, answer){
        if (answer === undefined) return abort()
        if (!pattern.test(answer)){
          // console.log()
          // console.log("    Invalid".yellow, "-".grey, "please enter valid email address.".grey)
          // console.log()
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