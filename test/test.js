require(["react-dev", "util", "models", "apiclient", "storage", "downloads", "cache", "minify", "notifications", "status", "views"],
        function(React, Util, models, APIClient, Storage, Downloads, Cache, Minify, Notifications, Status, Views) {

    var TestUtils = React.addons.TestUtils;
    var Simulate = TestUtils.Simulate;
    var mainView;

    var clickBack = function() {
        var backButton = TestUtils.findRenderedComponentWithType(mainView, Views.BackButton);
        var backLink = TestUtils.findRenderedDOMComponentWithTag(backButton, "a").getDOMNode();
        Simulate.click(backLink);
    };

    var search = function(term) {
        var topicSearch = TestUtils.findRenderedComponentWithType(mainView, Views.TopicSearch);
        var input = TestUtils.findRenderedDOMComponentWithTag(topicSearch, "input").getDOMNode();
        Simulate.change(input, { target: { value: term} });
    };

    var MainView = React.createFactory(Views.MainView);
    var mountNode = document.getElementById("app");
    $(mountNode).empty();

    QUnit.asyncTest("models.AppOptions.fetch defaults and reset", function(assert) {
        expect(12);
        models.AppOptions.fetch().done(function() {
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            assert.strictEqual(models.AppOptions.get("useYouTubePlayer"), false);
            assert.strictEqual(models.AppOptions.get("playbackSpeed"), 100);

            // Change settings
            models.AppOptions.set("showDownloadsOnly", true);
            models.AppOptions.set("showTranscripts", false);
            models.AppOptions.set("useYouTubePlayer", true);
            models.AppOptions.set("playbackSpeed", 200);
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), true);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), false);
            assert.strictEqual(models.AppOptions.get("useYouTubePlayer"), true);
            assert.strictEqual(models.AppOptions.get("playbackSpeed"), 200);

            // Now reset back to default
            models.AppOptions.reset();
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            assert.strictEqual(models.AppOptions.get("useYouTubePlayer"), false);
            assert.strictEqual(models.AppOptions.get("playbackSpeed"), 100);
            QUnit.start();
        });
    });
    QUnit.asyncTest("test react views", function(assert) {

        // Init everything
        Storage.init().then(function(){
          return APIClient.init();
        }).then(function() {
            return models.TopicTree.init();
        }).then(function() {
            return $.when(Downloads.init(), Cache.init(), models.AppOptions.fetch());
        }).then(function() {
            // We don't want to have to wait for results, so just start this and don't wait
            models.CurrentUser.init();

            mainView = TestUtils.renderIntoDocument(MainView({
                model: models.TopicTree.root
            }));

            var mainViewElements = ["header-title", "search", "icon-menu",
                "topic-list-container", "sidebar"];
            mainViewElements.forEach(function(c) {
                TestUtils.findRenderedDOMComponentWithClass(mainView, c);
            });

            // Make sure topic tree items display
            var topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(topicItems.length >= 10);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));

            // Make sure topic tree navigation works
            var link = TestUtils.findRenderedDOMComponentWithTag(topicItems[0], "a");
            Simulate.click(link.getDOMNode());
            topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));

            //Make sure that the back button works
            clickBack();
            topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));

            // Test topic search
            search("monkey");
            var videoItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.VideoListItem);
            //assert.ok(videoItems.length >= 2);
            assert.ok(_(videoItems).some(function(videoItem) {
                return videoItem.props.video.getTitle() === "Monkeys for a party";
            }));
            assert.ok(_(videoItems).some(function(videoItem) {
                return videoItem.props.video.getTitle() === "Harlow monkey experiments";
            }));
            models.AppOptions.set("useYouTubePlayer", false);

            // Test that video view render with transcripts
            models.AppOptions.set("showTranscripts", true);
            link = TestUtils.scryRenderedDOMComponentsWithTag(videoItems[0], "a")[0];
            Simulate.click(link.getDOMNode());
            // Check to make sure the sidebar contains: Download Video, Open in Website, Share
            var sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "download-video-link");
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "share-link");
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "download-video-link").length, 0);
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "share-link").length, 0);
            }
            TestUtils.findRenderedDOMComponentWithClass(sidebar, "open-in-website-link");
            TestUtils.findRenderedDOMComponentWithTag(mainView, "video");
            if (models.CurrentUser.isSignedIn()) {
                TestUtils.findRenderedDOMComponentWithClass(mainView, "energy-points"); // Only if signed in
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "energy-points").length, 0);
            }
            var videoViewer = TestUtils.findRenderedComponentWithType(mainView, Views.VideoViewer);
            return videoViewer.transcriptPromise;
        }).then(function() {
            var videoViewer = TestUtils.findRenderedComponentWithType(mainView, Views.VideoViewer);
            var transcriptViewer = TestUtils.findRenderedComponentWithType(videoViewer, Views.TranscriptViewer);
            var transcriptItems = TestUtils.scryRenderedComponentsWithType(transcriptViewer, Views.TranscriptItem);
            assert.ok(transcriptItems.length > 0);
            clickBack();

            // Make sure a video with transcript option off has no transcript promise
            models.AppOptions.set("showTranscripts", false);
            search("monkey");
            var videoItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.VideoListItem);
            link = TestUtils.scryRenderedDOMComponentsWithTag(videoItems[0], "a")[0];
            Simulate.click(link.getDOMNode());
            videoViewer = TestUtils.findRenderedComponentWithType(mainView, Views.VideoViewer);
            assert.ok(!videoViewer.transcriptPromise);
            clickBack();

            // Test that an article renders
            search("Oscillation with angular velocity");
            var articleItem = TestUtils.findRenderedComponentWithType(mainView, Views.ArticleListItem);
            link = TestUtils.scryRenderedDOMComponentsWithTag(articleItem, "a")[0];
            Simulate.click(link.getDOMNode());
            TestUtils.findRenderedDOMComponentWithTag(mainView, "article");
            var sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "download-article-link");
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "download-article-link").length, 0);
            }
            //assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "open-in-website-link").length, 0);
            //assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "share-link").length, 0);
            var articleViewer = TestUtils.findRenderedComponentWithType(mainView, Views.ArticleViewer);
            return articleViewer.p1;
        }).then(function() {
            // View setings works
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            var viewSettingsLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-settings-link").getDOMNode();
            Simulate.click(viewSettingsLink);
            TestUtils.findRenderedDOMComponentWithClass(mainView, "settings").getDOMNode();
            clickBack();

            // View downloads works
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                var viewDownloadsLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-downloads-link").getDOMNode();
                Simulate.click(viewDownloadsLink);
                TestUtils.findRenderedDOMComponentWithClass(mainView, "downloads").getDOMNode();
                clickBack();
            }

            // Open support link exists
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            TestUtils.findRenderedDOMComponentWithClass(sidebar, "open-support-link");

            ////////////////////
            // Logged in only tests
            ////////////////////

            if (!models.CurrentUser.isSignedIn()) {
                alert("Not signed in, not all tests were run.");
                QUnit.start();
                return;
            }

            // Make sure View Profile works correctly
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            var viewProfileLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-profile-link").getDOMNode();
            Simulate.click(viewProfileLink);
            TestUtils.findRenderedDOMComponentWithClass(mainView, "profile").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "username").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "points-header").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "energy-points-profile").getDOMNode();
            assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "badge-category-count").length, 6);
            assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "badge-category-icon").length, 6);
            clickBack();
            QUnit.start();
        }).fail(function(error) {
            if (error) {
                Util.warn("Promise failed: " + error);
            } else {
                Util.warn("Promise failed");
            }
        });
    });

    QUnit.asyncTest("test APIClient calls the right things", function(assert) {

        APIClient.init().done(function() {
            sinon.stub(APIClient, "_basicAPICall", function(url, extraParams, method, dataType) {
                console.log('basic api called here: ' + url);
                return  $.Deferred().resolve({
                    url: url,
                    extraParams: extraParams ? JSON.stringify(extraParams) : "",
                    method: method || "GET",
                    dataType: dataType}).promise();
            });
            APIClient.getUserProgress().then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user/progress_summary", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "{\"kind\":\"Video,Article\"}");
                return APIClient.getUserInfo();
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getInstalledTopicTree(false);
            }).then(function(result) {
                assert.strictEqual("/data/topic-tree.min.json", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getInstalledTopicTree(true);
            }).then(function(result) {
                assert.strictEqual("/data/topic-tree.min.js", result.url);
                assert.strictEqual(result.extraParams, "");
                return APIClient.getTopicTree();
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/fxos/topictree", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getVideoTranscript('abcd');
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/videos/abcd/transcript", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getArticle(54);
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/articles/54", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.reportArticleRead(54);
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user/article/54/log", result.url);
                assert.strictEqual(result.method, "POST");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getUserVideos();
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user/videos", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.getUserVideos();
            }).then(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user/videos", result.url);
                assert.strictEqual(result.method, "GET");
                assert.strictEqual(result.extraParams, "");
                return APIClient.reportVideoProgress(1,2,3,4,5);
            }).done(function(result) {
                assert.strictEqual("https://www.khanacademy.org/api/v1/user/videos/2/log", result.url);
                assert.strictEqual(result.method, "POST");
                assert.strictEqual(result.extraParams, "{\"seconds_watched\":\"4\",\"last_second_watched\":\"5\"}");
                APIClient._basicAPICall.restore();
                QUnit.start();
            });
        });
    });

    // Languages in which topic trees should be tested for
    var languages = ["en", "fr", "es", "pt"];
    QUnit.asyncTest("testUtil", function(assert) {
        assert.strictEqual(Util.numberWithCommas("1234567890"),"1,234,567,890");
        var oneAdder = Util.partial(function(x, y) { return x + y; }, 1);
        assert.strictEqual(oneAdder(5), 6);
        assert.strictEqual(window.x, undefined);
        assert.strictEqual(Util.appendQueryParam("http://test.com?a=b", "x", "y"), "http://test.com?a=b&x=y");
        assert.strictEqual(Util.appendQueryParam("http://test.com", "x", "y"), "http://test.com?x=y");
        assert.strictEqual(Util.getParameterByName("a", "?a=b"), "b");
        assert.strictEqual(Util.getParameterByName("a", "?a=b&c=d"), "b");
        assert.strictEqual(Util.getParameterByName("c", "?a=b&c=d"), "d");
        var old = navigator.connection;
        if (!navigator.connection) {
            navigator.connection = { metered: false, bandwidth: Infinity };
            assert.strictEqual(Util.isMeteredConnection(), false);
            assert.strictEqual(Util.isBandwidthCapped(), false);
            navigator.connection = { metered: true, bandwidth: 33};
            assert.strictEqual(Util.isMeteredConnection(), true);
            assert.strictEqual(Util.isBandwidthCapped(), true);
            navigator.connection = { metered: false, bandwidth: 33};
            assert.strictEqual(Util.isMeteredConnection(), false);
            assert.strictEqual(Util.isBandwidthCapped(), true);
            navigator.connection = { type: "wifi" };
            assert.strictEqual(Util.isBandwidthCapped(), false);
            navigator.connection = { type: "none" };
            assert.strictEqual(Util.isBandwidthCapped(), false);
            navigator.connection = { type: "cellular" };
            assert.strictEqual(Util.isBandwidthCapped(), true);
        }
        navigator.connection = old;
        Util.loadScript("/test/_test1.js").done(function() {
            assert.strictEqual(window.x, 3);
            QUnit.start();
        });
    });

    QUnit.asyncTest("APIClient.init", function(assert) {
        expect(5);
        APIClient.init().done(function() {
            // Consumer key and secret should be available after init
            assert.ok(APIClient.oauth.consumerKey);
            assert.ok(APIClient.oauth.consumerSecret);
            APIClient.getTopicTree().done(function() {
                assert.ok(true);
                return APIClient.getVideoTranscript();
            }).then(function() {
                assert.ok(true);
                return APIClient.getVideoTranscript();
            }).done(function() {
                assert.ok(true);
                QUnit.start();
            });
        });
    });

    QUnit.asyncTest("models.TopicTree.init", function(assert) {

        // Helper method for validating a valid topic
        var assertValidTopic = (t) => {
            assert.ok(t.isTopic());
            assert.ok(!t.isVideoList());
            assert.ok(!t.isVideo());
            assert.ok(!t.isArticleList());
            assert.ok(!t.isArticle());
            assert.ok(!t.isContent());
            assert.ok(!t.isContentList());
            assert.strictEqual(t.getKind(), "Topic");
        };

        // Helper method for validating a validcontent item
        var assertValidContent = (c) => {
            assert.ok(!c.isTopic());
            assert.ok(!c.isVideoList());
            assert.ok(c.isVideo() ^ c.isArticle());
            assert.ok(!c.isArticleList());
            assert.ok(c.isContent());
            assert.ok(!c.isContentList());
            assert.ok(c.getParentDomain());
            assert.ok(!c.isRoot());
            assert.ok(!c.isRootChild());
            if (c.isVideo()) {
                assert.strictEqual(c.getKind(), "Video");
            } else if (c.isArticle()) {
                assert.strictEqual(c.getKind(), "Article");
            }
        };

        var promise = $.Deferred().resolve().promise();
        languages.forEach((lang) => {

            promise = promise.then(function() {
                var stub = sinon.stub(Util, "getLang", function() {
                    if (lang === "en") {
                        return null;
                    }
                    return lang;
                });
                var p = models.TopicTree.init();
                Util.getLang.restore();
                return p;
            }).then(function() {

                var root = models.TopicTree.root;
                assert.ok(root);
                assert.strictEqual(root.getTitle(), "Khan Academy");
                assert.ok(!root.getParentDomain());
                assert.ok(root.isRoot());
                assert.ok(!root.getParent());
                assertValidTopic(root);

                // Topics are at root
                assert.ok(models.TopicTree.root.get("topics").models.length > 0);
                _(models.TopicTree.root.get("topics").models).each((m) => {
                    assert.ok(m.getParentDomain());
                    assert.ok(!m.isRoot());
                    assert.ok(m.getParent());
                    assertValidTopic(m);
                });

                assert.ok(models.TopicTree.allContentItems.length > 0);
                _(models.TopicTree.allContentItems).each((c) => {
                    assertValidContent(c);
                });

                // But there are no content items at root
                assert.ok(models.TopicTree.root.get("contentItems").models.length === 0);
                assert.strictEqual(models.TopicTree.root.findContentItems("math", 1).length, 1);
                var results = models.TopicTree.root.findContentItems("math", 2);
                assert.strictEqual(results.length, 2);
                assert.notStrictEqual(results[0], results[1]);

            });
        });
        promise.done(() => {
            QUnit.start();
        });
    });
    QUnit.asyncTest("models.CurrentUser.init", function(assert) {
        expect(1);
        models.CurrentUser.init().done(function() {
            assert.ok(models.CurrentUser.initialized);
            QUnit.start();
        });
    });
    QUnit.asyncTest("Storage.init", function(assert) {
        expect(1);
        Storage.init().then(function() {
            if (!Util.isFirefoxOS()) {
                assert.ok(true);
                QUnit.start();
                return;
            }
            return Storage.writeText("test-file", "test");
        }).then(function() {
            return Storage.readText("test-file");
        }).done(function(result) {
            assert.strictEqual(result, "test");
            QUnit.start();
        });
    });
    QUnit.asyncTest("Downloads.init", function(assert) {
        expect(1);
        Downloads.init().done(function() {
            assert.ok(true);
            QUnit.start();
        });
    });
    QUnit.asyncTest("Status.start, stop, update", function(assert) {
        expect(6);
        assert.ok(!models.TempAppState.get("showingStatus"));
        Status.start();
        assert.strictEqual(models.TempAppState.get("showingStatus"), true);
        var message = "hello world!";
        Status.update(message);
        assert.strictEqual(models.TempAppState.get("status"), message);
        message = "changed message!";
        Status.update(message);
        assert.strictEqual(models.TempAppState.get("status"), message);
        Status.stop();
        setTimeout(function() {
            assert.strictEqual(models.TempAppState.get("status"), "");
            assert.strictEqual(models.TempAppState.get("showingStatus"), false);
            QUnit.start();
        });
    });
    QUnit.asyncTest("Cache.init", function(assert) {
        expect(2);
        Cache.heartbeatInterval = 100;
        var count = 0;
        sinon.stub(Cache, "heartbeat", function() {
            ++count;
            if (count >= 3) {
                assert.ok(true);
                window.clearInterval(Cache.timer);
                Cache.heartbeat.restore();
                QUnit.start();
            }
        });
        Cache.init().done(function() {
            assert.ok(Cache.timer);
        });
    });
    QUnit.test("Notifications.info", function(assert) {
        var notificationPropExists = !!window.Notification;
        window.Notification = window.Notification || function() {};
        var title = "title";
        var message = "message";
        sinon.stub(window, "Notification", function(t, m) {
            assert.strictEqual(t, title);
            assert.strictEqual(m.body, message);
        });
        Notifications.info(title, message);
        if (notificationPropExists) {
            window.Notification.restore();
        } else {
            delete window.Notification;
        }
    });

    QUnit.test("testLocalization", function(assert) {
        document.webL10n.setAsyncLoading(false);
        document.webL10n.setExactLangOnly(true);
        var enDict = document.webL10n.getData();
        var otherLanguages = languages.slice(1);

        // Make sure each localization file has an associated string
        otherLanguages.forEach(function(lang) {
            document.webL10n.setLanguage(lang);
            for (var s in enDict) {
                if (enDict.hasOwnProperty(s)) {

                    var translated = document.webL10n.get(s);
                    if (!translated) {
                        console.error("Not localized! lang: %s, prop: %s, en-associated: %o",
                            lang, s, enDict[s], lang);
                    }
                    assert.ok(translated.length);
                }
            }
        });
    });
});
