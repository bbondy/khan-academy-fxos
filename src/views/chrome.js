/* @flow */

"use strict";

import $ from "jquery";
import _ from "underscore";
import l10n from "../l10n";
import classNames from "classnames";
import Util from "../util";
import React from "react";
import {TempAppState, CurrentUser} from "../models";
import {onClickBack, onClickTopic, onClickContentItemFromDownloads, onClickContentItem,
    onClickSignin, onClickSignout, onClickProfile, onClickDownloads, onClickSettings,
    onClickSupport, onClickDownloadContent, onClickViewOnKA, onClickShare, onTopicSearch,
    onClickCancelDownloadContent, onClickDeleteDownloadedContent} from "./chrome-actions";
import Storage from "../storage";
import Downloads from "../downloads";
import {VideoViewer} from "./video";
import {ArticleViewer} from "./article";
import {loadIfArticle} from "./article-actions";
import {loadVideoIfDownloadedVideo} from "./video-actions";
import {loadTranscriptIfVideo} from "./transcript-actions";
import {editorForPath} from "../renderer";
import {ExerciseViewer} from "./exercise";
import {TopicViewer} from "./topic";
import {TopicSearch, SearchResultsViewer} from "./search";
import {DownloadsViewer, SettingsViewer, ProfileViewer} from "./pane";
import component from "omniscient";
import {isContent, isTopic, getKey, getTitle, isContentList, getId, isVideo,
    isDownloaded, getKAUrl, isArticle, isExercise} from "../data/topic-tree-helper";
import {isPaneShowing} from "../data/nav-info";

/**
 * Represents the back button which is found on the top left of the header
 * on all screens except when the Root topic is displayed.
 * In general, when clicked it will take the user to the last view they were
 * at before.
 */
export const BackButton = component((prop, {onClickBack}) =>
    <div>
        <a className="icon-back-link " href="javascript:void(0)" onClick={onClickBack}>
            <span className="icon icon-back">Back</span>
        </a>
    </div>
).jsx;

/**
 * Represents the menu button which is found on the top right of the header
 * on all screens.
 * When clicked it will expand a drawer with context sensitive options.
 */
export const MenuButton = component(() =>
    <div>
        <menu type="toolbar" className="icon-menu-link ">
            <a href="#main-content">
                <span className="icon icon-menu">Menu</span>
            </a>
        </menu>
    </div>
).jsx;

/**
 * Represents the app header, it contains the back button, the menu button,
 * and a title.
 */
export const AppHeader = component((props, {onClickBack}) => {
    var backButton;
    var topicTreeNode = props.topicTreeNode;
    if (topicTreeNode &&
            (props.isPaneShowing ||
                isContent(topicTreeNode) ||
                isTopic(topicTreeNode) &&
            getKey(props.rootTopicTreeNode) !== getKey(topicTreeNode)) ||
            isContentList(topicTreeNode) ||
            !!props.searchResults) {
        backButton = <BackButton statics={{
                                     onClickBack,
                                 }}
                                 topicTreeNode={topicTreeNode}/>;
    }

    const domainId = props.domainTopicTreeNode && getId(props.domainTopicTreeNode) || "unknown";
    const styleClass = classNames({
        fixed: true,
        "topic-header": topicTreeNode &&
            getKey(topicTreeNode) !== getKey(props.rootTopicTreeNode) &&
            !props.isPaneShowing &&
            (isTopic(topicTreeNode) || isContent(topicTreeNode)),
        [domainId]: !!props.domainTopicTreeNode && !props.isPaneShowing,
    });

    var title = "Khan Academy";
    if (props.isDownloadsShowing) {
        title = l10n.get("view-downloads");
    } else if (props.isProfileShowing) {
        title = l10n.get("view-profile");
    } else if (props.isSettingsShowing) {
        title = l10n.get("view-settings");
    } else if (topicTreeNode && getTitle(topicTreeNode)) {
        title = getTitle(topicTreeNode);
    } else if (topicTreeNode && isContentList(topicTreeNode)) {
        title = l10n.get("search");
    }

    var menuButton;
    if (topicTreeNode) {
        menuButton = <MenuButton/>;
    }

    return <header className={styleClass}>
            {backButton}
            {menuButton}
            <h1 className="header-title">{title}</h1>
        </header>;
}).jsx;

export const StatusBarViewer = component((props, {onClickCancelDownloadContent}) => {
    if (!TempAppState.get("status")) {
        return <div/>;
    }
    var cancelButton;
    if (Downloads.canCancelDownload()) {
        cancelButton = <a className="status-button" href="#" onClick={onClickCancelDownloadContent}>{String.fromCharCode(215)}</a>;
    }

    return <div className="status-bar">
        {TempAppState.get("status")}
        {cancelButton}
    </div>;
}).jsx;

/**
 * Represents the sidebar drawer.
 * The sidebar drawer comes up when you click on the menu from the top header.
 */
