"use strict";

// Can be used for both Node miodules and AMD
(function(global) {

    var Minify = {
        // Topic tree items with thees kinds will be ignored
        // Example value would be "Exercise".
        excludedKinds: [],

        // Topic tree items with these ids will be ignored
        // new and noteworthy "x29232c6b"
        excludedIds: ["x29232c6b"],

        // Map property names to a shorter version
        // [new prop name, old prop name]
        propertyNameMap: {
            readable_id: "a",
            id: "i",
            children: "c",
            date_added: "d",
            file_name: "f",
            sha: "h",
            ka_url: "k",
            name: "n",
            progress_key: "p",
            render_type: "r",
            slug: "s",
            translated_title: "t",
            download_urls: "u",
            keywords: "y",
            duration: "D",
            translated_description: "E",
            kind: "K",
            translated_display_name: "T",
            youtube_id: "Y"
        },

        // Map common property values to a shorter version
        // [element name, old prop value, new prop value]
        // We use numbers for the shorter values because storing the quotes
        // takes extra space.
        propertyValueMap: [
            ["kind", "Article", 0],
            ["kind", "Topic", 1],
            ["kind", "Video", 2],
            ["kind", "Exercise", 3]
        ],

        // Things specified in the endpoint that I may need eventually
        // but don't need now
        uneededProps: ["sha", "date_added", "readable_id", "slug", "render_type"],

        stripKnownUrls: function(node) {
            if (node.kind !== "Video") {
                return;
            }

            var urlPrefix = "http://www.khanacademy.org/video/";
            if (node.ka_url &&
                    node.ka_url.indexOf(urlPrefix) === 0) {
                node.ka_url = node.ka_url.substring(urlPrefix.length);
            }

            urlPrefix = "http://fastly.kastatic.org/KA-youtube-converted/";
            if (node.download_urls && node.download_urls.mp4 &&
                    node.download_urls.mp4.indexOf(urlPrefix) === 0) {
                node.download_urls.mp4 = node.download_urls.mp4.substring(urlPrefix.length);
                node.download_urls.mp4 = node.download_urls.mp4.substring(0,  node.download_urls.mp4.length - 4);
            }
        },

        removeUneededProps: function(node) {
            // We only use the id on domains and for content items
            if (node.kind !== "Video" && node.kind !== "Article" &&
                    node.render_type !== "Domain") {
                delete node.id;
            }
            for (var x in node) {
                if (node.hasOwnProperty(x)) {
                    this.uneededProps.forEach(function(uneededProp) {
                        if (x === uneededProp) {
                            delete node[x];
                        }
                    });
                }
            }
        },

        removeEmptyStringProperties: function(node) {
            for (var x in node) {
                if (!node[x] && typeof node[x] === "string") {
                    delete node[x];
                }
            }
        },

        translateNodePropertyValues: function(node) {
            this.propertyValueMap.forEach(function(map) {
                var name = map[0];
                var oldPropValue = map[1];
                var newPropValue = map[2];
                if (node[name] && node[name] === oldPropValue) {
                    node[name] = newPropValue;
                }
            });
        },

        clearUneededDownloadUrls: function(node) {
            var downloadUrl;
            if (node.download_urls) {
                for (var d in node.download_urls) {
                    if (d === "mp4") {
                        downloadUrl = node.download_urls[d];
                    }
                }
            }
            delete node.download_urls;
            if (downloadUrl) {
                node.download_urls = downloadUrl;
            }
        },

        translateNodePropertyNames: function(node) {
            for (var name in this.propertyNameMap) {
                if (this.propertyNameMap.hasOwnProperty(name)) {
                    var value = this.propertyNameMap[name];
                    if (typeof node[name] !== "undefined") {
                        node[value] = node[name];
                        delete node[name];
                    }
                }
            }
        },

        minify: function(node, logWarnings, logVideos) {
            var newChildren = [];
            if (node.children) {
                node.children.forEach(function(child) {
                    if (this.excludedKinds.indexOf(child.kind) === -1 &&
                            this.excludedIds.indexOf(child.id)) {
                        this.minify(child);
                        // Also remove empty nodes, do this after minification because since we filter out some
                        // types of content items, it might only be empty after minification.
                        if (child[this.getShortName("kind")] !== this.getShortValue("kind", "Topic")) {
                            if (logVideos) {
                                console.log(child[this.getShortName("youtube_id")] + ":\t" + child[this.getShortName("translated_title")]);
                            }

                            // Exclude video items that have no download url
                            if (child[this.getShortName("kind")] !== this.getShortValue("kind", "Video") ||
                                    child[this.getShortName("download_urls")]) {
                                newChildren.push(child);
                            } else if (child[this.getShortName("kind")] === this.getShortValue("kind", "Video")) {
                                if (logWarnings) {
                                    if (typeof console !== "undefined") {
                                        console.log("Warning: Excluding because of no vidoe URL: " +
                                            child[this.getShortName("id")] +
                                            ", " + child[this.getShortName("translated_title")]);
                                    }
                                }
                            }
                        } else if (child[this.getShortName("children")] && child[this.getShortName("children")].length > 0) {
                            newChildren.push(child);
                        }
                    }
                }.bind(this));
                node.children = newChildren;
                if (!node.children.length) {
                    delete node.children;
                }
            }
            this.stripKnownUrls(node);
            this.removeUneededProps(node);
            this.removeEmptyStringProperties(node);
            this.translateNodePropertyValues(node);
            this.clearUneededDownloadUrls(node);
            this.translateNodePropertyNames(node);
        },
        /**
         * Returns JS not JSON, which is about 100KB smaller
         * for the topic tree.
         */
        getOutput: function(node) {
            return "window.topictree =" +
                this._getOutput(node) + ";";
        },

        _getOutput: function(node) {
            var output = "{";

            for (var p in node) {
                if (p === "c") {
                    output += "c:[";
                    node.c.forEach(function(child) {
                        output += this._getOutput(child) + ",";
                    }.bind(this));
                    output = output.substring(0, output.length - 1);
                    output += "],";
                } else {
                    if (typeof node[p] !== "number" && node[p] !== null) {
                        output += p + ":\"" + node[p]
                            // Replace a slash with 2 slashes
                            .replace(/\\/g, "\\\\")
                            // Replace whitespace with a space
                            .replace(/\r\n/g, " ")
                            .replace(/\n/g, " ")
                            .replace(/\r/g, " ")
                            .replace(/\t/g, " ")
                            // Replace quotes with \"
                            .replace(/\"/g, "\\\"")  + "\",";
                    } else {
                        output += p + ":" + node[p] + ",";
                    }
                }
            }
            // Remove trailing comma
            output = output.substring(0, output.length - 1);
            output += "}";
            return output;
        },
        getShortName: function(name) {
            var value = this.propertyNameMap[name];
            if (typeof value === "undefined") {
                return name;
            }
            return value;
        },
        getShortValue: function(prop, value) {
            // propertyValueMap has entries like: ["kind", "Article", 0],
            var found = null;
            this.propertyValueMap.forEach(function(map) {
                if (map[0] === prop && map[1] === value) {
                    found = map[2];
                }
            });
            return found;
        },
        getLongValue: function(prop, value) {
            // propertyValueMap has entries like: ["kind", "Article", 0],
            var found = null;
            this.propertyValueMap.forEach(function(map) {
                if (map[0] === prop && map[2] === value) {
                    found = map[1];
                }
            });
            return found;
        }
    };

    global.Minify = Minify;
}(this));

