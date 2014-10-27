"use strict";

define(["oauth", "storage", "util"], function(_oauth, Storage, Util) {
    /**
     * Client side library for the KA API
     */
    var APIClient = {
        oauth: {
            consumerKey: "",
            consumerSecret: "",
            token: Util.getParameterByName("oauth_token"),
            tokenSecret: Util.getParameterByName("oauth_token_secret"),
            oauthVerifier: Util.getParameterByName("oauth_verifier")
        },
        _localStorageAuthName: "oauth",
        _loadAuth: function() {
            var oauth = localStorage.getItem(this._localStorageAuthName);
            if (oauth) {
                this.oauth = JSON.parse(oauth);
            }
        },
        _saveAuth: function() {
            localStorage.setItem(this._localStorageAuthName, JSON.stringify(this.oauth));
        },
        _getSecrets: function() {
            // First check if we have the info from the local storage values
            // If so just resolve from that.
            if (this.oauth.consumerKey && this.oauth.consumerSecret) {
                console.log("resolving with local secrets info");
                return $.Deferred().resolve(this.oauth).promise();
            }

            // Otherwise request the info from the secrets.json file
            return $.ajax({
                url: "/secrets.json",
                timeout: 15000,
                dataType: "json",
            });
        },
        _getAccessToken: function() {
            var d = $.Deferred();
            $.oauth($.extend( {}, this.oauth, {
                type: "GET",
                url: this.API_BASE + "/auth/access_token",
                oauthCallback: this._oauthCallback,
                timeout: 15000,
                success: (data) => {
                    this.oauth.token = Util.getParameterByName("oauth_token", data);
                    this.oauth.tokenSecret = Util.getParameterByName("oauth_token_secret", data);
                    delete this.oauth.oauthVerifier;
                    d.resolve();
                },
                error: (xhr, status) => {
                    console.error(`error: ${status}: %o`, xhr);
                    d.reject();
                }
            }));
            return d.promise();
        },
        isSignedIn: function() {
            return !!(this.oauth.consumerKey &&
                this.oauth.consumerSecret &&
                this.oauth.token &&
                this.oauth.tokenSecret);
        },
        init: function() {
            // If a login is not in progress, then load the auth info
            var oauthVerifier = Util.getParameterByName("oauth_token");
            if (!oauthVerifier) {
                this._loadAuth();
            }
            var d = $.Deferred();
            this._oauthCallback = window.location.href.split("#")[0].split('?')[0];
            this.videosProgress = {};
            if (Util.isFirefoxOS()) {
                this._oauthCallback = "http://firefoxos.non-existent-domain-asdfg.com/authenticated.html";
            }

            this._getSecrets().done((keyData) => {
                this.oauth.consumerKey = keyData.consumerKey;
                this.oauth.consumerSecret = keyData.consumerSecret;

                // TODO: Only do access token stuff if we don't have local storage values
                if (this.oauth.oauthVerifier) {
                    this._getAccessToken().done(() => {
                        this._saveAuth();
                        d.resolve();
                    }).fail(() => {
                        // Even if we failed, we should resolve because this
                        // indicates we are initialized successfully, justnot
                        // signed in.
                        d.resolve();
                    });
                } else {
                    d.resolve();
                }
            }).fail(() => {
                // We should always be able to obtain secrets.json info!
                console.warn("Could not obtain secrets");
                d.reject();
            });
            return d.promise();
        },
        signIn: function() {
            // Start the oauth process by redirecting them to the request_token url
            var url = $.getURL($.extend( {}, this.oauth, {
                url: this.API_BASE + "/auth/request_token",
                oauthCallback: this._oauthCallback
            }));
            window.location = url;
        },
        signOut: function() {
            this.oauth.token = "";
            this.oauth.tokenSecret = "";
            this._saveAuth();
        },
        _basicAPICall: function(url, extraParams, method, dataType) {
            extraParams = extraParams || {};
            dataType = dataType || "json";
            if (_.isUndefined(method)) {
                method = "GET";
            }

            // Add a lang parameter to tell the KA API which langauge we want
            var lang = Util.getLang();
            if (lang) {
                extraParams["lang"] = lang;
            }

            for (var p in extraParams) {
                if (extraParams.hasOwnProperty(p)) {
                    url = Util.appendQueryParam(url, p, extraParams[p]);
                }
            }
            var d = $.Deferred();
            $.oauth($.extend( {}, this.oauth, {
                type: method,
                url: url,
                timeout: 15000,
                dataType,
                success: (data) => {
                    d.resolve(data);
                },
                error: function(xhr, status) {
                    console.error(`error: ${status}: %o`, xhr);
                    d.reject();
                }
            }));
            return d.promise();
        },
        getUserProgress: function() {
            var extraParams = {
                kind: "Video,Article"
            };
            return this._basicAPICall(this.API_V1_BASE + "/user/progress_summary", extraParams);
        },
        getUserInfo: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user");
        },
        getInstalledTopicTree: function(jsOnly) {
            var filename = `/data/topic-tree`;
            var lang = Util.getLang();
            if (lang) {
                filename += "-" + lang;
            }
            filename += jsOnly ? ".min.js" : ".min.json";
            console.log("Getting installed topic tree from: " + filename);
            return this._basicAPICall(filename, undefined, undefined, jsOnly ? "text" : "json");
        },
        getTopicTree: function() {
            return this._basicAPICall(this.API_V1_BASE + "/fxos/topictree");
        },
        getVideoTranscript: function(youTubeId) {
            return this._basicAPICall(this.API_V1_BASE + `/videos/${youTubeId}/transcript`);
        },
        getArticle: function(articleId) {
            return this._basicAPICall(this.API_V1_BASE + "/articles/" + articleId);
        },
        reportArticleRead: function(articleId) {
            return this._basicAPICall(this.API_V1_BASE + `/user/article/${articleId}/log`, undefined, "POST");
        },
        getUserVideos: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user/videos");
        },
        reportVideoProgress: function(videoId, youTubeId, duration, secondsWatched, lastSecondWatched) {
            var extraParams = {
                seconds_watched: secondsWatched.toString(),
                last_second_watched: lastSecondWatched.toString()
            };
            return this._basicAPICall(this.API_V1_BASE + `/user/videos/${youTubeId}/log`, extraParams, "POST");
        },
        API_BASE: "https://www.khanacademy.org/api",
        API_V1_BASE: "https://www.khanacademy.org/api/v1"
        //API_BASE: "http://192.168.1.131:8080/api",
        //API_V1_BASE: "http://192.168.1.131:8080/api/v1",
        //API_BASE: "http://stable.ka.local:8080/api",
        //API_V1_BASE: "http://stable.ka.local:8080/api/v1"
    };

    return APIClient;
});
