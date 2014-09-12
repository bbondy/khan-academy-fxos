"use strict";

/**
 * Responsible for keeping of downloaded videos
 *   - Maintains a manifest of what's downloaded
 *   - Actually performs downloads
 *   - Provides the ability to delete those downloads
 */

define(["storage", "models", "notifications"],
        function(Storage, models, Notifications) {

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
            var contentListIds = this.contentList.models.map(function(model) {
                return model.get("id");
            });
            var jsonManifest = JSON.stringify(contentListIds);
            return Storage.writeText(this.manifestFilename, jsonManifest);
        },
        /**
         * Reads in a manifest file, which keeps track of downloaded data
         */
        _readManifest: function() {
            var d = $.Deferred();
            Storage.readText(this.manifestFilename).done((data) => {
                var videoListIds;
                if (data) {
                    videoListIds = JSON.parse(data);
                }
                var contentListModels = models.TopicTree.getContentItemsByIds(videoListIds);
                _(contentListModels).each((model) => {
                    this._setDownloaded(model, true);
                });
                this.contentList = new models.ContentList(contentListModels);
                d.resolve();
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        _setDownloaded: function(model, downloaded) {
            model.set("downloaded", true);
            while (model = model.get("parent")) {
                var downloadCount = model.get("downloadCount");
                if (downloaded) {
                    downloadCount++;
                } else {
                    downloadCount--;
                }
                model.set("downloadCount", downloadCount);
            }
        },
        findVideo: function(video) {
            var foundVideo = _(this.contentList.models).find(function(model) {
                return model.get("id") === video.get("id");
            });
            return foundVideo;
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
                    this._addDownloadToManifest(video);
                    var videoTitle = video.get("title");
                    var title = "Download complete";
                    var message = `The video: ${videoTitle} was downloaded successfully`;
                    Notifications.info(title, message);
                });
            };
            req.send();
        },
        /**
         * Removes a download from the list of downloaded files and
         * removes the file on disk.
         */
        deleteVideo: function(video) {
            var d = $.Deferred();
            var filename = video.get("id");
            Storage.delete(filename).done(() => {
                this._removeDownloadFromManifest(video);
                d.resolve();
            });
            return d.promise();
        },
        /**
         * Adds the specified model to the list of downloaded files
         */
        _addDownloadToManifest: function(model) {
            this._setDownloaded(model, true);
            console.log('adding model to manifest: ');
            console.log(model);
            this.contentList.push(model);
            this._writeManifest();
        },
        /**
         * Remove the specified model from the list of downloaded files
         */
        _removeDownloadFromManifest: function(model) {
            this._setDownloaded(model, false);
            console.log('removing model from manifest: ');
            console.log(model);
            this.contentList.remove(model);
            this._writeManifest();
        },
        manifestFilename: "download-manifest.json"
    }

    return Downloads;

});
