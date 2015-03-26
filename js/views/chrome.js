/* @flow */

"use strict";

var $ = require("jquery"),
    _ = require("underscore"),
    l10n = require("../l10n"),
    React = require("react"),
    classNames = require("classnames"),
    Util = require("../util"),
    models = require("../models"),
    APIClient = require("../apiclient"),
    Storage = require("../storage"),
    Downloads = require("../downloads"),
    Notifications = require("../notifications"),
    Status = require("../status"),
    videoViews = require("./video"),
    articleViews = require("./article"),
    exerciseViews = require("./exercise"),
    topicViews = require("./topic"),
    searchViews = require("./search"),
    paneViews = require("./pane"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    { TopicTreeNode } = require("../data/topic-tree");

var VideoViewer = videoViews.VideoViewer;
var ArticleViewer = articleViews.ArticleViewer;
var ExerciseViewer = exerciseViews.ExerciseViewer;
var TopicViewer = topicViews.TopicViewer;
var TopicSearch = searchViews.TopicSearch;
var SearchResultsViewer = searchViews.SearchResultsViewer;
var DownloadsViewer = paneViews.DownloadsViewer;
var SettingsViewer = paneViews.SettingsViewer;
var ProfileViewer = paneViews.ProfileViewer;


/**
 * Represents the back button which is found on the top left of the header
 * on all screens except when the Root topic is displayed.
 * In general, when clicked it will take the user to the last view they were
 * at before.
 */
class BackButton extends React.Component {
    render() : any {
        return <div>
            <a className="icon-back-link " href="javascript:void(0)" onClick={_.partial(this.props.onClickBack, this.props.topicTreeCursor)}>
                <span className="icon icon-back">Back</span>
            </a>
        </div>;
    }
}
BackButton.propTypes = {
    topicTreeCursor: React.PropTypes.object.isRequired,
    onClickBack: React.PropTypes.func.isRequired
};

/**
 * Represents the menu button which is found on the top right of the header
 * on all screens.
 * When clicked it will expand a drawer with context sensitive options.
 */
class MenuButton extends React.Component {
    render(): any {
        return <div>
            <menu type="toolbar" className="icon-menu-link ">
                <a href="#main-content">
                    <span className="icon icon-menu">Menu</span>
                </a>
            </menu>
        </div>;
    }
}

// todo
const isRoot = () => {
    return false;
};
const getParnetDomain = () => {
    return null;
}

/**
 * Represents the app header, it contains the back button, the menu button,
 * and a title.
 */
class AppHeader extends React.Component {
    render(): any {
        var backButton;
        var topicListCursor = this.props.topicListCursor;
        if (topicListCursor && (this.props.isPaneShowing ||
                isContent(topicListCursor) ||
                isTopic(topicListCursor) && !isRoot(contentListCursor) ||
                isContentList(topicListCursor))) {
            backButton = <BackButton topicListCursor={topicListCursor}
                                     onClickBack={this.props.onClickBack}/>;
        }

        var styleObj = {
            fixed: true,
            "topic-header": topicListCursor && !isRoot(topicListCursor) &&
                !this.props.isPaneShowing &&
                (isTopic(topicListCursor) || isContent(topicListCursor))
        };
        var parentDomain = topicListCursor && getParentDomain(topicListCursor);
        if (parentDomain && !this.props.isPaneShowing) {
            styleObj[parentDomain.getId()] = true;
        }
        var styleClass = classNames(styleObj);

        var title = "Khan Academy";
        if (this.props.isDownloadsShowing) {
            title = l10n.get("view-downloads");
        } else if (this.props.isProfileShowing) {
            title = l10n.get("view-profile");
        } else if (this.props.isSettingsShowing) {
            title = l10n.get("view-settings");
        } else if (topicListCursor && getTitle(topicListCursor)) {
            title = getTitle(topicListCursor);
        } else if (topicListCursor && isContentList(topicListCursor)) {
            title = l10n.get("search");
        }

        var menuButton;
        if (topicListCursor) {
            menuButton = <MenuButton/>;
        }

        return <header className={styleClass}>
                {backButton}
                {menuButton}
                <h1 className="header-title">{title}</h1>
            </header>;
    }
}
AppHeader.propTypes = {
    topicListCursor: React.PropTypes.object,
    isPaneShowing: React.PropTypes.bool.isRequired
};

class StatusBarViewer extends React.Component {
    render(): any {
        if (!models.TempAppState.get("status")) {
            return <div/>;
        }
        var cancelButton;
        if (Downloads.canCancelDownload()) {
            cancelButton = <a className="status-button" href="#" onClick={this.props.onClickCancelDownloadContent}>{String.fromCharCode(215)}</a>;
        }

        return <div className="status-bar">
            {models.TempAppState.get("status")}
            {cancelButton}
        </div>;
    }
}

/**
 * Represents the sidebar drawer.
 * The sidebar drawer comes up when you click on the menu from the top header.
 */
class Sidebar extends React.Component {
    render(): any {
        var items = [];

        ////////////////////
        // Context sensitive actions first
        if (Storage.isEnabled()) {
            if (!this.props.isPaneShowing &&
                    this.props.topicListCursor && isContent(this.props.topicListCursor)) {
                if (isDownloaded(this.props.topicListCursor)) {
                    var text = l10n.get(isVideo(this.props.topicListCursor) ? "delete-downloaded-video" : "delete-downloaded-article");
                    items.push(<li key="delete-downloaded-video" className="hot-item">
                            <a href="#" onClick={_.partial(this.props.onClickDeleteDownloadedContent, this.props.topicListCursor)}>{{text}}</a>
                        </li>);
                } else {
                    var text = l10n.get(isVideo(this.props.topicListCursor) ? "download-video" : "download-article");
                    items.push(<li key="download-video" className="hot-item">
                            <a href="#" className={isVideo(this.props.topicListCursor) ? "download-video-link" : "download-article-link"} onClick={_.partial(this.props.onClickDownloadContent, this.props.topicListCursor)}>{{text}}</a>
                        </li>);
                }
            }
        }

        if (!this.props.isPaneShowing &&
                this.props.topicListCursor &&
                isContent(this.props.topicListCursor) &&
                getKAUrl(this.props.topicListCursor)) {
            var viewOnKAMessage = l10n.get("open-in-website");
            items.push(<li key="open-in-website"><a href="#" className="open-in-website-link" onClick={_.partial(this.props.onClickViewOnKA, this.props.topicListCursor)}>{{viewOnKAMessage}}</a></li>);

            if (window.MozActivity) {
                var shareMessage = l10n.get("share");
                items.push(<li key="share-link"><a href="#" className="share-link" onClick={_.partial(this.props.onClickShare, this.props.topicListCursor)}>{{shareMessage}}</a></li>);
            }
        }

        if (Storage.isEnabled()) {
            if (Downloads.canCancelDownload()) {
                items.push(<li key="cancel-downloading" className="hot-item">
                        <a href="#" data-l10n-id="cancel-downloading" onClick={_.partial(this.props.onClickCancelDownloadContent, this.props.topicListCursor)}>Cancel Downloading</a>
                    </li>);
            } else if (!this.props.isPaneShowing &&
                        this.props.topicListCursor && isTopic(this.props.topicListCursor)) {
                items.push(<li key="download-topic" className="hot-item">
                        <a href="#" data-l10n-id="download-topic" onClick={_.partial(this.props.onClickDownloadContent, this.props.topicListCursor)}>Download Topic</a>
                    </li>);
            }
        }

        ////////////////////
        // Followed by sign in
        if (!models.CurrentUser.isSignedIn()) {
            // If the user is not signed in, add that option first
            items.push(<li key="sign-in"><a data-l10n-id="sign-in" href="#" onClick={this.props.onClickSignin}>Sign In</a></li>);
        }

        ////////////////////
        // Followed by view pane items
        if (models.CurrentUser.isSignedIn() && !this.props.isProfileShowing) {
            // User is signed in, add all the signed in options here
            items.push(<li key="view-profile"><a  data-l10n-id="view-profile" className="view-profile-link" href="#" onClick={this.props.onClickProfile}>View Profile</a></li>);
        }
        if (!this.props.isSettingsShowing) {
            items.push(<li key="view-settings"><a data-l10n-id="view-settings" className="view-settings-link" href="#" onClick={this.props.onClickSettings}>View Settings</a></li>);
        }
        if (!this.props.isDownloadsShowing && Storage.isEnabled()) {
            items.push(<li key="view-downloads"><a data-l10n-id="view-downloads" className="view-downloads-link" href="#" onClick={this.props.onClickDownloads}>View Downloads</a></li>);
        }

        items.push(<li key="open-support"><a data-l10n-id="open-support" className="open-support-link" href="#" onClick={this.props.onClickSupport}>Open support website</a></li>);

        // Add the signout button last
        if (models.CurrentUser.isSignedIn()) {
            items.push(<li key="sign-out"><a data-l10n-id="sign-out" href="#" onClick={this.props.onClickSignout}>Sign Out</a></li>);
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
    }
}
Sidebar.propTypes = {
    topicListCursor: React.PropTypes.object.isRequired,
    isPaneShowing: React.PropTypes.bool.isRequired,
    isSettingsShowing: React.PropTypes.bool.isRequired,
    isProfileShowing: React.PropTypes.bool.isRequired,
    isDownloadsShowing: React.PropTypes.bool.isRequired,
    onClickDeleteDownloadedContent: React.PropTypes.func.isRequired,
    onClickDownloadContent: React.PropTypes.func.isRequired,
    onClickViewOnKA: React.PropTypes.func.isRequired,
    onClickShare: React.PropTypes.func.isRequired,
    onClickSignin: React.PropTypes.func.isRequired,
    onClickCancelDownloadContent: React.PropTypes.func.isRequired,
    onClickProfile: React.PropTypes.func.isRequired,
    onClickSettings: React.PropTypes.func.isRequired,
    onClickDownloads: React.PropTypes.func.isRequired,
    onClickSupport: React.PropTypes.func.isRequired,
    onClickSignout: React.PropTypes.func.isRequired
};


// TODO
const isContentList = () => {
    return false;
};

/**
 * This is the main app container itself.
 * It implements most of the view based functionality for the rest of the views
 * which call back up to it. It is responsible for re-rendering the appropriate
 * things when certain page actions change.  No other part of the code is repsonsible
 * for the overall top level view (which is nice and clean ;)).
 */
var MainView = React.createClass({
    propTypes: {
        // Optional because it's not specified until the topic tree is loaded
        topicListCursor: React.PropTypes.object,
        cursorOptions: React.PropTypes.object.isRequired,
    },
    mixins: [Util.LocalizationMixin],
    //mixins: [Util.BackboneMixin, Util.LocalizationMixin],
    //getBackboneModels: function(): Array<any> {
    //    return [new models.ContentList(models.TopicTree.allContentItems),
    //        models.AppOptions, models.TempAppState, models.CurrentUser];
    //},
    getInitialState: function() {
        return {
            topicTreeCursor: this.props.topicTreeRootCursor,
            isPaneShowing: false,
            showProfile: false,
            showDownloads: false,
            showSettings: false,
            wasLastDownloads: false,
        };
    },
    onClickContentItemFromDownloads: function(topicTreeCursor: any) {
        // We need to keep track of the lastTopicTreeCursor here because
        // we're changing the topicTreeCursor, so going back from the
        // downloads pane would be impossible otherwise.
        this.setState({
            topicTreeCursor,
            showProfile: false,
            showDownloads: false,
            showSettings: false,
            wasLastDownloads: true,
            lastTopicTreeCursor: this.state.topicTreeCursor
        });
    },
    onClickContentItem: function(topicTreeCursor: any) {
        this.setState({
            topicTreeCursor,
            showProfile: false,
            showDownloads: false,
            showSettings: false
        });
    },
    onClickTopic: function(newTopicTreeCursor: any, parentDomainCursor: any) {
        this.setState({
            topicTreeCursor: newTopicTreeCursor,
            parentDomainCursor: parentDomainCursor,
            showProfile: false,
            showDownloads: false,
            showSettings: false,
            wasLastDownloads: false
        });
    },
    /**
     * Performs the action users expect when pressing the back button.
     * TODO: This works fine as is, but the logic can be simplified and
     * be less ugly by simply using a stack of current pane views.
     */
    onClickBack: function(topicListCursor: any) {
        // If we were on a content item from downloads,
        // then go back to downloads.
        if (this.state.wasLastDownloads) {
            this.onClickDownloads();
            return;
        }

        // If we have a last model set, then we're effectively
        // presisng back from the downloads screen itself.
        // The lastTopicTreeCursor is needed because the downloads pane is the
        // only pane where clicking on it can change the topicTreeCursor.
        if (this.state.lastTopicTreeCursor) {
            this.setState({
                topicTreeCursor: this.state.lastTopicTreeCursor,
                lastTopicTreeCursor: undefined,
                showDownloads: false,
                showProfile: false,
                showSettings: false,
                wasLastDownloads: false
            });
        }

        /**
         * If settings or profile or ... is set, then don't show it anymore.
         * This effectively makes the topicTreeCursor be in use again.
         */
        if (this.isPaneShowing()) {
            this.setState({
                showDownloads: false,
                showProfile: false,
                showSettings: false,
                wasLastDownloads: false
            });
            if (isContentList(this.state.topicTreeCursor)) {
                this.onTopicSearch("");
            }
            return;
        }

        if (isContentList(this.state.topicTreeCursor)) {
            return this.onTopicSearch("");
        }

        this.setState({
            topicTreeCursor: getParent(topicListCursor),
            showProfile: false,
            showDownloads: false,
            showSettings: false,
            wasLastDownloads: false
        });
    },
    onClickSignin: function() {
        APIClient.signIn();
        this.forceUpdate();
    },
    onClickSignout: function() {
        models.CurrentUser.signOut();
        this.forceUpdate();
    },
    onClickProfile: function() {
        this.setState({
            showProfile: true,
            showDownloads: false,
            showSettings: false,
            wasLastDownloads: false
        });
    },
    onClickDownloads: function() {
        this.setState({
            showDownloads: true,
            showProfile: false,
            showSettings: false,
            wasLastDownloads: false
        });
    },
    onClickSettings: function() {
        this.setState({
            showDownloads: false,
            showProfile: false,
            showSettings: true,
            wasLastDownloads: false
        });
    },
    _openUrl: function(url: string) {
        if (window.MozActivity) {
            new window.MozActivity({
                name: "view",
                data: {
                    type: "url",
                    url: url
                }
            });
        } else {
            window.open(url, "_blank");
        }

    },
    onClickSupport: function() {
        var url = "https://khanacademy.zendesk.com/hc/communities/public/topics/200155074-Mobile-Discussions";
        this._openUrl(url);
    },
    onClickViewOnKA: function(topicListCursor: any) {
        this._openUrl(getKAUrl(topicListCursor));
    },
    onClickShare: function(topicListCursor: any) {
        new window.MozActivity({
            name: "share",
            data: {
                type: "url",
                url: getKAUrl(topicListCursor)
            }
        });
    },
    onClickDownloadContent: function(topicListCursor: any) {
        var totalCount = 1;
        if (isTopic(topicListCursor)) {
            totalCount = getChildNotDownloadedCount(topicListCursor);
        }

        // Check for errors
        if (totalCount === 0) {
            alert(l10n.get("already-downloaded"));
            return;
        } else if (models.TempAppState.get("isDownloadingTopic")) {
            alert(l10n.get("already-downloading"));
            return;
        } else if (Util.isMeteredConnection()) {
            if (!confirm(l10n.get("metered-connection-warning"))) {
                return;
            }
        } else if (Util.isBandwidthCapped()) {
            if (!confirm(l10n.get("limited-bandwidth-warning"))) {
                return;
            }
        }

        // Format to string with commas
        var totalCountStr = Util.numberWithCommas(totalCount);

        // Prompt to download remaining
        if (isTopic(topicListCursor)) {
            if (!confirm(l10n.get("download-remaining", {
                        totalCount: totalCount,
                        totalCountStr: totalCountStr
                    }))) {
                return;
            }
        }

        var onProgress = (count, currentProgress, cancelling) => {
            if (cancelling) {
                Status.update(l10n.get("canceling-download"));
                return;
            }
            count = Util.numberWithCommas(count);
            var progressMessage = l10n.get("downloading-progress", {
                count: count,
                totalCount: totalCount,
                totalCountStr: totalCountStr,
                currentProgress: currentProgress
            });
            Status.update(progressMessage);
        };
        Status.start();
        var message;
        var title;
        Downloads.download(topicTreeCursor, onProgress).then((topicTreeCursor, count) => {
            var title = l10n.get("download-complete");
            var contentTitle = TopicTreeHelper.getTitle(topicTreeCursor);
            if (TopicTreeHelper.isContent(topicTreeCursor)) {
                if (TopicTreeHelper.isVideo(topicTreeCursor)) {
                    message = l10n.get("video-complete-body", {
                        title: contentTitle
                    });
                } else {
                    message = l10n.get("article-complete-body", {
                        title: contentTitle
                    });
                }
            } else {
                // TODO: We don't want commas here so we should change the source
                // strings for all locales for count and countStr
                // count = Util.numberWithCommas(count);
                message = l10n.get("content-items-downloaded-succesfully", {
                    count: count,
                    title: contentTitle
                });
            }
            Status.stop();
            Notifications.info(title, message, () => {});
        }).catch((isCancel) => {
            if (isCancel) {
                title = l10n.get("download-canceled");
                message = l10n.get("content-items-downloaded-cancel");
            } else {
                title = l10n.get("download-aborted");
                message = l10n.get("content-items-downloaded-failure");
            }
            Status.stop();
            Notifications.info(title, message, () => {});
        });
    },
    onClickCancelDownloadContent: function() {
        if (!confirm(l10n.get("cancel-download-warning"))) {
            return;
        }
        Downloads.cancelDownloading();
    },
    onClickDeleteDownloadedContent: function(video: any) {
        Downloads.deleteContent(video);
    },
    isPaneShowing: function(): boolean {
        return this.state.showDownloads ||
            this.state.showProfile ||
            this.state.showSettings;
    },
    onTopicSearch: function(topicSearch: string) {
        if (!topicSearch) {
            this.setState({topicTreeCursor: this.state.searchingTopicTreeCursor, searchingTopicTreeCursor: null});
            return;
        }
        var searchingTopicTreeCursor = this.state.searchingTopicTreeCursor;
        if (!searchingTopicTreeCursor) {
            searchingTopicTreeCursor = this.state.topicTreeCursor;
        }
        var results = searchingtopicTreeCursor.findContentItems(topicSearch);
        var contentList = new models.ContentList(results);
        this.setState({topicTreeCursor: contentList, searchingTopicTreeCursor: searchingTopicTreeCursor});
    },
    render: function(): any {
        // Make sure scrollTop is at the top of the page
        // This is in case the search box scrolling doesn't get an onblur
        if (this.state.topicTreeCursor && !isContentList(this.state.topicTreeCursor)) {
            $("html, body").scrollTop(0);
        }

        var control;
        if (!this.state.topicTreeCursor) {
            // Still loading topic tree
            control = <div className="app-loading"/>;
        } else if (this.state.showProfile) {
            control = <ProfileViewer/>;
        } else if (this.state.showDownloads) {
            control = <DownloadsViewer onClickContentItem={this.onClickContentItemFromDownloads.bind(this)}
                                       optionsCursor={this.props.optionsCursor}/>;
        } else if (this.state.showSettings) {
            control = <SettingsViewer optionsCursor={this.props.optionsCursor}/>;
        } else if (TopicTreeHelper.isTopic(this.state.topicTreeCursor)) {
            control = <TopicViewer topicCursor={this.state.topicTreeCursor}
                                   onClickTopic={this.onClickTopic.bind(this)}
                                   optionsCursor={this.props.optionsCursor}
                                   onClickContentItem={this.onClickContentItem.bind(this)}/>;
        } else if (isContentList(this.state.topicTreeCursor)) {
            control = <SearchResultsViewer collection={this.state.topicTreeCursor}
                                           onClickContentItem={this.onClickContentItem.bind(this)}
                                           optionsCursor={this.props.optionsCursor}/>;
        } else if (TopicTreeHelper.isVideo(this.state.topicTreeCursor)) {
            control = <VideoViewer video={this.state.topicTreeCursor}
                                   optionsCursor={this.props.optionsCursor}/>;
        } else if (TopicTreeHelper.isArticle(this.state.topicTreeCursor)) {
            control = <ArticleViewer  article={this.state.topicTreeCursor}/>;
        } else if (TopicTreeHelper.isExercise(this.state.topicTreeCursor)) {
            control = <ExerciseViewer  exercise={this.state.topicTreeCursor}/>;
        } else {
            Util.error("Unrecognized content item!");
        }

        var topicSearch;
        if (!this.isPaneShowing() && this.state.topicTreeCursor &&
                !TopicTreeHelper.isContent(this.state.topicTreeCursor)) {
            topicSearch = <TopicSearch topicTreeCursor={this.state.topicTreeCursor}
                                       optionsCursor={this.props.optionsCursor}
                                       onTopicSearch={this.onTopicSearch.bind(this)}/>;
        }

        var sidebar;
        if (this.state.topicTreeCursor) {
            sidebar = <Sidebar topicTreeCursor={this.state.topicTreeCursor}
                               onClickSignin={this.onClickSignin.bind(this)}
                               onClickSignout={this.onClickSignout.bind(this)}
                               onClickProfile={this.onClickProfile.bind(this)}
                               onClickDownloads={this.onClickDownloads.bind(this)}
                               onClickSettings={this.onClickSettings.bind(this)}
                               onClickSupport={this.onClickSupport.bind(this)}
                               onClickDownloadContent={this.onClickDownloadContent.bind(this)}
                               onClickViewOnKA={this.onClickViewOnKA.bind(this)}
                               onClickShare={this.onClickShare.bind(this)}
                               onClickCancelDownloadContent={this.onClickCancelDownloadContent.bind(this)}
                               onClickDeleteDownloadedContent={this.onClickDeleteDownloadedContent.bind(this)}
                               isPaneShowing={this.isPaneShowing()}
                               isDownloadsShowing={this.state.showDownloads}
                               isProfileShowing={this.state.showProfile}
                               isSettingsShowing={this.state.showSettings} />;
        }

        return <section className="current" id="index" data-position="current">
            {sidebar}
            <section id="main-content" role="region" className="skin-dark">
                <AppHeader topicTreeCursor={this.state.topicTreeCursor}
                           onClickBack={this.onClickBack.bind(this)}
                           onTopicSearch={this.onTopicSearch.bind(this)}
                           isPaneShowing={this.isPaneShowing()}
                           isDownloadsShowing={this.state.showDownloads}
                           isProfileShowing={this.state.showProfile}
                           isSettingsShowing={this.state.showSettings}
                           />
                    {topicSearch}
                    {control}
                    <StatusBarViewer onClickCancelDownloadContent={this.onClickCancelDownloadContent.bind(this)} />
            </section>
        </section>;
    }
});

module.exports = {
    BackButton,
    MenuButton,
    AppHeader,
    StatusBarViewer,
    Sidebar,
    MainView,
};
