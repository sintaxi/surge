var helpers  = require("../util/helpers")
var surgeSDK = require("surge-sdk")

// surge claim <code> - any code (plans/transfer.md, plans/b2b.md): a
// transfer code takes its domain into the signed-in account, an invite
// joins its org. The code says which, so nothing else is typed; moving a
// claimed domain into an org is the next command.
//
// With someone at the terminal it first shows what the code does and asks
// (2026-10-28): a transfer makes you a domain's owner, history and all.
// --yes, CI, agents and pipes claim straight away

module.exports = function(req, next){

  var bin  = req.configuration.name
  var sdk  = surgeSDK({ endpoint: req.endpoint.format() })
  var auth = { user: "token", pass: req.creds.token }
  var code = req.argv["_"][0] != null ? String(req.argv["_"][0]).trim() : null

  var abort = function(msg){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - " + msg).grey)
    helpers.space()
    process.exit(1)
  }

  if (!code) return abort("claim takes a code - `" + bin + " claim <code>`.")

  var article = function(role){ return role === "admin" ? "an admin" : "a member" }

  var claim = function(){ sdk.claim(code, auth, done) }

  // read trims its prompt, so the indent sits inside the colour code
  var ask = function(question){
    helpers.read({
      prompt: ("   " + question + " (y/N)").grey,
      terminal: req.configuration.terminal,
      output: req.configuration.output,
      input: req.configuration.input
    }, function(err, answer){
      if (/^y(es)?$/i.test(String(answer || "").trim())) return claim()
      abort("nothing claimed. The code still works.")
    })
  }

  // what accepting does, in a sentence, then who it's from and when it
  // runs out, then the question
  var check = function(){
    sdk.claim(code, { check: true }, auth, function(error, c){
      if (error) return abort((error.messages && error.messages[0]) || error.message || "could not check that code")
      var expires = c.expires_at ? "expires " + String(c.expires_at).split("T")[0] : null
      var details = function(from){
        var line = [from ? "From " + from : null, expires].filter(Boolean).join(" · ")
        if (line) helpers.trunc(line.grey)
      }
      helpers.space()
      if (c.kind === "invite"){
        if (c.member) return abort("you're already in " + c.org.slug + ". The code still works for someone else.")
        var name = c.org.name && c.org.name !== c.org.slug ? " (" + c.org.name + ")" : ""
        helpers.trunc("Adds you as " + article(c.role) + " to the '" + c.org.slug + "' org" + name + ".")
        details(c.by)
        return ask("Would you like to join?")
      }
      if (c.yours) return abort(c.domain + " is already yours.")
      helpers.trunc("Makes you the owner of " + c.domain.underline + ".")
      details(c.from && c.from.org ? "the '" + c.from.org.slug + "' org" : c.by)
      return ask("Would you like to claim it?")
    })
  }

  var done = function(error, rsp){
    if (error) return abort((error.messages && error.messages[0]) || error.message || "could not claim with that code")
    helpers.space()
    if (rsp.org){
      helpers.trunc("Success".green + (rsp.already
        ? " - you're already in " + rsp.org.slug + ". The code is used up, and nothing changed."
        : " - joined " + rsp.org.slug + " as " + article(rsp.role) + ".").grey)
      return next()
    }
    helpers.trunc("Success".green + (" - " + rsp.domain.underline + " is now yours.").grey)
    var orgs = rsp.orgs || []
    if (orgs.length){
      helpers.trunc(("To put it in an org: " + bin + " " + rsp.domain + " transfer " + (orgs.length === 1 ? orgs[0] : "<org>")).grey)
    }
    return next()
  }

  if (req.argv.yes || helpers.nobodyToAsk(req)) return claim()
  check()

}
