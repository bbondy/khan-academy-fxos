"use strict";

define(["oauth", "storage"], function(_oauth, Storage) {

    // TODO: find a better home for this
    function getParameterByName(name, params) {
        if (_.isUndefined(params)) {
            params = window.location.search;
        }
        if (params.length && params[0] != "?") {
            params = "?" + params;
        }
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(params);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    var KA = {
        oauth: {
            consumerKey: "",
            consumerSecret: "",
            token: getParameterByName("oauth_token"),
            tokenSecret: getParameterByName("oauth_token_secret"),
            oauthVerifier: getParameterByName("oauth_verifier")
        },
        _load: function() {
            var oauth = localStorage.getItem("oauth");
            if (oauth) {
                this.oauth = JSON.parse(oauth);
            }
        },
        _save: function() {
            localStorage.setItem("oauth", JSON.stringify(this.oauth));
        },
        _getSecrets: function() {
            return $.ajax({
                url: "/secrets.json",
                timeout: 5000,
                dataType: "json",
            });
        },
        _getAccessToken: function() {
            return $.oauth($.extend( {}, this.oauth, {
                type: "GET",
                url: this.API_BASE + "/auth/access_token",
                oauthCallback: this._oauthCallback,
                timeout: 5000,
                success: (data) => {
                    this.oauth.token = getParameterByName("oauth_token", data);
                    this.oauth.tokenSecret = getParameterByName("oauth_token_secret", data);
                    this.oauth.oauthVerifier = undefined;
                },
                error: (xhr, status) => {
                    alert("error: " + status);
                    alert(xhr);
                }
            }));
        },
        isLoggedIn: function() {
            return this.oauth.consumerKey &&
                this.oauth.consumerSecret &&
                this.oauth.token &&
                this.oauth.tokenSecret;
        },
        isFirefoxOS: function() { // TODO: Find a better place for this
            return window.location.protocol === 'app:';
        },
        init: function() {
            this._load();
            var d = $.Deferred();
            this._oauthCallback = window.location.href;
            this.completedVideos = [];
            if (this.isFirefoxOS()) {
                this._oauthCallback = "http://firefoxos.non-existent-domain-asdfg.com/authenticated.html"
            }

            // TODO: Only fetch from secrets.json if we don't have local storage values
            this._getSecrets().done((keyData) => {
                this.oauth.consumerKey = keyData.key;
                this.oauth.consumerSecret = keyData.secret;
                console.log(this.oauth);

                // TODO: Only do access token stuff if we don't have local storage values
                if (this.oauth.oauthVerifier) {
                    console.log('doing access token fetch!');
                    this._getAccessToken().done(() => {
                        this._save();
                        d.resolve();
                    });
                } else {
                    d.resolve();
                }
            });
            return d.promise();
        },
        login: function() {
            // Start the oauth process by redirecting them to the request_token url
            var url = $.getURL($.extend( {}, this.oauth, {
                url: this.API_BASE + "/auth/request_token",
                oauthCallback: this._oauthCallback
            }));
            window.location = url;
        },
        _basicAPICall: function(url) {
            var d = $.Deferred();
            $.oauth($.extend( {}, this.oauth, {
                type: "GET",
                url: url,
                timeout: 10000,
                dataType: "json",
                success: (data) => {
                    d.resolve(data);
                },
                error: function( xhr, status ) {
                    d.reject();
                    console.error("error: " + status);
                    console.error(xhr);
                }
            }));
            return d.promise();
        },
        getUserVideos: function() {
            var storageName = "completedVideos";
            var d = $.Deferred();
            var cachedWatchedVideos = localStorage.getItem(storageName);
            if (cachedWatchedVideos) {
                this.completedVideos = JSON.parse(cachedWatchedVideos);
                return d.resolve(this.completedVideos).promise();
            }

            this._basicAPICall(this.API_V1_BASE + "/user/videos").done((data) => {
                this.completedVideos = [];
                data.forEach((item) => {
                    this.completedVideos.push(item.video.id);
                });
                localStorage.setItem(storageName, JSON.stringify(this.completedVideos));
                d.resolve(this.completedVideos);
            });
            return d.promise();
        },
        getUserInfo: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user");
        },
        getTopicTree: function() {
            if (!this.isFirefoxOS()) {
                return this._basicAPICall("/knowledge-map.json");
            }
            var d = $.Deferred();

            console.log(Storage);

            var filename = "topictree1.json";
            var topicTreePromise = Storage.readText(filename);
            topicTreePromise.done((data) => {
                console.log('got topictreedata from storage!!');
                d.resolve(JSON.parse(data));
            });
            topicTreePromise.fail(() => {
                console.log('topictree read failed! Do a fetch to get the data!');
                var promise = this._basicAPICall(this.API_V1_BASE + "/fxos/topictree");
                promise.done((data) => {
                    Storage.writeText(filename, JSON.stringify(data));
                    d.resolve(data);
                });
            });

            return d.promise();
        },
        getVideoTranscript: function(youTubeId) {
            return this._basicAPICall(this.API_V1_BASE + "/videos/" + youTubeId + "/transcript");
        },
        API_BASE: "https://www.khanacademy.org/api",
        API_V1_BASE: "https://www.khanacademy.org/api/v1",
        //API_BASE: "http://192.168.1.131:8080/api",
        //API_V1_BASE: "http://192.168.1.131:8080/api/v1",
    };

    return KA;
});
