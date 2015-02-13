jest.dontMock("../util.js");

describe("Util module", function() {
    it("has basic exports work", function() {
        var Util = require("../util.js");
        expect(Util.numberWithCommas("1234567890")).toBe("1,234,567,890");
        var oneAdder = Util.partial(function(x, y) {
            return x + y;
        }, 1);
        expect(oneAdder(5)).toBe(6);
        expect(window.x).toBe(undefined);
        expect(Util.appendQueryParam("http://test.com?a=b", "x", "y")).toBe("http://test.com?a=b&x=y");
        expect(Util.appendQueryParam("http://test.com", "x", "y")).toBe("http://test.com?x=y");
        expect(Util.getParameterByName("a", "?a=b")).toBe("b");
        expect(Util.getParameterByName("a", "?a=b&c=d")).toBe("b");
        expect(Util.getParameterByName("c", "?a=b&c=d")).toBe("d");
        var old = navigator.connection;
        if (!navigator.connection) {
            navigator.connection = {
                metered: false,
                bandwidth: Infinity
            };
            expect(Util.isMeteredConnection()).toBe(false);
            expect(Util.isBandwidthCapped()).toBe(false);
            navigator.connection = {
                metered: true,
                bandwidth: 33
            };
            expect(Util.isMeteredConnection()).toBe(true);
            expect(Util.isBandwidthCapped()).toBe(true);
            navigator.connection = {
                metered: false,
                bandwidth: 33
            };
            expect(Util.isMeteredConnection()).toBe(false);
            expect(Util.isBandwidthCapped()).toBe(true);
            navigator.connection = {
                type: "wifi"
            };
            expect(Util.isBandwidthCapped()).toBe(false);
            navigator.connection = {
                type: "none"
            };
            expect(Util.isBandwidthCapped()).toBe(false);
            navigator.connection = {
                type: "cellular"
            };
            expect(Util.isBandwidthCapped()).toBe(true);
        }
        navigator.connection = old;
        Util.loadScript("/test/_test1.js").done(function() {
            expect(window.x).toBe(3);
        });
    });
});
