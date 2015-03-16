jest.dontMock("../cache.js");
var Cache = require("../cache");

describe("Cache module", function() {
    beforeEach(function() {
        window.localStorage = {};
        localStorage.setItem = function(key, val) {
            window.localStorage[key] = val + "";
        };
        localStorage.getItem = function(key) {
            return window.localStorage[key] || null;
        };
        Object.defineProperty(localStorage, "length", {
            get: function() {
                return Object.keys(window.localStorage).length - 2;
            }
        });
    });

    it("initializes correctly and has a heartbeat", function() {
        Cache.heartbeatInterval = 100;
        var initRan = false;
        Cache.heartbeat = jest.genMockFn();
        expect(Cache.heartbeat).not.toBeCalled();
        Cache.init().then(function() {
            expect(Cache.timer).toBeTruthy();
            initRan = true;
            jest.runOnlyPendingTimers();
            expect(Cache.heartbeat).toBeCalled();
            jest.runOnlyPendingTimers();
            jest.runOnlyPendingTimers();
            expect(Cache.heartbeat.mock.calls.length).toBe(3);
            expect(setInterval.mock.calls.length).toBe(1);
            expect(setInterval.mock.calls[0][1]).toBe(Cache.heartbeatInterval);
        });
        waitsFor(() => {
            return initRan;
        });
    });
});

