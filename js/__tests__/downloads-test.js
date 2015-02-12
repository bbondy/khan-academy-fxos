jest.dontMock("../downloads")
    .dontMock("../storage")
    .dontMock("../models");

describe("Downloads module", function() {
    it("initializes correctly", function() {
        var initRan = false;
        waitsFor(() => {
            return initRan;
        });

        var Downloads = require("../downloads");
        Downloads.init().done(function() {
            initRan = true;
        });
    });
});

