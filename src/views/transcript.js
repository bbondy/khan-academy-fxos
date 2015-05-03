import _ from "underscore";
import React from "react";
import component from "omniscient";

const getTotalSeconds = (startMilliseconds) => {
    return startMilliseconds / 1000 | 0;
};

const getTimeFormat = (startMilliseconds) => {
    var totalSeconds = getTotalSeconds(startMilliseconds);
    var startMinute = totalSeconds / 60 | 0;
    var startSecond = totalSeconds % 60 | 0;
    startSecond = ("0" + startSecond).slice(-2);
    return `${startMinute}:${startSecond}`;
};

/**
 * Represents a single transcript item for the list of transcript items.
 * When clicekd, it willl fast forward the video to that transcript item.
 */
export const TranscriptItem = component(({transcriptItem}, {onClickTranscript}) =>
    <li className="transcript-item" data-time={getTotalSeconds(transcriptItem.get("start_time"))}>
        <a href="javascript:void(0)" onClick={_.partial(onClickTranscript, transcriptItem)}>
            <div>{getTimeFormat(transcriptItem.get("start_time"))}</div>
            <div>{transcriptItem.get("text")}</div>
        </a>
    </li>
).jsx;

/**
 * Represents the entire transcript, which is a list of TranscriptItems.
 */
export const TranscriptViewer = component(({collection}, {onClickTranscript}) =>
    <ul className="transcript">
    {
        collection.map((transcriptItem) => {
            return <TranscriptItem transcriptItem={transcriptItem}
                key={transcriptItem.get("start_time")}
                statics={{
                    onClickTranscript: onClickTranscript
                }}/>;
        })
    }
    </ul>
).jsx;
