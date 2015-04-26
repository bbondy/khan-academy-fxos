/* @flow */

"use strict";

import {TempAppState} from "./models";

const Status = {
    /**
     * Start showing a new status message
     */
    start: function() {
        TempAppState.set("showingStatus", true);
    },
    /**
     * Stop showing the status message.
     * This function hides the status async.
     * @param delay The amount of time to wait before hiding the status
     */
    stop: function(delay: number) {
        delay = delay || 0;
        setTimeout(() => {
            TempAppState.set("status", "");
            TempAppState.set("showingStatus", false);
        }, delay);
    },
    /**
     * Updates the displayed status message
     * @param message The status message to show.
     */
    update: function(message: string) {
        if (TempAppState.get("showingStatus")) {
            TempAppState.set("status", message);
        }
    }
};

export default Status;
