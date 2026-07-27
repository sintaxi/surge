
var moniker = require("moniker")
var fs      = require("fs")
var path    = require("path")
var os      = require("os")
var helpers = require("../../util/helpers")

// reads a domain out of a directory. CNAME wins, then a `surge.domain`
// field in package.json. returns { domain, source } or null.
var fromDir = function(dir){
  try {
    var cname = fs.readFileSync(path.join(dir, "CNAME")).toString().split(os.EOL)[0].trim()
    if (helpers.validDomain(cname)) return { domain: cname, source: "cname" }
  } catch(e) {}
  try {
    var pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json")).toString())
    if (pkg.surge && helpers.validDomain(pkg.surge.domain)) return { domain: pkg.surge.domain, source: "pkg" }
  } catch(e) {}
  return null
}

// a `./` (or `../`, `/`, `~`, bare `.`) prefix always means path, even
// when a directory shares its name with a valid domain.
var forcedPath = function(arg){
  return arg === "." || arg === ".." ||
         arg.indexOf("./") === 0 || arg.indexOf("../") === 0 ||
         arg.indexOf("/") === 0 || arg.indexOf("~") === 0
}

// resolves the [<domain>] slot every command shares. the slot is really
// [<domain>|<path>] defaulting to "." — a domain is used directly, a path
// resolves via its CNAME then package.json. in a domain slot a valid
// domain beats a same-named directory; `./` forces the path reading.
//
// opts.positional  read argv._[0] as the slot (default true; publish
//                  passes false — its first positional is the project)
// opts.prompt      prompt when unresolved instead of aborting
// opts.generate    seed the prompt with a generated domain suggestion
// opts.log         print the resolved domain: line (publish recap style)
//
// sets req.domain and req.domainSource: arg|cname|pkg|prompt|generated
exports.resolve = function(opts){
  opts = opts || {}

  return function(req, next, abort){
    var label = helpers.smart("domain:").grey

    var finish = function(domain, source){
      req.domain = domain
      req.domainSource = source
      if (opts.log) helpers.log(label, domain)
      return next()
    }

    var generate = function(){
      return [moniker.choose(), req.configuration.platform].join(".")
    }

    var prompt = function(suggestion){
      var suggested = suggestion
      var ask = function(draft){
        helpers.read({
          silent: false,
          prompt: label,
          default: draft || "",
          edit: true,
          terminal: req.configuration.terminal,
          output: req.configuration.output,
          input: req.configuration.input
        }, function(err, domain){
          if (domain === undefined) return abort("Not initiated.".grey)
          if (err || !helpers.validDomain(domain)) return ask(domain)
          return finish(domain, opts.generate && domain === suggested ? "generated" : "prompt")
        })
      }
      return ask(suggestion)
    }

    // the slot may be pre-set by a flag (-d/--domain) or publish shorthand
    var arg = req.domain || null
    if (!arg && opts.positional !== false && req.argv._[0] != null){
      arg = String(req.argv._[0])
    }

    if (arg){
      if (arg === "_") return finish(generate(), "generated")

      var isPath = forcedPath(arg)
      if (!isPath && helpers.validDomain(arg)) return finish(arg, "arg")

      var dir = path.resolve(arg)
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()){
        var found = fromDir(dir)
        if (found) return finish(found.domain, found.source)
        return abort(("No CNAME found in " + arg + " - pass a domain or publish first.").grey)
      }
      if (isPath) return abort(("No such directory: " + arg).grey)

      if (opts.prompt) return prompt(arg)
      return abort(("`" + arg + "` is not a domain.").grey)
    }

    // no arg — infer from the project directory, falling back to cwd
    // (a regenerated ./dist loses its CNAME; the cwd package.json survives)
    var base = path.resolve(req.project || process.cwd())
    var found = fromDir(base)
    if (!found && base !== process.cwd()) found = fromDir(process.cwd())
    if (found) return finish(found.domain, found.source)

    if (opts.prompt) return prompt(opts.generate ? generate() : "")
    return abort("No domain found - pass a domain or publish first.".grey)
  }
}

exports.setDomainFromArgs = function(req, next){
  if (!req.domain && req.argv._[0]) {
    req.domain = req.argv._[0]
  }
  return next()
}
