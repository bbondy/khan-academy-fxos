import _ from "underscore";
import Immutable from "immutable";
import Minify from "../minify";

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

export const mapChildrenByKind = fnChildrenByKind("map");
export const eachChildrenByKind = fnChildrenByKind("forEach");

export const topicKind = [Minify.getShortValue("kind", "Topic")];
export const contentKinds = [Minify.getShortValue("kind", "Video"),
    Minify.getShortValue("kind", "Article"),
    Minify.getShortValue("kind", "Exercise")];

export const eachChildTopicNode = eachChildrenByKind(topicKind);
export const mapChildTopicNodes = mapChildrenByKind(topicKind);
export const eachChildContentNode = eachChildrenByKind(contentKinds);
export const mapChildContentNodes = mapChildrenByKind(contentKinds);

export const getTitle = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "translated_title") ||
    getMinifiedPropFromNode(topicTreeNode, "translated_display_name");

export const getProgressKey = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "progress_key");


export const getKind = (topicTreeNode) =>
    Minify.getLongValue("kind", getMinifiedPropFromNode(topicTreeNode, "kind"));

const genIsKindFn = (kind) =>
    (topicTreeNode) =>
        getKind(topicTreeNode) === kind;

export const isTopic = genIsKindFn("Topic");
export const isVideo = genIsKindFn("Video");
export const isArticle = genIsKindFn("Article");
export const isExercise = genIsKindFn("Exercise");

const genCheckAnyFn = (...validators) =>
    (topicTreeNode) =>
        _.any(validators, (validator) => validator(topicTreeNode));

export const isContent = genCheckAnyFn(isVideo, isArticle, isExercise);
export const isContentList = () => false;

export const getId = (topicTreeNode) => {
    if (isExercise(topicTreeNode)) {
        return getProgressKey(topicTreeNode).substring(1);
    }
    return getMinifiedPropFromNode(topicTreeNode, "id");
};

// todo: It's probably better to store this out of the topic tree
export const getDownloadCount = (topicTreeNode) =>
    topicTreeNode.get("downloadCount") === 0;

export const getSlug = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "slug");

export const getKey = (topicTreeNode) => {
    return getId(topicTreeNode) || getSlug(topicTreeNode) || getTitle(topicTreeNode);
};

export const getKAUrl = (topicTreeNode) => {
    var value = getMinifiedPropFromNode(topicTreeNode, "ka_url");
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://www.khanacademy.org/video/" + value;
    }
    return value;
};

export const isDownloaded = (topicTreeNode) =>
    !!topicTreeNode.get("downloaded");

export const isStarted = (topicTreeNode) =>
    topicTreeNode.get("started");

export const isCompleted = (topicTreeNode) =>
    topicTreeNode.get("completed");

export const getYoutubeId = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "youtube_id");

export const getDuration = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "duration");

export const getPoints = (topicTreeNode) =>
    topicTreeNode.get("points") || 0;

export const getContentMimeType = (topicTreeNode) =>
    isVideo(topicTreeNode) ? "video/mp4" : "text/html";

export const getDownloadUrl = (topicTreeNode) => {
    var value = getMinifiedPropFromNode(topicTreeNode, "download_urls");
    if (!value) {
        return null;
    }
    if (value.substring(0, 4) !== "http") {
        value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
    }
    return value;
};

export const getName = (topicTreeNode)  =>
    getMinifiedPropFromNode(topicTreeNode, "name");

export const isPerseusExercise = (topicTreeNode) =>
    !getMinifiedPropFromNode(topicTreeNode, "file_name");

export const isKhanExercisesExercise = (topicTreeNode) =>
    !!getMinifiedPropFromNode(topicTreeNode, "file_name");

export const getFilename = (topicTreeNode) =>
    getMinifiedPropFromNode(topicTreeNode, "file_name");

// TODO: remove all dependencies on this and remove this
export const getParentDomain = (topicTreeNode) => {
    return null;
};

/**
 * Initiates a recursive search for the term `search`
 */
export const findContentItems = (topicTreeNode, search, maxResults) => {
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
