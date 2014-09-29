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
});
