"use strict";

// Can be used for both Node miodules and AMD
(function(global) {

    // Topic tree items with thees kinds will be ignored
    var excludedKinds = ["Exercise"];

    // Topic tree items with these ids will be ignored
    // new and noteworthy "x29232c6b"
    var excludedIds = ["x29232c6b"];

    // Map property names to a shorter version
    // [new prop name, old prop name]
    var propertyNameMap = {
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
    };

    // Map common property values to a shorter version
    // [element name, old prop value, new prop value]
    var propertyValueMap = [
        ["kind", "Article", "A"],
        ["kind", "Topic", "T"],
        ["kind", "Video", "V"]
    ];

    // Things specified in the endpoint that I may need eventually
    // but don't need now
    var uneededProps = ["sha", "date_added", "readable_id", "slug", "render_type"];

    function stripKnownUrls(node) {
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
    }

    function removeUneededProps(node) {
        // We only use the id on domains and for content items
        if (node.kind !== "Video" && node.kind !== "Article" &&
                node.render_type !== "Domain") {
            delete node.id;
        }
        for (var x in node) {
            uneededProps.forEach(function(uneededProp) {
                if (x === uneededProp) {
                    delete node[x];
                }
            });
        }
    }

    function removeEmptyStringProperties(node) {
        for (var x in node) {
            if (!node[x] && typeof node[x] === "string") {
                delete node[x];
            }
        }
    }

    function translateNodePropertyValues(node) {
        propertyValueMap.forEach(function(map) {
            var name = map[0];
            var oldPropValue = map[1];
            var newPropValue = map[2];
            if (node[name] && node[name] === oldPropValue) {
                node[name] = newPropValue;
            }
        });
    }

    function clearUneededDownloadUrls(node) {
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
    }

    function translateNodePropertyNames(node) {
        for (var name in propertyNameMap) {
            var value = propertyNameMap[name];
            if (typeof node[name] !== 'undefined') {
                node[value] = node[name];
                delete node[name];
            }
        }
    }

    var Minify = {
        minify: function(node) {
            var newChildren = [];
            if (node.children) {
                node.children.forEach(function(child) {
                    if (excludedKinds.indexOf(child.kind) === -1 &&
                            excludedIds.indexOf(child.id)) {
                        newChildren.push(child);
                        this.minify(child);
                    }
                }.bind(this));
                node.children = newChildren;
                if (!node.children.length) {
                    delete node.children;
                }
            }
            stripKnownUrls(node);
            removeUneededProps(node);
            removeEmptyStringProperties(node);
            translateNodePropertyValues(node);
            clearUneededDownloadUrls(node);
            translateNodePropertyNames(node);
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
                        output += this.getOutput(child);
                    }.bind(this));
                    output += "],";
                } else {
                    output += p + ":\"" + node[p] + "\",";
                }
            }
            // Remove trailing comma
            output = output.substring(0, output.length - 1);
            output += "}";
            return output;
        },
        getShortName: function(name) {
            var value = propertyNameMap[name];
            if (_.isUndefined(value)) {
                return name;
            }
            return value;
        }
    }

  global.Minify = Minify;
}(this));

