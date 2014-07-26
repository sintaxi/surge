# surge (alpha)

> publish any directory to the web with a single command

### Rationale

The web promised us shipping web projects would be fast, easy, and low risk. Surge delivers on that promise by making rapid deployment of front-end projects impossible to fuck up.

Run `surge` within any directory and that directory becomes live on the web at that very moment. Both account and app creation is implicit, so there is no setup or registration. Simply install surge and start tossing projects in the wild without a second thought.

### Features

- Single command deployment.
- Free production grade static hosting
- Free CNAME support.
- Free SSL support.
- Fallback 404.html pages.
- Catch all 200.html pages.

### Install

    npm install -g surge

### Usage

    surge <dir> [--domain=<example.com>]

### Examples

Publish current working directory.

    surge

If you are using tools like Grunt and Gulp and you have a compile directory. From within the root of your project pass in the path to your output direcotory to only upload your compiled assets. (note - you may want to also `.gitignore` that direcory in order to keep compiled assets out of your repo.

    surge output

If wanting a particular subdomain just pass in as an optional arg

    surge --domain foo.sarge.sh

As an alternative you may pass surge a data stream.

    echo "<h1>Hello World</h1>" | surge



