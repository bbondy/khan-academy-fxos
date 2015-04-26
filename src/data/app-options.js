import Immutable from "immutable";

const appOptionsFilename = "appOptions.json";
export const readOptions = () => {
    try {
        return Immutable.fromJS(JSON.parse(localStorage[appOptionsFilename]));
    } catch (error) {
        return null;
    }
};

export const resetOptions = () => Immutable.fromJS({
    autoUpdateTopicTree: true,
    showDownloadsOnly: false,
    showTranscripts: true,
    playbackRate: 100,
    temp: Immutable.fromJS({}),
});

export const writeOptions = options => {
    localStorage[appOptionsFilename] = JSON.stringify(options.toJSON());
};
