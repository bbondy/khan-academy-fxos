import _ from "underscore";
import Immutable from "immutable";
import {eachChildContentNode, eachChildTopicNode, getTitle, getId} from "../data/topic-tree-helper";

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
                getTitle(childNode).toLowerCase().indexOf(search) !== -1 ||
                getId(childNode).indexOf(search) !== -1) {
            results.push(childNode);
        }
    });

    eachChildTopicNode(topicTreeNode, (childNode) => {
        _findContentItems(childNode, search, results, maxResults);
    });
};

/**
 * Creates a function at the specified navInfo. This returned function
 * takes a search term and edits the navInfo data with the result.
 */
export const onTopicSearch = (navInfo, editNavInfo) => (topicSearch) => {
    if (!topicSearch) {
        editNavInfo((navInfo) => navInfo.merge({
            topicTreeNode: navInfo.get("searchingTopicTreeNode"),
            searchingTopicTreeNode: null,
            searchResults: null,
        }));
        return;
    }

    var searchingTopicTreeNode = navInfo.get("searchingTopicTreeNode");
    if (!searchingTopicTreeNode) {
        searchingTopicTreeNode = navInfo.get("topicTreeNode");
    }
    var results = findContentItems(searchingTopicTreeNode, topicSearch);
    editNavInfo((navInfo) => navInfo.merge({
        searchResults: results,
        searchingTopicTreeNode: searchingTopicTreeNode,
    }));
};


