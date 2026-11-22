var helpers     = require("../util/helpers")
var discovery   = require("./_shared/discovery")
var surgeSDK    = require("surge-sdk")
var surgeStream = require("surge-stream")
var ProgressBar = require("progress")
var fs          = require("fs")
var path        = require("path")

// pull makes the project match the domain - the inverse of publish
// (slushi plans/pull.md). The comparing, fetching and writing live in
// surge-stream; this decides where a pull goes and prints what it did.
//
//   surge example.com pull [rev]    into the project, or a new ./example.com
//   surge pull [rev]                the cwd's project, from its own domain
//   surge ./dir pull [rev]          that project, from its own domain
//   surge example.com pull -p dir   into the directory named
//
// --force takes the domain's copy of a file changed here. It means
// nothing else: which directory a pull may write into is never forced,
// it is named

var forcedPath = function(s){
  return s === "." || s === ".." || s.indexOf("./") === 0 || s.indexOf("../") === 0 ||
         s.indexOf("/") === 0 || s.indexOf("~") === 0
}

var isDir = function(p){
  try { return fs.statSync(p).isDirectory() } catch(e) { return false }
}

// anything in it beyond what a pull itself leaves
var isEmpty = function(dir){
  try {
    return fs.readdirSync(dir).filter(function(n){ return n !== ".surge" }).length === 0
  } catch(e) { return true }
}

// as the user would type it
var shown = function(dir, cwd){
  var rel = path.relative(cwd, dir)
  if (rel === "") return "."
  if (rel.indexOf("..") === 0 || path.isAbsolute(rel)) return dir
  return "." + path.sep + rel
}

// where a pull goes, from what was typed and what is on disk:
// { domain, dir, rev, fresh } - fresh when dir isn't a project yet - or
// { abort } with the reason. A project only ever pulls its own domain:
// one project's files never land in another's directory
var target = exports.target = function(argv, cwd){
  cwd = cwd || process.cwd()
  var args  = (argv._ || []).map(String)
  var first = args.length ? args[0] : null
  var domain = typeof argv.domain === "string" ? argv.domain : null
  var named  = typeof argv.project === "string" ? argv.project : null

  if (first !== null && !/^\d+$/.test(first)){
    if (!domain && !forcedPath(first) && first.indexOf("@") === -1 && (helpers.splitOrg(first) || helpers.validDomain(first))){
      domain = args.shift()
    } else if (!named && (forcedPath(first) || isDir(path.resolve(cwd, first)))){
      named = args.shift()
    }
  }

  var org = domain && helpers.splitOrg(domain)
  if (org) domain = org.domain

  var rev = args.length ? args[0] : null
  if (rev !== null && !/^\d{1,16}$/.test(rev)) return { abort: "`" + rev + "` is not a revision." }
  if (args.length > 1) return { abort: "`" + args[1] + "` - pull takes one revision." }

  var dir   = path.resolve(cwd, named || ".")
  var local = isDir(dir) ? discovery.local(dir) : null

  if (!domain){
    if (named && !isDir(dir)) return { abort: "No such directory: " + named }
    if (!local) return { abort: named
      ? "`" + named + "` is not a surge project - pass a domain."
      : "No domain found - pass a domain." }
    return { domain: local.domain, dir: dir, rev: rev, fresh: false }
  }

  var other = function(found, where){
    return { abort: where + " is " + found.domain + ", not " + domain + " - pull from another directory." }
  }

  if (local){
    if (local.domain !== domain) return other(local, named ? "`" + named + "`" : "this project")
    return { domain: domain, dir: dir, rev: rev, fresh: false }
  }

  // a directory named with -p: that is where it goes
  if (named) return { domain: domain, dir: dir, rev: rev, fresh: true }

  // nowhere named and the cwd isn't a project: ./<domain>, the way the
  // domain is the project's name everywhere else
  dir = path.join(cwd, domain.replace(/\*/g, "_"))
  var there = isDir(dir) ? discovery.local(dir) : null
  if (there){
    if (there.domain !== domain) return other(there, "`" + shown(dir, cwd) + "`")
    return { domain: domain, dir: dir, rev: rev, fresh: false }
  }
  if (fs.existsSync(dir) && !isEmpty(dir)){
    return { abort: "`" + shown(dir, cwd) + "` exists and isn't this project - `-p <dir>` names where to pull." }
  }
  return { domain: domain, dir: dir, rev: rev, fresh: true }
}

