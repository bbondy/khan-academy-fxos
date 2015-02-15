jest.dontMock("../cache.js")
    .dontMock("sinon");

var Cache = require("../cache"),
    sinon = require("sinon");

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
        expect(2);
        Cache.heartbeatInterval = 100;

        var initRan = false;
        var count = 0;
        sinon.stub(Cache, "heartbeat", function() {
            ++count;
            if (count >= 3) {
                window.clearInterval(Cache.timer);
                Cache.heartbeat.restore();
            }
        });
        Cache.init().done(function() {
            expect(Cache.timer).toBeTruthy();
            initRan = true;
        });
        waitsFor(() => {
            return initRan && count >=3;
        });
        jest.runAllTimers();
    });
});

