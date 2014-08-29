"use strict";

define(["storage"], function(Storage) {

    var Downloads = {
        /**
         * Initializes download manager
         */
        init: function() {
            return $.Deferred().resolve().promise();
        },
        /**
         * Writes out the manifest file, which keeps track of downloaded data
         */
        _writeManifest: function() {
        },
        downloadFile: function(filename) {
            //---------
            //---------
            //---------
            //---------
            //---------
            //todo: remove filename explicit set
            //todo: add deleting of file before downloading
            console.log('downloading');
            filename = "http://s3.amazonaws.com/KA-youtube-converted/9XZypM2Z3Ro.mp4/9XZypM2Z3Ro.mp4";
            var req = new XMLHttpRequest({mozSystem: true});
            req.open("GET", filename, true);
            req.responseType = "arraybuffer";
            req.onload = function(event) {
                console.log('download complete')
                console.log(event);
console.log('response: ');
console.log(req.response);
                var blob = new Blob([req.response], {type: "video/mp4"});
console.log('blog: ');
console.log(blob);
                Storage.writeBlob('blob-test3', blob);
            };
            req.send();
            console.log('downloading send()');
        }
    }

    return Downloads;

});
