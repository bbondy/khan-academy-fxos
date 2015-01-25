jest.dontMock("../storage.js");
jest.dontMock("../util.js");

describe("Storage module", function() {
    it("initializes correctly", function(assert) {
        var Storage = require("../storage.js");
        var Util = require("../util.js");

        var initRan = false;
        waitsFor(() => {
            return initRan;
        });
        Storage.init().then(() => {
            if (!Util.isFirefoxOS()) {
                initRan = true;
                return;
            }
            return Storage.writeText("test-file", "test");
        }).then(() => {
            return Storage.readText("test-file");
        }).done((result) => {
            expect(result).toBe("test");
            initRan = true;
        });
    });
});

