"use strict";

define([], function() {
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
         * Returns a promise which when resolved contains a string of data
         */
        readText: function(filename, data) {
            var d = $.Deferred();
            if (!this.sdcard) {
                return d.reject().promise();
            }
            var request = this.sdcard.get(filename);
            request.onsuccess = function () {
                var file = this.result;
                var fileReader = new FileReader();
                fileReader.readAsText(file.slice())
                fileReader.onloadend = function() {
                    d.resolve(fileReader.result);
                }
            };
            request.onerror = function () {
                console.warn("Unable to get the file: " + this.error);
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
                    console.warn("Unable to delete the file: " + this.error);
                    d.reject();
                }
            };

            return d.promise();
        },
        /**
         * Writes out the specified data as text in the specified file.
         */
        writeText: function(filename, data) {
            var d = $.Deferred();
            if (!this.sdcard) {
                return d.reject().promise();
            }

            var file = new Blob([data], {type: "text/plain"});
            var request = this.sdcard.addNamed(file, filename);
            request.onsuccess = function () {
                var name = this.result;
                d.resolve();
            };
            // An error typically occur if a file with the same name already exist
            request.onerror = function () {
                console.warn('Unable to write the file: ' + this.error);
                d.reject();
            };
            return d.promise();
        }
    };

    return Storage;
});
