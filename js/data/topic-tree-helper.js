var _ = require("underscore"),
    Immutable = require("immutable"),
    Minify = require("../minify");

/**
 * Do something to {forEach: fn} child element
 * @param fn A string function like "map", "forEach", etc.
 * @param kinds An array of kinds to be filtered on
 * @param topicTreeCursor The topic to filter on
 * @param callback The function that should be called for {forEach: fn} filtered child
 */
const fnChildrenByKind = (fn) => (kinds) => {
    return (topicTreeCursor, callback) => {
        return topicTreeCursor.get(Minify.getShortName("children")).filter((child) => {
            return _.includes(kinds, child.get(Minify.getShortName("kind")));
        })[fn](callback);
    };
};

const mapChildrenByKind = fnChildrenByKind("map");
const eachChildrenByKind = fnChildrenByKind("forEach");

const topicKind = [Minify.getShortValue("kind", "Topic")];
const contentKinds = [Minify.getShortValue("kind", "Video"),
    Minify.getShortValue("kind", "Article"),
    Minify.getShortValue("kind", "Exercise")];

const eachChildTopicCursors = eachChildrenByKind(topicKind);
const mapChildTopicCursors = mapChildrenByKind(topicKind);
const eachChildContentCursors = eachChildrenByKind(contentKinds);
const mapChildContentCursors = mapChildrenByKind(contentKinds);

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
const isContentList = () => false;

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

const getKAUrl = (topicTreeCursor) => {
    var value = topicTreeCursor.get(Minify.getShortName("ka_url"));
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://www.khanacademy.org/video/" + value;
    }
    return value;
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

const getYoutubeId = (topicTreeCursor) => {
    return topicTreeCursor.get(Minify.getShortName("youtube_id"));
};

const getDuration = (topicTreeCursor) => {
    return topicTreeCursor.get(Minify.getShortName("duration"));
};

const getPoints = (topicTreeCursor) => {
    return topicTreeCursor.get("points") || 0;
};

const getContentMimeType = (topicTreeCursor) => {
     return isVideo(topicTreeCursor) ? "video/mp4" : "text/html";
};

const getDownloadUrl = (topicTreeCursor) => {
    var value = topicTreeCursor.get(Minify.getShortName("download_urls"));
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
    }
    return value;
};

const getName = (topicTreeCursor)  => {
    return topicTreeCursor.get(Minify.getShortName("name"));
};

const isPerseusExercise = (topicTreeCursor) => {
    return !topicTreeCursor.get(Minify.getShortName("file_name"));
};

const isKhanExercisesExercise = (topicTreeCursor) => {
    return !!topicTreeCursor.get(Minify.getShortName("file_name"));
};

const getFilename = (topicTreeCursor) => {
    return topicTreeCursor.get(Minify.getShortName("file_name"));
};

// TODO: remove all dependencies on this and remove this
const getParentDomain = (topicTreeCursor) => {
    return null;
};

/**
 * Initiates a recursive search for the term `search`
 */
const findContentItems = (topicTreeCursor, search, maxResults) => {
    if (_.isUndefined(maxResults)) {
        maxResults = 40;
    }

    var results = [];
    _findContentItems(topicTreeCursor, search.toLowerCase(), results, maxResults);
    return results.slice(0, maxResults);
};

/**
 * Recursively calls _findContentItems on all children and adds videos and articles with
 * a matching title to the results array.
 */
const _findContentItems = (topicTreeCursor, search, results, maxResults) => {
    if (results.length > maxResults) {
        return;
    }

    eachChildContentCursors(topicTreeCursor, (childCursor) => {
        // TODO: Possibly search descriptions too?
        // TODO: We could potentially index the transcripts for a really good search
        // TODO: Tokenize the `search` string and do an indexOf for each token
        // TODO: Allow for OR/AND search term strings
        if (getTitle(childCursor) &&
                getTitle(childCursor).toLowerCase().indexOf(search) !== -1) {
            results.push(childCursor);
        }
    });

    eachChildTopicCursors(topicTreeCursor, (childCursor) => {
        _findContentItems(childCursor, search, results, maxResults);
    });
};

module.exports = {
    getId,
    getTitle,
    getKey,
    getKAUrl,
    getDownloadCount,
    mapChildTopicCursors,
    eachChildTopicCursors,
    mapChildContentCursors,
    eachChildContentCursors,
    isContent,
    isContentList,
    isTopic,
    isArticle,
    isVideo,
    isExercise,
    isStarted,
    isCompleted,
    isDownloaded,
    getYoutubeId,
    getDuration,
    getPoints,
    getContentMimeType,
    getDownloadUrl,
    getName,
    isPerseusExercise,
    isKhanExercisesExercise,
    getFilename,
    getParentDomain,
    findContentItems,
};
