import {isVideo, getId, isDownloaded} from "../data/topic-tree-helper";
import Immutable from "immutable";

export const loadVideoIfDownloadedVideo = (editVideo) => (topicTreeNode) => {
    if (!isVideo(topicTreeNode)) {
        return topicTreeNode;
    }

    if (!isDownloaded(topicTreeNode)) {
        return topicTreeNode;
    }

    Storage.readAsBlob(getId(topicTreeNode)).then((result) => {
        var downloadedUrl = window.URL.createObjectURL(result);
        editVideo((video) => (video || Immutable.fromJS({})).merge({
            downloadedUrl,
            showOfflineImage: false,
        }));
    });

    return topicTreeNode;
};
