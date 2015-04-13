/* @flow */

"use strict";

const React = require("react"),
    l10n = require("../l10n"),
    component = require("omniscient"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    topicViews = require("./topic");

const ContentListViewer = topicViews.ContentListViewer;

/**
 * Represents the topic search input item which is right below the header.
 */
const TopicSearch = component(({topicTreeNode, searchValue, navInfo}, {onTopicSearch, editSearch}) => {
    const onChange = (event) => {
        var topicSearch = event.target.value;
        editSearch(() => topicSearch);
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

    var text = l10n.get("search");
    if (TopicTreeHelper.getTitle(topicTreeNode)) {
        text = l10n.get("search-topic", {
            topic: TopicTreeHelper.getTitle(topicTreeNode)
        });
    }

    return <div>
        <input ref="search"
               className="search app-chrome"
               type="searh"
               placeholder={text}
               value={searchValue || ""}
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
const SearchResultsViewer  = component(({options, collection}, {onClickContentItem}) => {
    var control = <ContentListViewer topicTreeNodes={collection}
                                     options={options}
                                     statics={{
                                         onClickContentItem,
                                     }}/>;
    return <div className="topic-list-container">
        {control}
    </div>;
}).jsx;

module.exports = {
    TopicSearch,
    SearchResultsViewer,
};
