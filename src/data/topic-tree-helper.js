const _ = require("underscore"),
    Immutable = require("immutable"),
    Minify = require("../minify");

/**
 * Do something to {forEach: fn} child element
 * @param fn A string function like "map", "forEach", etc.
 * @param kinds An array of kinds to be filtered on
 * @param topicTreeNode The topic to filter on
 * @param callback The function that should be called for {forEach: fn} filtered child
 */
const fnChildrenByKind = (fn) => (kinds) => {
    return (topicTreeNode, callback) => {
        return topicTreeNode.get(Minify.getShortName("children")).filter((child) => {
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

const eachChildTopicNode = eachChildrenByKind(topicKind);
const mapChildTopicNodes = mapChildrenByKind(topicKind);
const eachChildContentNode = eachChildrenByKind(contentKinds);
const mapChildContentNodes = mapChildrenByKind(contentKinds);

const getTitle = (tpoicTreeNode) => {
    return tpoicTreeNode.get(Minify.getShortName("translated_title")) ||
            tpoicTreeNode.get(Minify.getShortName("translated_display_name"));

};

const getProgressKey = (topicTreeNode) => {
    return topicTreeNode.get(Minify.getShortName("progress_key"));
};

const getKind = (topicTreeNode) => {
    return Minify.getLongValue("kind", topicTreeNode.get(Minify.getShortName("kind")));
};

const genIsKindFn = (kind) => {
    return (topicTreeNode) => {
        return getKind(topicTreeNode) === kind;
    };
};

const isTopic = genIsKindFn("Topic");
const isVideo = genIsKindFn("Video");
const isArticle = genIsKindFn("Article");
const isExercise = genIsKindFn("Exercise");

const genCheckAnyFn = () => {
    var validators = _.toArray(arguments);
    return function(topicTreeNode) {
        return _.any(validators, (validator) => {
            return validator(topicTreeNode);
        });
    };
};

const isContent = genCheckAnyFn(isVideo, isArticle, isExercise);
const isContentList = () => false;

const getId = (topicTreeNode) => {
    if (isExercise(topicTreeNode)) {
        return getProgressKey(topicTreeNode).substring(1);
    }
    return topicTreeNode.get(Minify.getShortName("id"));
};

// todo: It's probably better to store this out of the topic tree
const getDownloadCount = (topicTreeNode) =>
    topicTreeNode.get("downloadCount") === 0;

const getSlug = (topicTreeNode) => {
    return topicTreeNode.get(Minify.getShortName("slug"));
};

const getKey = (topicTreeNode) => {
    return getId(topicTreeNode) || getSlug(topicTreeNode) || getTitle(topicTreeNode);
};

const getKAUrl = (topicTreeNode) => {
    var value = topicTreeNode.get(Minify.getShortName("ka_url"));
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://www.khanacademy.org/video/" + value;
    }
    return value;
};

const isDownloaded = (topicTreeNode) => {
    return !!topicTreeNode.get("downloaded");
};

const isStarted = (topicTreeNode) => {
    return topicTreeNode.get("started");
};

const isCompleted = (topicTreeNode) => {
    return topicTreeNode.get("completed");
};

const getYoutubeId = (topicTreeNode) => {
    return topicTreeNode.get(Minify.getShortName("youtube_id"));
};

const getDuration = (topicTreeNode) => {
    return topicTreeNode.get(Minify.getShortName("duration"));
};

const getPoints = (topicTreeNode) => {
    return topicTreeNode.get("points") || 0;
};

const getContentMimeType = (topicTreeNode) => {
    return isVideo(topicTreeNode) ? "video/mp4" : "text/html";
};

const getDownloadUrl = (topicTreeNode) => {
    var value = topicTreeNode.get(Minify.getShortName("download_urls"));
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
    }
    return value;
};

const getName = (topicTreeNode)  => {
    return topicTreeNode.get(Minify.getShortName("name"));
};

const isPerseusExercise = (topicTreeNode) => {
    return !topicTreeNode.get(Minify.getShortName("file_name"));
};

const isKhanExercisesExercise = (topicTreeNode) => {
    return !!topicTreeNode.get(Minify.getShortName("file_name"));
};

const getFilename = (topicTreeNode) => {
    return topicTreeNode.get(Minify.getShortName("file_name"));
};

// TODO: remove all dependencies on this and remove this
const getParentDomain = (topicTreeNode) => {
    return null;
};

/**
 * Initiates a recursive search for the term `search`
 */
const findContentItems = (topicTreeNode, search, maxResults) => {
    if (_.isUndefined(maxResults)) {
        maxResults = 40;
    }

    var results = [];
    _findContentItems(topicTreeNode, search.toLowerCase(), results, maxResults);
    return Immutable.fromJS(results.slice(0, maxResults));
};

/**
 * Recursively calls _findContentItems on all children and adds videos and articles with
 * a matching title to the results array.
 */
const _findContentItems = (topicTreeNode, search, results, maxResults) => {
    if (results.length > maxResults) {
        return;
    }

    eachChildContentNode(topicTreeNode, (childNode) => {
        // TODO: Possibly search descriptions too?
        // TODO: We could potentially index the transcripts for a really good search
        // TODO: Tokenize the `search` string and do an indexOf for each token
        // TODO: Allow for OR/AND search term strings
        if (getTitle(childNode) &&
                getTitle(childNode).toLowerCase().indexOf(search) !== -1) {
            results.push(childNode);
        }
    });

    eachChildTopicNode(topicTreeNode, (childNode) => {
        _findContentItems(childNode, search, results, maxResults);
    });
};

module.exports = {
    getId,
    getTitle,
    getKey,
    getKAUrl,
    getDownloadCount,
    mapChildTopicNodes,
    eachChildTopicNode,
    mapChildContentNodes,
    eachChildContentNode,
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
