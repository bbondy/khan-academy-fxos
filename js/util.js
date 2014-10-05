"use strict";

define([], function() {
    /**
     * Various utility functions
     */
    var Util = {
        /**
         * We don't need to list en here since that is the default
         */
        supportedLocales: ["boxes", "es", "fr", "pt"],
        /**
         * Returns the phone's locale or null for the default locale (en-US)
         */
        getLang: function() {
            if (!this.isFirefoxOS()) {
                return null;
            }

            // If we're testing via boxes, let that override the current setting
            if (window.translateToBoxes) {
                return "boxes";
            }

            var lang = document.webL10n.getLanguage().substring(0, 2);
            if (this.supportedLocales.indexOf(lang) === -1) {
                return null;
            }
            return lang;
        },
        quit: function() {
            window.close();
        },
        /**
         * Returns true when run within a gaia environment
         */
        isFirefoxOS: function() {
            return window.location.protocol === 'app:';
        },
        /**
         * Determines if the connection is metered (pay per use)
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
         */
        isBandwidthCapped: function() {
            var connection = navigator.connection || navigator.mozConnection;
            if (!connection) {
                return false;
            }
            return connection.bandwidth !== Infinity;
        },
        /**
         * Obtains a URL query parameter
         */
        getParameterByName: function(name, params) {
            if (_.isUndefined(params)) {
                params = window.location.search;
            }
            if (params.length && params[0] !== "?") {
                params = "?" + params;
            }
            var match = RegExp('[?&]' + name + '=([^&]*)').exec(params);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        },
        /**
         * Adds a query parameter to the specified url
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
         */
        partial: function( fn /*, args...*/) {
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
        BackboneMixin : {
          componentDidMount: function() {
            // Whenever there may be a change in the Backbone data, trigger a reconcile.
            this.getBackboneModels().forEach(function(model) {
              model.on('add change remove', this.forceUpdate.bind(this, null), this);
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

        LocalizationMixin: {
            componentDidMount: function() {
                window.document.webL10n.translate(this.getDOMNode());
            },
            componentDidUpdate: function() {
                window.document.webL10n.translate(this.getDOMNode());
            }
        }
    };

    return Util;
});
