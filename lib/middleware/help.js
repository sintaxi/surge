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
    var missing = false
    var a0 = req.argv._[0] != null ? String(req.argv._[0]) : null

    if (typeof req.argv.domain === "string" && helpers.validDomain(req.argv.domain)){
      local = { domain: req.argv.domain, source: "arg" }
    } else if (a0){
      // mirrors the router: a valid domain wins unless the path form is
      // forced - a same-named directory never shadows a domain
      var forced = a0 === "." || a0 === ".." || a0.indexOf("./") === 0 ||
                   a0.indexOf("../") === 0 || a0.indexOf("/") === 0
      if (!forced && a0.indexOf("@") === -1 && helpers.validDomain(a0)){
        typed = a0
        local = { domain: a0, source: "arg" }
      } else if (forced || a0.indexOf("/") !== -1 || fs.existsSync(a0)){
        typed = a0
        if (!fs.existsSync(a0)){
          missing = true
        } else {
          var found = discovery.local(a0)
          if (found){
            local = { domain: found.domain, source: found.source, at: a0 }
          } else {
            notAProject = true
          }
        }
      }
    } else {
      local = discovery.local()
    }

    // the slot reads <domain> because that is what almost everyone puts
    // there. a path works too - that is the power-user form, left for the
    // docs rather than spent on a line of the help screen.
    var proj = typed ? typed + " " : (local ? "" : "<domain> ")

    // rows are collected before anything prints so one description column
    // serves every section. the widest line sets it, which matters because
    // the target slot changes width with context - empty inside a project,
    // the typed domain when one is given, <domain> otherwise.
    var rows = []
    var row = function(section, left, desc){
      rows.push({ section: section, left: left, desc: desc })
    }
    var cmd = function(word, args){
      return name + " " + proj + word + (args ? " " + args : "")
    }

    // each section opens with its own blank line, so the header and the
    // context line below it close without one
    helpers
      .log()
      .log("  " + req.configuration.platform.replace(/^\w/, c => c.toUpperCase()).underline.blue, ("⚡ " + req.pkg.description).brightYellow, req.pkg.version.grey)

    if (local){
      var label = sourceLabels[local.source] || local.source
      if (local.at && local.at !== ".") label += " in " + local.at
      helpers
        .log()
        .log("  " + local.domain.underline + (" (" + label + ")").grey)
    } else if (missing){
      helpers
        .log()
        .log("  " + typed.underline + " (no such directory)".grey)
    } else if (notAProject){
      helpers
        .log()
        .log("  " + typed.underline + " (not a surge project yet)".grey)
    }

    // publish takes a path, never a domain - a domain has nothing to upload
    var typedPath = typed && !missing && (notAProject || (local && local.at)) ? typed : null
    var typedDomain = typed && local && !local.at ? typed : null
    var pair = typedPath
      ? name + " " + typedPath + " <domain>"
      : (typedDomain ? name + " <path> " + typedDomain : name + " <path> <domain>")
    var publishLine = typedPath
      ? name + " " + typedPath + " publish"
      : (local && !typed ? name + " publish" : name + " <path> publish")

    row("PUBLISHING", pair, "publish dir to domain")
    row("PUBLISHING", publishLine, "publish using local CNAME")

    row("ADMIN", name + " whoami", "display current session")
    row("ADMIN", name + " login", "authenticate")
    row("ADMIN", name + " logout", "remove session & expire token")
    row("ADMIN", name + " verify", "verify email address")
    row("ADMIN", name + " list", "show all projects")
    row("ADMIN", name + " card", "change billing credit card")
    row("ADMIN", name + " plan", "show/change account plan")
    row("ADMIN", name + " tokens", "show available tokens commands")

    // a target that is not a project yet gets the way in, not a list
    // of commands that cannot run against it
    if (!notAProject && !missing){
      row("PROJECT", cmd("config"), "show/change project configuration")
      row("PROJECT", cmd("rollback|rollfore"), "change live revision")
      row("PROJECT", cmd("invite", "<emails>"), "invite collaborators to project")
      row("PROJECT", cmd("revoke", "<emails>"), "revoke access to collaborators")
      row("PROJECT", cmd("teardown"), "remove project (!destructive)")
      row("PROJECT", cmd("stats"), "show available analytics commands")
      row("PROJECT", cmd("dns"), "show available dns commands")
      row("PROJECT", cmd("debug"), "show available debug commands")
    }

    // the widest line sets the description column, but only up to a ceiling
    // - a long absolute path in the target slot would otherwise drag every
    // `surge login` in the screen out to its width. past the ceiling a line
    // just runs over and keeps its own gap.
    var CEILING = 44
    var GAP = 6
    var width = 0
    rows.forEach(function(r){
      if (r.left.length > width && r.left.length <= CEILING) width = r.left.length
    })

    var section = null
    rows.forEach(function(r){
      if (r.section !== section){
        section = r.section
        helpers.log().log("  " + section.grey)
      }
      var left = r.left.length >= width + GAP ? r.left + pad("", GAP) : pad(r.left, width + GAP)
      helpers.log("    " + left + r.desc.grey)
    })
    helpers.log()
  } else {
    next()
  }
}

// namespace usage screens - shown for a verbless noun. the lines echo the
// target exactly as typed (or the cwd-implied short form), the header
// announces what it resolved to, and <domain> only renders when nothing
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
  return typed ? typed + " " : (local ? "" : "<domain> ")
}

module.exports.dnsUsage = function(name, local, typed){
  var proj = projToken(local, typed)
  helpers.log()
  usageHeader(local, "DNS")
  helpers
    .log("    " + name + " " + proj + "dns " + "list".grey)
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

// `surge account` still dispatches, so this screen answers it - but the
// identity verbs are flat, so it teaches the flat spelling rather than the
// one the user happened to type in.
module.exports.accountUsage = function(name){
  helpers
    .log()
    .log("    " + name + " " + "whoami".grey)
    .log("    " + name + " " + "login".grey)
    .log("    " + name + " " + "logout".grey)
    .log("    " + name + " " + "verify".grey)
    .log("    " + name + " " + "card".grey)
    .log("    " + name + " " + "plan".grey)
    .log("    " + name + " " + "nuke".grey)
    .log()
}

module.exports.tokensUsage = function(name){
  helpers
    .log()
    .log("    " + name + " tokens " + "list".grey)
    .log("    " + name + " tokens " + "add [--domain <domain>] [-m <msg>]".grey)
    .log("    " + name + " tokens " + "rem <id>".grey)
    .log()
}
