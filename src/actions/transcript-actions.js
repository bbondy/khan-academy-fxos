import {isVideo, getYoutubeId} from "../data/topic-tree-helper";
import Immutable from "immutable";
import APIClient from "../apiclient";

export const loadTranscriptIfVideo = (options, editVideo) => (topicTreeNode) => {
    if (!isVideo(topicTreeNode) || !options.get("showTranscripts")) {
        return topicTreeNode;
    }

    editVideo((video) =>
        Immutable.fromJS({
            transcript: null,
        }))

    APIClient.getVideoTranscript(getYoutubeId(topicTreeNode)).then((transcript) => {
        if (transcript && transcript.length === 0) {
            return;
        }
        editVideo((video) =>
            Immutable.fromJS({
                transcript,
            }));
    });
    return topicTreeNode;
};

