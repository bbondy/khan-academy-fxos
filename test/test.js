require(["react", "util", "models", "apiclient", "storage", "downloads", "cache", "minify"],
        function(React, Util, models, APIClient, Storage, Downloads, Cache, Minify) {

    QUnit.asyncTest("APIClient.init", function(assert) {
        expect(2);
        APIClient.init().done(function() {
            // Consumer key and secret should be available after init
            assert.ok(APIClient.oauth.consumerKey);
            assert.ok(APIClient.oauth.consumerSecret);
            QUnit.start();
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

        // Languages in which topic trees should be tested for
        var languages = ["en", "fr", "es", "pt"];

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
    QUnit.asyncTest("models.AppOptions.fetch", function(assert) {
        expect(1);
        models.AppOptions.fetch().done(function() {
            assert.ok(models.AppOptions.get("showDownloadsOnly") === false);
            QUnit.start();
        });
    });
    QUnit.asyncTest("Storage.init", function(assert) {
        expect(1);
        Storage.init().done(function() {
            assert.ok(true);
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
    QUnit.asyncTest("Cache.init", function(assert) {
        expect(1);
        Cache.init().done(function() {
            assert.ok(true);
            QUnit.start();
        });
    });

});
