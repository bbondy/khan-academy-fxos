jest.dontMock("../notifications.js");

var Notifications = require("../notifications");

describe("Util module", function() {
    it("has basic exports work", function() {
        window.Notification = window.Notification || function() {};
        var title = "title";
        var message = "message";
        window.Notification = jest.genMockFunction();
        Notifications.info(title, message);
        expect(window.Notification.mock.calls.length).toBe(1);
        expect(window.Notification.mock.calls[0][0]).toBe(title);
        expect(window.Notification.mock.calls[0][1].body).toBe(message);
    });
});

