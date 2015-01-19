"use strict";

define(["l10n", "jquery", "underscore"], function(l10n, $, _) {
    /**
     * Various utility functions
     */
    var Util = {
        /**
         * Wrapper around console.log
         */
        log: function() {
            if (typeof console !== "undefined") {
                console.log(Array.prototype.slice.call(arguments));
            }
        },
        /**
         * Wrapper around console.warn
         */
        warn: function() {
            if (typeof console !== "undefined") {
                console.warn(Array.prototype.slice.call(arguments));
            }
        },
        /**
         * Wrapper around console.error
         */
        error: function(rest) {
            if (typeof console !== "undefined") {
                console.error(Array.prototype.slice.call(arguments));
            }
        },
        /**
         * We don't need to list en here since that is the default
         */
        supportedLocales: ["boxes", "es", "fr", "pt", "tr", "bn"],
        /**
         * Obtains the phone's locale or null for the default locale (en-US)
         *
         * @return the locale
         */
        getLang: function() {
            if (!this.isFirefoxOS()) {
                return null;
            }

            // If we're testing via boxes, let that override the current setting
            if (window.translateToBoxes) {
                return "boxes";
            }

            var lang = l10n.getLanguage().substring(0, 2);
            if (this.supportedLocales.indexOf(lang) === -1) {
                return null;
            }
            return lang;
        },
        /**
         * Terminates the application.
         */
        quit: function() {
            window.close();
        },
        /**
         * Returns true when run within a gaia environment
         *
         * @return true if the bandwidth is metered.
         */
        isFirefoxOS: function() {
            return window.location.protocol === "app:";
        },
        /**
         * Determines if the connection is metered (pay per use)
         *
         * @return true if the bandwidth is metered.
         */
        isMeteredConnection: function() {
            var connection = navigator.connection || navigator.mozConnection;
            if (!connection) {
                return false;
            }
            return connection.metered;
        },
        /**
         * Determines if there's a cap on the bandwidth
         *
         * @return true if the bandwidth is capped.
         */
        isBandwidthCapped: function() {
            var connection = navigator.connection || navigator.mozConnection;
            if (!connection) {
                return false;
            }

            // 1.* emulators return this
            if (connection.bandwidth === Infinity) {
                return false;
            }

            // 2.* devices return this
            if (connection.type === "wifi" || connection.type === "none") {
                return false;
            }
            return true;
        },
        /**
         * Obtains a URL query parameter
         *
         * @param name The name of the parameter to obtain
         * @param params Optional, specifies the parameters to parse, if
         *   not specified, uses window.location.search.
         * @return The obtained parameter value
         */
        getParameterByName: function(name, params) {
            if (_.isUndefined(params)) {
                params = window.location.search;
            }
            if (params.length && params[0] !== "?") {
                params = "?" + params;
            }
            var match = RegExp("[?&]" + name + "=([^&]*)").exec(params);
            return match && decodeURIComponent(match[1].replace(/\+/g, " "));
        },
        /**
         * Adds a query parameter to the specified url
         *
         * @param url The URL to append to
         * @param name The naem of the parameter to append
         * @param value The value of the parameter to append
         * @return The built url
         *
         * TODO: Handle fragments
         */
        appendQueryParam: function(url, name, value) {
            if (url.indexOf("?") === -1) {
                url += "?";
            } else {
                url += "&";
            }
            return url + name + "=" + value;
        },
        /**
         * Formats a number with thousand separators
         * http://stackoverflow.com/a/2901298/3153
         */
        numberWithCommas: function(x) {
            if (_.isUndefined(x)) {
                return 0;
            }
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        /**
         * Binds a set of arguments to a function without modifying the bound `this`
         *
         * @return The same function with one of the specified parameters found.
         */
        partial: function(fn /*, args...*/) {
            var aps = Array.prototype.slice;
            var args = aps.call(arguments, 1);
            return function() {
                return fn.apply(this, args.concat(aps.call(arguments)));
            };
        },
        // An example generic Mixin that you can add to any component that should react
        // to changes in a Backbone component. The use cases we've identified thus far
        // are for Collections -- since they trigger a change event whenever any of
        // their constituent items are changed there's no need to reconcile for regular
        // models. One caveat: this relies on getBackboneModels() to always return the
        // same model instances throughout the lifecycle of the component. If you're
        // using this mixin correctly (it should be near the top of your component
        // hierarchy) this should not be an issue.
        // https://github.com/facebook/react/blob/1be9a9e/examples/todomvc-backbone/js/app.js#L148-L171
        BackboneMixin: {
            componentDidMount: function() {
                // Whenever there may be a change in the Backbone data, trigger a reconcile.
                this.getBackboneModels().forEach(function(model) {
                    model.on("add change remove", this.forceUpdate.bind(this, null), this);
                }, this);
            },

            componentWillUnmount: function() {
                // Ensure that we clean up any dangling references when the component is
                // destroyed.
                this.getBackboneModels().forEach(function(model) {
                    model.off(null, null, this);
                }, this);
            }
        },

        /**
         * Mixin to help with localization
         */
        LocalizationMixin: {
            componentDidMount: function() {
                l10n.translate(this.getDOMNode());
            },
            componentDidUpdate: function() {
                l10n.translate(this.getDOMNode());
            }
        },

        /**
         * Loads a script from the specified installed file path.
         * Note taht the filename specified must be installed on the device
         * and even if we changed the interface to execute code on the fly
         * it would not work. Eval is disabled for other scripts.
         *
         * @param filename The URL to load
         */
        loadScript: function(filename) {
            var d = $.Deferred();
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.src = filename;
            s.onload = () => {
                d.resolve();
            };
            s.onerror = (e) => {
                Util.log("on error: %o", e);
                d.reject();
            };
            document.getElementsByTagName("head")[0].appendChild(s);
            return d.promise();
        }
    };

    return Util;
});
