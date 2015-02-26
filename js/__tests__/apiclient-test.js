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

        var $ = require("jquery");
        $.ajax = jest.genMockFunction();
        $.ajax.mockReturnValueOnce($.Deferred().resolve({
            consumerKey: "not-telling-you",
            consumerSecret: "not-real"
        }).promise());
        $.oauth = jest.genMockFunction();
        $.oauth.mockReturnValue($.Deferred().resolve({}).promise());
    });

    it("initializes correctly", function(assert) {
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


    it("test APIClient calls the right things", function() {
        var initRan = false;
        waitsFor(() => {
            return initRan;
        });
        var $ = require("jquery");
        var APIClient = require("../apiclient");
        APIClient.init().done(function() {
            APIClient._basicAPICall = jest.genMockFn();
            APIClient._basicAPICall.mockImpl((url, extraParams, method, dataType) => {
                return $.Deferred().resolve({
                    url: url,
                    extraParams: extraParams ? JSON.stringify(extraParams) : "",
                    method: method || "GET",
                    dataType: dataType}).promise();
            });
            APIClient.getUserProgress().then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user/progress_summary");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("{\"kind\":\"Video,Article,Exercise\"}");
                return APIClient.getUserInfo();
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.getInstalledTopicTree(false);
            }).then(function(result) {
                expect(result.url).toBe("/data/topic-tree.min.json");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.getInstalledTopicTree(true);
            }).then(function(result) {
                expect(result.url).toBe("/data/topic-tree.min.js");
                expect(result.extraParams).toBe("");
                return APIClient.getTopicTree();
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/fxos/topictree");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.getVideoTranscript("abcd");
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/videos/abcd/transcript");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.getArticle(54);
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/articles/54");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.reportArticleRead(54);
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user/article/54/log");
                expect(result.method).toBe("POST");
                expect(result.extraParams).toBe("");
                return APIClient.getUserVideos();
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user/videos");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.getUserVideos();
            }).then(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user/videos");
                expect(result.method).toBe("GET");
                expect(result.extraParams).toBe("");
                return APIClient.reportVideoProgress(1, 2, 3, 4, 5);
            }).done(function(result) {
                expect(result.url).toBe("https://www.khanacademy.org/api/v1/user/videos/2/log");
                expect(result.method).toBe("POST");
                expect(result.extraParams).toBe("{\"seconds_watched\":\"4\",\"last_second_watched\":\"5\"}");
                initRan = true;
            });
        });
    });


});

