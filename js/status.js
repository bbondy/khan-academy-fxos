"use strict";

define([], function() {
    var Status = {
        // A new status message is starting
        start: function() {
            models.TempAppState.set("showingStatus", true);
        },
        stop: function(delay) {
            setTimeout(() => {
                models.TempAppState.set("status", "");
                models.TempAppState.set("showingStatus", false);
            }, delay || 0);
        },
        update: function(message) {
            if (models.TempAppState.get("showingStatus")) {
                models.TempAppState.set("status", message);
            }
        }
    };
    return Status;
});
