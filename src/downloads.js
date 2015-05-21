/* @flow */

"use strict";

/**
 * Responsible for keeping track of downloaded content.
 *   - Maintains a manifest of what's downloaded
 *   - Actually performs downloads
 *   - Provides the ability to delete those downloads
 */

import _ from "underscore";
import Util from "./util";
import Storage from "./storage";
import {ContentList, TempAppState} from "./models";
import models from "./models";
import APIClient from "./apiclient";

const Downloads: { contentList: any; init: any; canCancelDownload: any; cancelDownloading: any; download: any; downloadContent: any; downloadTopic: any; deleteContent: any } = {
    contentList: null,
    /**
     * Initializes download manager
     */
    init: function() {
        // Force always resolve instead of just returning readManifest
        return new Promise((resolve) => {
            this.contentList = new ContentList();
            this.readManifest().then(() => {
                resolve();
            }).catch(() => {
                resolve();
            });
        });
    },
    /**
     * Writes out the manifest file, which keeps track of downloaded data
     */
    writeManifest: function() {
        var contentListIds = this.contentList.models.map(function(model) {
            return model.getId();
        });
        var jsonManifest = JSON.stringify(contentListIds);
        return Storage.writeText(this.manifestFilename, jsonManifest);
    },
    /**
     * Reads in a manifest file, which keeps track of downloaded data
     */
    readManifest: function() {
        return new Promise((resolve, reject) => {
            Storage.readText(this.manifestFilename).then((data) => {
                var contentListIds;
                if (data) {
                    contentListIds = JSON.parse(data);
                }
                var contentListModels = models.TopicTree.getContentItemsByIds(contentListIds);
                _(contentListModels).each((model) => {
                    this.setDownloaded(model, true);
                });
                this.contentList = new ContentList(contentListModels);
                resolve();
            }).catch(() => {
                reject();
            });
        });
    },
    setDownloaded: function(model: any, downloaded: boolean) {
        model.setDownloaded(downloaded);
        while (model = model.getParent()) { // eslint-disable-line
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
     * Returns whether there is a cancellable download in progress.
     */
    canCancelDownload: function() {
        return TempAppState.get("isDownloadingTopic") || TempAppState.get("currentDownloadRequest");
    },

    /**
     * Cancels downloading if it's in progress.
     */
    cancelDownloading: function() {
        TempAppState.set("isDownloadingTopic", false);
        var currentRequest = TempAppState.get("currentDownloadRequest");
        // Cancel the XHR if it exists (it may not, in the case of article downloads).
        if (currentRequest) {
            currentRequest.abort();
            TempAppState.set("currentDownloadRequest", null);
        }
        if (this.currentProgress) {
            this.currentProgress(undefined, true);
        }
    },
    /**
     * Used to download either a single content item for all content
     * items underneath the specified topic.
     */
    download: function(model: any, onProgress: any) {
        if (model.isContent()) {
            return this.downloadContent(model, onProgress, 0);
        } else if (model.isTopic()) {
            return this.downloadTopic(model, onProgress);
        }
        return Promise.resolve();
    },
    /**
     * Downloads all content items recursively one at a time for
     * the current topic
     */
    downloadTopic: function(topic: any, onProgress: any) {
        return new Promise((resolve, reject) => {
            this.currentProgress = onProgress;
            var downloadedCount = 0;
            TempAppState.set("isDownloadingTopic", true);
            var predicate = (model) => !model.isDownloaded();
            var seq = topic.enumChildrenGenerator(predicate);
            var downloadOneAtATime = () => {
                try {
                    var contentItem = seq.next().value;
                    // Allow at most one download at a time.
                    this.downloadContent(contentItem, onProgress, downloadedCount).then(() => {
                        downloadedCount++;
                        setTimeout(downloadOneAtATime, 1000);
                    }).catch((isCancel) => {
                        if (isCancel) {
                            delete this.currentProgress;
                        }
                        reject(isCancel);
                    });
                } catch (e) {
                    // done, no more items in the generator
                    TempAppState.set("isDownloadingTopic", false);
                    resolve(topic, downloadedCount);
                    delete this.currentProgress;
                }
            };
            downloadOneAtATime();
        });
    },
    /**
     * Downloads the file at the specified URL and stores it to the
     * specified filename.
     */
    downloadContent: function(contentItem: any, onProgress: any, downloadNumber: any) {
        return new Promise((resolve, reject) => {
            if (onProgress) {
                onProgress(downloadNumber, 0);
            }

            var filename = contentItem.getId();
            var handleContentLoaded = (contentData) => {
                var blob = new window.Blob([contentData], {
                    type: contentItem.getContentMimeType()
                });
                Storage.writeBlob(filename, blob).then(() => {
                    this.addDownloadToManifest(contentItem);
                    if (onProgress) {
                        onProgress(downloadNumber + 1, 0);
                    }
                    resolve(contentItem, 1);
                }).catch(() => {
                    reject();
                });
            };
            if (contentItem.isVideo()) {
                var url = contentItem.getDownloadUrl();
                var req = new XMLHttpRequest({mozSystem: true});
                req.open("GET", url, true);
                req.responseType = "arraybuffer";
                req.onload = () => {
                    models.TempAppState.set("currentDownloadRequest", null);
                    handleContentLoaded(req.response);
                };
                req.onabort = () => {
                    reject(true);
                };
                req.onerror = () => {
                    reject(false);
                };
                req.onprogress = (e) => {
                    var percent = Math.floor(e.loaded * 100 / e.total);
                    onProgress(downloadNumber, percent);
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
                    APIClient.getArticle(contentItem.getId()).then((result) => {
                        contentItem.set("content", result.translated_html_content);
                        handleContentLoaded(contentItem.get("content"));
                    }).catch(() => {
                        return reject().promise();
                    });
                }
            }
        });
    },
    /**
     * Removes a download from the list of downloaded files and
     * removes the file on disk.
     */
    deleteContent: function(contentItem: any): any {
        return new Promise((resolve, reject) => {
            var filename = contentItem.getId();
            Storage.delete(filename).then(() => {
                this.removeDownloadFromManifest(contentItem);
                resolve();
            }).catch(() => {
                reject();
            });
        });
    },
    /**
     * Adds the specified model to the list of downloaded files
     */
    addDownloadToManifest: function(model: any): any {
        this.setDownloaded(model, true);
        Util.log("adding model to manifest: ");
        Util.log(model);
        this.contentList.push(model);
        this.writeManifest();
    },
    /**
     * Remove the specified model from the list of downloaded files
     */
    removeDownloadFromManifest: function(model: any): any {
        this.setDownloaded(model, false);
        Util.log("removing model from manifest: ");
        Util.log(model);
        this.contentList.remove(model);
        this.writeManifest();
    },
    manifestFilename: "download-manifest.json"
};

export default Downloads;
