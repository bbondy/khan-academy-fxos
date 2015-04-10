/* @flow */

"use strict";

const $ = require("jquery"),
    _ = require("underscore"),
    l10n = require("../l10n"),
    classNames = require("classnames"),
    Util = require("../util"),
    models = require("../models"),
    ChromeActions = require("./chrome-actions"),
    APIClient = require("../apiclient"),
    Storage = require("../storage"),
    Downloads = require("../downloads"),
    Notifications = require("../notifications"),
    Status = require("../status"),
    videoViews = require("./video"),
    articleViews = require("./article"),
    {loadIfArticle} = require("./article-actions"),
    exerciseViews = require("./exercise"),
    topicViews = require("./topic"),
    searchViews = require("./search"),
    paneViews = require("./pane"),
    Immutable = require("immutable"),
    component = require('omniscient'),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    { getDomainTopicTreeCursor, isPaneShowing } = require("../data/nav-info"),
    { TopicTreeNode } = require("../data/topic-tree");

const VideoViewer = videoViews.VideoViewer,
    ArticleViewer = articleViews.ArticleViewer,
    ExerciseViewer = exerciseViews.ExerciseViewer,
    TopicViewer = topicViews.TopicViewer,
    TopicSearch = searchViews.TopicSearch,
    SearchResultsViewer = searchViews.SearchResultsViewer,
    DownloadsViewer = paneViews.DownloadsViewer,
    SettingsViewer = paneViews.SettingsViewer,
    ProfileViewer = paneViews.ProfileViewer;

/**
 * Represents the back button which is found on the top left of the header
 * on all screens except when the Root topic is displayed.
 * In general, when clicked it will take the user to the last view they were
 * at before.
 */
