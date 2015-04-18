/* @flow */

"strict";

const React = require("react"),
    Util = require("./util"),
    models = require("./models"),
    APIClient = require("./apiclient"),
    Cache = require("./cache"),
    Downloads = require("./downloads"),
    Storage = require("./storage"),
    chromeViews = require("./views/chrome"),
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


var MainView = chromeViews.MainView;
var mountNode = document.getElementById("app");

// Start showing the topic tree
var options = readOptions() || resetOptions();
var navInfo = resetNavInfo();



const initialState = Immutable.fromJS({
    options,
    navInfo,
    tempStore: {
        video: {},
        exercise: {},
    },
});

const renderer = new Renderer(MainView, mountNode, initialState);
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
