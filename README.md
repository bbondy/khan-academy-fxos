Khan Academy Firefox OS app
=============================

Khan Academy's Firefox OS app source is [Mozilla Public License Version 2.0](https://www.mozilla.org/MPL/2.0/) licensed.

You can download the Khan Academy Firefox OS app on your device at the [Firefox Marketplace](https://marketplace.firefox.com/app/khan-academy).

The Khan Academy app also functions as a:
- Firefox web app for Desktop on OSX, Windows, and Linux are also available at the same link. (No downloads support because Desktop has no Storage API yet)
- Firefox web app for Android.

## About the source

Everything is built using JavaScript.
[React](http://facebook.github.io/react/) is used for views and [Backbone](http://backbonejs.org/) is used for models.  The video player is using [VideoJS](http://www.videojs.com/).

## Getting setup

    git clone --recursive https://github.com/bbondy/khan-academy-fxos

Copy `./secrets.json.sample` to `./secrets.json`, fill in the info with your API key.  
Note that reporting user points will not work unless you have an annointed key.

See here for information on how to apply for a Khan Academy API key:  
https://github.com/Khan/khan-api/wiki/Khan-Academy-API-Authentication

## Building the source

You need [Nodejs](http://nodejs.org) installed to run the following commands (please run them in the order given).

    npm install
    bower install
    gulp

To run a web server instead of using the Firefox emulator, run: `./tools/runserver`.  
This will start a local python HTTP server on port 8092.  

Running gulp will:
- convert the JSX React source which lives inside js/ and put it inside /build.
- Convert the LESS stylesheets in style/less into CSS and store it in /build/css
- Run lint on the source files
- Start watching for changes and will re-run all of that again when changes are made.

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

- [Brian R. Bondy](http://www.brianbondy.com) - Lead app developer
- [Farez](http://farez.ca/) - App contributor (Playback speed)
- [Max Li](http://www.maxli.org) - App contributor
- [Rodrigo Silveira](http://blog.rodms.com) - Portuguese app translation
- [Romain Sertelon](https://www.bluepyth.fr/) - French app translation
- [Pablo Solares Acebal]( http://pablo.edicionescamelot.com) - Spanish translation
- [Sashoto Seeam](sashoto.wordpress.com) - Bengali translation
