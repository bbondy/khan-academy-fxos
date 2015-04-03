const Immutable = require("immutable"),
    {getKey} = require("./topic-tree-helper");

const resetNavInfo = () => Immutable.fromJS({
    topicTreeCursor: null,
    rootTopicTreeCursor: null,
    lastTopicTreeCursor: null,
    domainTopicTreeCursor: null,
    navStack: null,
    isPaneShowing: false,
    showProfile: false,
    showDownloads: false,
    showSettings: false,
    wasLastDownloads: false,
});

const getDomainTopicTreeCursor = (navInfoCursor, newTopicTreeCursor) => {
    var domainTopicTreeCursor = navInfoCursor.get("domainTopicTreeCursor");
    if (!domainTopicTreeCursor) {
        domainTopicTreeCursor = newTopicTreeCursor;
    } else if (getKey(navInfoCursor.get("rootTopicTreeCursor")) === getKey(newTopicTreeCursor)) {
        domainTopicTreeCursor = null;
    }
    return domainTopicTreeCursor;
};

const isPaneShowing = (navInfoCursor) => navInfoCursor.get("showDownloads") ||
    navInfoCursor.get("showProfile") || navInfoCursor.get("showSettings");

module.exports = {
    resetNavInfo,
    getDomainTopicTreeCursor,
    isPaneShowing,
};
