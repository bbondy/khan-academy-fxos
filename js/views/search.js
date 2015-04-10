/* @flow */

"use strict";

const $ = require("jquery"),
    React = require("react"),
    l10n = require("../l10n"),
    component = require("omniscient"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    topicViews = require("./topic");

const ContentListViewer = topicViews.ContentListViewer;

/**
 * Represents the topic search input item which is right below the header.
 */
const TopicSearch = component(({topicTreeCursor, optionsCursor}, {onTopicSearch}) => {
    const onChange = (event) => {
        var topicSearch = event.target.value;
        optionsCursor.setIn(["temp", "search"], topicSearch);
        onTopicSearch(topicSearch);
    };

    const onFocus = (event) => {
        // TODO
        /*
        setTimeout(() => {
            $("html, body").stop(true, true).animate({
                scrollTop: $(this.refs.search.getDOMNode()).offset().top
            }, 500);
        }, 500);
        */
    };

    const onBlur = (event) => {
        // TODO
        /*
        $("html, body").stop(true, true).animate({
            scrollTop: 0
        }, 700);
        */
    };

    console.log('render search');
    var text = l10n.get("search");
    if (TopicTreeHelper.getTitle(topicTreeCursor)) {
        text = l10n.get("search-topic", {
            topic: TopicTreeHelper.getTitle(topicTreeCursor)
        });
    }

    var searchValue = optionsCursor.getIn(["temp", "search"]);

    return <div>
        <input ref="search"
               className="search app-chrome"
               type="searh"
               placeholder={text}
               value={searchValue}
               required=""
               onChange={onChange.bind(this)}
               onFocus={onFocus.bind(this)}
               onBlur={onBlur.bind(this)}
               />
    </div>;
}).jsx;

/**
 * Represents a search result list which is basically just a wrapper around a
 * ContentListViewer for now.
 */
const SearchResultsViewer  = component(({collection}, {onClickContentItem}) => {
    var control = <ContentListViewer collection={this.props.collection}
                                     optionsCursor={this.props.optionsCursor}
                                     onClickContentItem={this.props.onClickContentItem} />;
    return <div className="topic-list-container">
        {control}
    </div>;
}).jsx;

module.exports = {
    TopicSearch,
    SearchResultsViewer,
};
