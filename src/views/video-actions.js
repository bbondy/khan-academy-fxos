const {isVideo, getKey, getYoutubeId} = require("../data/topic-tree-helper"),
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
        console.log("Setting video transcript to: " + transcript);
        editVideoTranscript((video) => {
            return Immutable.fromJS({
                transcript,
            });
        });
    });
    return topicTreeNode;
};

module.exports = {
    loadTranscriptIfVideo,
};
