"use strict";

// Can be used for both Node miodules and AMD
(function(global) {

    var Minify = {
        // Topic tree items with thees kinds will be ignored
        excludedKinds: ["Exercise"],

        // Topic tree items with these ids will be ignored
        // new and noteworthy "x29232c6b"
        excludedIds: ["x29232c6b"],

        // Map property names to a shorter version
        // [new prop name, old prop name]
        propertyNameMap: {
            "readable_id": "a",
            "id": "i",
            "children": "c",
            "date_added": "d",
            "file_name": "f",
            "sha": "h",
            "ka_url": "k",
            "name": "n",
            "progress_key": "p",
            "render_type": "r",
            "slug": "s",
            "translated_title": "t",
            "download_urls": "u",
            "keywords": "y",
            "duration": "D",
            "translated_description": "E",
            "kind": "K",
            "translated_display_name": "T",
            "youtube_id": "Y"
        },

        // Map common property values to a shorter version
        // [element name, old prop value, new prop value]
        // We use numbers for the shorter values because storing the quotes
        // takes extra space.
        propertyValueMap: [
            ["kind", "Article", 0],
            ["kind", "Topic", 1],
            ["kind", "Video", 2]
        ],

        // Things specified in the endpoint that I may need eventually
        // but don't need now
        uneededProps: ["sha", "date_added", "readable_id", "slug", "render_type"],

        stripKnownUrls: function(node) {
            var urlPrefix = "http://www.khanacademy.org/video/";
            if (node.ka_url &&
                    node.ka_url.indexOf(urlPrefix) === 0) {
                node.ka_url = node.ka_url.substring(urlPrefix.length);
            }

            urlPrefix = "http://s3.amazonaws.com/KA-youtube-converted/";
            if (node.download_urls && node.download_urls.mp4) {
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
                this.uneededProps.forEach(function(uneededProp) {
                    if (x === uneededProp) {
                        delete node[x];
                    }
                });
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
                var value = this.propertyNameMap[name];
                if (typeof node[name] !== 'undefined') {
                    node[value] = node[name];
                    delete node[name];
                }
            }
        },

        minify: function(node) {
            var newChildren = [];
            if (node.children) {
                node.children.forEach(function(child) {
                    if (this.excludedKinds.indexOf(child.kind) === -1 &&
                            this.excludedIds.indexOf(child.id)) {
                        newChildren.push(child);
                        this.minify(child);
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
            var output = "{";

            for (var p in node) {
                if (p === 'c') {
                    output += "c:[";
                    node.c.forEach(function(child) {
                        output += this.getOutput(child) + ",";
                    }.bind(this));
                    output = output.substring(0, output.length - 1);
                    output += "],";
                } else {
                    if (typeof node[p] !== "number") {
                        output += p + ":\"" + node[p].replace(/\\/g, "\\\\").replace(/\"/g, "\\\"")  + "\",";
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
            if (_.isUndefined(value)) {
                return name;
            }
            return value;
        },
        getShortValue: function(prop, value) {
            var found = null;
            this.propertyValueMap.forEach(function(map) {
                if (map[0] === prop && map[1] === value) {
                    found = map[2];
                }
            });
            return found;
        }
    }

    global.Minify = Minify;
}(this));

