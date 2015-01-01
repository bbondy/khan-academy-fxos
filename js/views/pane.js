"use strict";

define(["react", "util", "models", "downloads", "topic"],
        function(React, Util, models, Downloads, topicViews) {
    var cx = React.addons.classSet;
    var ContentListViewer = topicViews.ContentListViewer;

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
        handleAutoUpdateTopicTreeChange: function(event) {
            this.props.options.set("autoUpdateTopicTree", event.target.checked);
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

                <div data-l10n-id="auto-update-topic-tree">Automatically download new topics</div>
                <label className="pack-switch">
                <input ref="autoUpdateTopicTree"
                       className="auto-update-topic-tree-setting"
                       type="checkbox"
                       checked={this.props.options.get("autoUpdateTopicTree")}
                       onChange={this.handleAutoUpdateTopicTreeChange}></input>
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

    return {
        DownloadsViewer,
        SettingsViewer,
        ProfileViewer,
    };
});
