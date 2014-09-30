fs = require("fs")

// Topic tree items with thees kinds will be ignored
var excludedKinds = ["Exercise"];

// Topic tree items with these ids will be ignored
// new and noteworthy "x29232c6b"
var excludedIds = ["x29232c6b"];

// Map property names to a shorter version
// [new prop name, old prop name]
var propertyNameMap = [
    ["a", "readable_id"],
    ["i", "id"],
    ["c", "children"],
    ["d", "date_added"],
    ["f", "file_name"],
    ["h", "sha"],
    ["k", "ka_url"],
    ["n", "name"],
    ["p", "progress_key"],
    ["r", "render_type"],
    ["s", "slug"],
    ["t", "translated_title"],
    ["u", "download_urls"],
    ["y", "keywords"],
    ["D", "duration"],
    ["E", "translated_description"],
    ["K", "kind"],
    ["T", "translated_display_name"],
    ["Y", "youtube_id"],
];

// Map common property values to a shorter version
// [element name, old prop value, new prop value]
var propertyValueMap = [
    ["kind", "Article", "A"],
    ["kind", "Topic", "T"],
    ["kind", "Video", "V"]
];

// Things specified in the endpoint that I may need eventually
// but don't need now
var uneededProps = ["sha", "date_added", "readable_id", "slug"];

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
    propertyNameMap.forEach(function(map) {
        var name = map[0];
        var value = map[1];
        node[name] = node[value];
        delete node[value];
    });
}

function minify(node) {
    var newChildren = [];
    if (node.children) {
        node.children.forEach(function(child) {
            if (excludedKinds.indexOf(child.kind) === -1 &&
                    excludedIds.indexOf(child.id)) {
                newChildren.push(child);
                minify(child);
            }
        });
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
}

fs.readFile("data/topic-tree.json", "utf8", function (err,data) {
    var topicTree = JSON.parse(data);

    minify(topicTree);

    var outputData = JSON.stringify(topicTree);
    fs.writeFile("data/topic-tree.min.json", outputData);
});
