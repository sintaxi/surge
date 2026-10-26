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
      .log("  " + req.configuration.platform.replace(/^\w/, c => c.toUpperCase()).underline.blue, "⚡ Static Web Publishing".brightYellow, req.pkg.version.grey)

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
    row("PUBLISHING", name + " <page.html> <domain>", "publish one html page as index.html")
    row("PUBLISHING", pair + " --preview", "publish a preview, production untouched")

    // previews are only useful if the way to ship one is on the same
    // screen - an agent reading this learns cutover exists
    if (!notAProject && !missing){
      row("REVISIONS", cmd("revs"), "list revisions")
      row("REVISIONS", cmd("cutover", "[<rev>]"), "serve a revision (ships a preview)")
      row("REVISIONS", cmd("rollback|rollfore"), "change live revision")
      row("REVISIONS", cmd("discard", "<rev>"), "remove a revision")
    }

    row("ADMIN", name + " whoami", "display current session")
    row("ADMIN", name + " login", "authenticate")
    row("ADMIN", name + " logout", "remove session & expire token")
    row("ADMIN", name + " verify", "verify email address")
    row("ADMIN", name + " mfa", "manage two-factor auth")
    row("ADMIN", name + " list", "list your domains, newest first")
    row("ADMIN", name + " card", "change billing credit card")
    row("ADMIN", name + " plan", "show/change account plan")
    row("ADMIN", name + " tokens", "show available tokens commands")
    row("ADMIN", name + " orgs", "show your orgs")
    row("ADMIN", name + " claim <code>", "take a domain someone transferred to you")

    // a target that is not a project yet gets the way in, not a list
    // of commands that cannot run against it
    if (!notAProject && !missing){
      row("PROJECT", cmd("config"), "show/change project configuration")
      // invite and revoke still run, for old grants; orgs share domains now
      row("PROJECT", cmd("transfer", "[<org>]"), "move to an org, or get a code to give it away")
      row("PROJECT", cmd("teardown"), "remove project (!destructive)")
      row("PROJECT", cmd("stats"), "show available analytics commands")
      row("PROJECT", cmd("dns"), "show available dns commands")
      row("PROJECT", cmd("debug"), "show available debug commands")
    }

    row("AUTH", "--token <token>", "authenticate without logging in")
    row("AUTH", "SURGE_TOKEN=<token>", "same, from the environment")

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
    helpers
      .log()
      .log("  " + (name + " <command> --help for one command").grey)
      .log()
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