// runs ahead of sign-in: a pull that can't go anywhere never prompts
exports.resolve = function(req, next, abort){
  var found = target(req.argv)
  if (found.abort) return abort(found.abort.grey)
  req.pull = found
  req.domain = found.domain
  return next()
}

var count = function(n, word){
  return n + " " + word
}

// "a.html, b.html +3 more", without the leading slash manifests use
var names = function(paths){
  var list = paths.map(function(p){ return p.replace(/^\//, "") })
  return list.slice(0, 5).join(", ") + (list.length > 5 ? " +" + (list.length - 5) + " more" : "")
}

exports.pull = function(req, next){
  var cwd   = process.cwd()
  var into  = shown(req.pull.dir, cwd)
  var force = req.argv.force !== undefined && req.argv.force !== false
  var bar   = null
  var plan  = null

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  }, surgeStream)

  var stop = function(msg){
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - " + msg).grey)
    helpers.space()
    process.exit(1)
  }

  helpers.log(helpers.smart("project:").grey + " " + into)
  helpers.log(helpers.smart("domain:").grey + " " + req.pull.domain)

  sdk.pull(req.pull.dir, req.pull.domain, {
    "user": "token",
    "pass": req.creds.token
  }, { rev: req.pull.rev, force: force })

  .on("plan", function(p){
    plan = p
    var message = p.metadata && p.metadata.message
    helpers.log(helpers.smart("revision:").grey + " " + p.rev + (message ? (" " + message).grey : ""))

    var parts = []
    if (p.update.length) parts.push(count(p.update.length, "updated"))
    if (p.add.length)    parts.push(count(p.add.length, "added"))
    if (p.remove.length) parts.push(count(p.remove.length, "removed"))
    helpers.log(helpers.smart("changed:").grey + " " + (parts.length ? parts.join(", ") : "0 files") + (" (" + p.unchanged.length + " unchanged)").grey)

    if (p.kept.length){
      helpers.log(helpers.smart("kept:").grey + " " + names(p.kept.map(function(k){ return k.path })) + " (changed here)".grey)
    }
    if (p.ignored.length){
      helpers.log(helpers.smart("ignored:").grey + " " + names(p.ignored) + " (never pulled)".grey)
    }

    // the domain as the project's identity, as publish leaves it: here
    // already so a pull that is cut short can be run again as it was
    // typed. Never over a CNAME the project or the revision has
    if (req.pull.fresh) try {
      var cname = path.join(req.pull.dir, "CNAME")
      var coming = p.add.concat(p.update).indexOf("/CNAME") !== -1
      if (!coming && !fs.existsSync(cname)) fs.writeFileSync(cname, req.pull.domain + "\n")
    } catch(e) {}
  })

  .on("progress", function(payload){
    try {
      var label = helpers.smart("download:").grey
      if (!helpers.redraws()){
        if (payload.files === payload.of) helpers.log(label + " done")
        return
      }
      bar = bar || new ProgressBar(label + " [:bar] :percent", {
        complete: "=", incomplete: " ", width: 25, total: Math.max(payload.total, 1)
      })
      bar.update(payload.total ? Math.min(payload.bytes / payload.total, 1) : payload.files / payload.of)
    } catch(e){}
  })

  .on("unauthorized", function(){
    stop("not signed in - try `" + req.configuration.name + " login`.")
  })

  .on("forbidden", function(payload){
    stop(payload && payload !== "Forbidden"
      ? payload
      : "you do not have permission to pull " + req.pull.domain.underline)
  })

  .on("ratelimited", function(payload){
    stop(payload)
  })

  .on("error", function(payload){
    var err = (payload && payload.error) || payload || {}
    stop(err.message || "pull did not complete. please try again.")
  })

  .on("fail", function(){
    stop("pull did not complete. please try again.")
  })

  .on("success", function(p){
    helpers.space()
    if (p.add.length + p.update.length + p.remove.length === 0){
      helpers.trunc("Unchanged".yellow + (" - " + into + " has nothing to pull from " + req.pull.domain.underline).grey)
    } else {
      helpers.trunc("Success!".green + (" - Pulled " + req.pull.domain.underline + " into " + into).grey)
    }
    helpers.space()
    // force has no say over a file the domain dropped
    if (p.kept.some(function(k){ return k.why !== "gone" })){
      helpers.trunc(("`--force` takes the domain's copy of what was kept").grey)
      helpers.space()
    }
    return next()
  })
}
