"use strict";

define(["util"], function(Util) {
    var Storage = {
        /**
         * Initializes the device storage for the sd card.
         * Must be called before any other API.
         */
        init: function() {
            if (!navigator.getDeviceStorage) {
                return $.Deferred().resolve().promise();
            }
            this.sdcard = navigator.getDeviceStorage("sdcard");
            return $.Deferred().resolve().promise();
        },
        /**
         * Returns a promise which when resolved contains an array of binary data
         */
        readAsBlob: function(filename) {
            var d = $.Deferred();
            if (!this.sdcard) {
                return d.reject().promise();
            }
            var request = this.sdcard.get(filename);
            request.onsuccess = function () {
                var file = this.result;
                d.resolve(file);
            };
            request.onerror = function () {
                Util.warn("Unable to get the file %s: %o", filename, this.error);
                d.reject();
            };

            return d.promise();
        },
        /**
         * Returns a promise which when resolved contains a string of data
         */
        readText: function(filename) {
            var d = $.Deferred();
            if (!this.sdcard) {
                return d.reject().promise();
            }
            var request = this.sdcard.get(filename);
            request.onsuccess = function () {
                var file = this.result;
                var fileReader = new FileReader();
                fileReader.readAsText(file.slice());
                fileReader.onloadend = function() {
                    d.resolve(fileReader.result);
                };
            };
            request.onerror = function () {
                Util.warn("Unable to get the file %s: %o", filename, this.error);
                d.reject();
            };

            return d.promise();
        },
        /**
         * Deletes the specified file from sdstorage.
         * Resolves if the file no longer exists, wehther or not it was deleted.
         */
        delete: function(filename) {
            var d = $.Deferred();
            if (!this.sdcard) {
                return d.reject().promise();
            }
            var request = this.sdcard.delete(filename);
            request.onsuccess = function () {
                d.resolve();
            };
            request.onerror = function () {
                if (this.error.name === "NotFoundError") {
                    d.resolve();
                } else {
                    Util.warn("Unable to delete the file: %o", this.error);
                    d.reject();
                }
            };

            return d.promise();
        },
        /**
         * Writes out the specified data as text in the specified file.
         */
        writeText: function(filename, data) {
            var blob = new Blob([data], {type: "text/plain"});
            return this.writeBlob(filename, blob);
        },
        /**
         * Writes out the specified blob in the specified file.
         */
        writeBlob: function(filename, blob) {
            var d = $.Deferred();
            this.delete(filename).always(() => {
                if (!this.sdcard) {
                    Util.log('rejected!');
                    return d.reject().promise();
                }

                var request = this.sdcard.addNamed(blob, filename);
                request.onsuccess = function () {
                    Util.log(filename + ' was written successfully!');
                    d.resolve();
                };
                // An error typically occur if a file with the same name already exist
                request.onerror = function () {
                    Util.warn('Unable to write the file: %o', this.error);
                    d.reject();
                };
            });
            return d.promise();
        }
    };

    return Storage;
});
