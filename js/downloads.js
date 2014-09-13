"use strict";

/**
 * Responsible for keeping track of downloaded content.
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
                var contentListIds;
                if (data) {
                    contentListIds = JSON.parse(data);
                }
                var contentListModels = models.TopicTree.getContentItemsByIds(contentListIds);
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
        /**
         * Downloads the file at the specified URL and stores it to the
         * specified filename.
         */
        downloadContent: function(contentItem) {
            var filename = contentItem.get("id");
            var handleContentLoaded = (contentData) => {
                var blob = new Blob([contentData], {type: contentItem.getContentMimeType()});
                Storage.writeBlob(filename, blob).done(() => {
                    this._addDownloadToManifest(contentItem);
                    var contentTitle = contentItem.get("title");
                    var title = "Download complete";
                    var message;
                    if (contentItem.isVideo()) {
                        message = `The video: ${contentTitle} was downloaded successfully`;
                    } else {
                        message = `The article: ${contentTitle} was downloaded successfully`;
                    }
                    Notifications.info(title, message);
                });
            };
            if (contentItem.isVideo()) {
                var url = contentItem.get("download_urls").mp4;
                var req = new XMLHttpRequest({mozSystem: true});
                req.open("GET", url, true);
                req.responseType = "arraybuffer";
                req.onload = () => {
                    handleContentLoaded(req.response);
                }
                req.send();
            } else {
                handleContentLoaded(contentItem.get("content"));
            }
        },
        /**
         * Removes a download from the list of downloaded files and
         * removes the file on disk.
         */
        deleteContent: function(contentItem) {
            var d = $.Deferred();
            var filename = contentItem.get("id");
            Storage.delete(filename).done(() => {
                this._removeDownloadFromManifest(contentItem);
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
