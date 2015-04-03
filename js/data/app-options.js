const Immutable = require("immutable");

const appOptionsFilename = "appOptions.json";
const readOptions = () => {
    try {
      return Immutable.fromJS(JSON.parse(localStorage[appOptionsFilename]));
    } catch(error) {
      return null;
    }
};

const resetOptions = () => Immutable.fromJS({
    autoUpdateTopicTree: true,
    showDownloadsOnly: false,
    showTranscripts: true,
    playbackRate: 100,
    temp: Immutable.fromJS({}),
});

const writeOptions = options => {
    options = options.toJSON();
    delete options.temp;
    localStorage[appOptionsFilename] = JSON.stringify(options);
};

module.exports = {
    readOptions,
    resetOptions,
    writeOptions,
};
