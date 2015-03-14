/* @flow */

"use strict";

var Util = require("./util");

var Storage = {
    /**
     * Initializes the device storage for the sd card.
     * Must be called before any other API.
     */
    init: function(): any {
        if (!navigator.getDeviceStorage || !Util.isFirefoxOS()) {
            return Promise.resolve();
        }
        this.sdcard = navigator.getDeviceStorage("sdcard");
        return Promise.resolve();
    },
    /**
     * Returns true if storage is available on the device
     */
    isEnabled: function(): boolean {
        return !!this.sdcard;
    },
    /**
     * Returns a promise which when resolved contains an array of binary data
     */
    readAsBlob: function(filename: string): any {
        return new Promise((resolve, reject) => {
            if (!this.sdcard) {
                return reject();
            }
            var request = this.sdcard.get(filename);
            request.onsuccess = function() {
                resolve(this.result);
            };
            request.onerror = function() {
                Util.warn("Unable to get the file %s: %o", filename, this.error);
                reject();
            };
        });
    },
    /**
     * Returns a promise which when resolved contains a string of data
     */
    readText: function(filename: string): any {
        return new Promise((resolve, reject) => {
            if (!this.sdcard) {
                return reject();
            }
            var request = this.sdcard.get(filename);
            request.onsuccess = function() {
                var file = this.result;
                var fileReader = new FileReader();
                fileReader.readAsText(file.slice());
                fileReader.onloadend = function() {
                    resolve(fileReader.result);
                };
            };
            request.onerror = function() {
                Util.warn("Unable to get the file %s: %o", filename, this.error);
                reject();
            };
        });
    },
    /**
     * Deletes the specified file from sdstorage.
     * Resolves if the file no longer exists, wehther or not it was deleted.
     */
    delete: function(filename: string): any {
        return new Promise((resolve, reject) => {
            if (!this.sdcard) {
                return reject();
            }
            var request = this.sdcard.delete(filename);
            request.onsuccess = function() {
                resolve();
            };
            request.onerror = function() {
                if (this.error.name === "NotFoundError") {
                    resolve();
                } else {
                    Util.warn("Unable to delete the file: %o", this.error);
                    reject();
                }
            };
        });
    },
    /**
     * Writes out the specified data as text in the specified file.
     */
    writeText: function(filename: string, data: any): any {
        var blob = new window.Blob([data], {type: "text/plain"});
        return this.writeBlob(filename, blob);
    },
    /**
     * Writes out the specified blob in the specified file.
     */
    writeBlob: function(filename: string, blob: any): any {
        return new Promise((resolve, reject) => {
            this.delete(filename)
            // .always
            .catch(() => {}).then(() => {
                if (!this.sdcard) {
                    Util.log("rejected!");
                    return reject();
                }

                var request = this.sdcard.addNamed(blob, filename);
                request.onsuccess = function() {
                    Util.log(filename + " was written successfully!");
                    resolve();
                };
                // An error typically occur if a file with the same name already exist
                request.onerror = function() {
                    Util.warn("Unable to write the file: %o", this.error);
                    reject();
                };
            });
        });
    }
};

module.exports = Storage;
