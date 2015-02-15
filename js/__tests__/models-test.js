jest.dontMock("../models");
var models = require("../models");

describe("models module", function() {
    beforeEach(function () {
        window.localStorage = {};
        localStorage.setItem = function (key, val) {
             this[key] = val + '';
        }
        localStorage.getItem = function (key) {
            return this[key] || null;
        }
        Object.defineProperty(localStorage, 'length', {
            get: function () { return Object.keys(this).length - 2; }
        });
    });

    it("models.AppOptions.fetch defaults and reset", function(assert) {
        models.AppOptions.fetch().done(function() {
            models.AppOptions.reset();
            expect(models.AppOptions.get("showDownloadsOnly")).toBe(false);
            expect(models.AppOptions.get("showTranscripts")).toBe(true);
            expect(models.AppOptions.get("playbackRate")).toBe(100);

            // Change settings
            models.AppOptions.set("showDownloadsOnly", true);
            models.AppOptions.set("showTranscripts", false);
            models.AppOptions.set("playbackRate", 200);

            expect(models.AppOptions.get("showDownloadsOnly")).toBe(true);
            expect(models.AppOptions.get("showTranscripts")).toBe(false);
            expect(models.AppOptions.get("playbackRate")).toBe(200);

            // Now reset back to default
            models.AppOptions.reset();
            expect(models.AppOptions.get("showDownloadsOnly")).toBe(false);
            expect(models.AppOptions.get("showTranscripts")).toBe(true);
            expect(models.AppOptions.get("playbackRate")).toBe(100);
        });
    });

    it("models.CurrentUser.init works", function(assert) {
        var initRan = false;
        waitsFor(() => {
            return initRan;
        });

         models.CurrentUser.init().done(function() {
              expect(models.CurrentUser.initialized).toBe(true);
              initRan = true;
          });
    });

});
