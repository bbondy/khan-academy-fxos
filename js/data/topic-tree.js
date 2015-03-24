var _ = require("underscore"),
    Immutable = require("immutable"),
    Storage = require("../storage"),
    Util = require("../util");

const getTopicTreeFilename = () => {
    var lang = Util.getLang();
    var path = "topictree";
    if (lang) {
        path += `-${lang}`;
    }
    return path + ".min.json";
};

const readTopicTree = () => {
    return new Promise((resolve, reject) => {
        // Check if we have a local downloaded copy of the topic tree
        Util.log("loading topic tree from storage: " + getTopicTreeFilename());
        var topicTreePromise = Storage.readText(getTopicTreeFilename());
        topicTreePromise.then((topicTree) => {
            Util.log("Loaded topic tree from local copy, parsing...");
            resolve(Immutable.fromJS(JSON.parse(topicTree)));
        });

        // If we don't have a local downloaded copy, load in the
        // one we shipped with for the instaled app.
        topicTreePromise.catch(() => {
            var filename = `/data/topic-tree`;
            var lang = Util.getLang();
            if (lang) {
                filename += "-" + lang;
            }
            filename += ".min.js";
            Util.log("going for pre-installed default file: %s", filename);
            Util.loadScript(filename).then(() => {
                Util.log("Topic tree script loaded, parsing...");
                resolve(Immutable.fromJS(window.topictree));
            }).catch(() => {
                reject();
            });
        });
    });
};

module.exports = {
    readTopicTree,
};
