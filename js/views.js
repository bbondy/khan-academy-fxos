"use strict";

define([window.isTest ? "react-dev" : "react", "util", "models", "apiclient", "cache", "storage",
        "downloads", "notifications", "status"],
        function(React, Util, models, APIClient, Cache, Storage,
            Downloads, Notifications, Status) {
    var cx = React.addons.classSet;

    /**
     * Represents a single root, domain, subject, topic, or tutorial
     * item in the topic list.
     * This is represented as a single list item, and when clicked, the
     * list view will be replaced with a bunch of different TopicListItem
     * which are the children of the clicked item.
     */
    var TopicListItem = React.createClass({
        propTypes: {
            topic: React.PropTypes.object.isRequired,
            onClickTopic: React.PropTypes.func.isRequired
        },
        getInitialState: function() {
            return {};
        },
        render: function() {
            var topicClassObj = {
                'topic-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    this.props.topic.get("downloadCount") === 0
            };
            var parentDomain = this.props.topic.getParentDomain();
            topicClassObj[parentDomain.getId()] = true;
            var topicClass = cx(topicClassObj);

            return <li className={topicClass}>
                { this.props.topic.isRootChild() ?
                    <div className="color-block"/> : null }
                <a href="javascript:void(0)"
                   onClick={Util.partial(this.props.onClickTopic,
                       this.props.topic)}>
                    <p className="topic-title">{this.props.topic.getTitle()}</p>
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
        propTypes: {
            video: React.PropTypes.object.isRequired,
            onClickVideo: React.PropTypes.func.isRequired
        },
        render: function() {
            var videoNodeClass = cx({
              'video-node': true,
              'completed': this.props.video.isCompleted(),
              'in-progress': this.props.video.isStarted()
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.video.isCompleted(),
                'in-progress': this.props.video.isStarted()
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var videoClassObj = {
                'video-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    !this.props.video.isDownloaded()
            };
            var parentDomain = this.props.video.getParentDomain();
            if (parentDomain) {
                subwayIconClassObj[parentDomain.getId()] = true;
                videoClassObj[parentDomain.getId()] = true;
                pipeClassObj[parentDomain.getId()] = true;
            }
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var videoClass = cx(videoClassObj);
            return <li className={videoClass}>
                <div className={subwayIconClass}>
                    <a href="javascript:void(0)"
                       onClick={Util.partial(this.props.onClickVideo,
                               this.props.video)}>
                        <div className={videoNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="javascript:void(0)"
                   onClick={Util.partial(this.props.onClickVideo,
                           this.props.video)}>
                    <p className="video-title">{this.props.video.getTitle()}</p>
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
        propTypes: {
            article: React.PropTypes.object.isRequired,
            onClickArticle: React.PropTypes.func.isRequired
        },
        render: function() {
            var articleNodeClass = cx({
              'article-node': true,
              'completed': this.props.article.isCompleted(),
              'in-progress': this.props.article.isStarted()
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.article.isCompleted(),
                'in-progress': this.props.article.isStarted()
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var articleClassObj = {
                'article-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    !this.props.article.isDownloaded()
            };
            var parentDomain = this.props.article.getParentDomain();
            subwayIconClassObj[parentDomain.getId()] = true;
            articleClassObj[parentDomain.getId()] = true;
            pipeClassObj[parentDomain.getId()] = true;
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var articleClass = cx(articleClassObj);
            return <li className={articleClass}>
                <div className={subwayIconClass}>
                    <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickArticle, this.props.article)}>
                        <div className={articleNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickArticle, this.props.article)}>
                    <p className="article-title">{this.props.article.getTitle()}</p>
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
     * Represents a single topic and it displays a list of all of its children.
     * Each child of the list is a TopicListItem, VideoListItem, or ArticleListItem.
     */
    var TopicViewer = React.createClass({
        componentDidMount: function() {
        },
        propTypes: {
            topic: React.PropTypes.object.isRequired,
            onClickTopic: React.PropTypes.func.isRequired,
            onClickContentItem: React.PropTypes.func.isRequired
        },
        render: function() {
            var topics;
            if (this.props.topic.get("topics")) {
                topics = _(this.props.topic.get("topics").models).map((topic) => {
                    return <TopicListItem topic={topic}
                                          onClickTopic={this.props.onClickTopic}
                                          key={topic.getId()}/>;
                });
            }

            var contentItems;
            if (this.props.topic.get("contentItems")) {
                contentItems = _(this.props.topic.get("contentItems").models).map((contentItem) => {
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
                                              key={contentItem.getId()} />;
                    }
                    return <ArticleListItem article={contentItem}
                                            onClickArticle={this.props.onClickContentItem}
                                            key={contentItem.getId()} />;
                });
            }

            var topicList = <section data-type="list">
                            <ul>
                            {topics}
                            {contentItems}
                            </ul>
                    </section>;
            return <div className="topic-list-container">
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
        propTypes: {
            collection: React.PropTypes.object.isRequired,
            onClickContentItem: React.PropTypes.func.isRequired,
            onClickTranscript: React.PropTypes.func.isRequired
        },
        render: function() {
            var contentItems;
            if (this.props.collection.models) {
                contentItems = _(this.props.collection.models).map((contentItem) => {
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
                                              key={contentItem.getId()} />;
                    }
                    return <ArticleListItem article={contentItem}
                                            onClickArticle={this.props.onClickContentItem}
                                            key={contentItem.getId()} />;
                });
            }

            var topicList = <section data-type="list">
                <ul>
                    {contentItems}
                </ul>
            </section>;

            return <div className="topic-list-container">
                    {topicList}
            </div>;
        }
    });

    /**
     * Represents a single transcript item for the list of transcript items.
     * When clicekd, it willl fast forward the video to that transcript item.
     */
    var TranscriptItem = React.createClass({
        propTypes: {
            transcriptItem: React.PropTypes.object.isRequired
        },
        render: function() {
            var totalSeconds = this.props.transcriptItem.start_time / 1000 | 0;
            var startMinute = totalSeconds / 60 | 0;
            var startSecond = totalSeconds % 60 | 0;
            startSecond = ("0" + startSecond).slice(-2);
            return <li className="transcript-item" data-time={totalSeconds}>
                <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickTranscript, this.props.transcriptItem)}>
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
        propTypes: {
            collection: React.PropTypes.object.isRequired,
            onClickTranscript: React.PropTypes.func.isRequired
        },
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
        propTypes: {
            article: React.PropTypes.object.isRequired
        },
        mixins: [Util.BackboneMixin],
        getBackboneModels: function() {
            return [this.props.article];
        },
        getInitialState: function() {
            return { };
        },
        componentWillMount: function() {
            if (this.props.article.isDownloaded()) {
                this.p1 = Storage.readText(this.props.article.getId()).done((result) => {
                    Util.log("rendered article from storage");
                    this.props.article.set("content", result);
                });
            } else {
                this.p1 = APIClient.getArticle(this.props.article.getId()).done((result) => {
                    Util.log("rendered article from web");
                    this.props.article.set("content", result.translated_html_content);
                }).fail(() => {
                    if (!this.isMounted()) {
                        return;
                    }
                    this.setState({articleDownloadError: true});
                });
            }
        },
        componentDidMount: function() {
            this.timerId = setTimeout(this.onReportComplete.bind(this), 5000);
        },
        onReportComplete: function() {
            if (models.CurrentUser.isSignedIn()) {
                models.CurrentUser.reportArticleRead(this.props.article);
            }
        },
        componentWillUnmount: function() {
            clearTimeout(this.timerId);
        },
        render: function() {
            Util.log("render article: :%o", this.props.article);
            if (this.state.articleDownloadError) {
                return <img className="video-placeholder" src="img/offline.png"/>;
            } else if (this.props.article.get("content")) {
                return <article dangerouslySetInnerHTML={{
                    __html: this.props.article.get("content")
                }}/>;

            }
            return <article/>;
        }
    });

    /**
     * Represents a single video, it will load the video dynamically and
     * display it to the user.
     */
    var VideoViewer = React.createClass({
        propTypes: {
            video: React.PropTypes.object.isRequired
        },
        componentWillMount: function() {
            Util.log("VideoViewer will mount");
            if (models.AppOptions.get("showTranscripts")) {
                this.transcriptPromise = $.Deferred();
                APIClient.getVideoTranscript(this.props.video.getYoutubeId()).done((transcript) => {
                    if (transcript && transcript.length === 0) {
                        return;
                    }
                    // This will cause a second re-render but that's OK
                    this.setState({transcript: transcript});
                    this.transcriptPromise.resolve();
                }).fail((e) => {
                    this.transcriptPromise.reject(e);
                });
            }

            if (this.props.video.isDownloaded()) {
                Storage.readAsBlob(this.props.video.getId()).done((result) => {
                    var download_url = URL.createObjectURL(result);
                    this.setState({downloadedUrl: download_url, showOfflineImage: false});
                });
            }

            Util.log('video: %o', this.props.video);
            this.videoId = this.props.video.getId();
            this.initSecondWatched = 0;
            this.lastSecondWatched = 0;
            if (this.props.video.get("lastSecondWatched") &&
                    this.props.video.get("lastSecondWatched") + 10 < this.props.video.getDuration()) {
                this.initSecondWatched = this.props.video.get("lastSecondWatched");
            }
            this.secondsWatched = 0;
            this.lastReportedTime = new Date();
            this.lastWatchedTimeSinceLastUpdate = new Date();
            this.pointsPerReport = this.availablePoints * this.MIN_SECONDS_BETWEEN_REPORTS / this.props.video.getDuration();
            this.pointsObj = {num: this.props.video.getPoints()};
        },
        componentWillUnmount: function() {
            if (this.state.downloadedUrl) {
                Util.log("Revoking: " + this.state.downloadedUrl);
                URL.revokeObjectURL(this.state.downloadedUrl);
            }
            if (this.refs.video) {
                var video = this.refs.video.getDOMNode();
                // Do a reset to make sure all data is cleared right away.
                // Otherwise the app degrades and doesn't play videos anymore
                // after about 15 minutes of use while viewing videos.
                video.src = "";
                video.load();
            }
            if (this.youtubePlayerTimer) {
                clearInterval(this.youtubePlayerTimer);
            }
            this.cleanedUp = true;
        },
        onClickTranscript: function(obj) {
            var startSecond = obj.start_time / 1000 | 0;
            var video = this.refs.video.getDOMNode();
            video.currentTime = startSecond;
            video.play();
        },
        getInitialState: function() {
            return { showOfflineImage: false };
        },
        _canPlayYoutube: function() {
            if (this.initSecondWatched) {
                this.player.seekTo(this.initSecondWatched);
                Util.log('set current time to: ' + this.initSecondWatched);
                delete this.initSecondWatched;
            }
            if (this.state.showOfflineImage) {
                Util.log("Video has no source.", e);
                this.stopAnimatingPoints(false);
                this.setState({showOfflineImage: false});
            }
        },
        _canPlayHTML5: function() {
            var video = this.refs.video.getDOMNode();
            if (this.initSecondWatched) {
                video.currentTime = this.initSecondWatched;
                Util.log('set current time to: ' + video.currentTime);
                delete this.initSecondWatched;
            }
            if (this.state.showOfflineImage) {
                Util.log("Video has no source.", e);
                this.stopAnimatingPoints(false);
                this.setState({showOfflineImage: false});
            }
        },
        _onPlay: function(e) {
            // Update lastWatchedTimeSinceLastUpdate so that we
            // don't count paused time towards secondsWatched
            Util.warn("Video play: %o", e);
            this.lastWatchedTimeSinceLastUpdate = new Date();
            this.isPlaying = true;
            this.animatePoints();
        },
        _onPause: function(e) {
            this.updateSecondsWatched();
            this.isPlaying = false;
            this.stopAnimatingPoints(false);
        },
        _onStop: function(e) {
            this.updateSecondsWatched();
            this.isPlaying = false;
            this.stopAnimatingPoints(true);
        },
        _onEnded: function(e) {
            // If we're full screen, exit out.
            document.mozCancelFullScreen();
        },
        _onNetworkProgress: function(e) {
            if (!this.isMounted()) {
                return;
            }
            var video = this.refs.video.getDOMNode();
            Util.log("Network state changed: ", video.networkState);
        },
        _onError: function(e) {
            Util.warn("Video error: %o", e);
            if (!this.refs.video) {
                return;
            }

            var video = this.refs.video.getDOMNode();
            if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                Util.log("Video has no source.", e);
                this.stopAnimatingPoints(false);
                if (!this.state.downloadedUrl && !this.cleanedUp) {
                    this.setState({showOfflineImage: true});
                }
            }

            if (!e.target || !e.target.error ||
                    e.target.error.code === undefined) {
                return;
            }

            // video playback failed - show a message saying why
            switch (e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    Util.warn("video error: You aborted the video playback.");
                break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    Util.warn("video error: A network error caused the video download to fail part-way.");
                break;
                case e.target.error.MEDIA_ERR_DECODE:
                    Util.warn("The video playback was aborted due to a corruption problem or because the video used features your browser did not support.");
                break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    Util.warn("The video could not be loaded, either because the server or network failed or because the format is not supported.");
                    break;
                default:
                    Util.warn("An unknown error occurred.");
                    break;
           }
        },
        _onTimeupdateHTML5: function(e) {
            if (!this.isMounted()) {
                return;
            }
            // Sometimes a 'timeupdate' event will come before a 'play' event when
            // resuming a paused video. We need to get the play event before reporting
            // seconds watched to properly update the secondsWatched though.
            if (this.isPlaying && this.refs.video) {
                var video = this.refs.video.getDOMNode();
                this.reportSecondsWatched(video.currentTime, video.duration);
                this._onScrollTranscriptTo(video.currentTime);
            }
        },
        _onScrollTranscriptTo: function(scrollTime) {
            scrollTime |= scrollTime;
            var node = $("li[data-time='" + scrollTime + "']");
            var ul = $("ul");
            if (node.length > 0) {
                var scrollOffset = node.get(0).offsetTop -
                    $("ul.transcript").get(0).offsetTop;
                $("ul.transcript").stop(true, true).animate({
                    scrollTop: scrollOffset
                }, 400);
            }
        },
        youtubePlayerStates: {
            unstarted: -1,
            ended: 0,
            playing: 1,
            paused: 2,
            buffering: 3,
            videoCued: 5
        },
        shouldUseYoutubePlayer: function() {
            return models.AppOptions.get("useYouTubePlayer") &&
                !this.props.video.isDownloaded();
        },
        componentDidMount: function() {
            if (this.shouldUseYoutubePlayer()) {
                Util.log("Loading Youtube player for YID: " + this.props.video.getYoutubeId());
                this.player = new YT.Player('player', {
                    width: '900',
                    height: '506',
                    videoId: this.props.video.getYoutubeId(),
                    playerVars: {
                        modestbranding: 1,
                        showinfo: 0,
                        origin: location.protocol + "//" + location.hostname
                    },
                    events: {
                        onReady: () => {
                            $(".throbber").hide();
                            this._canPlayYoutube();
                        },
                        onError: function() {
                            Util.error('onError!');
                        },
                        onStateChange: (e) => {
                            var state = e.data;
                            Util.log('on youtube player state changed: :' + state);
                            if (state === this.youtubePlayerStates.cued) {
                            } else if (state === this.youtubePlayerStates.paused) {
                                this._onPause();
                            } else if (state === this.youtubePlayerStates.playing) {
                                this._onPlay();
                            } else if (state === this.youtubePlayerStates.buffering) {
                                this.stopAnimatingPoints(false);
                            }
                        }

                    }
                });
                this.youtubePlayerTimer = setInterval(() => {
                    if (this.player.getCurrentTime && this.player.getDuration && this.isPlaying) {
                        Util.log("currentTime: " + this.player.getCurrentTime());
                        Util.log("duration: " + this.player.getDuration());
                        this.reportSecondsWatched(this.player.getCurrentTime(), this.player.getDuration());
                        this._onScrollTranscriptTo(this.player.getCurrentTime());
                    }
                }, 1000);
            } else {
                // Add an event listener to track watched time
                var video = this.refs.video.getDOMNode();
                video.addEventListener("canplay", this._canPlayHTML5.bind(this));
                video.addEventListener("progress", this._onNetworkProgress.bind(this));
                video.addEventListener("timeupdate", this._onTimeupdateHTML5);
                video.addEventListener("play", this._onPlay.bind(this), true);
                video.addEventListener("pause", this._onPause.bind(this), true);
                video.addEventListener("stop", this._onStop.bind(this), true);
                video.addEventListener("ended", this._onEnded.bind(this), true);
                video.addEventListener("error", this._onError.bind(this), true);
                video.defaultPlaybackRate = models.AppOptions.get("playbackRate") / 100;
                video.playbackRate = models.AppOptions.get("playbackRate") / 100;
            }
        },

        // Updates the secondsWatched variable with the difference between the current
        // time and the time stamp stored in lastWatchedTimeSinceLastUpdate.
        updateSecondsWatched: function() {
            var currentTime = new Date();
            this.secondsWatched += (currentTime.getTime() - this.lastWatchedTimeSinceLastUpdate.getTime()) / 1000;
            this.lastWatchedTimeSinceLastUpdate = currentTime;
        },

        availablePoints: 750,

        // Start animating the points going up
        animatePoints: function() {
            // Never start animating if we aren't playing.
            // This was sometimes happening after the video was complete,
            // and new progress responses were received.
            if (!this.isPlaying ||
                    !models.CurrentUser.isSignedIn()) {
                return;
            }

            var points = Math.min(this.availablePoints, this.pointsObj.num + this.pointsPerReport);
            $(this.pointsObj).stop(true, false).animate({num: points}, {
                // Add an extra second to the duration so the UI never looks like it's stuck waiting for the HTTP reply
                duration: this.MIN_SECONDS_BETWEEN_REPORTS * 1000,
                step: (num) => {
                    this.pointsObj.num = Math.ceil(num);
                    var pointsString = document.webL10n.get("points-so-far",
                        {"earned" : this.pointsObj.num, "available": this.availablePoints});
                    $(".energy-points.energy-points-video").text(pointsString);
                }
            });
        },

        // Stop the current animation and jump to the end
        stopAnimatingPoints: function(jumpToEnd) {
            $(this.pointsObj).stop(true, jumpToEnd);
        },

        // Reports the seconds watched to the server if it hasn't been reported recently
        // or if the lastSecondWatched is at the end of the video.
        reportSecondsWatched: function(currentTime, duration) {
            if (!models.CurrentUser.isSignedIn()) {
                return;
            }

            // Report watched time to the server
            this.lastSecondWatched = Math.round(currentTime);
            this.updateSecondsWatched();
            var currentTime = new Date();
            var secondsSinceLastReport = (currentTime.getTime() - this.lastReportedTime.getTime()) / 1000;
            if (secondsSinceLastReport >= this.MIN_SECONDS_BETWEEN_REPORTS || this.lastSecondWatched >= (duration | 0)) {
                this.lastReportedTime = new Date();
                models.CurrentUser.reportVideoProgress(this.props.video,
                        this.props.video.getYoutubeId(),
                        this.secondsWatched,
                        this.lastSecondWatched).done(() => {
                            // We could just add a backbone model to watch for video model
                            // changes and it would work automatically, but to get animated points
                            // growing, we need to do it manually.
                            // Re-animate the points
                            this.pointsObj.num = this.props.video.getPoints();
                            this.animatePoints();
                        });
                this.secondsWatched = 0;
            }
        },

        onReloadVideo: function() {
            Util.log("Calling video load!");
            if (this.refs.video) {
               this.refs.video.getDOMNode().load();
            }
        },

        render: function() {
            var transcriptViewer;
            if (!!this.state.transcript) {
                transcriptViewer = <TranscriptViewer collection={this.state.transcript}
                                                     onClickTranscript={this.onClickTranscript} />;
            }

            var videoSrc = this.props.video.getDownloadUrl();
            if (this.state.downloadedUrl) {
                videoSrc = this.state.downloadedUrl;
            }
            Util.log('video rendered with url: ' + videoSrc);
            var pointsString = document.webL10n.get("points-so-far",
                        {"earned" : this.props.video.getPoints(), "available": this.availablePoints});
            var pointsDiv;
            if (models.CurrentUser.isSignedIn()) {
                pointsDiv = <div className="energy-points energy-points-video pull-right">{pointsString}</div>;
            }

            var videoClass = cx({
              'video-has-transcript': !!this.state.transcript
            });

            var control;
            if (this.state.showOfflineImage) {
                control = <div className="video-placeholder" onClick={this.onReloadVideo}/>;
            } else if (this.shouldUseYoutubePlayer()) {
                control = <div>
                        <div className="throbber"/>
                        <div className={videoClass} id="player"/>
                    </div>;
            } else {
                control = <video className={videoClass} src={videoSrc} ref="video" preload="auto"
                                 type={this.props.video.getContentMimeType()} controls></video>;
            }

            // The overlay div helps with a bug where html5 video sometimes doesn't render properly.
            // I'm not sure exactly why but I guess maybe it pushes out the painting to its own layer
            // or something along those lines.
            // http://fastly.kastatic.org/KA-youtube-converted/wx2gI8iwMCA.mp4/wx2gI8iwMCA.mp4
            return <div className="video-viewer-container">
                {control}
                 <div className="video-info-bar">{pointsDiv}</div>
                 <div id="overlay"></div>
                {transcriptViewer}
            </div>;
        },
        MIN_SECONDS_BETWEEN_REPORTS: 10
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
        handleUseYouTubePlayerChange: function(event) {
            this.props.options.set("useYouTubePlayer", event.target.checked);
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

                {/*
                <div data-l10n-id="use-youtube-player">Use YouTube player</div>
                <label className="pack-switch">
                <input ref="useYouTubePlayer"
                       type="checkbox"
                       checked={this.props.options.get("useYouTubePlayer")}
                       onChange={this.handleUseYouTubePlayerChange}></input>
                <span></span>
                </label>
                */}
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
        TopicListItem,
        VideoListItem,
        ArticleListItem,
        BackButton,
        MenuButton,
        TopicViewer,
        ContentListViewer,
        TranscriptItem,
        TranscriptViewer,
        ArticleViewer,
        VideoViewer,
        AppHeader,
        TopicSearch,
        StatusBarViewer,
        Sidebar,
        DownloadsViewer,
        SettingsViewer,
        SearchResultsViewer,
        ProfileViewer,
        MainView
    };
});
