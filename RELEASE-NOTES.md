# surge 0.49

This release is for anything that runs `surge` without a person at the
keyboard: CI jobs, scripts and coding agents. The short version: **surge
now fails when it can't do what you asked, instead of exiting as if it had.**

## No credentials, no terminal: exit 1

Run surge where nobody can answer a prompt (a CI job, an agent, input
piped from `/dev/null`) with no token and no stored login, and it used to
print `email:`, read nothing and exit `0`. The job went green with nothing
published.

Now it stops before prompting, says why on stderr, and exits `1`:

    Aborted - not logged in and no terminal to ask. Run `surge login` in a terminal, or set SURGE_TOKEN.

When the `CI` environment variable is set, surge treats the run as having
nobody to ask even if a terminal is attached:

    Aborted - not logged in and CI is set, so nobody to ask. Set SURGE_TOKEN, or unset CI to log in here.

The same rule covers the other prompts. A missing project directory or
domain names what's missing (`Try surge <path> <domain>`) instead of
waiting for an answer that never comes.

## `surge whoami` exits 1 when not authenticated

`whoami` is the natural "am I logged in?" check at the top of a script, and
it now fails when the answer is no. When you are authenticated it also names
the token in use, by id, and what it can touch:

    $ SURGE_TOKEN=... surge whoami

       you@example.com
       tok-1a2b3c4d · scoped to my-app.surge.sh

An agent can check it was handed a token scoped to one domain without
printing the token itself. A rejected `SURGE_TOKEN` no longer clears the
login stored in `~/.netrc`.

## `--force https` at publish

    surge ./dist example.com --force https

redirects all plain HTTP to HTTPS from that publish on. The setting sticks,
like `surge example.com config --force https`. The value must be `https` or
`http`; anything else stops before uploading.

## Help that shows the whole workflow

`surge --help` now lists previews (`--preview`), a revisions section
(`revs`, `cutover`, `rollback`, `rollfore`, `discard`) and the two ways to
authenticate without logging in (`--token`, `SURGE_TOKEN`).

For one command's usage, ask for it:

    surge cutover --help
    surge help cutover
    surge example.com rollback --help

Commands with flags (publish, config, login) list them.

## What might change for you

- **A CI job that was green may turn red.** If its token was missing or
  misspelled, it was never publishing. The failure is the fix: add the
  token as a secret (`surge tokens add --domain <domain>` mints one).
- **Scripts that run `surge whoami` under `set -e`** stop there when not
  authenticated. Add `|| true` if it was only informational.
- **`npx surge` always runs the latest release**, so these changes reach
  pipelines that don't pin a version. Pin `surge@0.48.0` to keep the old
  behaviour while you fix a job.

---

# surge 0.40

The command line interface has been reorganized around a single idea: **you
name the thing you are working on, then say what to do with it.**

    surge <project> <command>

Everything else in this release follows from that. Your existing commands
still work — skip to [Migrating](#migrating) if that is all you need.

## Projects now remember their domain

When you publish a directory for the first time, surge writes the domain into
a `CNAME` file inside it. From then on that directory knows where it belongs,
and you never have to repeat the domain.

Start a new project by naming the directory and the domain you want:

    surge ./my-proj example.com

That is the only time you need to say both. To publish again, run the same
command, or just name the project:

    surge ./my-proj publish

The domain came from `./my-proj/CNAME`. Surge writes that file on the first
publish and never overwrites it, so the directory carries its own identity.
If you keep your `CNAME` in source control (or in the directory your build
copies into its output), every machine and every CI job publishes to the
right place with no configuration.

## The same shape for every command

Because the project knows its domain, every other command works the same way:

    surge ./my-proj rollback
    surge ./my-proj revs
    surge ./my-proj teardown

You are welcome to name the domain directly instead. It means the same thing:

    surge example.com rollback

And when you are already inside the project directory, surge assumes you mean
the directory you are standing in:

    surge . publish
    surge rollback
    surge revs
    surge stats traffic

That is the whole grammar. `<project>` is a **path**, a **domain**, or — if
you leave it out — the **current directory**.

## Commands

    PUBLISH
      surge <path> <domain>            publish a directory to a domain
      surge <path> publish            publish again, domain from CNAME

    COMMANDS                          (on a path, a domain, or the cwd)
      surge <project> config
      surge <project> revs
      surge <project> rollback
      surge <project> rollfore
      surge <project> cutover
      surge <project> discard   <rev>
      surge <project> invite    <emails>
      surge <project> revoke    <emails>
      surge <project> teardown
      surge <project> dns   <cmd>     list·add·rem
      surge <project> debug <cmd>     status·files·audit·bust·certs·encrypt
      surge <project> stats <cmd>     traffic·load·audience·usage

    ADMIN
      surge <cmd>                     list·whoami·login·logout·verify·card·plan·nuke
      surge tokens  <cmd>             list·add·rem

Run `surge --help` inside a project and the help fills itself in with your
domain and your paths, so every line is a command you can copy and run.

Commands that act on a project are grouped under a noun. Run the noun on its
own to see what it offers — `surge debug`, `surge dns`, `surge stats`,
`surge tokens`. Nothing is hidden behind documentation. The commands that act
on **you** rather than on a project — `whoami`, `login`, `logout`, `verify`,
`card`, `plan`, `nuke` — stay where they have always been, at the top level.

## Also new

- **`surge ./my-proj _`** publishes to a generated domain with no prompting —
  useful for throwaway previews and scripted builds.
- **`surge <project> revs`** lists the revisions of one project; `surge list`
  remains the list of everything you have published.
- **`surge deploy`** works anywhere `publish` does, if that is the word you
  reach for.
- **The domain prompt suggests your project's name.** Publishing
  `~/sites/my-proj` (or `~/sites/my-proj/dist`) offers `my-proj.surge.sh`.
- **`list` is the listing word everywhere** — `surge list`,
  `surge tokens list`, `surge <project> dns list`.
- **Custom domains and provisioned certificates remain free for everyone.**

## Migrating

**Everything you have scripted keeps working.** Older command forms are
permanently supported; where a command has a newer spelling, surge prints one
grey line pointing at it and then does the work:

    surge teardown example.com      →  surge example.com teardown
    surge status example.com        →  surge example.com debug status
    surge traffic example.com       →  surge example.com stats traffic

Flags are unchanged: `--domain`/`-d`, `--project`/`-p`, `--preview`,
`--message`/`-m`, `SURGE_TOKEN`, and the rest behave exactly as before, in any
order.

    surge --domain example.com ./dist          still publishes
    surge -p ./dist -d example.com             still publishes

**There is one change to be aware of.** A directory on its own no longer
publishes:

    surge ./dist

Naming a project without a command now shows you that project instead of
publishing it, so an incomplete command can never push to production by
accident. Add the domain or the word `publish`:

    surge ./dist example.com
    surge ./dist publish

If a script relied on the old behaviour it fails immediately, with the fix in
the message — nothing publishes silently and nothing publishes to the wrong
place.

**Node 18 or newer is required.**

## 0.40.1

Fixes publishing when the domain is given as a flag alongside a directory —
for example `surge --domain example.com ./dist`, and the same form with
`--preview`, `--message`, or `--build`. Upgrade with `npm install -g surge`.
