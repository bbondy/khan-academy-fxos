/* @flow */

"use strict";

define(function() {
    var Notifications = {
        /**
         * Shows a system notification
         * @param title The title of the notification
         * @param message The message of the notification
         * @param clickCallback A callback to call if the notification is clicked.
         */
        info: function(title, message, clickCallback) {
            // TODO: If we ever want this to work outside of FFOS we may need
            // to request permissions here.
            if (!window.Notification) {
                return;
            }
            var notification = new window.Notification(title, {
                body: message
            });
            notification.onclick = clickCallback;
        }
    };
    return Notifications;
});
