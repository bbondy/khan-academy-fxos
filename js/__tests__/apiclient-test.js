jest.dontMock("../apiclient")
    .dontMock("../oauth");

jasmine.getEnv().defaultTimeoutInterval = 20000;

describe("APIClient", function() {
    beforeEach(function() {
        window.localStorage = {};
        localStorage.setItem = function(key, val) {
            window.localStorage[key] = val + "";
        };
        localStorage.getItem = function(key) {
            return window.localStorage[key] || null;
        };
        Object.defineProperty(localStorage, "length", {
            get: function() { return Object.keys(window.localStorage).length - 2; }
        });
    });

    it("initializes correctly", function(assert) {
        var $ = require("jquery");

        $.ajax = jest.genMockFunction();
        $.ajax.mockReturnValueOnce($.Deferred().resolve({
            consumerKey: "not-telling-you",
            consumerSecret: "not-real"
        }).promise());
        $.oauth = jest.genMockFunction();
        $.oauth.mockReturnValue($.Deferred().resolve({}).promise());

        var APIClient = require("../apiclient");
        var initRan = false;
        waitsFor(() => {
            return initRan;
        });

        APIClient.init().done(function() {
            // Consumer key and secret should be available after init
            expect(APIClient.oauth.consumerKey).toBeTruthy();
            expect(APIClient.oauth.consumerSecret).toBeTruthy();
            initRan = true;
            /*
            APIClient.getTopicTree().done(function() {
                return APIClient.getVideoTranscript();
            }).then(function() {
                return APIClient.getVideoTranscript();
            }).done(function() {
                initRan = true;
            });
            */
        });
    });
});

