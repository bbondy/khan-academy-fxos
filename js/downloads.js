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
        downloadFile: function(filename, url) {
            var req = new XMLHttpRequest({mozSystem: true});
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onload = function(event) {
                console.log('response: ');
                console.log(req.response);
                var blob = new Blob([req.response], {type: "video/mp4"});
                Storage.writeBlob(filename, blob).done(() => {
                    console.log('wrote file!');
                });
            };
            req.send();
            console.log('downloading send()');
        }
    }

    return Downloads;

});
