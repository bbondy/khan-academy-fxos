require(["l10n", "jquery", "underscore", "react", "util", "models", "apiclient", "storage", "downloads", "cache", "minify", "notifications", "status"],
        function(l10n, $, _, React, Util, models, APIClient, Storage, Downloads, Cache, Minify, Notifications, Status) {

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
