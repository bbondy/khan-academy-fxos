/**
 * @jsx React.DOM
 */

"use strict";

define(["react", "models", "ka", "cache", "storage", "downloads"],
        function(React, models, KA, Cache, Storage, Downloads) {
    var cx = React.addons.classSet;

    // TODO: remove, just for easy inpsection
    window.KA = KA;
    window.models = models;

    /**
     * Represents a single root, domain, subject, topic, or tutorial
     * item in the topic list.
     * This is represented as a single list item, and when clicked, the
     * list view will be replaced with a bunch of different TopicListItem
     * which are the children of the clicked item.
     */
    var TopicListItem = React.createClass({
        getInitialState: function() {
            return {};
        },
        render: function() {
            var topicClassObj = {
                'topic-item': true
            };
            var parentDomain = this.props.topic.getParentDomain();
            topicClassObj[parentDomain.get("id")] = true;
            var topicClass = cx(topicClassObj);

            return <li className={topicClass}>
                { this.props.topic.isRootChild() ? <div className="color-block"/> : null }
                <a href="#" onClick={KA.Util.partial(this.props.onClickTopic, this.props.topic)}>
                    <p className="topic-title">{this.props.topic.get("title")}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single video item in the topic list.
     * This renders the list item and not the actual video.
     * When clicked, it will render the video corresponding to this list item.
     */
    var VideoListItem = React.createClass({
        componentDidMount: function() {
        },
        render: function() {
            var videoNodeClass = cx({
              'video-node': true,
              'completed': this.props.completed,
              'in-progress': this.props.inProgress
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.completed,
                'in-progress': this.props.inProgress
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var videoClassObj = {
                'video-item': true
            };
            var parentDomain = this.props.video.getParentDomain();
            if (parentDomain) {
                subwayIconClassObj[parentDomain.get("id")] = true;
                videoClassObj[parentDomain.get("id")] = true;
                pipeClassObj[parentDomain.get("id")] = true;
            }
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var videoClass = cx(videoClassObj);
            return <li className={videoClass}>
                <div className={subwayIconClass}>
                    <a href="#" onClick={KA.Util.partial(this.props.onClickVideo, this.props.video)}>
                        <div className={videoNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="#" onClick={KA.Util.partial(this.props.onClickVideo, this.props.video)}>
                    <p className="video-title">{this.props.video.get("title")}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single article item in the topic list.
     * This renders the list item and not the actual article.
     * When clicked, it will render the article corresponding to this list item.
     */
    var ArticleListItem = React.createClass({
        render: function() {
            var articleNodeClass = cx({
              'article-node': true,
              'completed': this.props.completed,
              'in-progress': this.props.inProgress
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.completed,
                'in-progress': this.props.inProgress
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var articleClassObj = {
                'article-item': true
            };
            var parentDomain = this.props.article.getParentDomain();
            subwayIconClassObj[parentDomain.get("id")] = true;
            articleClassObj[parentDomain.get("id")] = true;
            pipeClassObj[parentDomain.get("id")] = true;
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var articleClass = cx(articleClassObj);
            return <li className={articleClass}>
                <div className={subwayIconClass}>
                    <a href="#" onClick={KA.Util.partial(this.props.onClickArticle, this.props.article)}>
                        <div className={articleNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="#" onClick={KA.Util.partial(this.props.onClickArticle, this.props.article)}>
                    <p className="article-title">{this.props.article.get("title")}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents the back button which is found on the top left of the header
     * on all screens except when the Root topic is displayed.
     * In general, when clicked it will take the user to the last view they were
     * at before.
     */
    var BackButton = React.createClass({
        render: function() {
            return <div>
                <a className="icon-back-link " href="#" onClick={KA.Util.partial(this.props.onClickBack, this.props.model)}>
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
     * Represents a single topic and it displays a list of all of its children.
     * Each child of the list is a TopicListItem, VideoListItem, or ArticleListItem.
     */
    var TopicViewer = React.createClass({
        componentDidMount: function() {
        },
        render: function() {
            if (this.props.topic.get("topics")) {
                var topics = _(this.props.topic.get("topics").models).map((topic) => {
                    return <TopicListItem topic={topic}
                                      onClickTopic={this.props.onClickTopic}
                                      key={topic.get("slug")}/>;
                });
            }

            if (this.props.topic.get("contentItems")) {
                var contentItems = _(this.props.topic.get("contentItems").models).map((contentItem) => {
                    var completed = KA.APIClient.completedEntities.indexOf(contentItem.get("id")) !== -1;
                    var inProgress = !completed && KA.APIClient.startedEntities.indexOf(contentItem.get("id")) !== -1;
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
                                              key={contentItem.get("slug")}
                                              completed={completed}
                                              inProgress={inProgress} />;
                    }
                    return <ArticleListItem article={contentItem}
                                            onClickArticle={this.props.onClickContentItem}
                                            key={contentItem.get("slug")}
                                            completed={completed}
                                            inProgress={inProgress} />;
                });
            }

            var topicList = <section data-type="list">
                            <ul>
                            {topics}
                            {contentItems}
                            </ul>
                    </section>;
            return <div>
                    {topicList}
            </div>;
        }
    });

    /**
     * Represents a list of content items.
     * This is used for displaying search results and download lists.
     * This always contains only a list of VideoListItems, or ARticleListItems.
     */
    var ContentListViewer = React.createClass({
        render: function() {
            if (this.props.collection.models) {
                var contentItems = _(this.props.collection.models).map((contentItem) => {
                    var completed = KA.APIClient.completedEntities.indexOf(contentItem.get("id")) !== -1;
                    var inProgress = !completed && KA.APIClient.startedEntities.indexOf(contentItem.get("id")) !== -1;
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
                                              key={contentItem.get("slug")}
                                              completed={completed}
                                              inProgress={inProgress} />;
                    }
                    return <ArticleListItem article={contentItem}
                                            onClickArticle={this.props.onClickContentItem}
                                            key={contentItem.get("slug")}
                                            completed={completed}
                                            inProgress={inProgress} />;
                });
            }

            var topicList = <section data-type="list">
                <ul>
                    {contentItems}
                </ul>
            </section>;

            return <div>
                    {topicList}
            </div>;
        }
    });

    /**
     * Represents a single transcript item for the list of transcript items.
     * When clicekd, it willl fast forward the video to that transcript item.
     */
    var TranscriptItem = React.createClass({
        render: function() {
            var startMinute = this.props.transcriptItem.start_time / 1000 / 60 | 0;
            var startSecond = this.props.transcriptItem.start_time / 1000 % 60 | 0;
            startSecond = ("0" + startSecond).slice(-2);
            return <li className="transcript-item">
                <a href="#" onClick={KA.Util.partial(this.props.onClickTranscript, this.props.transcriptItem)}>
                    <div>{startMinute}:{startSecond}</div>
                    <div>{this.props.transcriptItem.text}</div>
                </a>
            </li>;
        }
    });

    /**
     * Represents the entire transcript, which is a list of TranscriptItems.
     */
    var TranscriptViewer = React.createClass({
        render: function() {
            if (!this.props.collection) {
                return null;
            }
            var transcriptItems = _(this.props.collection).map((transcriptItem) => {
                return <TranscriptItem transcriptItem={transcriptItem}
                                       key={transcriptItem.start_time}
                                       onClickTranscript={this.props.onClickTranscript} />;
            });
            return <ul className='transcript'>{transcriptItems}</ul>;
        }
    });

    /**
     * Represents a single article, it will load the article dynamically and
     * display it to the user.
     */
    var ArticleViewer = React.createClass({
        componentWillMount: function() {
            KA.APIClient.getArticle(this.props.article.id).done((result) => {
                this.setState({content: result.translated_html_content});
            });
        },
        componentDidMount: function() {
            this.timerId = setTimeout(this.onReportComplete.bind(this), 5000);
        },
        onReportComplete: function() {
            KA.APIClient.reportArticleRead(this.props.article.id);
        },
        componentWillUnmount: function() {
            clearTimeout(this.timerId);
        },
        getInitialState: function() {
            return {};
        },
        render: function() {
            console.log("render article: ");
            console.log(this.props.article);
            if (this.state.content) {
                return <article dangerouslySetInnerHTML={{
                    __html: this.state.content
                }}/>

            }
            return null;
        }
    });

    /**
     * Represents a single video, it will load the video dynamically and
     * display it to the user.
     */
    var VideoViewer = React.createClass({
         componentWillMount: function() {
            KA.APIClient.getVideoTranscript(this.props.video.get("youtube_id")).done((transcript) => {
                this.setState({transcript: transcript});
            });

            if (this.props.video.isDownloaded()) {
                Storage.readAsBlob(this.props.video.get("id")).done((result) => {
                    var download_url = URL.createObjectURL(result);
                    console.log('download url is: ');
                    console.log(download_url);
                    this.setState({downloadedUrl: download_url});
                });
            }

            console.log('video:');
            console.log(this.props.video);

            this.videoId = this.props.video.get("id");
            this.lastSecondWatched = KA.APIClient.videosProgress[this.videoId] || 0;
            this.secondsWatched = 0;
            this.lastReportedTime = new Date();
            this.lastWatchedTimeSinceLastUpdate = new Date();
        },
        onClickTranscript: function(obj) {
            var startSecond = obj.start_time / 1000 | 0;
            var video = this.refs.video.getDOMNode();
            video.currentTime = startSecond;
            video.play();
        },
        getInitialState: function() {
            return { };
        },
        componentDidMount: function() {
            // Add an event listener to track watched time
            var video = this.refs.video.getDOMNode();

            video.addEventListener("canplay", (e) => {
                if (this.lastSecondWatched) {
                    video.currentTime = this.lastSecondWatched;
                    console.log('set current time to: ' + video.currentTime);
                }
            });

            video.addEventListener("timeupdate", (e) => {
                var video = e.target;
                var currentSecond = video.currentTime | 0;
                var totalSeconds = video.duration | 0;

                // Sometimes a 'timeupdate' event will come before a 'play' event when
                // resuming a paused video. We need to get the play event before reporting
                // seconds watched to properly update the secondsWatched though.
                if (this.isPlaying) {
                    this.reportSecondsWatched();
                }
            }, true);

            video.addEventListener("play", (e) => {
                // Update lastWatchedTimeSinceLastUpdate so that we
                // don't count paused time towards secondsWatched
                this.lastWatchedTimeSinceLastUpdate = new Date();
                this.isPlaying = true;
            }, true);

            video.addEventListener("pause", (e) => {
                this.updateSecondsWatched();
                this.isPlaying = false;
            }, true);
        },

        // Updates the secondsWatched variable with the difference between the current
        // time and the time stamp stored in lastWatchedTimeSinceLastUpdate.
        updateSecondsWatched: function() {
            var currentTime = new Date();
            this.secondsWatched += (currentTime.getTime() - this.lastWatchedTimeSinceLastUpdate.getTime()) / 1000;
            this.lastWatchedTimeSinceLastUpdate = currentTime;
        },

        // Reports the seconds watched to the server if it hasn't been reported recently
        // or if the lastSecondWatched is at the end of the video.
        reportSecondsWatched: function() {
            if (!KA.APIClient.isLoggedIn()) {
                return;
            }

            if (!this.refs.video) {
                return;
            }

            // Report watched time to the server
            var video = this.refs.video.getDOMNode();
            this.lastSecondWatched = Math.round(video.currentTime);
            this.updateSecondsWatched();
            var currentTime = new Date();
            var secondsSinceLastReport = (currentTime.getTime() - this.lastReportedTime.getTime()) / 1000;
            if (secondsSinceLastReport >= this.MIN_SECONDS_BETWEEN_REPORTS || this.lastSecondWatched >= (video.duration | 0)) {
                this.lastReportedTime = new Date();
                console.log('report video progress duration: ' + this.props.video.get("duration"));
                KA.APIClient.reportVideoProgress(this.props.video.get("id"),
                        this.props.video.get("youtube_id"),
                        this.props.video.get("duration"),
                        this.secondsWatched,
                        this.lastSecondWatched);
                this.secondsWatched = 0;
            }
        },

        render: function() {
            var transcriptViewer;
            if (this.state.transcript) {
                 transcriptViewer = <TranscriptViewer collection={this.state.transcript}
                                                      onClickTranscript={this.onClickTranscript} />;
            }
            var videoSrc = this.props.video.get("download_urls").mp4;
            if (this.state.downloadedUrl) {
                videoSrc = this.state.downloadedUrl;
            }
            console.log('video rendered with url: ' + videoSrc);
            return <div>
                 <video ref="video" width="320" height="240" controls>
                    <source src={videoSrc} type="video/mp4"/>
                 </video>
                {transcriptViewer}
            </div>;
        },
        MIN_SECONDS_BETWEEN_REPORTS: 15
    });

    /**
     * Represents the app header, it contains the back button, the menu button,
     * and a title.
     */
    var AppHeader = React.createClass({
        render: function() {
                var backButton;
                if (this.props.isPaneShowing ||
                        this.props.model.isContent() ||
                        this.props.model.isTopic() && !this.props.model.isRoot() ||
                        this.props.model.isContentList()) {
                    backButton = <BackButton model={this.props.model}
                                             onClickBack={this.props.onClickBack}/>;
                }

                var styleObj = { fixed: true };
                var parentDomain = this.props.model.getParentDomain();
                if (parentDomain) {
                    styleObj[parentDomain.get("id")] = true;
                }
                var styleClass = cx(styleObj);

                var title = "Khan Academy";
                if (this.props.isDownloadsShowing) {
                    title = "Downloads";
                } else if (this.props.isProfileShowing) {
                    title = "Profile";
                } else if (this.props.model.get("title")) {
                    title = this.props.model.get("title");
                } else if (this.props.model.isContentList()) {
                    title = "Search";
                }

                return <header className={styleClass}>
                        {backButton}
                        <MenuButton/>
                        <h1 className="header-title">{title}</h1>
                    </header>;
        }
    });


    /**
     * Represents the topic search input item which is right below the header.
     */
    var TopicSearch = React.createClass({
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
        render: function() {
            var style = {
                width: "100%",
                height: "3em;",
                position: "relative"
            };
            var text = "Search...";
            if (this.props.model.get("title")) {
                text = "Search " + this.props.model.get("title");
            }
            return <div>
                <input type="text"
                       placeholder={text}
                       value={this.state.value}
                       required=""
                       style={style}
                       onChange={this.onChange}/>
            </div>;

        }
    });

    /**
     * Represents the sidebar drawer.
     * The sidebar drawer comes up when you click on the menu from the top header.
     */
    var Sidebar = React.createClass({
        render: function() {
            var items = [];

            if (this.props.currentModel && this.props.currentModel.isVideo()) {
                if (this.props.currentModel.isDownloaded()) {
                    items.push(<li className="hot-item">
                            <a href="#" onClick={KA.Util.partial(this.props.onClickDeleteDownloadedVideo, this.props.currentModel)}>Delete downloaded video</a>
                        </li>);
                } else {
                    items.push(<li className="hot-item">
                            <a href="#" onClick={KA.Util.partial(this.props.onClickDownloadVideo, this.props.currentModel)}>Download video</a>
                        </li>);
                }
            }

            if (KA.APIClient.isLoggedIn()) {
                // User is signed in, add all the signed in options here
                items.push(<li><a href="#" onClick={this.props.onClickProfile}>View profile</a></li>);
            } else {
                // If the user is not signed in, add that option first
                items.push(<li><a href="#" onClick={this.props.onClickSignin}>Sign in</a></li>);
            }
            items.push(<li><a href="#" onClick={this.props.onClickDownloads}>View downloads</a></li>);


            // Add the signout button last
            if (KA.APIClient.isLoggedIn()) {
                items.push(<li><a href="#" onClick={this.props.onClickSignout}>Sign out</a></li>);
            }

            return <section className="sidebar" data-type="sidebar">
                <header>
                    <menu type="toolbar">
                        <a href="#">Done</a>
                    </menu>
                    <h1>Options</h1>
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
        render: function() {
            if (!Downloads.contentList.length) {
                return <div className="downloads">
                    <h1>You have no downloads yet!</h1>
                </div>;
            }

            var control = <ContentListViewer collection={Downloads.contentList}
                                             onClickContentItem={this.props.onClickContentItem} />;
            return <div className="downloads">
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
            KA.APIClient.getUserInfo().done((result) => {
                //this.setState({content: result.translated_html_content});
                this.setState({
                    avatarUrl: result.avatar_url,
                    joined: result.joined,
                    nickname: result.nickname,
                    username: result.username,
                    points: result.points,
                    badgeCounts: result.badge_counts
                });
                console.log('user info result:');
                console.log(result);
            });
        },
        getInitialState: function() {
            return {};
        },
        render: function() {
            return <div className="profile">
                <img className="avatar" src={this.state.avatarUrl}/>
                <h1>{this.state.nickname || this.state.username}</h1>
                <h2>Points: {KA.Util.numberWithCommas(this.state.points)}</h2>

                { this.state.badgeCounts ?
                    <div>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[5]}</div>
                        <img className="badge-category-icon" title="Challenge Patches" src="img/badges/master-challenge-blue-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[4]}</div>
                        <img className="badge-category-icon" title="Black Hole Badges" src="img/badges/eclipse-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[3]}</div>
                        <img className="badge-category-icon" title="Sun Badges" src="img/badges/sun-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[2]}</div>
                        <img className="badge-category-icon" title="Earth Badges" src="img/badges/earth-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[1]}</div>
                        <img className="badge-category-icon" title="Moon Badges" src="img/badges/moon-60x60.png"/>
                    </span>
                    <span className="span2">
                        <div className="badge-category-count">{this.state.badgeCounts[0]}</div>
                        <img className="badge-category-icon" title="Meteorite Badges" src="img/badges/meteorite-60x60.png"/>
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
        componentWillMount: function() {
        },
        getInitialState: function() {
            return {
                currentModel: this.props.model
            };
        },
        onClickContentItem: function(model) {
            this.setState({
                currentModel: model,
                showProfile: false,
                 showDownloads: false
            });
        },
        onClickTopic: function(model) {
            this.setState({
                currentModel: model,
                showProfile: false,
                showDownloads: false
            });
        },
        onClickBack: function(model) {
            console.log('onClickBack');
            if (this.isPaneShowing()) {
                this.setState({
                    showDownloads: false,
                    showProfile: false
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
                currentModel: model.get("parent"),
                showProfile: false,
                showDownloads: false
            });
        },
        onClickSignin: function() {
            KA.APIClient.login();
            this.forceUpdate();
        },
        onClickSignout: function() {
            KA.APIClient.logout();
            this.forceUpdate();
        },
        onClickProfile: function() {
            console.log('Click profile');
            this.setState({
                showProfile: true,
                showDownloads: false
            });
        },
        onClickDownloads: function(model) {
            console.log('Click downloads');
            this.setState({
                showDownloads: true,
                showProfile: false
            });
        },
        onClickDownloadVideo: function(video) {
            Downloads.downloadVideo(video);
        },
        onClickDeleteDownloadedVideo: function(video) {
            console.log('click delete downloaded video');
            Downloads.deleteVideo(video);
        },
        isPaneShowing: function() {
            return this.state.showDownloads ||
                this.state.showProfile;
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
        /**
         * Most of the time returns this.state.currentModel,
         * but will return a donwloaded copy if it's available.
         */
        getCurrentModel: function() {
            return Downloads.findVideo(this.state.currentModel) ||
                this.state.currentModel;
        },
        render: function() {
            var currentModel = this.getCurrentModel();
            var control;
            if (this.state.showProfile) {
                control = <ProfileViewer/>;
            }
            else if (this.state.showDownloads) {
                control = <DownloadsViewer onClickContentItem={this.onClickContentItem} />;
            }
            else if (currentModel.isTopic()) {
                control = <TopicViewer topic={currentModel}
                                       onClickTopic={this.onClickTopic}
                                       onClickContentItem={this.onClickContentItem}/>;
            } else if (currentModel.isContentList()) {
                control = <ContentListViewer collection={currentModel}
                                             onClickContentItem={this.onClickContentItem} />;
            } else if (currentModel.isVideo()) {
                control = <VideoViewer  video={this.getCurrentModel()}/>;
            } else if (currentModel.isArticle()) {
                control = <ArticleViewer  article={currentModel}/>;
            } else {
                console.error("Unrecognized content item!");
            }

            var topicSearch;
            if (!this.isPaneShowing() && !currentModel.isContent()) {
                topicSearch = <TopicSearch model={currentModel}
                                           onTopicSearch={this.onTopicSearch}/>;
            }

            return <section className="current" id="index" data-position="current">
                <Sidebar currentModel={currentModel}
                         onClickSignin={this.onClickSignin}
                         onClickSignout={this.onClickSignout}
                         onClickProfile={this.onClickProfile}
                         onClickDownloads={this.onClickDownloads}
                         onClickDownloadVideo={this.onClickDownloadVideo}
                         onClickDeleteDownloadedVideo={this.onClickDeleteDownloadedVideo}
                         />
                <section id="main-content" role="region" className="skin-dark">
                    <AppHeader model={currentModel}
                               onClickBack={this.onClickBack}
                               onTopicSearch={this.onTopicSearch}
                               isPaneShowing={this.isPaneShowing()}
                               isDownloadsShowing={this.state.showDownloads}
                               isProfileShowing={this.state.showProfile}
                               />
                        {topicSearch}
                        {control}
                </section>
            </section>;
        }
    });

    /*
    // I thought this was supposed to be needed, but it seems to not be needed
    // I think the manifest permissions implies this for us.
    $.ajaxSetup({
        xhr: function() {return new window.XMLHttpRequest({mozSystem: true});}
    });
    */

    var mountNode = document.getElementById("app");

    // Init everything
    Storage.init().then(function(){
      return KA.APIClient.init();
    }).then(function() {
        return models.TopicTree.init();
    }).then(function() {
        return $.when(Downloads.init(), Cache.init());
    }).then(function() {
        React.renderComponent(<MainView model={models.TopicTree.root}/>, mountNode);

        // TODO: Remove or move ???
        Storage.readText("data.json").done(function(data) {
            console.log('read: ' + data);
        });
    });
});
