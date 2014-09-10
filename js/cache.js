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

define(["ka", "models"],
        function(KA, models) {

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
            models.CurrentUser.refreshLoggedInInfo();
        }
    }

    return Cache;

});

