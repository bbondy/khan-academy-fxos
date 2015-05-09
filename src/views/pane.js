/* @flow */

"use strict";

import l10n from "../l10n";
import Util from "../util";
import Downloads from "../downloads";
import React from "react";
import {ContentListViewer} from "./topic";
import component from "omniscient";
import { resetOptions } from "../data/app-options";

const NoDownloads = component(() =>
    <div className="downloads">
        <div data-l10n-id="no-downloads">You have no downloads yet!</div>
    </div>
).jsx;

/**
 * Represents a downloads list which is basically just a wrapper around a
 * ContentListViewer for now.
 */
export const DownloadsViewer = component(({options}, {onClickContentItem}) =>
    !Downloads.contentList.length ? <NoDownloads/> :
    <div className="downloads topic-list-container">
        <ContentListViewer topicTreeNodes={Downloads.contentList}
                           options={options}
                           statics={{
                               onClickContentItem,
                           }}/>;
    </div>
).jsx;

/**
 * Represents a list of settings which can be modified which affect
 * global state.
 */
export const SettingsViewer = component(({options}, {editOptions}) => {
    const onShowDownloadsChange = (event) => {
        editOptions((options) =>
            options.set("showDownloadsOnly", event.target.checked));
    };
    const onShowTranscriptsChange = (event) => {
        editOptions((options) =>
            options.set("showTranscripts", event.target.checked));
    };
    const onAutoUpdateTopicTreeChange = (event) => {
        editOptions((options) =>
            options.set("autoUpdateTopicTree", event.target.checked));
    };
    const onSetPlaybackRateChange = (event) => {
        // Convert a value like: 0, 1, 2, 3 to 50, 100, 150, 200
        var percentage = 50 + event.target.value * 50;
        editOptions((options) =>
            options.set("playbackRate", percentage));
    };
    const onReset = (event) => {
        if (confirm(l10n.get("confirm-reset"))) {
            editOptions(resetOptions);
        }
    };

    return <div className="settings topic-list-container">

        <div data-l10n-id="show-downloads-only">Show downloads only</div>
        <label className="pack-switch">
        <input ref="showDownloadsOnly"
               className="show-downloads-setting app-chrome"
               type="checkbox"
               checked={options.get("showDownloadsOnly")}
               onChange={onShowDownloadsChange.bind(this)}></input>
        <span></span>
        </label>

        <div data-l10n-id="show-transcripts">Show transcripts</div>
        <label className="pack-switch">
        <input ref="showTranscripts"
               className="show-transcripts-setting app-chrome"
               type="checkbox"
               checked={options.get("showTranscripts")}
               onChange={onShowTranscriptsChange.bind(this)}></input>
        <span></span>
        </label>

        <div data-l10n-id="auto-update-topic-tree">Automatically download new topics</div>
        <label className="pack-switch">
        <input ref="autoUpdateTopicTree"
               className="auto-update-topic-tree-setting app-chrome"
               type="checkbox"
               checked={options.get("autoUpdateTopicTree")}
               onChange={onAutoUpdateTopicTreeChange.bind(this)}></input>
        <span></span>
        </label>

        <div data-l10n-id="set-playback-speed">Set playback speed</div>
        <label class="icon"></label>
        <label className="bb-docs">
        <section role="slider">
            <input ref="setPlaybackRate"
                   className="set-playback-speed-setting app-chrome"
                   id="set-playback-speed"
                   type="range"
                   min="0" max="3"
                   value={(options.get("playbackRate") - 50) / 50}
                   onChange={onSetPlaybackRateChange.bind(this)}></input>
            <label class="icon">{options.get("playbackRate")}%</label>
            <span></span>
        </section>
        </label>

        <button id="reset-button"
                className="reset-button"
                data-l10n-id="reset-setting"
                onClick={onReset.bind(this)}>Reset</button>
    </div>;
}).jsx;

/**
 * Represents a user's profile. It gives the user information about their
 * username, badges, and points.
 */
export const ProfileViewer = component(({userInfo}) => {
    const images = [
        "/img/badges/meteorite-60x60.png",
        "/img/badges/moon-60x60.png",
        "/img/badges/earth-60x60.png",
        "/img/badges/sun-60x60.png",
        "/img/badges/eclipse-60x60.png",
        "/img/badges/master-challenge-blue-60x60.png"
    ];
    const titles= [
        "Meteorite Badges",
        "Moon Badges",
        "Earth Badges",
        "Sun Badges",
        "Black Hole Badges",
        "Challenge Patches"
    ];

    var pointsString = l10n.get("points");
    // TODO(bbondy): The title attributes on the images need to change
    // because you can't hover with your finger on FxOS Maybe just
    // when you tap it, it gives you the name underneath or something
    // like that.
    return <div className="profile">
        <img className="avatar" src={userInfo.get("avatarUrl")}/>
        <div className="username">{userInfo.get("nickname") || userInfo.get("username")}</div>
        <div className="points-header">{{pointsString}}: <div className="energy-points energy-points-profile">{Util.numberWithCommas(userInfo.get("points"))}</div></div>

        <div>
        { userInfo.get("badgeCounts").reverse().map((item, i) =>
            <span className="span2">
                <div className="badge-category-count">{item}</div>
                <img className="badge-category-icon" title={titles[i]} src={images[i]}/>
            </span>)
        }
        </div>
    </div>;
}).jsx;