module.exports.orgsUsage = function(name){
  helpers
    .log()
    .log("    " + name + " " + "orgs".grey)
    .log("    " + name + " orgs " + "<org>".grey)
    .log("    " + name + " orgs " + "<org> create [--name <name>]".grey)
    .log("    " + name + " orgs " + "<org> rename <slug> [--name <name>]".grey)
    .log("    " + name + " orgs " + "<org> remove".grey)
    .log("    " + name + " orgs " + "<org> join <code>".grey)
    .log("    " + name + " orgs " + "<org> members".grey)
    .log("    " + name + " orgs " + "<org> members <email> invite [--admin]".grey)
    .log("    " + name + " orgs " + "<org> members <email> revoke|mkadmin|rmadmin".grey)
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

// one command's usage - `surge <verb> --help`, `surge <target> <verb>
// --help` and `surge help <verb>`. {t} is the target slot: the target as
// typed, <domain> otherwise. the wording follows the command reference on
// surge.sh (docs/cli/reference), which documents every command.
var publishFlags = [
  ["--preview", "publish a preview, production untouched"],
  ["-m, --message <msg>", "attach a message to the revision"],
  ["--force https|http", "redirect all traffic to that protocol (sticks)"],
  ["--private | --public", "lock the domain to its collaborators, or open it"],
  ["-a, --add <email>", "add a collaborator"],
  ["-r, --remove <email>", "remove a collaborator"],
  ["--token <token>", "authenticate without logging in (or SURGE_TOKEN)"]
]

var usages = {
  publish: {
    lines: ["<path> <domain>", "<path> <org>:<domain>", "<path> publish", "<page.html> <domain>"],
    desc: [
      "Publish a directory to a domain, or one html page as its index.html.",
      "`_` as the domain generates a fresh .surge.sh name; `publish` uses",
      "the project's CNAME file. <org>: claims a new domain for an org."
    ],
    flags: publishFlags
  },
  teardown: { lines: ["{t}teardown"], desc: ["Remove the project from the domain and the CDN (!destructive)."] },
  transfer: {
    lines: ["{t}transfer", "{t}transfer <org>", "{t}transfer <your email>"],
    desc: [
      "Move the domain into an org you're in, or out to your own account.",
      "With nothing after it, prints a code: whoever runs `{n} claim <code>`",
      "takes the domain. A new code replaces the last. Serving is unchanged."
    ]
  },
  claim:    { lines: ["claim <code>"], desc: ["Take the domain a transfer code names into your account."] },
  list:     {
    lines: ["list", "list --all", "list <org>:"],
    desc: [
      "Your domains and your orgs', newest first: owner, age, last publisher.",
      "The newest 50 unless --all. `{n} <domain> list` lists revisions."
    ]
  },
  revs:     { lines: ["{t}revs"], desc: ["The project's revisions - preview url, age, author, size and message -", "with the live revision marked."] },
  rollback: { lines: ["{t}rollback"], desc: ["Serve the previous revision."] },
  rollfore: { lines: ["{t}rollfore"], desc: ["Serve the next revision (the inverse of rollback)."] },
  cutover:  { lines: ["{t}cutover [<rev>]"], desc: ["Serve a revision, or the latest when omitted. Ships a preview."] },
  discard:  { lines: ["{t}discard [<rev>]"], desc: ["Remove a revision. If it was live, production moves to a neighbouring", "revision; discarding the last one takes the project offline."] },
  dns: {
    lines: ["{t}dns list", "{t}dns add <type> <name> <value>", "{t}dns rem <id>"],
    desc: ["The domain's custom DNS records. MX records take a priority."]
  },
  zone: {
    lines: ["{t}zone", "{t}zone add <type> <name> <value>", "{t}zone rem <id>"],
    desc: ["The domain's complete zone in BIND format, including the records", "Surge manages."]
  },
  debug: {
    lines: ["{t}debug status", "{t}debug files", "{t}debug audit", "{t}debug bust", "{t}debug certs", "{t}debug encrypt"],
    desc: ["Diagnostics for the domain. Each also runs on its own: `{n} {t}status`."]
  },
  status:   { lines: ["{t}status"], desc: ["The domain's state: waiting on dns (with the records to add), securing,", "ready (serving once the email is verified), or live."] },
  files:    { lines: ["{t}files"], desc: ["Every file in the live revision, with its size."] },
  audit:    { lines: ["{t}audit"], desc: ["Each edge's state for the domain: revision, files, size, certificate."] },
  bust:     { lines: ["{t}bust"], desc: ["Purge the project from the cache on every edge."] },
  certs:    { lines: ["{t}certs"], desc: ["The certificates installed for the domain: subject, issuer, names,", "expiry, auto-renewal."] },
  encrypt:  { lines: ["{t}encrypt"], desc: ["Provision the domain's managed certificate now. Certificates normally", "provision and renew on their own."] },
  stats: {
    lines: ["{t}stats traffic", "{t}stats load", "{t}stats audience", "{t}stats usage"],
    desc: ["Analytics for the domain. Each also runs on its own: `{n} {t}traffic`."]
  },
  traffic:  { lines: ["{t}traffic"], desc: ["Visits, uniques, cache hits, top pages, 404s and sources, past two weeks."] },
  load:     { lines: ["{t}load"], desc: ["Connection volume per datacenter across the network."] },
  audience: { lines: ["{t}audience"], desc: ["Browsers, operating systems and devices of your visitors."] },
  usage:    { lines: ["{t}usage"], desc: ["Bandwidth served per file, with a projected monthly total."] },
  config: {
    lines: ["{t}config [flags]"],
    desc: ["Show the project's settings, or change them with flags. Any value", "`null` clears it. Changes apply across the edge immediately."],
    flags: [
      ["--force https|http", "redirect all traffic to that protocol"],
      ["--redirect <domain>", "send every request to another domain"],
      ["--cors <origin>|*", "allow cross-origin requests"],
      ["--hsts <seconds>", "set Strict-Transport-Security"],
      ["--private | --public", "lock the domain to its collaborators, or open it"]
    ]
  },
  invite:   { lines: ["{t}invite <emails>"], desc: ["Invite people to publish to the project."] },
  revoke:   { lines: ["{t}revoke <emails>"], desc: ["Revoke publishing rights immediately."] },
  ssl:      { lines: ["{t}ssl --pem <file>"], desc: ["Upload a custom certificate as a PEM bundle (cert, intermediates, key).", "Rarely needed: Surge provides the certificate for every domain."] },
  login: {
    lines: ["login"],
    desc: ["Authenticate, or create an account, and store a token in ~/.netrc."],
    flags: [["--browser", "sign in through the browser instead"]]
  },
  logout:   { lines: ["logout"], desc: ["Remove the stored token and expire it."] },
  whoami:   { lines: ["whoami"], desc: ["The logged-in email and plan, and the token in use by id and scope.", "Exits 1 when not authenticated."] },
  verify:   { lines: ["verify"], desc: ["Send an email verification link."] },
  mfa:      { lines: ["mfa"], desc: ["Open the page that sets up or manages two-factor auth."] },
  tokens: {
    lines: ["tokens list", "tokens add [--domain <domain>] [-m <msg>]", "tokens rem <id>"],
    desc: ["Tokens for CI and agents. A token is shown once, when added. --domain", "scopes it to one domain (repeat for more); -m labels it."]
  },
  token:    { lines: ["token"], desc: ["Print the token the CLI is authenticating with."] },
  orgs: {
    lines: ["orgs", "orgs <org>", "orgs <org> create [--name <name>]", "orgs <org> rename <slug> [--name <name>]",
            "orgs <org> remove", "orgs <org> join <code>", "orgs <org> members",
            "orgs <org> members <email> invite [--admin]", "orgs <org> members <email> revoke|mkadmin|rmadmin"],
    desc: ["Orgs you belong to, and their members."]
  },
  plan:     { lines: ["plan [--web | --manage]"], desc: ["Change the account plan, or print a private link for checkout (--web)", "or billing management (--manage)."] },
  card:     { lines: ["card"], desc: ["Update the payment card on file."] },
  nuke:     { lines: ["nuke"], desc: ["Permanently delete your account. Every project must be torn down first."] },
  account:  { lines: ["whoami", "login", "logout", "verify", "card", "plan", "nuke"], desc: ["`{n} account <verb>` is the same as `{n} <verb>`."] }
}
usages.deploy = usages.publish

module.exports.verb = function(name, verb, target){
  var u = usages[verb]
  if (!u) return false
  var t = (target || "<domain>") + " "
  var fill = function(s){ return s.split("{t}").join(t).split("{n}").join(name) }

  helpers.log()
  u.lines.forEach(function(l){ helpers.log("  " + name + " " + fill(l)) })
  helpers.log()
  u.desc.forEach(function(d){ helpers.log("    " + fill(d).grey) })
  if (u.flags){
    var width = 0
    u.flags.forEach(function(f){ if (f[0].length > width) width = f[0].length })
    helpers.log().log("  " + "FLAGS".grey)
    u.flags.forEach(function(f){ helpers.log("    " + pad(f[0], width + 4) + f[1].grey) })
  }
  helpers.log()
  return true
}
