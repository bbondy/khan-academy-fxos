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

define(["ka"],
        function(KA) {

    var Cache = {
        /**
         * Initializes the cache manager
         */
        init: function() {
            var ONE_HOUR = 1000 * 60 * 60;
            var d = $.Deferred();
            setInterval(this.heartbeat.bind(this), ONE_HOUR);
            this.heartbeat();
            return d.resolve().promise();
        },
        heartbeat: function() {
            console.log('heartbeat!');
            if (KA.APIClient.isSignedIn()) {
                console.log('user is logged in, getting usr videos and entity progress');
                // The call is needed so we get KA.APIClient.videoProgress
                // which tells us the duration of each watched item.
                KA.APIClient.getUserVideos();

                // The calli s needed so we get KA.APIClient.completedEntities
                // Which is used for completed/in progress tatus of content items
                KA.APIClient.getUserProgress().done(function(completedEntities, startedEntities) {
                       console.log("getUserProgress:");
                       console.log(completedEntities);
                       console.log(startedEntities);
                });
            } else {
                console.log('user is not logged in');
            }
        }
    }

    return Cache;

});

