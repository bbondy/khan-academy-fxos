const {isVideo, getId, getYoutubeId, isDownloaded} = require("../data/topic-tree-helper"),
    Immutable = require("immutable");

const loadTranscriptIfVideo = (options, editVideo) => (topicTreeNode) => {
    if (!isVideo(topicTreeNode)) {
        return topicTreeNode;
    }

    if (!options.get("showTranscripts")) {
        return topicTreeNode;
    }

    APIClient.getVideoTranscript(getYoutubeId(topicTreeNode)).then((transcript) => {
        if (transcript && transcript.length === 0) {
            return;
        }
        editVideo((video) => {
            return Immutable.fromJS({
                transcript,
            });
        });
    });
    return topicTreeNode;
};

const loadVideoIfDownloadedVideo = (editVideo) => (topicTreeNode) => {
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

module.exports = {
    loadTranscriptIfVideo,
    loadVideoIfDownloadedVideo,
};
