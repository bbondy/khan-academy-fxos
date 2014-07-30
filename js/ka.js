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


    var oauth = {
        consumerKey: "",
        consumerSecret: "",
        token: getParameterByName("oauth_token"),
        tokenSecret: getParameterByName("oauth_token_secret"),
        oauthVerifier: getParameterByName("oauth_verifier")
    };


    var KA = {
        _getSecrets: function() {
            return $.ajax({
                url: "secrets.json",
                timeout: 5000,
                dataType: "json",
            });
        },
        _getAccessToken: function() {
            return $.oauth($.extend( {}, oauth, {
                type: "GET",
                url: "http://www.khanacademy.org/api/auth/access_token",
                oauthCallback: this._oauthCallback,
                timeout: 5000,
                success: function(data) {
                    oauth.token = getParameterByName("oauth_token", data);
                    oauth.tokenSecret = getParameterByName("oauth_token_secret", data);
                    oauth.oauthVerifier = undefined;
                },
                error: function(xhr, status) {
                    alert("error: " + status);
                    alert(xhr);
                }
            }));
        },
        init: function() {
            var d = $.Deferred();

            // TODO: Only fetch from secrets.json if we don't have local storage values
            var self = this;
            this._getSecrets().done(function(keyData) {
                oauth.consumerKey = keyData.key;
                oauth.consumerSecret = keyData.secret;
                console.log(oauth);

                // TODO: Only do access token stuff if we don't have local storage values
                if (oauth.oauthVerifier) {
                    console.log('doing access token fetch!');
                    self._getAccessToken().done(function() {
                        self.isLoggedIn = true;
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
            var url = $.getURL($.extend( {}, oauth, {
                url: "http://www.khanacademy.org/api/auth/request_token",
                oauthCallback: this._oauthCallback
            }));
            window.location = url;
        },
        getUserVideos: function() {
            var d = $.Deferred();
            if (!oauth.token) {
                return d.reject().promise();
            }

            $.oauth($.extend( {}, oauth, {
                type: "GET",
                url: "http://www.khanacademy.org/api/v1/user/videos",
                timeout: 10000,
                dataType: "json",
                success: function(data) {
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
        _oauthCallback: "http://localhost:8092"
    };

    return KA;
});
