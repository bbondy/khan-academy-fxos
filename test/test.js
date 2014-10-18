require(["react", "models", "apiclient", "storage", "downloads", "cache"], function(React, models, APIClient, Storage, Downloads, Cache) {

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
        expect(4);
        models.TopicTree.init().done(function() {
            assert.ok(models.TopicTree.root);
            assert.ok(models.TopicTree.allContentItems.length > 0);
            // Topics are at root
            assert.ok(models.TopicTree.root.get("topics").models.length > 0);
            // But there are no content items at root
            assert.ok(models.TopicTree.root.get("contentItems").models.length === 0);
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
