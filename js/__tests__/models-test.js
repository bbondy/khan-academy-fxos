jest.dontMock("../models")
    .dontMock("../minify");

var models = require("../models");
jest.dontMock("../models")
    .dontMock("../util");

jasmine.getEnv().defaultTimeoutInterval = 60000;

var models = require("../models"),
    Util = require("../util"),
    Storage = require("../storage");

var mockTopicTreeData = {
  c: [{
        i: "x7a488390",
        t:" Math",
        K:1,
        c: [{
            K: 1,
            c: [{
                K: 1,
                c: [{
                    K: 1,
                    c: [
                        {
                            f:null,
                            n:"count-to-100",
                            p:"exa4413411",
                            E:"Can you count to 100?",
                            K:3,
                            T:"Count to 100"
                        },
                        {
                            f:null,
                            n:"count-from-any-number",
                            p:"ex3b1bceb9",
                            K:3,
                            T:"Count from any number"
                        },
                        {
                            i:"xc640da96",
                            k:"https://www.khanacademy.org/video/assess-mission-progress",
                            t:"Scenario 2: Assess mission progress",
                            u:"AVpSjvpBwqY.mp4/AVpSjvpBwqY",
                            D:68,
                            K:2,
                            Y:"AVpSjvpBwqY"
                        },
                        {
                            i:"xc640da97",
                            k:"https://www.khanacademy.org/video/assess-mission-progress-2",
                            t:"Scenariod 3: Assess mission progress",
                            u:"AVpSjvpBwqY.mp4/AVpSjvpBwqY",
                            D:68,
                            K:2,
                            Y:"AVpSjvpBwqY"
                        }
                    ]
                }]
            }]
        }]
    }],
    t: "Khan Academy",
    K: 1
};

describe("models module", function() {
    beforeEach(function() {
        window.localStorage = {};
        localStorage.setItem = function(key, val) {
            this[key] = val + "";
        };
        localStorage.getItem = function(key) {
            return this[key] || null;
        };
        Object.defineProperty(localStorage, "length", {
            get: function() {
                return Object.keys(this).length - 2;
            }
        });
    });

    it("models.AppOptions.fetch defaults and reset", function(assert) {
        models.AppOptions.fetch().then(function() {
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

        models.CurrentUser.init().then(function() {
            expect(models.CurrentUser.initialized).toBe(true);
            initRan = true;
        });
    });

    it("initializes the topic tree correctly with valid data", function(assert) {

        // Helper method for validating a valid topic
        var assertValidTopic = (t) => {
            expect(t.isTopic()).toBeTruthy();
            expect(t.isVideoList()).toBeFalsy();
            expect(t.isVideo()).toBeFalsy();
            expect(t.isArticleList()).toBeFalsy();
            expect(t.isArticle()).toBeFalsy();
            expect(t.isExerciseList()).toBeFalsy();
            expect(t.isExercise()).toBeFalsy();
            expect(t.isContent()).toBeFalsy();
            expect(t.isContentList()).toBeFalsy();
            expect(t.getKind()).toBe("Topic");
        };

        // Helper method for validating a validcontent item
        var assertValidContent = (c) => {
            expect(c.isTopic()).toBeFalsy();
            expect(c.isVideoList()).toBeFalsy();
            expect(c.isVideo() ^ c.isArticle() ^ c.isExercise()).toBeTruthy();
            expect(c.isArticleList()).toBeFalsy();
            expect(c.isExerciseList()).toBeFalsy();
            expect(c.isContent()).toBeTruthy();
            expect(c.isContentList()).toBeFalsy();
            expect(c.getParentDomain()).toBeTruthy();
            expect(c.isRoot()).toBeFalsy();
            expect(c.isRootChild()).toBeFalsy();

            if (c.isVideo()) {
                expect(c.getKind()).toBe("Video");
            } else if (c.isArticle()) {
                expect(c.getKind()).toBe("Article");
            } else if (c.isExercise()) {
                expect(c.getKind()).toBe("Exercise");
            }
        };

        Storage.readText.mockReturnValue(Promise.resolve(JSON.stringify(mockTopicTreeData)).promise());
        var promise = Promise.resolve();
        var languages = ["en", "fr", "es", "pt", "tr", "bn"];
        languages.forEach((lang) => {
            promise = promise.then(function() {
                Util.getLang = jest.genMockFn();
                Util.getLang.mockReturnValueOnce(lang);
                return models.TopicTree.init();
            }).then(function() {
                var root = models.TopicTree.root;
                expect(root).toBeTruthy();
                expect(root.getTitle()).toBe("Khan Academy");
                expect(root.getParentDomain()).toBeFalsy();
                expect(root.isRoot()).toBeTruthy();
                expect(root.getParent()).toBeFalsy();
                assertValidTopic(root);
                // Topics are at root
                expect(models.TopicTree.root.get("topics").models.length).toBeGreaterThan(0);
                models.TopicTree.root.get("topics").models.forEach((m) => {
                    expect(m.getParentDomain()).toBeTruthy();
                    expect(m.isRoot()).toBeFalsy();
                    expect(m.getParent()).toBeTruthy();
                    assertValidTopic(m);
                });

                expect(models.TopicTree.allContentItems.length).toBeGreaterThan(0);
                models.TopicTree.allContentItems.forEach((c) => {
                    assertValidContent(c);
                });

                // But there are no content items at root
                expect(models.TopicTree.root.get("contentItems").models.length).toBe(0);
                expect(models.TopicTree.root.findContentItems("mission", 1).length).toBe(1);
                var results = models.TopicTree.root.findContentItems("count", 2);
                expect(results.length).toBe(2);
                results = models.TopicTree.root.findContentItems("countfdsafs", 2);
                expect(results.length).toBe(0);
            });
        });

        var initRan = false;
        waitsFor(() => {
            return initRan;
        });

        promise.then(() => {
            initRan = true;
        });
    });
});
