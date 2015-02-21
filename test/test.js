require(["l10n", "jquery", "underscore", "react", "util", "models", "apiclient", "storage", "downloads", "cache", "minify", "notifications", "status"],
        function(l10n, $, _, React, Util, models, APIClient, Storage, Downloads, Cache, Minify, Notifications, Status) {

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
