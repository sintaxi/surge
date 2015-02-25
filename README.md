# surge(.sh)

> Publish web apps to a CDN with a single command and no setup required.

[![NPM](https://nodei.co/npm/surge.png?global=true)](https://nodei.co/npm/surge/)

_surge_ is a Command Line Interface that runs on the nodejs runtime (surge's only external dependency). Surge can be installed using npm (via `sudo npm install -g surge`). Once installed, `surge` is available from within your terminal. The following command will deploy the current working directory to the surge servers where the application will be available at sintaxi.com.

    $ surge ./ sintaxi.com

Run `surge --help` to see the following overview of the `surge` command...

```
 Usage:
    surge [options]

  Options: 
    -p, --project       path to projects asset directory (./)
    -d, --domain        domain of your project (<random>.surge.sh)
    -e, --endpoint      domain of API server (surge.sh)
    -g, --grant         grant publish access (email address)
    -r, --revoke        revoke publish access (email address)
    -V, --version       show the version number
    -h, --help          show this help message

  Shorthand usage:
    surge [project path] [domain]

  Additional commands:
    surge whoami        show who you are logged in as
    surge logout        expire local token
    surge login         only performs authentication step
    surge list          list all domains you have access to

  When in doubt, run surge from within you project directory.

```

## CDN Features

- Custom CNAME & custom SSL
- Fallback 404.html pages
- HTML5 mode 200.html pages
- stays out of `git`s way
- supports clean URLs && trailing slashes `/`
- Implicit signup
- supports CNAME files

If you’re using tools like Grunt, Gulp, or a static site generator like Jekyll, your files are output into a compile directory like `_site/`, `build/`, or `www/`. From the root of your project, pass Surge the path to this directory to upload your compiled assets.

    surge www

You may also add this directory to your `.gitignore` to keep your compiled assets out of your Git history.