const BackButton = component(({topicTreeCursor}, {onClickBack}) =>
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
const MenuButton = component(() =>
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
const AppHeader = component((props, {onClickBack}) => {
    var backButton;
    var topicTreeCursor = props.topicTreeCursor;
    if (topicTreeCursor &&
            (props.isPaneShowing ||
                TopicTreeHelper.isContent(topicTreeCursor) ||
                TopicTreeHelper.isTopic(topicTreeCursor) &&
            TopicTreeHelper.getKey(props.rootTopicTreeCursor) !== TopicTreeHelper.getKey(topicTreeCursor)) ||
            TopicTreeHelper.isContentList(topicTreeCursor)) {
        backButton = <BackButton statics={{
                                     onClickBack: onClickBack
                                 }}
                                 topicTreeCursor={topicTreeCursor}/>;
    }

    var styleObj = {
        fixed: true,
        "topic-header": topicTreeCursor &&
            TopicTreeHelper.getKey(topicTreeCursor) !== TopicTreeHelper.getKey(props.rootTopicTreeCursor) &&
            !props.isPaneShowing &&
            (TopicTreeHelper.isTopic(topicTreeCursor) || TopicTreeHelper.isContent(topicTreeCursor))
    };
    if (props.domainTopicTreeCursor && !props.isPaneShowing) {
        styleObj[TopicTreeHelper.getId(props.domainTopicTreeCursor)] = true;
    }
    var styleClass = classNames(styleObj);

    var title = "Khan Academy";
    if (props.isDownloadsShowing) {
        title = l10n.get("view-downloads");
    } else if (props.isProfileShowing) {
        title = l10n.get("view-profile");
    } else if (props.isSettingsShowing) {
        title = l10n.get("view-settings");
    } else if (topicTreeCursor && TopicTreeHelper.getTitle(topicTreeCursor)) {
        title = TopicTreeHelper.getTitle(topicTreeCursor);
    } else if (topicTreeCursor && TopicTreeHelper.isContentList(topicTreeCursor)) {
        title = l10n.get("search");
    }

    var menuButton;
    if (topicTreeCursor) {
        menuButton = <MenuButton/>;
    }

    return <header className={styleClass}>
            {backButton}
            {menuButton}
            <h1 className="header-title">{title}</h1>
        </header>;
}).jsx;

const StatusBarViewer = component((props, {onClickCancelDownloadContent}) => {
    if (!models.TempAppState.get("status")) {
        return <div/>;
    }
    var cancelButton;
    if (Downloads.canCancelDownload()) {
        cancelButton = <a className="status-button" href="#" onClick={onClickCancelDownloadContent}>{String.fromCharCode(215)}</a>;
    }

    return <div className="status-bar">
        {models.TempAppState.get("status")}
        {cancelButton}
    </div>;
}).jsx;

/**
 * Represents the sidebar drawer.
 * The sidebar drawer comes up when you click on the menu from the top header.
 */
const Sidebar = component((props, statics) => {
    var items = [];

    ////////////////////
    // Context sensitive actions first
    if (Storage.isEnabled()) {
        if (!props.isPaneShowing &&
                props.topicTreeCursor && TopicTreeHelper.isContent(props.topicTreeCursor)) {
            if (isDownloaded(props.topicTreeCursor)) {
                var text = l10n.get(isVideo(props.topicTreeCursor) ? "delete-downloaded-video" : "delete-downloaded-article");
                items.push(<li key="delete-downloaded-video" className="hot-item">
                        <a href="#" onClick={statics.onClickDeleteDownloadedContent}>{{text}}</a>
                    </li>);
            } else {
                var text = l10n.get(isVideo(props.topicTreeCursor) ? "download-video" : "download-article");
                items.push(<li key="download-video" className="hot-item">
                        <a href="#" className={isVideo(props.topicTreeCursor) ? "download-video-link" : "download-article-link"} onClick={statics.onClickDownloadContent}>{{text}}</a>
                    </li>);
            }
        }
    }

    if (!props.isPaneShowing &&
            props.topicTreeCursor &&
            TopicTreeHelper.isContent(props.topicTreeCursor) &&
            TopicTreeHelper.getKAUrl(props.topicTreeCursor)) {
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
                    props.topicTreeCursor && TopicTreeHelper.isTopic(props.topicTreeCursor)) {
            items.push(<li key="download-topic" className="hot-item">
                    <a href="#" data-l10n-id="download-topic" onClick={statics.onClickDownloadContent}>Download Topic</a>
                </li>);
        }
    }

    ////////////////////
    // Followed by sign in
    if (!models.CurrentUser.isSignedIn()) {
        // If the user is not signed in, add that option first
        items.push(<li key="sign-in"><a data-l10n-id="sign-in" href="#" onClick={statics.onClickSignin}>Sign In</a></li>);
    }

    ////////////////////
    // Followed by view pane items
    if (models.CurrentUser.isSignedIn() && !props.isProfileShowing) {
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
    if (models.CurrentUser.isSignedIn()) {
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
const MainView = component(({topicTreeRootCursor, navInfoCursor, optionsCursor}) => {
    //mixins: [Util.LocalizationMixin],
    //mixins: [Util.BackboneMixin, Util.LocalizationMixin],
    //getBackboneModels: function(): Array<any> {
    //    return [new models.ContentList(models.TopicTree.allContentItems),
    //        models.AppOptions, models.TempAppState, models.CurrentUser];
    //},

    // Make sure scrollTop is at the top of the page
    // This is in case the search box scrolling doesn't get an onblur
    if (navInfoCursor.get("topicTreeCursor") && !TopicTreeHelper.isContentList(navInfoCursor.get("topicTreeCursor"))) {
        $("html, body").scrollTop(0);
    }

    var control;
    if (!navInfoCursor.get("topicTreeCursor")) {
        // Still loading topic tree
        control = <div className="app-loading"/>;
    } else if (navInfoCursor.get("showProfile")) {
        control = <ProfileViewer/>;
    } else if (navInfoCursor.get("showDownloads")) {
        control = <DownloadsViewer statics={{
                                       onClickContentItem: ChromeActions.onClickContentItemFromDownloads(navInfoCursor)
                                   }}
                                   optionsCursor={optionsCursor}/>;
    } else if (navInfoCursor.get("showSettings")) {
        control = <SettingsViewer optionsCursor={optionsCursor}/>;
    } else if (TopicTreeHelper.isTopic(navInfoCursor.get("topicTreeCursor"))) {
        var onClickContentItem = _.compose(
            ChromeActions.onClickContentItem(navInfoCursor),
            loadIfArticle(optionsCursor));
        control = <TopicViewer statics={{
                                   onClickTopic: ChromeActions.onClickTopic(navInfoCursor),
                                   onClickContentItem,
                               }}
                               topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                               domainTopicTreeCursor={navInfoCursor.get("domainTopicTreeCursor")}
                               optionsCursor={optionsCursor}/>;
    } else if (TopicTreeHelper.isContentList(navInfoCursor.get("topicTreeCursor"))) {
        control = <SearchResultsViewer collection={navInfoCursor.get("topicTreeCursor")}
                                       onClickContentItem={ChromeActions.onClickContentItem(navInfoCursor)}
                                       optionsCursor={optionsCursor}/>;
    } else if (TopicTreeHelper.isVideo(navInfoCursor.get("topicTreeCursor"))) {
        control = <VideoViewer topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                               domainTopicTreeCursor={navInfoCursor.get("domainTopicTreeCursor")}
                               optionsCursor={optionsCursor}/>;
    } else if (TopicTreeHelper.isArticle(navInfoCursor.get("topicTreeCursor"))) {
        control = <ArticleViewer  topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                                  optionsCursor={optionsCursor}/>;
    } else if (TopicTreeHelper.isExercise(navInfoCursor.get("topicTreeCursor"))) {
        control = <ExerciseViewer  topicTreeCursor={navInfoCursor.get("topicTreeCursor")}/>;
    } else {
        Util.error("Unrecognized content item!");
    }

    var topicSearch;
    if (!isPaneShowing(navInfoCursor) && navInfoCursor.get("topicTreeCursor") &&
            !TopicTreeHelper.isContent(navInfoCursor.get("topicTreeCursor"))) {
        topicSearch = <TopicSearch topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                                   optionsCursor={optionsCursor}
                                   statics={{
                                       onTopicSearch: ChromeActions.onTopicSearch(navInfoCursor),
                                   }}/>;
    }

    var sidebar;
    if (navInfoCursor.get("topicTreeCursor")) {
        sidebar = <Sidebar topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                           statics={{
                               onClickSignin: ChromeActions.onClickSignin,
                               onClickSignout: ChromeActions.onClickSignout,
                               onClickProfile: ChromeActions.onClickProfile(navInfoCursor),
                               onClickDownloads: ChromeActions.onClickDownloads(navInfoCursor),
                               onClickSettings: ChromeActions.onClickSettings(navInfoCursor),
                               onClickSupport: ChromeActions.onClickSupport,
                               onClickDownloadContent: ChromeActions.onClickDownloadContent(navInfoCursor.get("topicTreeCursor")),
                               onClickViewOnKA: ChromeActions.onClickViewOnKA(navInfoCursor.get("topicTreeCursor")),
                               onClickShare: ChromeActions.onClickShare(navInfoCursor.get("topicTreeCursor")),
                               onClickCancelDownloadContent: ChromeActions.onClickCancelDownloadContent,
                               onClickDeleteDownloadedContent: ChromeActions.onClickDeleteDownloadedContent(navInfoCursor.get("topicTreeCursor")),
                           }}
                           isPaneShowing={isPaneShowing(navInfoCursor)}
                           isDownloadsShowing={navInfoCursor.get("showDownloads")}
                           isProfileShowing={navInfoCursor.get("showProfile")}
                           isSettingsShowing={navInfoCursor.get("showSettings")} />;
    }

    return <section className="current" id="index" data-position="current">
        {sidebar}
        <section id="main-content" role="region" className="skin-dark">
            <AppHeader statics={{
                           onClickBack: ChromeActions.onClickBack(navInfoCursor, navInfoCursor.get("topicTreeCursor"))
                       }}
                       topicTreeCursor={navInfoCursor.get("topicTreeCursor")}
                       domainTopicTreeCursor={navInfoCursor.get("domainTopicTreeCursor")}
                       rootTopicTreeCursor={navInfoCursor.get("rootTopicTreeCursor")}
                       isPaneShowing={isPaneShowing(navInfoCursor)}
                       isDownloadsShowing={navInfoCursor.get("showDownloads")}
                       isProfileShowing={navInfoCursor.get("showProfile")}
                       isSettingsShowing={navInfoCursor.get("showSettings")}
                       />
            {topicSearch}
            {control}
            <StatusBarViewer
                statics={{
                    onClickCancelDownloadContent: ChromeActions.onClickCancelDownloadContent
                }}/>
        </section>
    </section>;
}).jsx;

module.exports = {
    BackButton,
    MenuButton,
    AppHeader,
    StatusBarViewer,
    Sidebar,
    MainView,
};
