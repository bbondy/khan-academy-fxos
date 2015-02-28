/* @flow  */

"use strict";

var $ = require("jquery"),
    _ = require("underscore"),
    l10n = require("../l10n"),
    React = require("react/addons"),
    Util = require("../util"),
    models = require("../models"),
    APIClient = require("../apiclient"),
    Storage = require("../storage");

var cx = React.addons.classSet;

/**
 * Represents a single transcript item for the list of transcript items.
 * When clicekd, it willl fast forward the video to that transcript item.
 */
var TranscriptItem = React.createClass({
    propTypes: {
        transcriptItem: React.PropTypes.object.isRequired
    },
    render: function(): any {
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
        collection: React.PropTypes.array.isRequired,
        onClickTranscript: React.PropTypes.func.isRequired
    },
    render: function(): any {
        if (!this.props.collection) {
            return null;
        }
        var transcriptItems = _(this.props.collection).map((transcriptItem) => {
            return <TranscriptItem transcriptItem={transcriptItem}
                                   key={transcriptItem.start_time}
                                   onClickTranscript={this.props.onClickTranscript} />;
        });
        return <ul className="transcript">{transcriptItems}</ul>;
    }
});

/**
 * Represents a single video, it will load the video dynamically and
 * display it to the user.
 */
var VideoViewerRawObj: {
        videoClass: ?string;
        videoSrc: ?string;
        videoNode: any;
        videoId: ?string;
        initSecondWatched: number;
        lastSecondWatched: number;
        secondsWatched: number;
        lastReportedTime: Date;
        lastWatchedTimeSinceLastUpdate: Date;
        pointsPerReport: number;
        pointsObj: any;
        isPlaying: boolean;
        videoCreatedPromise: any;
        transcriptPromise: any;
        cleanedUp: boolean;
        videojs: any;
    } = {
    propTypes: {
        video: React.PropTypes.object.isRequired
    },
    componentWillMount: function() {
        Util.log("VideoViewer will mount");
        this.videoCreatedPromise = $.Deferred();
        if (models.AppOptions.get("showTranscripts")) {
            this.transcriptPromise = $.Deferred();
            APIClient.getVideoTranscript(this.props.video.getYoutubeId()).done((transcript) => {
                if (transcript && transcript.length === 0) {
                    return;
                }
                // This will cause a second re-render but that's OK
                this.setState({transcript: transcript});
                if (this.transcriptPromise) {
                    this.transcriptPromise.resolve();
                }
            }).fail((e) => {
                if (this.transcriptPromise) {
                    this.transcriptPromise.reject(e);
                }
            });
        }

        if (this.props.video.isDownloaded()) {
            Storage.readAsBlob(this.props.video.getId()).done((result) => {
                var download_url = window.URL.createObjectURL(result);
                this.setState({downloadedUrl: download_url, showOfflineImage: false});
            });
        }

        Util.log("video: %o", this.props.video);
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
            window.URL.revokeObjectURL(this.state.downloadedUrl);
        }
        var video = this._getVideoDOMNode();
        if (video) {
            video.removeEventListener("canplay", this._canPlayHTML5);
            video.removeEventListener("progress", this._onNetworkProgress);
            video.removeEventListener("timeupdate", this._onTimeupdateHTML5);
            video.removeEventListener("play", this._onPlay);
            video.removeEventListener("pause", this._onPause);
            video.removeEventListener("stop", this._onStop);
            video.removeEventListener("ended", this._onEnded);
            video.removeEventListener("error", this._onError);

            // This clears out the video buffer.  Without it playing videos
            // for around 10 minutes in the app causes future videos to never
            // load.
            Util.log("Clearing video buffer");
            video.src = "";
            video.load();

            if (this.videojs) {
                this.videojs.dispose();
            }
        }
        this.cleanedUp = true;
    },
    onClickTranscript: function(obj: any) {
        var startSecond = obj.start_time / 1000 | 0;
        var video = this._getVideoDOMNode();
        if (video) {
            video.currentTime = startSecond;
            video.play();
        }
    },
    getInitialState: function() {
        return {
            showOfflineImage: false
        };
    },
    _canPlayHTML5: function() {
        var video = this._getVideoDOMNode();
        if (video && this.initSecondWatched) {
            video.currentTime = this.initSecondWatched;
            Util.log("set current time to: " + video.currentTime);
            delete this.initSecondWatched;
        }
        if (this.state.showOfflineImage) {
            this.stopAnimatingPoints(false);
            this.setState({showOfflineImage: false});
        }
    },
    _onPlay: function(e: any) {
        // Update lastWatchedTimeSinceLastUpdate so that we
        // don't count paused time towards secondsWatched
        Util.warn("Video play: %o", e);
        this.lastWatchedTimeSinceLastUpdate = new Date();
        this.isPlaying = true;
        this.animatePoints();
    },
    _onPause: function(e: any) {
        this.updateSecondsWatched();
        this.isPlaying = false;
        this.stopAnimatingPoints(false);
    },
    _onStop: function(e: any) {
        this.updateSecondsWatched();
        this.isPlaying = false;
        this.stopAnimatingPoints(true);
    },
    _onEnded: function(e: any) {
        // If we're full screen, exit out.
        var doc: any = document;
        var cancelFullScreen = doc.mozCancelFullScreen;
        if (typeof cancelFullScreen === "function") {
            cancelFullScreen();
        }
    },
    _onNetworkProgress: function(e: any) {
        if (!this.isMounted()) {
            return;
        }
        var video = this._getVideoDOMNode();
        if (video) {
            Util.log("Network state changed: ", video.networkState);
        }
    },
    _onError: function(e: any) {
        Util.warn("Video error: %o", e);
        var video = this._getVideoDOMNode();
        if (!video) {
            return;
        }

        var video = this._getVideoDOMNode();
        if (video && video.networkState === window.HTMLMediaElement.NETWORK_NO_SOURCE) {
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
    _getVideoDOMNode: function(): any {
        if (!this.videoNode) {
            return null;
        }
        return this.videoNode.get(0);
    },
    _onTimeupdateHTML5: function(e: any) {
        if (!this.isMounted()) {
            return;
        }
        // Sometimes a 'timeupdate' event will come before a 'play' event when
        // resuming a paused video. We need to get the play event before reporting
        // seconds watched to properly update the secondsWatched though.
        var video = this._getVideoDOMNode();
        if (video && this.isPlaying) {
            this.reportSecondsWatched(video.currentTime, video.duration);
            this._onScrollTranscriptTo(video.currentTime);
        }
    },
    _onScrollTranscriptTo: function(scrollTime: number) {
        scrollTime |= scrollTime;
        var node = $("li[data-time='" + scrollTime + "']");
        if (node.length > 0) {
            var scrollOffset = node.get(0).offsetTop -
                $("ul.transcript").get(0).offsetTop;
            $("ul.transcript").stop(true, true).animate({
                scrollTop: scrollOffset
            }, 400);
        }
    },

    videoClass: null,
    videoSrc: null,
    videoNode: null,
    videoId: null,
    initSecondWatched: 0,
    lastSecondWatched: 0,
    secondsWatched: 0,
    lastReportedTime: new Date(),
    lastWatchedTimeSinceLastUpdate: new Date(),
    pointsPerReport: 0,
    pointsObj: {},
    isPlaying: false,
    videoCreatedPromise: null,
    transcriptPromise: null,
    cleanedUp: false,
    videojs: null,

    componentDidMount: function() {
        var videoMountNode = this.refs.videoPlaceholder.getDOMNode();
        this.videoNode = $("<video width='640' height='264' type='" + this.props.video.getContentMimeType() + "'" +
            " id='video-player' class='" + this.videoClass + "' preload='auto' src='" + this.videoSrc + "' controls>" +
            "</video>");
        $(videoMountNode).append(this.videoNode);

        var {requirejs} = require("../requirejs");
        requirejs(["./build/video.js"], (videojs) => {
            this.videojs = videojs(this._getVideoDOMNode(), {
                    width: "100%",
                    height: "100%"
            }, () => {
                Util.log("Videojs player is initialized and ready.");
                // Add an event listener to track watched time
                var video = this._getVideoDOMNode();
                if (video) {
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
                if (this.videoCreatedPromise) {
                    this.videoCreatedPromise.resolve();
                }
            });
        });
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
                var pointsString = l10n.get("points-so-far", {
                        earned: this.pointsObj.num,
                        available: this.availablePoints
                });
                $(".energy-points.energy-points-video").text(pointsString);
            }
        });
    },

    // Stop the current animation and jump to the end
    stopAnimatingPoints: function(jumpToEnd: boolean) {
        $(this.pointsObj).stop(true, jumpToEnd);
    },

    // Reports the seconds watched to the server if it hasn't been reported recently
    // or if the lastSecondWatched is at the end of the video.
    reportSecondsWatched: function(currentTime: Date, duration: number) {
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
        var video = this._getVideoDOMNode();
        if (video) {
            video.load();
        }
    },

    render: function(): any {
        var transcriptViewer;
        if (!!this.state.transcript) {
            transcriptViewer = <TranscriptViewer collection={this.state.transcript}
                                                 onClickTranscript={this.onClickTranscript} />;
        }

        this.videoSrc = this.props.video.getDownloadUrl();
        if (this.state.downloadedUrl) {
            this.videoSrc = this.state.downloadedUrl;
        }
        Util.log("video rendered with url: " + this.videoSrc);
        var pointsString = l10n.get("points-so-far", {
            earned: this.props.video.getPoints(),
            available: this.availablePoints
        });

        var pointsDiv;
        if (models.CurrentUser.isSignedIn()) {
            pointsDiv = <div className="energy-points energy-points-video">{pointsString}</div>;
        }

        var videoClassObj = {
          "video-has-transcript": !!this.state.transcript,
          "video-js": true,
          "vjs-default-skin": true,
          "signed-in": models.CurrentUser.isSignedIn()
        };
        var parentDomain = this.props.video && this.props.video.getParentDomain();
        if (parentDomain) {
            videoClassObj[parentDomain.getId()] = true;
        }
        this.videoClass = cx(videoClassObj);

        var control;
        if (this.state.showOfflineImage) {
            control = <div className="video-placeholder" onClick={this.onReloadVideo}/>;
        } else {
            control = <div className={this.videoClass} ref="videoPlaceholder" id="video-placeholder"/>;
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
};
var VideoViewer = React.createClass(VideoViewerRawObj);

module.exports = {
    VideoViewer: VideoViewer,
    TranscriptViewer: TranscriptViewer,
    TranscriptItem: TranscriptItem,
};
