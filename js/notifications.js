"use strict";

define([], function() {
    var Notifications = {
        info: function(title, message, clickCallback) {
            // TODO: If we ever want this to work outside of FFOS we may need
            // to request permissions here.
            if (!window.Notification) {
                return;
            }
            var notification = new Notification(title, { body: message });
            notification.onclick = clickCallback;
        }
    };
    return Notifications;
});
