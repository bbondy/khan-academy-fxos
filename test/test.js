require(["react", "models", "apiclient"], function(React, models, APIClient) {

    QUnit.asyncTest( "APIClient.init", function(assert) {
        expect(2);
        APIClient.init().done(function() {
            // Consumer key and secret should be available after init
            assert.ok(APIClient.oauth.consumerKey);
            assert.ok(APIClient.oauth.consumerSecret);
            QUnit.start();
        });
    });
    QUnit.asyncTest( "models.TopicTree.init", function(assert) {
        expect(1);
        models.TopicTree.init().done(function() {
            assert.ok(models.TopicTree.root);
            QUnit.start();
        });
    });
    QUnit.asyncTest( "models.CurrentUser.init", function(assert) {
        expect(1);
        models.CurrentUser.init().done(function() {
            assert.ok(models.CurrentUser.initialized);
            QUnit.start();
        });
    });
});