export const Sidebar = component((props, statics) => {
    var items = [];

    ////////////////////
    // Context sensitive actions first
    if (Storage.isEnabled()) {
        if (!props.isPaneShowing &&
                props.topicTreeNode && isContent(props.topicTreeNode)) {
            if (isDownloaded(props.topicTreeNode)) {
                var text = l10n.get(isVideo(props.topicTreeNode) ? "delete-downloaded-video" : "delete-downloaded-article");
                items.push(<li key="delete-downloaded-video" className="hot-item">
                        <a href="#" onClick={statics.onClickDeleteDownloadedContent}>{{text}}</a>
                    </li>);
            } else {
                var text = l10n.get(isVideo(props.topicTreeNode) ? "download-video" : "download-article");
                items.push(<li key="download-video" className="hot-item">
                        <a href="#" className={isVideo(props.topicTreeNode) ? "download-video-link" : "download-article-link"} onClick={statics.onClickDownloadContent}>{{text}}</a>
                    </li>);
            }
        }
    }

    if (!props.isPaneShowing &&
            props.topicTreeNode &&
            isContent(props.topicTreeNode) &&
            getKAUrl(props.topicTreeNode)) {
        var viewOnKAMessage = l10n.get("open-in-website");
        items.push(<li key="open-in-website"><a href="#" className="open-in-website-link" onClick={statics.onClickViewOnKA}>{{viewOnKAMessage}}</a></li>);

        if (window.MozActivity) {
            var shareMessage = l10n.get("share");
            items.push(<li key="share-link"><a href="#" className="share-link" onClick={statics.onClickShare}>{{shareMessage}}</a></li>);
        }
    }

    if (Storage.isEnabled()) {
        if (Downloads.canCancelDownload()) {
            items.push(<li key="cancel-downloading" className="hot-item">
                    <a href="#" data-l10n-id="cancel-downloading" onClick={statics.onClickCancelDownloadContent}>Cancel Downloading</a>
                </li>);
        } else if (!props.isPaneShowing &&
                    props.topicTreeNode && isTopic(props.topicTreeNode)) {
            items.push(<li key="download-topic" className="hot-item">
                    <a href="#" data-l10n-id="download-topic" onClick={statics.onClickDownloadContent}>Download Topic</a>
                </li>);
        }
    }

    ////////////////////
    // Followed by sign in
    if (!CurrentUser.isSignedIn()) {
        // If the user is not signed in, add that option first
        items.push(<li key="sign-in"><a data-l10n-id="sign-in" href="#" onClick={statics.onClickSignin}>Sign In</a></li>);
    }

    ////////////////////
    // Followed by view pane items
    if (CurrentUser.isSignedIn() && !props.isProfileShowing) {
        // User is signed in, add all the signed in options here
        items.push(<li key="view-profile"><a  data-l10n-id="view-profile" className="view-profile-link" href="#" onClick={statics.onClickProfile}>View Profile</a></li>);
    }
    if (!props.isSettingsShowing) {
        items.push(<li key="view-settings"><a data-l10n-id="view-settings" className="view-settings-link" href="#" onClick={statics.onClickSettings}>View Settings</a></li>);
    }
    if (!props.isDownloadsShowing && Storage.isEnabled()) {
        items.push(<li key="view-downloads"><a data-l10n-id="view-downloads" className="view-downloads-link" href="#" onClick={statics.onClickDownloads}>View Downloads</a></li>);
    }

    items.push(<li key="open-support"><a data-l10n-id="open-support" className="open-support-link" href="#" onClick={statics.onClickSupport}>Open support website</a></li>);

    // Add the signout button last
    if (CurrentUser.isSignedIn()) {
        items.push(<li key="sign-out"><a data-l10n-id="sign-out" href="#" onClick={statics.onClickSignout}>Sign Out</a></li>);
    }

    return <section className="sidebar" data-type="sidebar">
        <header>
            <menu type="toolbar">
                <a data-l10n-id="done" href="#">Done</a>
            </menu>
            <h1 data-l10n-id="options">Options</h1>
        </header>
        <nav>
            <ul>
                {items}
            </ul>
        </nav>
        </section>;
}).jsx;

/**
 * This is the main app container itself.
 * It implements most of the view based functionality for the rest of the views
 * which call back up to it. It is responsible for re-rendering the appropriate
 * things when certain page actions change.  No other part of the code is repsonsible
 * for the overall top level view (which is nice and clean ;)).
 */
