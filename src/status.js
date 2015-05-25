/* @flow */

"use strict";

const Status = {
    /**
     * Start showing a new status message
     */
    start: function(editTempStore) {
        editTempStore((temp) => temp.set("showingStatus", true));
    },
    /**
     * Stop showing the status message.
     * This function hides the status async.
     * @param delay The amount of time to wait before hiding the status
     */
    stop: function(delay: number, editTempStore) {
        delay = delay || 0;
        setTimeout(() => {
            editTempStore((tempStore) => tempStore.merge({
                status: "",
                showingStatus: false,
            }));
        }, delay);
    },
    /**
     * Updates the displayed status message
     * @param message The status message to show.
     */
    update: function(message: string, tempStore, editTempStore) {
        if (tempStore.get("showingStatus")) {
            editTempStore((temp) => temp.set("status", message));
        }
    }
};

export default Status;
