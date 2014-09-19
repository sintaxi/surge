# surge (alpha)

> publish any directory to the web with a single command

## Rationale

The web promised us shipping web projects would be fast, easy, and low risk. Surge delivers on that promise by making rapid deployment of front-end projects impossible to fuck up. To publish a web project run `surge` within any directory and that directory becomes live on the web at that very moment.

Both account and app creation is implicit, so there is no setup or registration. Simply install surge and start tossing projects in the wild without a second thought.

## Features

- Single command deployment
- Free production grade static hosting
- Free CNAME support
- Free SSL support
- Custom `404.html` pages
- HTML5 mode `200.html` pages

## Install

    npm install -g surge

## Usage

    surge <dir> [--domain=<example.com>]

## Examples

The following examples show how you can publish any directory to the web with Surge.

### Publish current working directory.

    surge

If you’re using tools like Grunt, Gulp, or a static site generator like Jekyll, your files are output into a compile directory like `_site/`, `build/`, or `www/`. From the root of your project, pass Surge the path to this directory to upload your compiled assets.

    surge www

You may also add this directory to your `.gitignore` to keep your compiled assets out of your Git history.

### Publish with a custom subdomain

If no subdomain is specified, Surge will take care if this for you. If you’d like to specify one yourself, just pass it in as an optional argument:

    surge --domain foo.surge.sh

Now, if it’s available, `foo` will be used as the subdomain.

As an alternative you may pass surge a data stream.

    echo "<h1>Hello World</h1>" | surge

## License

[The ISC License (ISC)](LICENSE.md)

Copyright © 2013–2014, [Chloi Inc.](http://chloi.io) All rights reserved.
