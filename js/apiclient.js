"use strict";

define(["oauth", "util"], function(_oauth, Util) {
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
        /**
         * Load oauth info from local storage.
         */
        _loadAuth: function() {
            var oauth = localStorage.getItem(this._localStorageAuthName);
            if (oauth) {
                this.oauth = JSON.parse(oauth);
            }
        },
        /**
         * Save oauth info to local storage
         */
        _saveAuth: function() {
            localStorage.setItem(this._localStorageAuthName, JSON.stringify(this.oauth));
        },
        /**
         * Obtains the locally stored secrets file.
         * TODO: We could just make the secrets file javascript and include the script!
         */
        _getSecrets: function() {
            // First check if we have the info from the local storage values
            // If so just resolve from that.
            if (this.oauth.consumerKey && this.oauth.consumerSecret) {
                Util.log("resolving with local secrets info");
                return $.Deferred().resolve(this.oauth).promise();
            }

            // Otherwise request the info from the secrets.json file
            return $.ajax({
                url: "/secrets.json",
                timeout: 15000,
                dataType: "json",
            });
        },
        /**
         * Obtains the access token using the request token and oauth verifier.
         */
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
        /**
         * Determines based on the known oauth info, if the user is signed in.
         */
        isSignedIn: function() {
            return !!(this.oauth.consumerKey &&
                this.oauth.consumerSecret &&
                this.oauth.token &&
                this.oauth.tokenSecret);
        },
        /**
         * Initializes APIClient by loading in the secrets file and any saved
         * auth information from local storage.
         *
         * @return a promise which resolves when the object is initialized.
         */
        init: function() {
            // If a login is not in progress, then load the auth info
            var oauthVerifier = Util.getParameterByName("oauth_token");
            if (!oauthVerifier) {
                this._loadAuth();
            }
            var d = $.Deferred();
            this._oauthCallback = window.location.href.split("#")[0].split('?')[0];
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
                Util.warn("Could not obtain secrets");
                d.reject();
            });
            return d.promise();
        },
        /**
         * Signs the user in by redirecting them.
         * Currently this function does NOT return, it redirects the page
         *
         * TODO: I think we can do this by appending an iframe instead of setting
         * the location directly.
         */
        signIn: function() {
            // Start the oauth process by redirecting them to the request_token url
            var url = $.getURL($.extend( {}, this.oauth, {
                url: this.API_BASE + "/auth/request_token",
                oauthCallback: this._oauthCallback
            }));
            window.location = url;
        },
        /**
         * Resets the oauth info and clears out oauth local storage.
         */
        signOut: function() {
            this.oauth.token = "";
            this.oauth.tokenSecret = "";
            this._saveAuth();
        },
        /**
         * Performs an oauth basic API call using the logged in oauth info
         *
         * @return a promise with the results of the API call
         */
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
        /**
         * Obtains the user progress summary. That is to say started and
         * completed information.
         *
         * @return a promise with the results
         */
        getUserProgress: function() {
            var extraParams = {
                kind: "Video,Article"
            };
            return this._basicAPICall(this.API_V1_BASE + "/user/progress_summary", extraParams);
        },
        /**
         * Obtains basic user profile information.
         */
        getUserInfo: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user");
        },
        /**
         * Obtains the installed local topic tree.
         *
         * @param jsOnly true if the installed file to load is pure JavaScript.
         * @return a promise with the topic tree
         */
        getInstalledTopicTree: function(jsOnly) {
            var filename = `/data/topic-tree`;
            var lang = Util.getLang();
            if (lang) {
                filename += "-" + lang;
            }
            filename += jsOnly ? ".min.js" : ".min.json";
            Util.log("Getting installed topic tree from: " + filename);
            return this._basicAPICall(filename, undefined, undefined, jsOnly ? "text" : "json");
        },
        /**
         * Obtains the topic tree from the server.
         *
         * @return a promise with the topic tree
         */
        getTopicTree: function() {
            return this._basicAPICall(this.API_V1_BASE + "/fxos/topictree");
        },
        /**
         * Obtains a transcript for a video.
         *
         * @param youTubeId The id of the youtube video to obtain the transcript for.
         * @return a promise with the transcript
         */
        getVideoTranscript: function(youTubeId) {
            return this._basicAPICall(this.API_V1_BASE + `/videos/${youTubeId}/transcript`);
        },
        /**
         * Obtains an article
         *
         * @param articleId The id of the article to obtain information on.
         * @return a promise with the status and other information
         */
        getArticle: function(articleId) {
            return this._basicAPICall(this.API_V1_BASE + "/articles/" + articleId);
        },
        /**
         * Marks an article as read.
         *
         * @param articleId The id of the article to mark as completed.
         * @return a promise with the status and other information
         */
        reportArticleRead: function(articleId) {
            return this._basicAPICall(this.API_V1_BASE + `/user/article/${articleId}/log`, undefined, "POST");
        },
        /**
         * Obtains the last second watched for each video the user has watched
         * at least a part of.
         *
         * @return a promise with the results
         */
        getUserVideos: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user/videos");
        },
        /**
         * Reports progress and completion on a video.
         *
         * @param videoId The ID of the video to report progress on
         * @param youTubeId The youtube ID of the video to report progress on
         * @param duration The duration of the video (TODO: unused)
         * @param secondswatched The number of seconds watched
         * @param lastSecondWatched The last second watched of the video (for resume support)
         * @return a promise with some extra information like the points earned.
         */
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
