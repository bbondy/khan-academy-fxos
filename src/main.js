/* @flow */

"strict";

const React = require("react"),
    Util = require("./util"),
    models = require("./models"),
    APIClient = require("./apiclient"),
    Cache = require("./cache"),
    Downloads = require("./downloads"),
    Storage = require("./storage"),
    MainView = require("./views/chrome").MainView,
    {readOptions, resetOptions} = require("./data/app-options"),
    {readTopicTree} = require("./data/topic-tree"),
    {resetNavInfo} = require("./data/nav-info"),
    {Renderer} = require("./renderer"),
    Immutable = require("immutable");

// TODO: remove, just for easy inpsection
window.APIClient = APIClient;
window.Util = Util;
window.models = models;
window.React = React;

document.querySelector("body").addEventListener("contextmenu", function(e) {
    Util.log("contextmenu!");
    e.preventDefault();
});

// App is moving to background
document.addEventListener("visibilitychange", function(e) {
    if (document.hidden) {
        Util.log("visibility changing (hide)");
        // TODO(bbondy): Try to free up resources here for a smaller chance
        // of getting discarded.
    } else {
        Util.log("visibility changing (show)");
    }
});

const initialState = Immutable.fromJS({
    options: readOptions() || resetOptions(),
    navInfo: resetNavInfo(),
    tempStore: {
        video: {},
        exercise: {},
    },
});
const mountNode = document.getElementById("app");
const renderer = new Renderer(MainView, mountNode, initialState);
// Note that we don't wait for the topic tree since it can take
// relatively long on FxOS devices.
renderer.render();

readTopicTree().then((rootTopicTreeNode) =>
    renderer.edit((state) => state.mergeDeep({
        navInfo: {
            topicTreeNode: rootTopicTreeNode,
            rootTopicTreeNode,
            navStack: Immutable.Stack.of(rootTopicTreeNode),
        }}))
);

// Init everything
Storage.init().then(function() {
    return APIClient.init();
}).then(function() {
    return Promise.all([Downloads.init(), Cache.init()]);
}).then(function() {
    // We don't want to have to wait for results, so just start this and don't wait
    models.CurrentUser.init();
}).catch((error) => {
    alert(error);
    if (Util.isFirefoxOS()) {
        Util.quit();
    } else {
        throw error;
    }
});
