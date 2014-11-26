"use strict";

/**
 * Responsible for keeping a cache of data from the server.
 * This includes:
 *   - Keeping the topic tree up to date
 *   - Keeping watched videos up to date
 *
 * Nothing in this module should be required to run.
 * init will not wait for the result.
 */

define(["util", "models"],
        function(Util, models) {

    var TEN_MINUTES = 1000 * 60 * 10;
    var Cache = {
        heartbeatInterval: TEN_MINUTES,

        /**
         * Initializes the cache manager
         */
        init: function() {
            var d = $.Deferred();

            this.lastUserInfoRefresh = localStorage.getItem(this.heartbeatUserInfoName);
            if (this.lastUserInfoRefresh) {
                this.lastUserInfoRefresh = Date.parse(this.lastUserInfoRefresh);
            }
            this.lastTopicTreeRefresh = localStorage.getItem(this.heartbeatTopicTreeName);
            if (this.lastTopicTreeRefresh ) {
                this.lastTopicTreeRefresh = Date.parse(this.lastTopicTreeRefresh);
            }

            this.timer = setInterval(this.heartbeat.bind(this), this.heartbeatInterval);
            return d.resolve().promise();
        },
        /**
         * Heartbeat called every heartbeatInterval
         * Nothing is performed on metered connections or with the bandwidth is capped.
         * The following actions are performed:
         *   - refreshing logged in info (at most every 12 hours)
         *   - refreshing the topic tree (at most once a week)
         */
        heartbeat: function() {
            if (Util.isMeteredConnection()) {
                Util.log('skipping heartbeat due to metered connection!');
                return;
            }

            if (Util.isBandwidthCapped()) {
                Util.log('skipping heartbeat due to capped bandwidth!');
                return;
            }

            var TWELVE_HOURS = 1000 * 60 * 60 * 12;
            if (this.lastUserInfoRefresh && new Date() - this.lastUserInfoRefresh < TWELVE_HOURS) {
                Util.log('heartbeat: no need to refresh user info yet!');
            } else {
                Util.log('heartbeat: Refreshing logged in info!');
                models.CurrentUser.refreshLoggedInInfo(true).done(() => {
                    this.lastUserInfoRefresh = new Date();
                    localStorage.setItem(this.heartbeatUserInfoName, this.lastUserInfoRefresh);
                });
            }

            var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
            if (this.lastTopicTreeRefresh && new Date() - this.lastTopicTreeRefresh < ONE_WEEK) {
                Util.log('heartbeat: no need to refresh topic tree yet!');
            } else {
                Util.log('heartbeat: Refreshing topic tree!');
                models.TopicTree.refreshTopicTreeInfo().done(() => {
                    this.lastTopicTreeRefresh = new Date();
                    localStorage.setItem(this.heartbeatTopicTreeName, this.lastTopicTreeRefresh);
                });
            }
        },
        heartbeatTopicTreeName: "heartbeat-topic-tree-1",
        heartbeatUserInfoName: "heartbeat-user-info-1"
    };

    return Cache;

});

