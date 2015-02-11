jest.dontMock("../notifications.js")
    .dontMock("sinon");

var Notifications = require("../notifications"),
    sinon = require("sinon");

describe("Util module", function() {
    it("has basic exports work", function() {
        var notificationPropExists = !!window.Notification;
        window.Notification = window.Notification || function() {};
        var title = "title";
        var message = "message";
        sinon.stub(window, "Notification", function(t, m) {
            expect(t).toBe(title);
            expect(m.body).toBe(message);
        });
        Notifications.info(title, message);
        if (notificationPropExists) {
            window.Notification.restore();
        } else {
            delete window.Notification;
        }
    });
});

