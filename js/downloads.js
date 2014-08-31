"use strict";

define(["storage", "models"], function(Storage, models) {

    var Downloads = {
        /**
         * Initializes download manager
         */
        init: function() {
            var d = $.Deferred();
            this.contentList = new models.ContentList();
            this._readManifest().always(() => {
                d.resolve();
            });
            return d.promise();
        },
        /**
         * Writes out the manifest file, which keeps track of downloaded data
         */
        _writeManifest: function() {
            var contentListCopy = _(this.contentList.models).map((model) => {
                var modelCopy = jQuery.extend(true, {}, model.attributes);
                delete modelCopy.parent;
                return modelCopy;
            });
            var jsonManifest = JSON.stringify(contentListCopy);
            return Storage.writeText(this.manifestFilename, jsonManifest);
        },
        /**
         * Reads in a manifest file, which keeps track of downloaded data
         */
        _readManifest: function() {
            var d = $.Deferred();
            Storage.readText(this.manifestFilename).done((data) => {
                var videoList;
                if (data) {
                    videoList = JSON.parse(data);
                }
                this.contentList = new models.ContentList(videoList);
                d.resolve();
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        /**
         * Downloads the file at the specified URL and stores it to the
         * specified filename.
         */
        downloadVideo: function(video) {
            var filename = video.get("id");
            var url = video.get("download_urls").mp4;

            var req = new XMLHttpRequest({mozSystem: true});
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onload = (event) => {
                var blob = new Blob([req.response], {type: "video/mp4"});
                Storage.writeBlob(filename, blob).done(() => {
                    this._addDownload(video);
                });
            };
            req.send();
        },
        /**
         * Adds the specified model to the list of downloaded files
         */
        _addDownload: function(model) {
            console.log('adding model to manifest: ');
            console.log(model);
            window.model1 = model;
            this.contentList.push(model);
            this._writeManifest();
        },
        manifestFilename: "downloads-manifest.json"
    }

    return Downloads;

});
