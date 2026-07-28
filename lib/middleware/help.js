var fs        = require("fs")
var helpers   = require("../util/helpers")
var discovery = require("./_shared/discovery")

var pad = function(str, width){
  while (str.length < width) str += " "
  return str
}

var sourceLabels = { cname: "CNAME found", pkg: "package.json", arg: "given" }

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    var name = req.configuration.name

    // target-first context: argv._[0] is the target slot. a typed target
    // echoes in the lines, a resolvable one renders the header, and a
    // passed path that resolves nothing means no context - never fall
    // back to the cwd and lie about the target.
    var typed = null
    var local = null
    var notAProject = false
    var a0 = req.argv._[0] != null ? String(req.argv._[0]) : null

    if (typeof req.argv.domain === "string" && helpers.validDomain(req.argv.domain)){
      local = { domain: req.argv.domain, source: "arg" }
    } else if (a0){
      var pathish = a0 === "." || a0 === ".." || a0.indexOf("/") !== -1 || fs.existsSync(a0)
      if (!pathish && a0.indexOf("@") === -1 && helpers.validDomain(a0)){
        typed = a0
        local = { domain: a0, source: "arg" }
      } else if (pathish){
        typed = a0
        var found = discovery.local(a0)
        if (found){
          local = { domain: found.domain, source: found.source, at: a0 }
        } else {
          notAProject = true
        }
      }
    } else {
      local = discovery.local()
    }

    var proj = typed ? typed + " " : (local ? "" : "<proj> ")

    var cmd = function(word, args){
      return "    " + name + " " + proj + pad(word, 10) + (args ? args.grey : "")
    }

    var sub = function(word, verbs){
      return "    " + name + " " + proj + pad(word, 10) + pad("<cmd>", 9).grey + verbs.grey
    }

    helpers
      .log()
      .log("  " + req.configuration.platform.replace(/^\w/, c => c.toUpperCase()).underline.blue, ("⚡ " + req.pkg.description).brightYellow, req.pkg.version.grey)
      .log()

    if (local){
      var label = sourceLabels[local.source] || local.source
      if (local.at && local.at !== ".") label += " in " + local.at
      helpers
        .log("  " + local.domain.underline + (" (" + label + ")").grey)
        .log()
    } else if (notAProject){
      helpers
        .log("  " + typed.underline + " (not a surge project yet)".grey)
        .log()
    }

    helpers
      .log("  " + "PUBLISH".grey)
      .log("    " + name + " " + "<path> <domain>")
      .log(cmd("publish"))
      .log()
      .log("  " + "COMMANDS".grey)
      .log(cmd("config"))
      .log(cmd("revs"))
      .log(cmd("rollback"))
      .log(cmd("rollfore"))
      .log(cmd("cutover"))
      .log(cmd("discard", "<rev>"))
      .log(cmd("invite", "<emails>"))
      .log(cmd("revoke", "<emails>"))
      .log(cmd("teardown"))
      .log(sub("dns", "all·add·rem"))
      .log(sub("debug", "status·files·audit·bust·certs·encrypt"))
      .log(sub("stats", "traffic·load·audience·usage"))

    if (!local && !typed){
      helpers
        .log()
        .log("    " + "...where <proj> can be the <domain>, <path>, or <cwd>".grey)
    }

    helpers
      .log()
      .log("  " + "ADMIN".grey)
      .log("    " + name + " " + pad("list", 10))
      .log("    " + name + " " + pad("account", 10) + pad("<cmd>", 9).grey + "whoami·login·logout·verify·card·plan·nuke".grey)
      .log("    " + name + " " + pad("tokens", 10) + pad("<cmd>", 9).grey + "all·add·rem".grey)
      .log()
  } else {
    next()
  }
}

// namespace usage screens - shown for a verbless noun. the lines echo the
// target exactly as typed (or the cwd-implied short form), the header
// announces what it resolved to, and <proj> only renders when nothing
// resolves at all.

var usageHeader = function(local, label){
  if (!local) return
  var src = sourceLabels[local.source] || local.source
  if (local.at && local.at !== ".") src += " in " + local.at
  helpers
    .log("  " + local.domain.underline + (" (" + src + "). " + label + " commands...").grey)
    .log()
}

var projToken = function(local, typed){
  return typed ? typed + " " : (local ? "" : "<proj> ")
}

module.exports.dnsUsage = function(name, local, typed){
  var proj = projToken(local, typed)
  helpers.log()
  usageHeader(local, "DNS")
  helpers
    .log("    " + name + " " + proj + "dns " + "all".grey)
    .log("    " + name + " " + proj + "dns " + "add <type> <name> <value>".grey)
    .log("    " + name + " " + proj + "dns " + "rem <id>".grey)
    .log()
    .log("  " + "NS SERVERS (GEO)".grey)
    .log("  ns1.surge.world")
    .log("  ns2.surge.world")
    .log("  ns3.surge.world")
    .log("  ns4.surge.world")
    .log()
}

module.exports.debugUsage = function(name, local, typed){
  var proj = projToken(local, typed)
  helpers.log()
  usageHeader(local, "Debug")
  helpers
    .log("    " + name + " " + proj + "debug " + "status".grey)
    .log("    " + name + " " + proj + "debug " + "files".grey)
    .log("    " + name + " " + proj + "debug " + "audit".grey)
    .log("    " + name + " " + proj + "debug " + "bust".grey)
    .log("    " + name + " " + proj + "debug " + "certs".grey)
    .log("    " + name + " " + proj + "debug " + "encrypt".grey)
    .log()
}

module.exports.statsUsage = function(name, local, typed){
  var proj = projToken(local, typed)
  helpers.log()
  usageHeader(local, "Stats")
  helpers
    .log("    " + name + " " + proj + "stats " + "traffic".grey)
    .log("    " + name + " " + proj + "stats " + "load".grey)
    .log("    " + name + " " + proj + "stats " + "audience".grey)
    .log("    " + name + " " + proj + "stats " + "usage".grey)
    .log()
}

module.exports.accountUsage = function(name){
  helpers
    .log()
    .log("    " + name + " account " + "whoami".grey)
    .log("    " + name + " account " + "login".grey)
    .log("    " + name + " account " + "logout".grey)
    .log("    " + name + " account " + "verify".grey)
    .log("    " + name + " account " + "card".grey)
    .log("    " + name + " account " + "plan".grey)
    .log("    " + name + " account " + "nuke".grey)
    .log()
}

module.exports.tokensUsage = function(name){
  helpers
    .log()
    .log("    " + name + " tokens " + "all".grey)
    .log("    " + name + " tokens " + "add [--domain <domain>] [-m <msg>]".grey)
    .log("    " + name + " tokens " + "rem <id>".grey)
    .log()
}
