require(["react", "models", "ka"], function(React, models, KA) {

    QUnit.asyncTest( "KA.init", function(assert) {
        expect(2);
        KA.init().done(function() {
            // Consumer key and secret should be available after init
            assert.ok(KA.oauth.consumerKey);
            assert.ok(KA.oauth.consumerSecret);
            QUnit.start();
        });
    });
});
