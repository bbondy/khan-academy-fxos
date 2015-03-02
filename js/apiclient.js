/* @flow */

"use strict";

require("./oauth");
var $ = require("jquery"),
    _ = require("underscore"),
    Util = require("./util");

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
    _loadAuth: function(): void {
        var oauth = localStorage.getItem(this._localStorageAuthName);
        if (oauth) {
            this.oauth = JSON.parse(oauth);
        }
    },
    /**
     * Save oauth info to local storage
     */
    _saveAuth: function(): any {
        localStorage.setItem(this._localStorageAuthName, JSON.stringify(this.oauth));
    },
    /**
     * Obtains the locally stored secrets file.
     * TODO: We could just make the secrets file javascript and include the script!
     */
    _getSecrets: function(): any {
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
    _getAccessToken: function(): any {
        var d = $.Deferred();
        $.oauth($.extend({}, this.oauth, {
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
                Util.error(`error: ${status}: %o`, xhr);
                d.reject();
            }
        }));
        return d.promise();
    },
    /**
     * Determines based on the known oauth info, if the user is signed in.
     */
    isSignedIn: function(): boolean {
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
    init: function(): any {
        // If a login is not in progress, then load the auth info
        var oauthVerifier = Util.getParameterByName("oauth_token");
        if (!oauthVerifier) {
            this._loadAuth();
        }
        var d = $.Deferred();
        this._oauthCallback = window.location.href.split("#")[0].split("?")[0];
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
        var url = $.getURL($.extend({}, this.oauth, {
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
    _basicAPICall: function(url: string, extraParams: any, method:?string, dataType: ?string): any {
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
        $.oauth($.extend({}, this.oauth, {
            type: method,
            url: url,
            timeout: 120000,
            dataType,
            success: (data) => {
                d.resolve(data);
            },
            error: function(xhr, status) {
                Util.error(`error: ${status}: %o`, xhr);
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
    getUserProgress: function(): any {
        var extraParams = {
            kind: "Video,Article,Exercise"
        };
        return this._basicAPICall(this.API_V1_BASE + "/user/progress_summary", extraParams);
    },
    /**
     * Obtains basic user profile information.
     */
    getUserInfo: function(): any {
        return this._basicAPICall(this.API_V1_BASE + "/user");
    },
    /**
     * Obtains the installed local topic tree.
     *
     * @param jsOnly true if the installed file to load is pure JavaScript.
     * @return a promise with the topic tree
     */
    getInstalledTopicTree: function(jsOnly: boolean): any {
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
    getTopicTree: function(): any {
        return this._basicAPICall(this.API_V1_BASE + "/fxos/topictree");
    },
    /**
     * Obtains a transcript for a video.
     *
     * @param youTubeId The id of the youtube video to obtain the transcript for.
     * @return a promise with the transcript
     */
    getVideoTranscript: function(youTubeId: string): any {
        var url = this.API_V1_BASE + `/videos/${youTubeId}/transcript`;
        return this._basicAPICall(url);
    },
    /**
     * Obtains an article
     *
     * @param articleId The id of the article to obtain information on.
     * @return a promise with the status and other information
     */
    getArticle: function(articleId: string): any {
        return this._basicAPICall(this.API_V1_BASE + "/articles/" + articleId);
    },
    /**
     * Obtains an exercise
     *
     * @param exerciseName The name of the exercise to obtain information on.
     * @return a promise with the status and other information
     */
    getExerciseByName: function(exerciseName: string): any {
        var url = `${this.API_INTERNAL_BASE}/exercises/${exerciseName}`;
        return this._basicAPICall(url);
    },

    getTaskInfoByExerciseName: function(exerciseName: string): any {
        var url = `${this.API_INTERNAL_BASE}/user/tasks/exercises/${exerciseName}`;
        return this._basicAPICall(url);
    },

    /**
     * Obtains info on the user's missions
     *
     * @param exerciseName The name of the exercise to obtain task information for
     * @return a promise with the task
     */
    getMissions: function(exerciseName: string): any {
        var url = `${this.API_INTERNAL_BASE}/user/missions`;
        return this._basicAPICall(url);
    },
    /**
     * Obtains an exercise
     *
     * @param exerciseId The id of the exercise to obtain information on.
     * @return a promise with the status and other information
     */
    getAssessmentItem: function(assessmentId: string): any {
        return this._basicAPICall(this.API_V1_BASE + "/assessment_items/" + assessmentId);
    },
    /**
     * Marks an article as read.
     *
     * @param articleId The id of the article to mark as completed.
     * @return a promise with the status and other information
     */
    reportArticleRead: function(articleId: string): any {
        return this._basicAPICall(this.API_V1_BASE + `/user/article/${articleId}/log`, undefined, "POST");
    },
    /**
     * Obtains the last second watched for each video the user has watched
     * at least a part of.
     *
     * @return a promise with the results
     */
    getUserVideos: function(): any {
        return this._basicAPICall(this.API_V1_BASE + "/user/videos");
    },
    /**
     * Obtains more information on the user exercise
     * For example:
     *   - longest_streak: <num>
     *   - mastered: true|false
     *   - streak: <num>
     *   - total_done: <num>
     *   - total_correct: <num>
     */
    getUserExercises: function(): any {
        return this._basicAPICall(this.API_V1_BASE + "/user/exercises");
    },
    getUserExercise: function(exerciseName: string): any {
        var url = `${this.API_V1_BASE}/user/exercises/${exerciseName}`;
        return this._basicAPICall(url);
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
    reportVideoProgress: function(videoId: string,
                                  youTubeId: string,
                                  duration: string,
                                  secondsWatched: string,
                                  lastSecondWatched: string): any {
        var extraParams = {
            seconds_watched: secondsWatched.toString(),
            last_second_watched: lastSecondWatched.toString()
        };
        return this._basicAPICall(this.API_V1_BASE + `/user/videos/${youTubeId}/log`, extraParams, "POST");
    },

    reportExerciseProgress: function(exerciseName: string,
                                    problemNumber: string,
                                    assessmentSHA1: string,
                                    assessmentId: string,
                                    secondsTaken: number,
                                    hintsUsedCount: number,
                                    isCorrect: boolean,
                                    attemptNumber: number,
                                    problemType: string,
                                    taskId: string): any {
        var extraParams = {
            casing: "camel",
            sha1: assessmentSHA1,
            seed: assessmentId,
            count_hints: hintsUsedCount,
            complete: isCorrect ? 1 : 0,
            attempt_number: attemptNumber,
            card: "{}",
            attempt_content: [],
            problem_type: problemType,
            task_id: taskId,
            user_assessment_key: "",
            skipped: 0,
            opt_out: 0,
            time_taken: secondsTaken,
            user_mission_id: ""
        };
        return this._basicAPICall(this.API_INTERNAL_BASE + `/user/exercises/${exerciseName}/problems/${problemNumber}/attempt`, extraParams, "POST");
        /* Response:
        {
            "streak": 10,
            "snoozeTime": null,
            "masteryPoints": 3,
            "maximumExerciseProgressDt": "2014-03-26T16:16:17Z",
            "totalDone": 14,
            "lastCountHints": 0,
            "exerciseModel": {
                "translatedShortDisplayName": "Count to 10",
                "usesStreakSelection": false,
                "vPosition": -2,
                "relativeUrl": "/exercise/count-to-100",
                "fileName": null,
                "authorName": "Gail Hargrave",
                "creationDate": "2014-11-10T22:20:36Z",
                "usesAssessmentItems": true,
                "kaUrl": "https://www.khanacademy.org/exercise/count-to-100",
                "shortDisplayName": "Count to 10",
                "translatedTitle": "Count to 100",
                "authorKey": "123abc",
                "translatedDescriptionHtml": "Can you count to 100?",
                "id": "xa4413411",
                "isQuiz": false,
                "displayName": "Count to 100",
                "trackingDocumentUrl": "",
                "descriptionHtml": "Can you count to 100?",
                "doNotPublish": false,
                "tags": [],
                "progressKey": "exa4413411",
                "suggestedCompletionCriteria": "num_correct_in_a_row_5",
                "editSlug": "edit/e/xa4413411",
                "summative": false,
                "live": true,
                "translatedDescription":
                "Can you count to 100?",
                "prettyDisplayName": "Count to 100",
                "deletedModTime": null,
                "allAssessmentItems": [
                ...
        */
    },
    API_BASE: "https://www.khanacademy.org/api",
    API_V1_BASE: "https://www.khanacademy.org/api/v1",
    API_INTERNAL_BASE: "https://www.khanacademy.org/api/internal",
    //API_BASE: "http://stable.ka.local:8080/api",
    //API_V1_BASE: "http://stable.ka.local:8080/api/v1",
    //API_INTERNAL_BASE: "http://stable.ka.local:8080/api/internal",
};

module.exports = APIClient;
