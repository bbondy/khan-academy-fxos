/* @flow */

"use strict";

require("native-promise-only"); // For Jest!

import _ from "underscore";
import l10n from "./l10n";

/**
 * Mixin to help with localization
 */
const LocalizationMixin: any = {
    componentDidMount: function() {
        l10n.translate(this.getDOMNode());
    },
    componentDidUpdate: function() {
        l10n.translate(this.getDOMNode());
    }
};

/**
 * Various utility functions
 */
const Util = {
    /**
     * Wrapper around console.log
     */
    log: function(...args) {
        if (typeof console !== "undefined") {
            console.log(...args);
        }
    },
    /**
     * Wrapper around console.warn
     */
    warn: function(...args) {
        if (typeof console !== "undefined") {
            console.warn(...args);
        }
    },
    /**
     * Wrapper around console.error
     */
    error: function(...args) {
        if (typeof console !== "undefined") {
            console.error(...args);
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
    getLang: function(): ?string {
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
    isFirefoxOS: function(): boolean {
        return window.location.protocol === "app:";
    },
    /**
     * Determines if the connection is metered (pay per use)
     *
     * @return true if the bandwidth is metered.
     */
    isMeteredConnection: function(): boolean {
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
    isBandwidthCapped: function(): boolean {
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
     * @return The obtained parameter value or null if not found
     */
    getParameterByName: function(name: string, params: any): ?string {
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
    appendQueryParam: function(url: string, name: string, value: string): string {
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
    numberWithCommas: function(x: any): string {
        if (_.isUndefined(x)) {
            return "0";
        }
        return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    LocalizationMixin,

    /**
     * Loads a script from the specified installed file path.
     * Note taht the filename specified must be installed on the device
     * and even if we changed the interface to execute code on the fly
     * it would not work. Eval is disabled for other scripts.
     *
     * @param filename The URL to load
     */
    loadScript: function(filename: string): any {
        return new Promise((resolve, reject) => {
            var s: any = document.createElement("script");
            s.type = "text/javascript";
            s.src = filename;
            s.onload = () => {
                resolve();
            };
            s.onerror = (e) => {
                Util.log("on error: %o", e);
                reject();
            };
            document.getElementsByTagName("head")[0].appendChild(s);
        });
    }
};

export default Util;
