jest.dontMock("../status.js")
    .dontMock("../models.js");

var Status = require("../status"),
    models = require("../models");

describe("Status module", function() {
    it("start, stop and updates correctly", function() {
        var timerFired = false;
        waitsFor(() => {
            return timerFired;
        });

        expect(models.TempAppState.get("showingStatus")).toBe(false);
        Status.start();
        expect(models.TempAppState.get("showingStatus")).toBe(true);
        var message = "hello world!";
        Status.update(message);
        expect(models.TempAppState.get("status")).toBe(message);
        message = "changed message!";
        Status.update(message);
        expect(models.TempAppState.get("status")).toBe(message);
        Status.stop();
        setTimeout(function() {
            expect(models.TempAppState.get("status")).toBe("");
            expect(models.TempAppState.get("showingStatus")).toBe(false);
            timerFired = true;
        });
        jest.runAllTimers();
    });
});

