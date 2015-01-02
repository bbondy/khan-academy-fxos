"use strict";

/**
 * Responsible for keeping track of downloaded content.
 *   - Maintains a manifest of what's downloaded
 *   - Actually performs downloads
 *   - Provides the ability to delete those downloads
 */

define(["jquery", "underscore", "util", "storage", "models", "apiclient"],
        function($, underscore, Util, Storage, models, APIClient) {

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
                return model.getId();
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
            model.setDownloaded(downloaded);
            while (model = model.getParent()) {
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
         * Cancels downloading if it's in progress.
         */
        cancelDownloading: function() {
            models.TempAppState.set("isDownloadingTopic", false);
            var currentRequest = models.TempAppState.get("currentDownloadRequest");
            // Cancel the XHR if it exists (it may not, in the case of article downloads).
            if (currentRequest) {
                currentRequest.abort();
                models.TempAppState.set("currentDownloadRequest", null);
            }
            if (this.currentProgress) {
                this.currentProgress(undefined, undefined, true);
            }
        },
        /**
         * Used to download either a single content item for all content
         * items underneath the specified topic.
         * onProgress callback is only used for topics and is called for
         * each content item.
         */
        download: function(model, onProgress) {
            if (model.isContent()) {
                return this.downloadContent(model, onProgress);
            } else if (model.isTopic()) {
                return this.downloadTopic(model, onProgress);
            }
            return $.Deferred().resolve().promise();
        },
        /**
         * Downloads all content items recursively one at a time for
         * the current topic
         */
        downloadTopic: function(topic, onProgress) {
            this.currentProgress = onProgress;
            var d = $.Deferred();
            var downloadedCount = 0;
            models.TempAppState.set("isDownloadingTopic", true);
            if (onProgress) {
                onProgress(null, 0);
            }
            var predicate = (model) => !model.isDownloaded();
            var seq = topic.enumChildrenGenerator(predicate);
            var downloadOneAtATime = () => {
                try {
                    var contentItem = seq.next().value;
                    // Allow at most one download at a time.
                    this.downloadContent(contentItem).done(() => {
                        downloadedCount++;
                        if (onProgress) {
                            onProgress(contentItem, downloadedCount);
                        }
                        setTimeout(downloadOneAtATime, 1000);
                    }).fail((isCancel) => {
                        if (isCancel) {
                            delete this.currentProgress;
                        }
                        d.reject(isCancel);
                    });
                } catch (e) {
                    // done, no more items in the generator
                    models.TempAppState.set("isDownloadingTopic", false);
                    d.resolve(topic, downloadedCount);
                    delete this.currentProgress;
                }
            };
            downloadOneAtATime();
            return d.promise();
        },
        /**
         * Downloads the file at the specified URL and stores it to the
         * specified filename.
         */
        downloadContent: function(contentItem, onProgress) {
            var d = $.Deferred();
            if (onProgress) {
                onProgress(null, 0);
            }

            var filename = contentItem.getId();
            var handleContentLoaded = (contentData) => {
                var blob = new Blob([contentData], {type: contentItem.getContentMimeType()});
                Storage.writeBlob(filename, blob).done(() => {
                    this._addDownloadToManifest(contentItem);
                    if (onProgress) {
                        onProgress(contentItem, 1);
                    }
                    d.resolve(contentItem, 1);
                }).fail(() => {
                    d.reject();
                });
            };
            if (contentItem.isVideo()) {
                var url = contentItem.getDownloadUrl();
                var req = new XMLHttpRequest({mozSystem: true});
                req.open("GET", url, true);
                req.responseType = "arraybuffer";
                req.onload = () => {
                    handleContentLoaded(req.response);
                };
                req.onabort = (e) => {
                    d.reject(true);
                };
                req.onerror = (e) => {
                    d.reject(false);
                };
                req.send();
                models.TempAppState.set("currentDownloadRequest", req);
            } else if (contentItem.isArticle()) {
                if (contentItem.get("content")) {
                    // Articles have a content property with the html we want to
                    // download already. It's not loaded in by the topic tree but
                    // when the article is actually loaded.
                    handleContentLoaded(contentItem.get("content"));
                } else {
                    // Sometimes articles are downloaded before they are viewed,
                    // so try to download it here.
                    APIClient.getArticle(contentItem.getId()).done((result) => {
                        contentItem.set("content", result.translated_html_content);
                        handleContentLoaded(contentItem.get("content"));
                    }).fail(() => {
                        return d.reject().promise();
                    });
                }
            }
            return d.promise();
        },
        /**
         * Removes a download from the list of downloaded files and
         * removes the file on disk.
         */
        deleteContent: function(contentItem) {
            var d = $.Deferred();
            var filename = contentItem.getId();
            Storage.delete(filename).done(() => {
                this._removeDownloadFromManifest(contentItem);
                d.resolve();
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        /**
         * Adds the specified model to the list of downloaded files
         */
        _addDownloadToManifest: function(model) {
            this._setDownloaded(model, true);
            Util.log('adding model to manifest: ');
            Util.log(model);
            this.contentList.push(model);
            this._writeManifest();
        },
        /**
         * Remove the specified model from the list of downloaded files
         */
        _removeDownloadFromManifest: function(model) {
            this._setDownloaded(model, false);
            Util.log('removing model from manifest: ');
            Util.log(model);
            this.contentList.remove(model);
            this._writeManifest();
        },
        manifestFilename: "download-manifest.json"
    }

    return Downloads;

});
