# Map Bus
![bwc-logo](http://brunch.io/images/svg/brunch.svg)

This is a HTML5 application, built with [Brunch](http://brunch.io), to display bus schedules.

It currently is only working for the Métropole of Rennes, as it uses a specific API to get the schedule itself (positioning data requires extracting information from the GTFS dataset).

## Getting started
* Install (if you don't have them):
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Brunch](http://brunch.io): `npm install -g brunch`
    * [Bower](http://bower.io): `npm install -g bower`
    * Brunch plugins and Bower dependencies: `npm install & bower install`.
    * Set up the API key for Keolis Rennes: `export KEOLIS_API_KEY=XXXXXX`
* Run:
    * `brunch watch --server` — watches the project with continuous rebuild. This will also launch HTTP server with [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history).
    * `brunch build --production` — builds minified project for production
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Files saved in `app/assets` will be copied as are to `public`.
    * Write scripts in Javascript or Coffeescript in `app/scripts`.
    * Write styles in SCSS `app/styles`.

The applications requires a JSON file stored as `app/assets/data.json`
the provides information about the bus stops and lines.
