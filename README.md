
<h1 align="center"><code>surge</code> - static web publishing</h1>

### Introduction

With over 14 Million deployments available accross 10 regions globally surge is one of the preferred tools for publishing static content to the web. Surge's generous free plan of unlimited custom domains and unlimited deployments makes it a valuable tool for both staging and production builds.

![surge-help](https://github.com/user-attachments/assets/5b3e7e92-008e-48b6-9c61-dc4cbf1bf22c)

### About Surge

Surge is built on a modern API-first architecture, designed from the ground up to be programmable and composable. Every feature available in the CLI is accessible via the API, making it easy to integrate into automated workflows, CI/CD pipelines, and custom tooling.

This API-first approach makes Surge well-suited for AI-driven workloads where agents and automated systems need to deploy, update, and manage web properties at scale. Whether you're building AI-powered development tools, automated content pipelines, or agent-based systems that publish to the web, Surge provides the infrastructure to support high-volume, programmatic deployments.

### Install

    npm install -g surge

### Publish

    surge <path> <domain>

<!-- steno:publish-pair ansi -->
```ansi
$ surge ./dist lucid-example.surge.sh

   [90mRunning as [4myou@example.com[24m[39m[90m (Student)[39m

[90m        project:[39m ./dist
[90m         domain:[39m lucid-example.surge.sh
[90m           size:[39m 3 files, 672 bytes
[90m         upload:[39m [=========================] 100%
[90m            CDN:[39m [=========================] 100%
[90m     encryption:[39m [=========================] 100%

  [90m[90m┌──────────[39m[90m┬────────────────────────────────────────────────────────────────[39m[90m┬───────────────────────┐[39m[39m
  [90m[90m│[39m   [90mCERT[39m   [90m│[39m   [90m*.surge.sh, surge.sh[39m                                         [90m│[39m   [32mauto-renew[39m          [90m│[39m[39m
  [90m[90m├──────────[39m[90m┼────────────────────────────────────────────────────────────────[39m[90m┼───────────────────────┤[39m[39m
  [90m[90m│[39m   [90mDNS[39m    [90m│[39m   [90musing Surge Name Servers[39m                                     [90m│[39m   [32mgeo-aware[39m           [90m│[39m[39m
  [90m[90m└──────────[39m[90m┴────────────────────────────────────────────────────────────────[39m[90m┴───────────────────────┘[39m[39m
  [90m[90m┌──────────[39m[90m┬──────────────────[39m[90m┬───────────────────────[39m[90m┬─────────────────────[39m[90m┬─────────────[39m[90m┬─────────┐[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   sfo.surge.sh   [90m│[39m   US, San Francisco   [90m│[39m   138.197.235.123   [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   lhr.surge.sh   [90m│[39m   GB, London          [90m│[39m   46.101.67.123     [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   yyz.surge.sh   [90m│[39m   CA, Toronto         [90m│[39m   159.203.50.177    [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   jfk.surge.sh   [90m│[39m   US, New York        [90m│[39m   159.203.159.100   [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   ams.surge.sh   [90m│[39m   NL, Amsterdam       [90m│[39m   188.166.132.94    [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   fra.surge.sh   [90m│[39m   DE, Frankfurt       [90m│[39m   138.68.112.220    [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   sgp.surge.sh   [90m│[39m   SG, Singapore       [90m│[39m   139.59.195.30     [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   blr.surge.sh   [90m│[39m   IN, Bangalore       [90m│[39m   139.59.50.135     [90m│[39m   D.Ocean   [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   syd.surge.sh   [90m│[39m   AU, Sydney          [90m│[39m   45.76.126.95      [90m│[39m   Vultr     [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m│[39m   [90mHTTP[39m   [90m│[39m   nrt.surge.sh   [90m│[39m   JP, Tokyo           [90m│[39m   172.104.96.133    [90m│[39m   Linode    [90m│[39m   [32m✔[39m [32m◍[39m   [90m│[39m[39m
  [90m[90m└──────────[39m[90m┴──────────────────[39m[90m┴───────────────────────[39m[90m┴─────────────────────[39m[90m┴─────────────[39m[90m┴─────────┘[39m[39m
   [90mLive preview ................................................. [4m1785787164375-lucid-example.surge.sh[24m[39m
   [90mProduction ................................................................. [4mlucid-example.surge.sh[24m[39m

   [32mSuccess![39m[90m - Published to [4mlucid-example.surge.sh[24m[39m

   [90mdomain written to dist/CNAME[39m
```
<!-- /steno:publish-pair -->

Your project is now live in `10` regions globally! View it at `https://lucid-example.surge.sh`...

![surge-publish-results](https://github.com/user-attachments/assets/9bf53934-de53-4307-98b3-b90ab07c167e)

### License

Copyright © 2012-2026 Chloi Inc. Released under the ISC License.

"Surge" is a trademark of Chloi Inc.