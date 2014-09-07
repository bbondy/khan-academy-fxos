"use strict";

define(["oauth", "storage"], function(_oauth, Storage) {

    var Util = {
        isFirefoxOS: function() {
            return window.location.protocol === 'app:';
        },
        getParameterByName: function(name, params) {
            if (_.isUndefined(params)) {
                params = window.location.search;
            }
            if (params.length && params[0] != "?") {
                params = "?" + params;
            }
            var match = RegExp('[?&]' + name + '=([^&]*)').exec(params);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        },
        appendQueryParam: function(url, name, value) {
            if (url.indexOf("?") == -1) {
                url += "?";
            } else {
                url += "&";
            }
            return url + name + "=" + value;
        },
        // http://stackoverflow.com/a/2901298/3153
        numberWithCommas: function(x) {
            if (_.isUndefined(x)) {
                return 0;
            }
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        partial: function( fn /*, args...*/) {
          var aps = Array.prototype.slice;
          var args = aps.call(arguments, 1);
          return function() {
              return fn.apply(this, args.concat(aps.call(arguments)));
          }
        }
    };

    var APIClient = {
        oauth: {
            consumerKey: "",
            consumerSecret: "",
            token: Util.getParameterByName("oauth_token"),
            tokenSecret: Util.getParameterByName("oauth_token_secret"),
            oauthVerifier: Util.getParameterByName("oauth_verifier")
        },
        _loadAuth: function() {
            var oauth = localStorage.getItem("oauth");
            if (oauth) {
                this.oauth = JSON.parse(oauth);
            }
        },
        _loadCompletedAndProgress: function() {
            this.completedEntities = localStorage.getItem("completed");
            if (this.completedEntities) {
                this.completedEntities = JSON.parse(this.completedEntities);
            }
            this.startedEntities = localStorage.getItem("progress");
            if (this.startedEntities) {
                this.startedEntities = JSON.parse(this.startedEntities);
            }
        },
        _saveAuth: function() {
            localStorage.setItem("oauth", JSON.stringify(this.oauth));
        },
        _saveCompletedAndProgress: function() {
            localStorage.setItem("completed", JSON.stringify(this.completedEntities));
            localStorage.setItem("progress", JSON.stringify(this.startedEntities));
        },
        _getSecrets: function() {
            return $.ajax({
                url: "/secrets.json",
                timeout: 15000,
                dataType: "json",
            });
        },
        _getAccessToken: function() {
            return $.oauth($.extend( {}, this.oauth, {
                type: "GET",
                url: this.API_BASE + "/auth/access_token",
                oauthCallback: this._oauthCallback,
                timeout: 15000,
                success: (data) => {
                    this.oauth.token = Util.getParameterByName("oauth_token", data);
                    this.oauth.tokenSecret = Util.getParameterByName("oauth_token_secret", data);
                    this.oauth.oauthVerifier = undefined;
                },
                error: (xhr, status) => {
                    alert("error: " + status);
                    console.log(xhr);
                }
            }));
        },
        isLoggedIn: function() {
            return this.oauth.consumerKey &&
                this.oauth.consumerSecret &&
                this.oauth.token &&
                this.oauth.tokenSecret;
        },
        init: function() {
            // If a login is not in progress, then load the auth info
            var oauthVerifier = Util.getParameterByName("oauth_token");
            if (!oauthVerifier) {
                this._loadAuth();
            }
            var d = $.Deferred();
            this._oauthCallback = window.location.href.split("#")[0].split('?')[0];
            this.completedEntities = [];
            this.startedEntities = [];
            this.videosProgress = {};
            if (Util.isFirefoxOS()) {
                this._oauthCallback = "http://firefoxos.non-existent-domain-asdfg.com/authenticated.html"
            }

            // TODO: Only fetch from secrets.json if we don't have local storage values
            this._getSecrets().done((keyData) => {
                this.oauth.consumerKey = keyData.key;
                this.oauth.consumerSecret = keyData.secret;

                // TODO: Only do access token stuff if we don't have local storage values
                if (this.oauth.oauthVerifier) {
                    this._getAccessToken().done(() => {
                        this._saveAuth();
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
        logout: function() {
            this.oauth.token = "";
            this.oauth.tokenSecret = "";
            this._saveAuth();
        },
        _basicAPICall: function(url, extraParams, method) {
            if (_.isUndefined(method)) {
                method = "GET";
            }
            if (extraParams) {
                for (var p in extraParams) {
                    url = Util.appendQueryParam(url, p, extraParams[p]);
                }
            }
            var d = $.Deferred();
            $.oauth($.extend( {}, this.oauth, {
                type: method,
                url: url,
                timeout: 15000,
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
        getUserProgress: function() {
            var d = $.Deferred();
            //this._loadCompletedAndProgress();
            if (this.completedEntities.length || this.startedEntities.length) {
                console.log('no back!');
                return d.resolve(this.completedEntities, this.startedEntities).promise();
            }

            var extraParams = {
                kind: "Video,Article"
            };

            this._basicAPICall(this.API_V1_BASE + "/user/progress_summary", extraParams).done((data) => {
                console.log('user progress summary: ');
                console.log(data);
                this.completedEntities = data.complete;
                this.startedEntities = data.started;
                // Get rid of the 'a' and 'v' prefixes
                this.completedEntities = _.map(this.completedEntities, function(e) {
                    return e.substring(1);
                });
                this.startedEntities = _.map(this.completedEntities, function(e) {
                    return e.substring(1);
                });
                this._saveCompletedAndProgress();
                d.resolve(this.completedEntities, this.startedEntities);
            });
            return d.promise();
        },
        getUserInfo: function() {
            return this._basicAPICall(this.API_V1_BASE + "/user");
        },
        getTopicTree: function() {
            if (!Util.isFirefoxOS()) {
                return this._basicAPICall("/knowledge-map.json");
            }
            var d = $.Deferred();

            var filename = "topictree1.json";
            var topicTreePromise = Storage.readText(filename);
            topicTreePromise.done((data) => {
                d.resolve(JSON.parse(data));
            });
            topicTreePromise.fail(() => {
                var promise = this._basicAPICall(this.API_V1_BASE + "/fxos/topictree");
                promise.done((data) => {
                    Storage.writeText(filename, JSON.stringify(data));
                    d.resolve(data);
                });
            });

            return d.promise();
        },
        getVideoTranscript: function(youTubeId) {
            return this._basicAPICall(this.API_V1_BASE + `/videos/${youTubeId}/transcript`);
        },
        getArticle: function(articleId) {
            return this._basicAPICall(this.API_V1_BASE + "/articles/" + articleId);
        },
        reportArticleRead: function(articleId) {
            var d = $.Deferred();
            var promise = this._basicAPICall(this.API_V1_BASE + `/user/article/${articleId}/log`, undefined, "POST");
            promise.done((data) => {
                console.log('reported article complete!');
                console.log(data);
                d.resolve(data);
                this.completedEntities.push(articleId);
            });
            return d.promise();
        },
        getUserVideos: function() {
            var d = $.Deferred();
            var promise = this._basicAPICall(this.API_V1_BASE + "/user/videos");
            promise.done((results) => {
                _(results).each((result) => {
                    // If they've watched some part of the video, and it's not almost the end
                    if (result.last_second_watched > 10 &&
                            result.duration - result.last_second_watched > 10) {
                        this.videosProgress[result.video.id] = result.last_second_watched
                    }
                });
                console.log('videos progress:');
                console.log(this.videosProgress);
                d.resolve(results);
            });
            return d.promise();
        },
        reportVideoProgress: function(videoId, youTubeId, duration, secondsWatched, lastSecondWatched) {
            var extraParams = {
                seconds_watched: secondsWatched.toString(),
                last_second_watched: lastSecondWatched.toString()
            };
            var d = $.Deferred();

            var promise = this._basicAPICall(this.API_V1_BASE + `/user/videos/${youTubeId}/log`, extraParams, "POST");
            promise.done((result) => {
                console.log('result!');
                console.log(result);

                // If they've watched some part of the video, and it's not almost the end
                if (result.last_second_watched > 10 &&
                        duration - result.last_second_watched > 10) {
                    this.videosProgress[videoId] = result.last_second_watched
                // Otherwise check if we already have video progress for this item and we
                // therefore no longer need it.  Remove it to save memory.
                } else if(this.videosProgress[videoId]) {
                    delete this.videosProgress[videoId];
                }

                if (result.is_video_completed &&
                        this.completedEntities.indexOf(videoId) === -1) {
                    this.completedEntities.push(videoId);
                    // If it exists in the progress videos, remove it now
                    var index = this.startedEntities.indexOf(videoId);
                    if (index !== -1) {
                        this.startedEntities.splice(index, 1);
                    }
                    this._saveCompletedAndProgress();
                } else if (this.startedEntities.indexOf(videoId) === -1 &&
                        this.completedEntities.indexOf(videoId) === -1) {
                    this.startedEntities.push(videoId);
                    this._saveCompletedAndProgress();
                }
                d.resolve({
                    completed: result.is_video_completed,
                    lastSecondWatched: result.last_second_watched,
                    pointsEarned: result.points_earned,
                    youtubeId: result.youtube_id,
                    videoId: videoId,
                    id: result.id
                });
            });
            return d.promise();
        },
        API_BASE: "https://www.khanacademy.org/api",
        API_V1_BASE: "https://www.khanacademy.org/api/v1",
        //API_BASE: "http://192.168.1.131:8080/api",
        //API_V1_BASE: "http://192.168.1.131:8080/api/v1",
        //API_BASE: "http://stable.ka.local:8080/api",
        //API_V1_BASE: "http://stable.ka.local:8080/api/v1",
    };

    var KA = {
        Util: Util,
        APIClient: APIClient
    };

    return KA;
});
