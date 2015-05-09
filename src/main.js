/* @flow */

"strict";

import Util from "./util";
import APIClient from "./apiclient";
import Cache from "./cache";
import Downloads from "./downloads";
import Storage from "./storage";
import {MainView} from "./views/chrome";
import React from "react";
import {readOptions, resetOptions} from "./data/app-options";
import {readTopicTree} from "./data/topic-tree";
import {resetNavInfo} from "./data/nav-info";
import {editorForPath, Renderer} from "./renderer";
import Immutable from "immutable";
import {refreshLoggedInInfo} from "./user";

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
    user: {
        userInfo: {},
        startedEntityIds: [],
        completedEntityIds: [],
        userVideos: [],
        userExercises: [],
    },
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

    const editUser = editorForPath(renderer.edit, "user");
    refreshLoggedInInfo(renderer.state.get("user"), editUser);

}).catch((error) => {
    alert(error);
    if (Util.isFirefoxOS()) {
        Util.quit();
    } else {
        throw error;
    }
});
