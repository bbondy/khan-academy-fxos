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

* Install jsx by running `npm install -g jsx`.  Make sure you're using at least 0.12.0 by running `jsx --version`.

The first time you get setup, run `./tools/rebuild`.  Then run `./tools/runserver`.  
This will start a local python HTTP server on port 8092.  
It will also start watching js and jsx changes and transpile everything in the `./js` directory to the `./build` directory.  In this way React and ES6 features can be used.

Due to using JavaScript generators, if you want to test in Chrome you'll have to enable Chrome experimental JavaScript features.

## Running tests

Run `./tools/runserver` and load `./test/test.html` in Firefox.
Or just run `./tools/runtests`.

For now, it's best to run the tests in a fresh restart of the browser in private browsing mode so you can be sure no files are cached.
This is currently known to happen for some localization files with the simple python HTTP server otherwise.

The first time you run tests, the APIClient.init test may take a while because it fetches the topic tree and may not be cached on the KA servers.

## Storage

Device Storage API is used for downloads and for cached topic trees.  
It is sometimes useful to clear this data while using a simulator.  
You can find this storage when using a simulator in a location similar to this:
`/Users/brianbondy//Library/Application Support/Firefox/Profiles/s9r03lep.default-1410874219924/extensions/fxos_2_0_simulator@mozilla.org/profile/fake-sdcard/`  

Your exact path will differ depending on your OS, your profile, and the simulator being used.

Some other storage for smaller cached values is used with local storage.
You can clear that simply by opening the console and executing: `localStorage.clear();`

## ADB commands

For OOM failures, check for sigkill being sent to app.
The size is listed in pages (4 KB/page).

`adb shell dmesg | tail -20`

## Contribute

Please feel free to contribute directly by adding pull requests and issues through github.
If you would like help getting setup feel free to contact [Brian R. Bondy](http://www.brianbondy.com/contact/)

## Contributors

- [Brian R. Bondy](http://www.brianbondy.com) - App developer
- [Rodrigo Silveira](http://blog.rodms.com) - Portuguese app translation
- [Romain Sertelon](https://www.bluepyth.fr/) - French app translation
- [Pablo Solares Acebal]( http://pablo.edicionescamelot.com) - Spanish translation
