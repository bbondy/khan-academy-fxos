"use strict";

define([window.isTest ? "react-dev" : "react", "util", "models", "apiclient", "cache", "storage",
        "downloads", "notifications", "status", "video", "article", "topic"],
        function(React, Util, models, APIClient, Cache, Storage,
            Downloads, Notifications, Status, videoModels, articleModels, topicModels) {
    var cx = React.addons.classSet;
    var VideoViewer = videoModels.VideoViewer;
    var ArticleViewer = articleModels.ArticleViewer;
    var TopicListItem = topicModels.TopicListItem;
    var VideoListItem = topicModels.VideoListItem;
    var ArticleListItem = topicModels.ArticleListItem;
    var TopicViewer = topicModels.TopicViewer;
    var ContentListViewer = topicModels.ContentListViewer;

    /**
     * Represents the back button which is found on the top left of the header
     * on all screens except when the Root topic is displayed.
     * In general, when clicked it will take the user to the last view they were
     * at before.
     */
    var BackButton = React.createClass({
        propTypes: {
            model: React.PropTypes.object.isRequired,
            onClickBack: React.PropTypes.func.isRequired
        },
        render: function() {
            return <div>
                <a className="icon-back-link " href="javascript:void(0)" onClick={Util.partial(this.props.onClickBack, this.props.model)}>
                    <span className="icon icon-back">Back</span>
                </a>
            </div>;
        }
    });

    /**
     * Represents the menu button which is found on the top right of the header
     * on all screens.
     * When clicked it will expand a drawer with context sensitive options.
     */
    var MenuButton = React.createClass({
        render: function() {
            return <div>
                <menu type="toolbar" className="icon-menu-link ">
                    <a href="#main-content">
                        <span className="icon icon-menu">Menu</span>
                    </a>
                </menu>
            </div>;
        }
    });

    /**
     * Represents the app header, it contains the back button, the menu button,
     * and a title.
     */
    var AppHeader = React.createClass({
        propTypes: {
            model: React.PropTypes.object.isRequired,
            isPaneShowing: React.PropTypes.bool.isRequired
        },
        render: function() {
                var backButton;
                if (this.props.model && (this.props.isPaneShowing ||
                        this.props.model.isContent() ||
                        this.props.model.isTopic() && !this.props.model.isRoot() ||
                        this.props.model.isContentList())) {
                    backButton = <BackButton model={this.props.model}
                                             onClickBack={this.props.onClickBack}/>;
                }

                var styleObj = {
                    fixed: true,
                    "topic-header": this.props.model && !this.props.model.isRoot() &&
                        !this.props.isPaneShowing &&
                        (this.props.model.isTopic() || this.props.model.isContent())
                };
                var parentDomain = this.props.model && this.props.model.getParentDomain();
                if (parentDomain && !this.props.isPaneShowing) {
                    styleObj[parentDomain.getId()] = true;
                }
                var styleClass = cx(styleObj);

                var title = "Khan Academy";
                if (this.props.isDownloadsShowing) {
                    title = document.webL10n.get("view-downloads");
                } else if (this.props.isProfileShowing) {
                    title = document.webL10n.get("view-profile");
                } else if (this.props.isSettingsShowing) {
                    title = document.webL10n.get("view-settings");
                } else if (this.props.model && this.props.model.getTitle()) {
                    title = this.props.model.getTitle();
                } else if (this.props.model && this.props.model.isContentList()) {
                    title = document.webL10n.get("search");
                }

                var menuButton;
                if (this.props.model) {
                    menuButton = <MenuButton/>;
                }

                return <header className={styleClass}>
                        {backButton}
                        {menuButton}
                        <h1 className="header-title">{title}</h1>
                    </header>;
        }
    });


    /**
     * Represents the topic search input item which is right below the header.
     */
    var TopicSearch = React.createClass({
        propTypes: {
            model: React.PropTypes.object.isRequired,
            onTopicSearch: React.PropTypes.func.isRequired
        },
        getInitialState: function() {
            return {value: ''};
        },
        componentWillReceiveProps: function() {
            this.state.value = '';
        },
        onChange: function(event) {
            var topicSearch = event.target.value;
            this.setState({value: topicSearch});
            this.props.onTopicSearch(topicSearch);
        },
        handleFocus: function(event) {
            setTimeout(() => {
                $("html, body").stop(true, true).animate({
                    scrollTop: $(this.refs.search.getDOMNode()).offset().top
                }, 500);
            }, 500);
        },
        handleBlur: function(event) {
            $("html, body").stop(true, true).animate({
                scrollTop: 0
            }, 700);
        },

        render: function() {
            var style = {
                width: "100%",
                height: "3em;",
                position: "relative"
            };
            var text = document.webL10n.get("search");
            if (this.props.model.getTitle()) {
                text = document.webL10n.get("search-topic",
                        {"topic": this.props.model.getTitle()});
            }
            return <div>
                <input ref="search"
                       className="search"
                       type="searh"
                       placeholder={text}
                       value={this.state.value}
                       required=""
                       style={style}
                       onChange={this.onChange}
                       onFocus={this.handleFocus}
                       onBlur={this.handleBlur}
                       />
            </div>;

        }
    });

    var StatusBarViewer = React.createClass({
        render: function() {
            if (!models.TempAppState.get("status")) {
                return <div/>;
            }
            return <div className="status-bar">{models.TempAppState.get("status")}</div>;
        }
    });

    /**
     * Represents the sidebar drawer.
     * The sidebar drawer comes up when you click on the menu from the top header.
     */
    var Sidebar = React.createClass({
        propTypes: {
            model: React.PropTypes.object.isRequired,
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
        },
        render: function() {
            var items = [];

            ////////////////////
            // Context sensitive actions first
            if (Storage.isEnabled()) {
                if (!this.props.isPaneShowing &&
                        this.props.model && this.props.model.isContent()) {
                    if (this.props.model.isDownloaded()) {
                        var text = document.webL10n.get(this.props.model.isVideo() ? "delete-downloaded-video" : "delete-downloaded-article");
                        items.push(<li className="hot-item">
                                <a href="#" onClick={Util.partial(this.props.onClickDeleteDownloadedContent, this.props.model)}>{{text}}</a>
                            </li>);
                    } else {
                        var text = document.webL10n.get(this.props.model.isVideo() ? "download-video" : "download-article");
                        items.push(<li className="hot-item">
                                <a href="#" className={this.props.model.isVideo() ? "download-video-link" : "download-article-link"} onClick={Util.partial(this.props.onClickDownloadContent, this.props.model)}>{{text}}</a>
                            </li>);
                    }
                }
            }

            if (!this.props.isPaneShowing &&
                    this.props.model &&
                    this.props.model.isContent() &&
                    this.props.model.getKAUrl()) {
                var viewOnKAMessage = document.webL10n.get("open-in-website");
                items.push(<li><a href="#" className="open-in-website-link" onClick={Util.partial(this.props.onClickViewOnKA, this.props.model)}>{{viewOnKAMessage}}</a></li>);

                if (window.MozActivity) {
                    var shareMessage = document.webL10n.get("share");
                    items.push(<li><a href="#" className="share-link" onClick={Util.partial(this.props.onClickShare, this.props.model)}>{{shareMessage}}</a></li>);
                }
            }

            if (Storage.isEnabled()) {
                if (models.TempAppState.get("isDownloadingTopic")) {
                    items.push(<li className="hot-item">
                            <a href="#" data-l10n-id="cancel-downloading" onClick={Util.partial(this.props.onClickCancelDownloadContent, this.props.model)}>Cancel Downloading</a>
                        </li>);
                } else if(!this.props.isPaneShowing &&
                            this.props.model && this.props.model.isTopic()) {
                    items.push(<li className="hot-item">
                            <a href="#" data-l10n-id="download-topic" onClick={Util.partial(this.props.onClickDownloadContent, this.props.model)}>Download Topic</a>
                        </li>);
                }
            }

            ////////////////////
            // Followed by sign in
            if (!models.CurrentUser.isSignedIn()) {
                // If the user is not signed in, add that option first
                items.push(<li><a data-l10n-id="sign-in" href="#" onClick={this.props.onClickSignin}>Sign In</a></li>);
            }

            ////////////////////
            // Followed by view pane items
            if (models.CurrentUser.isSignedIn() && !this.props.isProfileShowing) {
                // User is signed in, add all the signed in options here
                items.push(<li><a  data-l10n-id="view-profile" className="view-profile-link" href="#" onClick={this.props.onClickProfile}>View Profile</a></li>);
            }
            if (!this.props.isSettingsShowing) {
                items.push(<li><a data-l10n-id="view-settings" className="view-settings-link" href="#" onClick={this.props.onClickSettings}>View Settings</a></li>);
            }
            if (!this.props.isDownloadsShowing && Storage.isEnabled()) {
                items.push(<li><a data-l10n-id="view-downloads" className="view-downloads-link" href="#" onClick={this.props.onClickDownloads}>View Downloads</a></li>);
            }

            items.push(<li><a data-l10n-id="open-support" className="open-support-link" href="#" onClick={this.props.onClickSupport}>Open support website</a></li>);

            // Add the signout button last
            if (models.CurrentUser.isSignedIn()) {
                items.push(<li><a data-l10n-id="sign-out" href="#" onClick={this.props.onClickSignout}>Sign Out</a></li>);
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
    });

    /**
     * Represents a downloads list which is basically just a wrapper around a
     * ContentListViewer for now.
     */
    var DownloadsViewer = React.createClass({
        propTypes: {
            onClickContentItem: React.PropTypes.func.isRequired
        },
        render: function() {
            if (!Downloads.contentList.length) {
                return <div className="downloads">
                    <div data-l10n-id="no-downloads">You have no downloads yet!</div>
                </div>;
            }

            var control = <ContentListViewer collection={Downloads.contentList}
                                             onClickContentItem={this.props.onClickContentItem} />;
            return <div className="downloads topic-list-container">
                {control}
            </div>;
        }
    });

    /**
     * Represents a list of settings which can be modified which affect
     * global state.
     */
    var SettingsViewer = React.createClass({
        propTypes: {
            options: React.PropTypes.object.isRequired
        },
        handleShowDownloadsChange: function(event) {
            this.props.options.set("showDownloadsOnly", event.target.checked);
            this.props.options.save();
        },
        handleShowTranscriptsChange: function(event) {
            this.props.options.set("showTranscripts", event.target.checked);
            this.props.options.save();
        },
        handleSetPlaybackRateChange: function(event) {
            // Convert a value like: 0, 1, 2, 3 to 50, 100, 150, 200
            var percentage = 50 + event.target.value * 50;
            this.props.options.set("playbackRate", percentage);
            this.props.options.save();
        },
        handleReset: function(event) {
            if (confirm(document.webL10n.get("confirm-reset"))) {
                this.props.options.reset();
            }
        },
        // YouTube player option is currently disabled due to a bug w/ the
        // API when on the actual device.  Callbacks aren't always called.
        render: function() {
            return <div className="settings topic-list-container">

                <div data-l10n-id="show-downloads-only">Show downloads only</div>
                <label className="pack-switch">
                <input ref="showDownloadsOnly"
                       className="show-downloads-setting"
                       type="checkbox"
                       checked={this.props.options.get("showDownloadsOnly")}
                       onChange={this.handleShowDownloadsChange}></input>
                <span></span>
                </label>

                <div data-l10n-id="show-transcripts">Show transcripts</div>
                <label className="pack-switch">
                <input ref="showTranscripts"
                       className="show-transcripts-setting"
                       type="checkbox"
                       checked={this.props.options.get("showTranscripts")}
                       onChange={this.handleShowTranscriptsChange}></input>
                <span></span>
                </label>

                <div data-l10n-id="set-playback-speed">Set playback speed</div>
                <label class="icon"></label>
                <label className="bb-docs">
                <section role="slider">
                    <input ref="setPlaybackRate"
                           className="set-playback-speed-setting"
                           id="set-playback-speed"
                           type="range"
                           min="0" max="3"
                           value={(this.props.options.get("playbackRate") - 50) / 50}
                           onChange={this.handleSetPlaybackRateChange}></input>
                    <label class="icon">{this.props.options.get("playbackRate")}%</label>
                    <span></span>
                </section>
                </label>

                <button id="reset-button"
                        className="reset-button"
                        data-l10n-id="reset-setting"
                        onClick={this.handleReset}>Reset</button>
            </div>;
        }
    });

    /**
     * Represents a search result list which is basically just a wrapper around a
     * ContentListViewer for now.
     */
    var SearchResultsViewer = React.createClass({
        propTypes: {
            collection: React.PropTypes.object.isRequired,
            onClickContentItem: React.PropTypes.func.isRequired
        },
        render: function() {
            var control = <ContentListViewer collection={this.props.collection}
                                             onClickContentItem={this.props.onClickContentItem} />;
            return <div className="topic-list-container">
                {control}
            </div>;
        }
    });

    /**
     * Represents a user's profile. It gives the user information about their
     * username, badges, and points.
     */
    var ProfileViewer = React.createClass({
        componentWillMount: function() {
        },
        render: function() {
            var pointsString = document.webL10n.get("points");
            // TODO(bbondy): The title attributes on the images need to change
            // because you can't hover with your finger on FxOS Maybe just
            // when you tap it, it gives you the name underneath or something
            // like that.
            return <div className="profile">
                <img className="avatar" src={models.CurrentUser.get("userInfo").avatarUrl}/>
                <div className="username">{models.CurrentUser.get("userInfo").nickname || models.CurrentUser.get("userInfo").username}</div>
                <div className="points-header">{{pointsString}}: <div className="energy-points energy-points-profile">{Util.numberWithCommas(models.CurrentUser.get("userInfo").points)}</div></div>

                { models.CurrentUser.get("userInfo").badgeCounts ?
                    <div>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[5]}</div>
                        <img className="badge-category-icon" title="Challenge Patches" src="/img/badges/master-challenge-blue-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[4]}</div>
                        <img className="badge-category-icon" title="Black Hole Badges" src="/img/badges/eclipse-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[3]}</div>
                        <img className="badge-category-icon" title="Sun Badges" src="/img/badges/sun-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[2]}</div>
                        <img className="badge-category-icon" title="Earth Badges" src="/img/badges/earth-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[1]}</div>
                        <img className="badge-category-icon" title="Moon Badges" src="/img/badges/moon-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{models.CurrentUser.get("userInfo").badgeCounts[0]}</div>
                        <img className="badge-category-icon" title="Meteorite Badges" src="/img/badges/meteorite-60x60.png"/>
                    </span>
                    </div> : null }
            </div>;
        }
    });

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
            model: React.PropTypes.object
        },
        mixins: [Util.BackboneMixin, Util.LocalizationMixin],
        getBackboneModels: function() {
            return [new models.ContentList(models.TopicTree.allContentItems),
                models.AppOptions, models.TempAppState, models.CurrentUser];
        },
        componentWillMount: function() {
        },
        getInitialState: function() {
            return {
                currentModel: this.props.model
            };
        },
        onClickContentItemFromDownloads: function(model) {
            // We need to keep track of the currentModel here because
            // we're changing the currentModel, so going back from the
            // downloads pane would be impossible otherwise.
            this.setState({
                currentModel: model,
                showProfile: false,
                showDownloads: false,
                showSettings: false,
                wasLastDownloads: true,
                lastModel: this.state.currentModel
            });
        },
        onClickContentItem: function(model) {
            this.setState({
                currentModel: model,
                showProfile: false,
                showDownloads: false,
                showSettings: false
            });
        },
        onClickTopic: function(model) {
            this.setState({
                currentModel: model,
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
        onClickBack: function(model) {
            // If we were on a content item from downloads,
            // then go back to downloads.
            if (this.state.wasLastDownloads) {
                this.onClickDownloads();
                return;
            }

            // If we have a last model set, then we're effectively
            // presisng back from the downloads screen itself.
            // The lastModel is needed because the downloads pane is the
            // only pane where clicking on it can change the currentModel.
            if (this.state.lastModel) {
                this.setState({
                    currentModel: this.state.lastModel,
                    lastModel: undefined,
                    showDownloads: false,
                    showProfile: false,
                    showSettings: false,
                    wasLastDownloads: false
                });
            }

            /**
             * If settings or profile or ... is set, then don't show it anymore.
             * This effectively makes the currentModel be in use again.
             */
            if (this.isPaneShowing()) {
                this.setState({
                    showDownloads: false,
                    showProfile: false,
                    showSettings: false,
                    wasLastDownloads: false
                });
                if (this.state.currentModel.isContentList()) {
                    this.onTopicSearch("");
                }
                return;
            }

            if (this.state.currentModel.isContentList()) {
                return this.onTopicSearch("");
            }

            this.setState({
                currentModel: model.getParent(),
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
        onClickSettings: function(model) {
            this.setState({
                showDownloads: false,
                showProfile: false,
                showSettings: true,
                wasLastDownloads: false
            });
        },
        _openUrl: function(url) {
            if (window.MozActivity) {
                new MozActivity({
                    name: "view",
                    data: {
                        type: "url",
                        url: url
                    }
                });
            } else {
                window.open(url, '_blank');
            }

        },
        onClickSupport: function(model) {
            var url = "https://khanacademy.zendesk.com/hc/communities/public/topics/200155074-Mobile-Discussions";
            this._openUrl(url);
        },
        onClickViewOnKA: function(model) {
            this._openUrl(model.getKAUrl());
        },
        onClickShare: function(model) {
            new MozActivity({
                name: "share",
                data: {
                    type: "url",
                    url: model.getKAUrl()
                }
            });
        },
        onClickDownloadContent: function(model) {
            var totalCount = 1;
            if (model.isTopic()) {
                totalCount = model.getChildNotDownloadedCount();
            }

            // Check for errors
            if (totalCount === 0) {
                alert(document.webL10n.get("already-downloaded"));
                return;
            } else if (models.TempAppState.get("isDownloadingTopic")) {
                alert(document.webL10n.get("already-downloading"));
                return;
            } else if (Util.isMeteredConnection()) {
                if (!confirm(document.webL10n.get("metered-connection-warning"))) {
                    return;
                }
            } else if (Util.isBandwidthCapped()) {
                if (!confirm(document.webL10n.get("limited-bandwidth-warning"))) {
                    return;
                }
            }

            // Format to string with commas
            var totalCountStr = Util.numberWithCommas(totalCount);

            // Prompt to download remaining
            if (model.isTopic()) {
                if (!confirm(document.webL10n.get("download-remaining",
                            {"totalCount": totalCount, "totalCountStr": totalCountStr}))) {
                    return;
                }
            }

            var onProgress = (model, count, cancelling) => {
                if (cancelling) {
                    Status.update(document.webL10n.get("canceling-download"));
                    return;
                }
                count = Util.numberWithCommas(count);
                var progressMessage = document.webL10n.get("downloading-progress",
                            {"count" : count, "totalCount": totalCount, "totalCountStr": totalCountStr});
                Status.update(progressMessage);
            };
            Status.start();
            Downloads.download(model, onProgress).done((model, count) => {
                var title = document.webL10n.get("download-complete");
                var contentTitle = model.getTitle();
                var message;
                if (model.isContent()) {
                    if (model.isVideo()) {
                        message = document.webL10n.get("video-complete-body",
                            {"title" : contentTitle});
                    } else {
                        message = document.webL10n.get("article-complete-body",
                            {"title" : contentTitle});
                    }
                } else {
                    // TODO: We don't want commas here so we should change the source
                    // strings for all locales for count and countStr
                    // count = Util.numberWithCommas(count);
                    message = document.webL10n.get("content-items-downloaded-succesfully",
                        {"count" : count, "title": contentTitle});
                }
                Status.stop();
                Notifications.info(title, message);
            }).fail(() => {
                var title = document.webL10n.get("download-aborted");
                var message = document.webL10n.get("content-items-downloaded-failure");
                Status.stop();
                Notifications.info(title, message);
            });
        },
        onClickCancelDownloadContent: function(model) {
            Downloads.cancelDownloading();
        },
        onClickDeleteDownloadedContent: function(video) {
            Downloads.deleteContent(video);
        },
        isPaneShowing: function() {
            return this.state.showDownloads ||
                this.state.showProfile ||
                this.state.showSettings;
        },
        onTopicSearch: function(topicSearch) {
            if (!topicSearch) {
                this.setState({currentModel: this.state.searchingModel, searchingModel: null});
                return;
            }
            var searchingModel = this.state.searchingModel;
            if (!searchingModel) {
                searchingModel = this.state.currentModel;
            }
            var results = searchingModel.findContentItems(topicSearch);
            var contentList = new models.ContentList(results);
            this.setState({currentModel: contentList, searchingModel: searchingModel});
        },
        getCurrentModel: function() {
            return this.state.currentModel;
        },
        render: function() {
            var currentModel = this.getCurrentModel();

            // Make sure scrollTop is at the top of the page
            // This is in case the search box scrolling doesn't get an onblur
            if (currentModel && !currentModel.isContentList()) {
                $("html, body").scrollTop(0);
            }

            var control;
            if (!currentModel) {
                // Still loading topic tree
                control = <div className="app-loading"/>;
            }
            else if (this.state.showProfile) {
                control = <ProfileViewer/>;
            }
            else if (this.state.showDownloads) {
                control = <DownloadsViewer onClickContentItem={this.onClickContentItemFromDownloads} />;
            }
            else if (this.state.showSettings) {
                control = <SettingsViewer options={models.AppOptions }/>;
            }
            else if (currentModel.isTopic()) {
                control = <TopicViewer topic={currentModel}
                                       onClickTopic={this.onClickTopic}
                                       onClickContentItem={this.onClickContentItem}/>;
            } else if (currentModel.isContentList()) {
                control = <SearchResultsViewer collection={currentModel}
                                               onClickContentItem={this.onClickContentItem} />;
            } else if (currentModel.isVideo()) {
                control = <VideoViewer  video={this.getCurrentModel()}/>;
            } else if (currentModel.isArticle()) {
                control = <ArticleViewer  article={currentModel}/>;
            } else {
                Util.error("Unrecognized content item!");
            }

            var topicSearch;
            if (!this.isPaneShowing() && currentModel && !currentModel.isContent()) {
                topicSearch = <TopicSearch model={currentModel}
                                           onTopicSearch={this.onTopicSearch}/>;
            }

            return <section className="current" id="index" data-position="current">
                <Sidebar model={currentModel}
                         onClickSignin={this.onClickSignin}
                         onClickSignout={this.onClickSignout}
                         onClickProfile={this.onClickProfile}
                         onClickDownloads={this.onClickDownloads}
                         onClickSettings={this.onClickSettings}
                         onClickSupport={this.onClickSupport}
                         onClickDownloadContent={this.onClickDownloadContent}
                         onClickViewOnKA={this.onClickViewOnKA}
                         onClickShare={this.onClickShare}
                         onClickCancelDownloadContent={this.onClickCancelDownloadContent}
                         onClickDeleteDownloadedContent={this.onClickDeleteDownloadedContent}
                         isPaneShowing={this.isPaneShowing()}
                         isDownloadsShowing={this.state.showDownloads}
                         isProfileShowing={this.state.showProfile}
                         isSettingsShowing={this.state.showSettings}
                         />
                <section id="main-content" role="region" className="skin-dark">
                    <AppHeader model={currentModel}
                               onClickBack={this.onClickBack}
                               onTopicSearch={this.onTopicSearch}
                               isPaneShowing={this.isPaneShowing()}
                               isDownloadsShowing={this.state.showDownloads}
                               isProfileShowing={this.state.showProfile}
                               isSettingsShowing={this.state.showSettings}
                               />
                        {topicSearch}
                        {control}
                        <StatusBarViewer/>
                </section>
            </section>;
        }
    });

    return {
        BackButton,
        MenuButton,
        AppHeader,
        TopicSearch,
        StatusBarViewer,
        Sidebar,
        DownloadsViewer,
        SettingsViewer,
        SearchResultsViewer,
        ProfileViewer,
        MainView,
    };
});
