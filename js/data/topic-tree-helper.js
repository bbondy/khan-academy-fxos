var _ = require("underscore"),
    Immutable = require("immutable"),
    Minify = require("../minify");

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

const genIsKindFn = (kind) => {
    return (topicTreeCursor) => {
        return getKind(topicTreeCursor) === kind;
    }
};

const isTopic = genIsKindFn("Topic");
const isVideo = genIsKindFn("Video");
const isArticle = genIsKindFn("Article");
const isExercise = genIsKindFn("Exercise");

const genCheckAnyFn = () => {
    var validators = _.toArray(arguments);
    return function(topicTreeCursor) {
        return _.any(validators, (validator) => {
            return validator(topicTreeCursor);
        });
    }
}

const isContent = genCheckAnyFn(isVideo,isArticle, isExercise);

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
};

const isDownloaded = (topicTreeCursor) => {
    return !!topicTreeCursor.get("downloaded");
};

const isStarted = (topicTreeCursor) => {
    return topicTreeCursor.get("started");
};

const isCompleted = (topicTreeCursor) => {
    return topicTreeCursor.get("completed");
};

module.exports = {
    getId,
    getTitle,
    getKey,
    getDownloadCount,
    mapChildTopicCursors,
    mapChildContentCursors,
    isContent,
    isTopic,
    isArticle,
    isVideo,
    isExercise,
    isStarted,
    isCompleted,
    isDownloaded,
};

