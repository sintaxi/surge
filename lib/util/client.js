/**
 * client
 *
 * The User-Agent a publish sends: the CLI and how it was called - where
 * the credential came from, whether CI is set, whether a person's
 * terminal is attached, npx or an installed copy, and the agent running
 * it, if a known one is.
 *
 *   surge/0.54.0 (auth=env; ci=0; tty=0; via=npx; agent=claude-code)
 *
 * Disclosed in the docs (surge.sh/docs/cli/what-surge-sends). The rule
 * that keeps it there: names and 0/1 only. Never a value from the
 * environment, a path, a hostname, or the credential - a new field that
 * would carry one needs a new decision, not a new line here.
 *
 * Without it an agent publishing with someone's SURGE_TOKEN looks like
 * any other login (slushi plans/grok.md).
 */

// an env var each agent sets in the shells it runs, first match wins.
// AI_AGENT is the open convention: its value names the agent, as
// name_version_kind (claude-code_2-1-300_agent) - only the name is sent
var AGENTS = [
  ["claude-code", "CLAUDECODE"],
  ["cursor",      "CURSOR_AGENT"],
  ["gemini",      "GEMINI_CLI"],
  ["codex",       "CODEX_SANDBOX"],
  ["replit",      "REPL_ID"],
  ["e2b",         "E2B_SANDBOX"]
]

var envOn = function(env, name){
  var val = env[name]
  return !!val && !/^(false|0)$/i.test(val)
}

var agentOf = function(env){
  if (env.AI_AGENT){
    var named = String(env.AI_AGENT).split(/[_\/@]/)[0].toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24)
    if (named) return named
  }
  for (var i = 0; i < AGENTS.length; i++){
    if (envOn(env, AGENTS[i][1])) return AGENTS[i][0]
  }
  return null
}

// argv.token → flag, SURGE_TOKEN → env, otherwise the saved login
exports.authOf = function(argv, env){
  if (argv && argv.token) return "flag"
  if (env.SURGE_TOKEN || env.TRAVIS_SURGE_TOKEN) return "env"
  return "netrc"
}

exports.userAgent = function(version, argv, env, isTTY){
  env = env || process.env
  var parts = [
    "auth=" + exports.authOf(argv, env),
    "ci="   + (envOn(env, "CI") ? 1 : 0),
    "tty="  + (isTTY ? 1 : 0),
    // npm sets npm_command=exec for npx and npm exec
    "via="  + (env.npm_command === "exec" ? "npx" : "installed")
  ]
  var agent = agentOf(env)
  if (agent) parts.push("agent=" + agent)
  return "surge/" + version + " (" + parts.join("; ") + ")"
}
