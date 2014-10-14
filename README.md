Khan Academy Firefox OS app
=============================

Khan Academy's Firefox OS app source is [Mozilla Public License Version 2.0](https://www.mozilla.org/MPL/2.0/) licensed.

## About the source

Everything is built using JavaScript.
[React](http://facebook.github.io/react/) is used for views and [Backbone](http://backbonejs.org/) is used for models.

## Getting setup

Copy `./secrets.json.sample` to `./secrets.json`, fill in the info with your API key.  
Note that reporting user points will not work unless you have an annointed key.

See here for information on how to apply for a Khan Academy API key:  
https://github.com/Khan/khan-api/wiki/Khan-Academy-API-Authentication

## Building the source

You need [Nodejs](http://nodejs.org) installed to run the following commands (please run them in the order given).

* Install react-tools by running `npm install -g react-tools`.

* Install jsx by running `npm install -g jsx`

The first time you get setup, run `./tools/rebuild`.  Then run `./tools/runserver`.  
This will start a local python HTTP server on port 8092.  
It will also start watching js and jsx changes and transpile everything in the `./js` directory to the `./build` directory.  In this way React and ES6 features can be used.

Due to using JavaScript generators, if you want to test in Chrome you'll have to enable Chrome experimental JavaScript features.

## Running tests

Run `./tools/runserver` and load `./test/test.html` in Firefox.
Or just run `./tools/runtests`.

## Contribute

Please feel free to contribute directly by adding pull requests and issues through github.
If you would like help getting setup feel free to contact [Brian R. Bondy](http://www.brianbondy.com/contact/)

## Contributors

- [Brian R. Bondy](http://www.brianbondy.com) - App developer
- [Rodrigo Silveira](blog.rodms.com) - Portuguese app translation

