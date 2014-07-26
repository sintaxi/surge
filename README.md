# surge (alpha)

> publish any directory to the web with a single command

### Rationale

The web promised us shipping web projects would be fast, easy, and low risk. The web on it's own falls short but surge delivers on that promise by making rapid deployment of front-end projects simply impossible to fuck up. Just run `surge` within any directory and that directory becomes live on the web, that very moment. Account and app creation is implicit, so there is no setup or registration. Simply `npm install -g surge` and toss projects in the wild without a second thought.

### Features

- Single command deployment.
- Free static hosting with CNAME + SSL support.
- Fallback 404.html pages.
- Catch all 200.html pages.

### Install

    npm install -g surge

### Usage

Publish current working directory or pass in optional path to project directory.

    surge <dir> [--domain=<example.com>]

**OR**, pass surge a data stream and Robert is your fathers brother.

    echo "<h1>Hello World</h1>" | surge



