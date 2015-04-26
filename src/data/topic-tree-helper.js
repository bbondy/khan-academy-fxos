const _ = require("underscore"),
    Immutable = require("immutable"),
    Minify = require("../minify");


/**
 * Obtains a property from a minified topic tree node
 */
const getMinifiedPropFromNode = (topicTreeNode, prop) =>
    topicTreeNode.get(Minify.getShortName(prop));

/**
 * Do something to {forEach: fn} child element
 * @param fn A string function like "map", "forEach", etc.
 * @param kinds An array of kinds to be filtered on
 * @param topicTreeNode The topic to filter on
 * @param callback The function that should be called for {forEach: fn} filtered child
 */
const fnChildrenByKind = (fn) => (kinds) => {
    return (topicTreeNode, callback) => {
        return getMinifiedPropFromNode(topicTreeNode, "children").filter((child) =>
            _.includes(kinds, getMinifiedPropFromNode(child, "kind"))
        )[fn](callback);
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

const getTitle = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "translated_title") ||
    getMinifiedPropFromNode(topicTreeNode, "translated_display_name");

const getProgressKey = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "progress_key");


const getKind = (topicTreeNode) =>
    Minify.getLongValue("kind", getMinifiedPropFromNode(topicTreeNode, "kind"));

const genIsKindFn = (kind) =>
    (topicTreeNode) =>
        getKind(topicTreeNode) === kind;

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
    return getMinifiedPropFromNode(topicTreeNode, "id");
};

// todo: It's probably better to store this out of the topic tree
const getDownloadCount = (topicTreeNode) =>
    topicTreeNode.get("downloadCount") === 0;

const getSlug = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "slug");

const getKey = (topicTreeNode) => {
    return getId(topicTreeNode) || getSlug(topicTreeNode) || getTitle(topicTreeNode);
};

const getKAUrl = (topicTreeNode) => {
    var value = getMinifiedPropFromNode(topicTreeNode,"ka_url");
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://www.khanacademy.org/video/" + value;
    }
    return value;
};

const isDownloaded = (topicTreeNode) =>
    !!topicTreeNode.get("downloaded");

const isStarted = (topicTreeNode) =>
    topicTreeNode.get("started");

const isCompleted = (topicTreeNode) =>
    topicTreeNode.get("completed");

const getYoutubeId = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "youtube_id");

const getDuration = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode,"duration");

const getPoints = (topicTreeNode) =>
    topicTreeNode.get("points") || 0;

const getContentMimeType = (topicTreeNode) =>
    isVideo(topicTreeNode) ? "video/mp4" : "text/html";

const getDownloadUrl = (topicTreeNode) => {
    var value = getMinifiedPropFromNode(topicTreeNode,"download_urls");
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
    }
    return value;
};

const getName = (topicTreeNode)  =>
    getMinifiedPropFromNode(topicTreeNode,"name");

const isPerseusExercise = (topicTreeNode) =>
    !getMinifiedPropFromNode(topicTreeNode,"file_name");

const isKhanExercisesExercise = (topicTreeNode) =>
    !!getMinifiedPropFromNode(topicTreeNode, "file_name");

const getFilename = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "file_name");

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
