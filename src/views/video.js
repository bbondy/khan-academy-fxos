/* @flow  */

"use strict";

import l10n from "../l10n";
import $ from "jquery";
import React from "react";
import classNames from "classnames";
import Util from "../util";
import component from "omniscient";
import {getId, getContentMimeType, getPoints, getDownloadUrl,
    getDuration} from "../data/topic-tree-helper";
import {TranscriptViewer} from "./transcript.js";
import {isSignedIn, reportVideoProgress} from "../user";

const minSecondsBetweenReports = 10;

/**
 * Represents a single video
 * This will mostly be refactored later once the state is brought up into the
 * parent object state model.
 */
const VideoMixin = {
    componentWillMount: function() {
        Util.log("VideoMixin will mount: %o", this.props.topicTreeNode);
        this.videoId = getId(this.props.topicTreeNode);
        this.initSecondWatched = 0;
        this.lastSecondWatched = 0;
        if (this.props.topicTreeNode.get("lastSecondWatched") &&
                this.props.topicTreeNode.get("lastSecondWatched") + 10 < getDuration(this.props.topicTreeNode)) {
            this.initSecondWatched = this.props.topicTreeNode.get("lastSecondWatched");
        }
        this.secondsWatched = 0;
        this.lastReportedTime = new Date();
        this.lastWatchedTimeSinceLastUpdate = new Date();
        this.pointsPerReport = this.availablePoints * minSecondsBetweenReports / getDuration(this.props.topicTreeNode);
        this.pointsObj = {num: getPoints(this.props.topicTreeNode)};
    },
    componentWillUnmount: function() {
        var downloadedUrl = this.props.videoStore.get("video");
        if (downloadedUrl) {
            Util.log("Revoking: " + downloadedUrl);
            window.URL.revokeObjectURL(downloadedUrl);
        }
        var video = this.getVideoDOMNode();
        if (video) {
            video.removeEventListener("canplay", this.canPlayHTML5);
            video.removeEventListener("progress", this.onNetworkProgress);
            video.removeEventListener("timeupdate", this.onTimeupdateHTML5);
            video.removeEventListener("play", this.onPlay);
            video.removeEventListener("pause", this.onPause);
            video.removeEventListener("stop", this.onStop);
            video.removeEventListener("ended", this.onEnded);
            video.removeEventListener("error", this.onError);

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
    canPlayHTML5: function() {
        var video = this.getVideoDOMNode();
        if (video && this.initSecondWatched) {
            video.currentTime = this.initSecondWatched;
            Util.log("set current time to: " + video.currentTime);
            delete this.initSecondWatched;
        }


        if (this.props.videoStore.get("showOfflineImage")) {
            this.stopAnimatingPoints(false);
            this.props.statics.editVideo((videoData) => videoData.merge({
                showOfflineImage: false,
            }));
        }
    },
    onPlay: function(e: any) {
        // Update lastWatchedTimeSinceLastUpdate so that we
        // don't count paused time towards secondsWatched
        Util.warn("Video play: %o", e);
        this.lastWatchedTimeSinceLastUpdate = new Date();
        this.isPlaying = true;
        this.animatePoints();
    },
    onPause: function() {
        this.updateSecondsWatched();
        this.isPlaying = false;
        this.stopAnimatingPoints(false);
    },
    onStop: function() {
        this.updateSecondsWatched();
        this.isPlaying = false;
        this.stopAnimatingPoints(true);
    },
    onEnded: function() {
        // If we're full screen, exit out.
        var doc: any = document;
        var cancelFullScreen = doc.mozCancelFullScreen;
        if (typeof cancelFullScreen === "function") {
            cancelFullScreen();
        }
    },
    onNetworkProgress: function() {
        if (!this.isMounted()) {
            return;
        }
        var video = this.getVideoDOMNode();
        if (video) {
            Util.log("Network state changed: ", video.networkState);
        }
    },
    onError: function(e: any) {
        Util.warn("Video error: %o", e);
        var video = this.getVideoDOMNode();
        if (!video) {
            return;
        }

        if (video && video.networkState === window.HTMLMediaElement.NETWORK_NO_SOURCE) {
            Util.log("Video has no source.", e);
            this.stopAnimatingPoints(false);
            var downloadedUrl = this.props.videoStore.get("downloadedUrl");
            if (!downloadedUrl && !this.cleanedUp) {
                this.props.statics.editVideo((videoData) => videoData.merge({
                    showOfflineImage: true,
                }));
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
    getVideoDOMNode: function(): any {
        if (!this.videoNode) {
            return null;
        }
        return this.videoNode.get(0);
    },
    onTimeupdateHTML5: function() {
        if (!this.isMounted()) {
            return;
        }
        // Sometimes a 'timeupdate' event will come before a 'play' event when
        // resuming a paused video. We need to get the play event before reporting
        // seconds watched to properly update the secondsWatched though.
        var video = this.getVideoDOMNode();
        if (video && this.isPlaying) {
            this.reportSecondsWatched(video.currentTime, video.duration);
            this.onScrollTranscriptTo(video.currentTime);
        }
    },
    onScrollTranscriptTo: function(scrollTime: number) {
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
    cleanedUp: false,
    videojs: null,

    componentDidMount: function() {
        var videoMountNode = this.refs.videoPlaceholder.getDOMNode();
        this.videoNode = $("<video width='640' height='264' type='" + getContentMimeType(this.props.topicTreeNode) + "'" +
            " id='video-player' class='" + this.videoClass + "' preload='auto' src='" + this.videoSrc + "' controls>" +
            "</video>");
        $(videoMountNode).append(this.videoNode);

        const videojs = require("../../bower_components/videojs");
        this.videojs = videojs(this.getVideoDOMNode(), {
                width: "100%",
                height: "100%"
        }, () => {
            Util.log("Videojs player is initialized and ready.");
            // Add an event listener to track watched time
            var video = this.getVideoDOMNode();
            if (video) {
                video.addEventListener("canplay", this.canPlayHTML5);
                video.addEventListener("progress", this.onNetworkProgress);
                video.addEventListener("timeupdate", this.onTimeupdateHTML5);
                video.addEventListener("play", this.onPlay, true);
                video.addEventListener("pause", this.onPause, true);
                video.addEventListener("stop", this.onStop, true);
                video.addEventListener("ended", this.onEnded, true);
                video.addEventListener("error", this.onError, true);
                video.defaultPlaybackRate = this.props.options.get("playbackRate") / 100;
                video.playbackRate = this.props.options.get("playbackRate") / 100;
            }
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
                !isSignedIn()) {
            return;
        }

        var points = Math.min(this.availablePoints, this.pointsObj.num + this.pointsPerReport);
        $(this.pointsObj).stop(true, false).animate({num: points}, {
            // Add an extra second to the duration so the UI never looks like it's stuck waiting for the HTTP reply
            duration: minSecondsBetweenReports * 1000,
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
    reportSecondsWatched: function(videoCurrentTime: Date, duration: number) {
        if (!isSignedIn()) {
            return;
        }

        // Report watched time to the server
        this.lastSecondWatched = Math.round(videoCurrentTime);
        this.updateSecondsWatched();
        var currentTime = new Date();
        var secondsSinceLastReport = (currentTime.getTime() - this.lastReportedTime.getTime()) / 1000;
        if (secondsSinceLastReport >= minSecondsBetweenReports || this.lastSecondWatched >= (duration | 0)) {
            this.lastReportedTime = new Date();
            reportVideoProgress(this.props.user,
                    this.props.topicTreeNode,
                    this.secondsWatched,
                    this.lastSecondWatched,
                    this.props.statics.editVideo,
                    this.props.statics.editUser).then(() => {
                        // We could just add a backbone model to watch for video model
                        // changes and it would work automatically, but to get animated points
                        // growing, we need to do it manually.
                        // Re-animate the points
                        this.pointsObj.num = getPoints(this.props.topicTreeNode);
                        this.animatePoints();
                    });
            this.secondsWatched = 0;
        }
    },
};

/**
 * Renders the little bar underneath the video for showing points earned
 */
export const VideoInfoBar = component(({earned, available}) =>
    isSignedIn() && <div className="video-info-bar">
       <div className="energy-points energy-points-video">{
            l10n.get("points-so-far", {
                earned,
                available,
            })
        }</div>
    </div> || null
).jsx;

/**
 * Renders the entire video component
 */
export const VideoViewer = component(VideoMixin, function({videoStore, topicTreeNode, domainTopicTreeNode}) {
    const onClickTranscript = (obj) => {
        var startSecond = obj.get("start_time") / 1000 | 0;
        var video = this.getVideoDOMNode();
        if (video) {
            video.currentTime = startSecond;
            video.play();
        }
    };

    const onReloadVideo = () => {
        Util.log("Calling video load!");
        var video = this.getVideoDOMNode();
        if (video) {
            video.load();
        }
    };

    this.videoSrc = videoStore.get("downloadedUrl") || getDownloadUrl(topicTreeNode);
    Util.log("video rendered with url: " + this.videoSrc);

    const domainId = domainTopicTreeNode && getId(domainTopicTreeNode) || "unknown";
    this.videoClass = classNames({
      "video-has-transcript": !!videoStore.get("transcript"),
      "video-js": true,
      "vjs-default-skin": true,
      "signed-in": isSignedIn(),
      [domainId]: !!domainTopicTreeNode,
    });

    var control;
    if (videoStore.get("showOfflineImage")) {
        control = <div className="video-placeholder" onClick={onReloadVideo}/>;
    } else {
        control = <div className={this.videoClass} ref="videoPlaceholder" id="video-placeholder"/>;
    }

    // The overlay div helps with a bug where html5 video sometimes doesn't render properly.
    // I'm not sure exactly why but I guess maybe it pushes out the painting to its own layer
    // or something along those lines.
    // http://fastly.kastatic.org/KA-youtube-converted/wx2gI8iwMCA.mp4/wx2gI8iwMCA.mp4
    return <div className="video-viewer-container">
        {control}
        <VideoInfoBar available={this.availablePoints} earned={getPoints(topicTreeNode)} />
        <div id="overlay"></div>
        <TranscriptViewer collection={videoStore.get("transcript")}
                          statics={{
                              onClickTranscript
                          }}/>
    </div>;
}).jsx;
