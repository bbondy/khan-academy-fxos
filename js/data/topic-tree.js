var _ = require("underscore"),
    Immutable = require("immutable"),
    Storage = require("../storage"),
    Minify = require("../minify"),
    Util = require("../util"),
    Cursor = require('immutable/contrib/cursor');

const getTopicTreeFilename = () => {
    var lang = Util.getLang();
    var path = "topictree";
    if (lang) {
        path += `-${lang}`;
    }
    return path + ".min.json";
};

const readTopicTree = () => {
    return new Promise((resolve, reject) => {
        // Check if we have a local downloaded copy of the topic tree
        Util.log("loading topic tree from storage: " + getTopicTreeFilename());
        var topicTreePromise = Storage.readText(getTopicTreeFilename());
        topicTreePromise.then((topicTree) => {
            Util.log("Loaded topic tree from local copy, parsing...");
            resolve(Immutable.fromJS(JSON.parse(topicTree)));
        });

        // If we don't have a local downloaded copy, load in the
        // one we shipped with for the instaled app.
        topicTreePromise.catch(() => {
            var filename = `/data/topic-tree`;
            var lang = Util.getLang();
            if (lang) {
                filename += "-" + lang;
            }
            filename += ".min.js";
            Util.log("going for pre-installed default file: %s", filename);
            Util.loadScript(filename).then(() => {
                Util.log("Topic tree script loaded, parsing...");
                resolve(Immutable.fromJS(window.topictree));
            }).catch(() => {
                reject();
            });
        });
    });
};

const genMapChildrenByKindFn = (kinds) => {
    return (topicCursor, mapFn) => {
        return topicCursor.get(Minify.getShortName("children")).filter((child) => {
            return _.includes(kinds, child.get(Minify.getShortName("kind")));
        }).map(mapFn);
    };
};

const mapChildTopicCursors = genMapChildrenByKindFn([Minify.getShortValue("kind", "Topic")]);
const mapChildContentCursors = genMapChildrenByKindFn([
    Minify.getShortValue("kind", "Video"),
    Minify.getShortValue("kind", "Article"),
    Minify.getShortValue("kind", "Exercise")]);

const getTitle = (tpoicTreeCursor) => {
    return tpoicTreeCursor.get(Minify.getShortName("translated_title")) ||
            tpoicTreeCursor.get(Minify.getShortName("translated_display_name"));

};

const getProgressKey = (topicTreeCursor) => {
    return topicTreeCursor.get(Minify.getShortName("progress_key"));
};

const getKind = (topicTreeCursor) => {
    return Minify.getLongValue("kind", topicTreeCursor.get(Minify.getShortName("kind")));
}

const isExercise = (topicTreeCursor) => {
    return getKind(topicTreeCursor) === "Exercise";
}

const getId = (topicTreeCursor) => {
    if (isExercise(topicTreeCursor)) {
        return getProgressKey(topicTreeCursor).substring(1);
    }
    return topicTreeCursor.get(Minify.getShortName("id"));
};

// todo: It's probably better to store this out of the topic tree
const getDownloadCount = (topicTreeCursor) => {
    return topicTreeCursor.get("downloadCount") === 0
};

const getSlug = (topicTreeCursor) => {
    return topicTreeCursor.get(Minify.getShortName("slug"));
};

const getKey = (topicTreeCursor) => {
    return getId(topicTreeCursor) || getSlug(topicTreeCursor) || getTitle(topicTreeCursor);
}


module.exports = {
    readTopicTree,
    getId,
    getTitle,
    getKey,
    getDownloadCount,
    mapChildTopicCursors,
    mapChildContentCursors,
};