export const MainView = component(({navInfo, options, tempStore}, {edit}) => {
    // Make sure scrollTop is at the top of the page
    // This is in case the search box scrolling doesn't get an onblur
    if (navInfo.get("topicTreeNode") && !isContentList(navInfo.get("topicTreeNode"))) {
        $("html, body").scrollTop(0);
    }

    const editNavInfo = editorForPath(edit, "navInfo");
    const editTempStore = editorForPath(edit, "tempStore");
    const editVideo = editorForPath(edit, ["tempStore", "video"]);
    const editExercise = editorForPath(edit, ["tempStore", "exercise"]);
    const editOptions = editorForPath(edit, "options");
    const editSearch = editorForPath(edit, ["tempStore", "search"]);

    const onClickContentItemComposed = _.compose(
        onClickContentItem(editNavInfo),
        loadTranscriptIfVideo(options, editVideo),
        loadVideoIfDownloadedVideo(editVideo),
        loadIfArticle(editTempStore));

    var control;
    if (!navInfo.get("topicTreeNode")) {
        // Still loading topic tree
        control = <div className="app-loading"/>;
    } else if (navInfo.get("showProfile")) {
        control = <ProfileViewer/>;
    } else if (navInfo.get("showDownloads")) {
        control = <DownloadsViewer statics={{
                                       onClickContentItem: onClickContentItemFromDownloads(editNavInfo)
                                   }}
                                   options={options}/>;
    } else if (navInfo.get("showSettings")) {
        control = <SettingsViewer options={options}
                                  statics={{
                                      editOptions,
                                  }}/>;
    } else if (navInfo.get("searchResults")) {
        control = <SearchResultsViewer collection={navInfo.get("searchResults")}
                                       options={options}
                                       statics={{
                                           onClickContentItem: onClickContentItemComposed,
                                       }}/>;
    } else if (isTopic(navInfo.get("topicTreeNode"))) {
        control = <TopicViewer statics={{
                                   onClickTopic: onClickTopic(editNavInfo),
                                   onClickContentItem: onClickContentItemComposed,
                               }}
                               topicTreeNode={navInfo.get("topicTreeNode")}
                               domainTopicTreeNode={navInfo.get("domainTopicTreeNode")}
                               options={options}/>;
    } else if (isVideo(navInfo.get("topicTreeNode"))) {
        control = <VideoViewer topicTreeNode={navInfo.get("topicTreeNode")}
                               domainTopicTreeNode={navInfo.get("domainTopicTreeNode")}
                               videoStore={tempStore.get("video")}
                               options={options}
                               statics={{
                                   editVideo,
                               }}/>;
    } else if (isArticle(navInfo.get("topicTreeNode"))) {
        control = <ArticleViewer  topicTreeNode={navInfo.get("topicTreeNode")}
                                  tempStore={tempStore}/>;
    } else if (isExercise(navInfo.get("topicTreeNode"))) {
        control = <ExerciseViewer  topicTreeNode={navInfo.get("topicTreeNode")}
                                   exerciseStore={tempStore.get("exercise")}
                                   statics={{
                                       editExercise,
                                   }}/>;
    } else {
        Util.error("Unrecognized content item!");
    }

    var topicSearch;
    if (!isPaneShowing(navInfo) && navInfo.get("topicTreeNode") &&
            !isContent(navInfo.get("topicTreeNode"))) {
        topicSearch = <TopicSearch topicTreeNode={navInfo.get("topicTreeNode")}
                                   searchValue={tempStore.get("search")}
                                   navInfo={navInfo}
                                   statics={{
                                       onTopicSearch: onTopicSearch(navInfo, editNavInfo),
                                       editSearch,
                                   }}/>;
    }

    var sidebar;
    if (navInfo.get("topicTreeNode")) {
        sidebar = <Sidebar topicTreeNode={navInfo.get("topicTreeNode")}
                           statics={{
                               onClickSignin: onClickSignin,
                               onClickSignout: onClickSignout,
                               onClickProfile: onClickProfile(editNavInfo),
                               onClickDownloads: onClickDownloads(editNavInfo),
                               onClickSettings: onClickSettings(editNavInfo),
                               onClickSupport: onClickSupport,
                               onClickDownloadContent: onClickDownloadContent(navInfo.get("topicTreeNode")),
                               onClickViewOnKA: onClickViewOnKA(navInfo.get("topicTreeNode")),
                               onClickShare: onClickShare(navInfo.get("topicTreeNode")),
                               onClickCancelDownloadContent: onClickCancelDownloadContent,
                               onClickDeleteDownloadedContent: onClickDeleteDownloadedContent(navInfo.get("topicTreeNode")),
                           }}
                           isPaneShowing={isPaneShowing(navInfo)}
                           isDownloadsShowing={navInfo.get("showDownloads")}
                           isProfileShowing={navInfo.get("showProfile")}
                           isSettingsShowing={navInfo.get("showSettings")} />;
    }

    return <section className="current" id="index" data-position="current">
        {sidebar}
        <section id="main-content" role="region" className="skin-dark">
            <AppHeader statics={{
                           onClickBack: onClickBack(navInfo.get("topicTreeNode"), navInfo, editNavInfo, editSearch)
                       }}
                       searchResults={navInfo.get("searchResults")}
                       topicTreeNode={navInfo.get("topicTreeNode")}
                       domainTopicTreeNode={navInfo.get("domainTopicTreeNode")}
                       rootTopicTreeNode={navInfo.get("rootTopicTreeNode")}
                       isPaneShowing={isPaneShowing(navInfo)}
                       isDownloadsShowing={navInfo.get("showDownloads")}
                       isProfileShowing={navInfo.get("showProfile")}
                       isSettingsShowing={navInfo.get("showSettings")}
                       />
            {topicSearch}
            {control}
            <StatusBarViewer
                statics={{
                    onClickCancelDownloadContent: onClickCancelDownloadContent
                }}/>
        </section>
    </section>;
}).jsx;
