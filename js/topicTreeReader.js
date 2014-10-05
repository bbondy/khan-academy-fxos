"use strict";

/**
 * Reads in a topic tree from the installed default
 * or from a more recent cached version.
 * Topic tree data is stored zipped for faster reading
 * from disk..
 */

define(["util"], function(Util) {

    var TopicTreeReader = {
        readTopicTree: function() {
            var d = $.Deferred();

            var filename = `data/topic-tree`;
            var lang = Util.getLang();
            if (lang) {
                filename += "-" + lang;
            }
            filename += ".min.json.gz";

            var req = new XMLHttpRequest({mozSystem: true});
            req.open("GET", filename, true);
            req.responseType = "arraybuffer";
            req.onload = () => {
                var blob = new Blob([req.response], {type: "binary/octet-stream"});
                var reader = ArchiveReader(blob);
                var h = reader.getFilenames();
                h.onerror = function() {
                    console.warn("Could not obtain topic tree filename from zip");
                    d.reject();
                };
                h.onsuccess = function() {
                    if (this.result.length === 0) {
                        console.warn("Zip read but contains no topic tree filenames");
                        d.reject();
                    }

                    console.log("Read file in zip: " + this.result[0]);
                    var hf = reader.getFile(this.result[0]);
                    hf.onerror = function() {
                        console.warn("Could not read file from topic tree zip");
                        d.reject();
                    };
                    hf.onsuccess = function() {
                        // this.result is a DOM File
                        console.log(`Read: : ${this.result.name}, contentType: ${this.result.type}, size: ${this.result.size}`);

                        var fileReader = new FileReader();
                        fileReader.readAsText(this.result.slice());
                        fileReader.onloadend = function() {
                            d.resolve(fileReader.result);
                        };
                    };
                };
            };
            req.send();
            return d.promise();
        }
    };

    return TopicTreeReader;
});

