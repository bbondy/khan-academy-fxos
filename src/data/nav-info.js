import Immutable from "immutable";
import {getKey} from "./topic-tree-helper";

export const resetNavInfo = () => Immutable.fromJS({
    topicTreeNode: null,
    rootTopicTreeNode: null,
    lastTopicTreeNode: null,
    domainTopicTreeNode: null,
    navStack: null,
    isPaneShowing: false,
    showProfile: false,
    showDownloads: false,
    showSettings: false,
    wasLastDownloads: false,
});

export const getDomainTopicTreeNode = (navInfo, newTopicTreeNode) => {
    var domainTopicTreeNode = navInfo.get("domainTopicTreeNode");
    if (!domainTopicTreeNode) {
        domainTopicTreeNode = newTopicTreeNode;
    } else if (getKey(navInfo.get("rootTopicTreeNode")) === getKey(newTopicTreeNode)) {
        domainTopicTreeNode = null;
    }
    return domainTopicTreeNode;
};

export const isPaneShowing = (navInfo) => navInfo.get("showDownloads") ||
    navInfo.get("showProfile") || navInfo.get("showSettings");
