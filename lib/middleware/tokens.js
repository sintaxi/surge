var Table = require("cli-table3")
var helpers = require("../util/helpers")
var surgeSDK = require("surge-sdk")

var day = function(iso, fallback){
  return iso ? iso.split("T")[0] : fallback
}

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  sdk.tokens({ user: "token", pass: req.creds.token }, function(error, tokens){
    if (error) return next(error)

    if (tokens.length === 0){
      helpers.space()
      helpers.trunc(("Empty").grey)
      return next()
    }

    var table = new Table({
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
             , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
             , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
             , 'right': '' , 'right-mid': '' , 'middle': ' ' },
      style: { 'padding-left': 0, 'padding-right': 2 }
    })

    tokens.forEach(function(token){
      table.push([
        token.id,
        token.scope.length > 0 ? token.scope.join(", ") : "account".blue,
        (token.msg || "").grey,
        (token.uses + "x").grey,
        (day(token.created_at, "—")).grey,
        ("used " + day(token.last_used_at, "never")).grey
      ])
    })

    helpers.space()
    helpers.log(table.toString())
    return next()
  })

}
