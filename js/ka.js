"use strict";

define(["oauth"], function() {

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
        init: function() {
            var d = $.Deferred();
            this._oauthCallback = window.location.href;
            if (window.location.protocol === 'app:') {
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
                        this.isLoggedIn = true;
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
            if (!this.oauth.token) {
                return d.reject().promise();
            }

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
                    alert("error: " + status);
                    alert(xhr);
                }
            }));
            return d.promise();
        },
        getUserVideos: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user/videos");
        },
        getUserInfo: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user");
        },
        API_BASE: "https://www.khanacademy.org/api",
        API_V1_BASE: "https://www.khanacademy.org/api/v1",
        //API_BASE: "http://192.168.1.131:8080/api",
        //API_V1_BASE: "http://192.168.1.131:8080/api/v1",
    };

    return KA;
});
