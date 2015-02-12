require(["l10n", "jquery", "underscore", "react", "util", "models", "apiclient", "storage", "downloads", "cache", "minify", "notifications", "status"],
        function(l10n, $, _, React, Util, models, APIClient, Storage, Downloads, Cache, Minify, Notifications, Status) {

    QUnit.asyncTest("models.AppOptions.fetch defaults and reset", function(assert) {
        expect(9);
        models.AppOptions.fetch().done(function() {
            models.AppOptions.reset();
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            assert.strictEqual(models.AppOptions.get("playbackRate"), 100);

            // Change settings
            models.AppOptions.set("showDownloadsOnly", true);
            models.AppOptions.set("showTranscripts", false);
            models.AppOptions.set("playbackRate", 200);
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), true);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), false);
            assert.strictEqual(models.AppOptions.get("playbackRate"), 200);

            // Now reset back to default
            models.AppOptions.reset();
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            assert.strictEqual(models.AppOptions.get("playbackRate"), 100);
            QUnit.start();
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

    QUnit.asyncTest("models.TopicTree.init", function(assert) {

        // Helper method for validating a valid topic
        var assertValidTopic = (t) => {
            assert.ok(t.isTopic());
            assert.ok(!t.isVideoList());
            assert.ok(!t.isVideo());
            assert.ok(!t.isArticleList());
            assert.ok(!t.isArticle());
            assert.ok(!t.isExerciseList());
            assert.ok(!t.isExercise());
            assert.ok(!t.isContent());
            assert.ok(!t.isContentList());
            assert.strictEqual(t.getKind(), "Topic");
        };

        // Helper method for validating a validcontent item
        var assertValidContent = (c) => {
            assert.ok(!c.isTopic());
            assert.ok(!c.isVideoList());
            assert.ok(c.isVideo() ^ c.isArticle() ^ c.isExercise());
            assert.ok(!c.isArticleList());
            assert.ok(!c.isExerciseList());
            assert.ok(c.isContent());
            assert.ok(!c.isContentList());
            assert.ok(c.getParentDomain());
            assert.ok(!c.isRoot());
            assert.ok(!c.isRootChild());
            if (c.isVideo()) {
                assert.strictEqual(c.getKind(), "Video");
            } else if (c.isArticle()) {
                assert.strictEqual(c.getKind(), "Article");
            } else if (c.isExercise()) {
                assert.strictEqual(c.getKind(), "Exercise");
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

    QUnit.test("testLocalization", function(assert) {
        l10n.setAsyncLoading(false);
        l10n.setExactLangOnly(true);
        var enDict = l10n.getData();
        var otherLanguages = languages.slice(1);

        // Make sure each localization file has an associated string
        otherLanguages.forEach(function(lang) {
            l10n.setLanguage(lang);
            for (var s in enDict) {
                if (enDict.hasOwnProperty(s)) {

                    var translated = l10n.get(s);
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
