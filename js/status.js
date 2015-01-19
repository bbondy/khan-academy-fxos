/* @flow */

"use strict";

define(["models"], function(models) {
    var Status = {
        /**
         * Start showing a new status message
         */
        start: function() {
            models.TempAppState.set("showingStatus", true);
        },
        /**
         * Stop showing the status message.
         * This function hides the status async.
         * @param delay The amount of time to wait before hiding the status
         */
        stop: function(delay) {
            setTimeout(() => {
                models.TempAppState.set("status", "");
                models.TempAppState.set("showingStatus", false);
            }, delay || 0);
        },
        /**
         * Updates the displayed status message
         * @param message The status message to show.
         */
        update: function(message) {
            if (models.TempAppState.get("showingStatus")) {
                models.TempAppState.set("status", message);
            }
        }
    };
    return Status;
});
