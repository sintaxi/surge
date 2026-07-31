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
