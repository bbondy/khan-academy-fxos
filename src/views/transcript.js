const _ = require("underscore"),
    component = require("omniscient");

/**
 * Represents a single transcript item for the list of transcript items.
 * When clicekd, it willl fast forward the video to that transcript item.
 */
const TranscriptItem = component(({transcriptItem}, {onClickTranscript}) => {
    var totalSeconds = transcriptItem.start_time / 1000 | 0;
    var startMinute = totalSeconds / 60 | 0;
    var startSecond = totalSeconds % 60 | 0;
    startSecond = ("0" + startSecond).slice(-2);
    return <li className="transcript-item" data-time={totalSeconds}>
        <a href="javascript:void(0)" onClick={_.partial(onClickTranscript, transcriptItem)}>
            <div>{startMinute}:{startSecond}</div>
            <div>{transcriptItem.text}</div>
        </a>
    </li>;
}).jsx;

/**
 * Represents the entire transcript, which is a list of TranscriptItems.
 */
const TranscriptViewer = component(({collection}, {onClickTranscript}) =>
    collection &&
        <ul className="transcript">
        {
            _(collection).map((transcriptItem) => {
                return <TranscriptItem transcriptItem={transcriptItem}
                    key={transcriptItem.start_time}
                    statics={{
                        onClickTranscript: onClickTranscript
                    }}/>;
            })
        }
        </ul>
).jsx;

module.exports = {
    TranscriptViewer,
    TranscriptItem,
};
