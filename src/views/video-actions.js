const {isVideo, getKey, getYoutubeId, isDownloaded} = require("../data/topic-tree-helper"),
    Immutable = require("immutable"),
    {editorForPath} = require("../renderer");

const loadTranscriptIfVideo = (options, editTempStore) => (topicTreeNode) => {
    if (!isVideo(topicTreeNode)) {
        return topicTreeNode;
    }

    if (!options.get("showTranscripts")) {
        return topicTreeNode;
    }

    const editVideoTranscript = editorForPath(editTempStore, "video");
    APIClient.getVideoTranscript(getYoutubeId(topicTreeNode)).then((transcript) => {
        if (transcript && transcript.length === 0) {
            return;
        }
        editVideoTranscript((video) => {
            return Immutable.fromJS({
                transcript,
            });
        });
    });
    return topicTreeNode;
};

const loadVideoIfDownloadedVideo = (editTempStore) => (topicTreeNode) => {
    if (!isVideo(topicTreeNode)) {
        return topicTreeNode;
    }

    if (!isDownloaded(topicTreeNode)) {
        return topicTreeNode;
    }

    Storage.readAsBlob(TopicTreeHelper.getId(topicTreeNode)).then((result) => {
        const editVideoTranscript = editorForPath(editTempStore, "video");
        var download_url = window.URL.createObjectURL(result);
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
