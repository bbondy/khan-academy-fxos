/* @flow */

"use strict";

const React = require("react"),
    _ = require("underscore"),
    Util = require("../util"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    {reportArticleRead} = require("./article-actions"),
    component = require("omniscient");

const ArticleReadMixin = {
    componentDidMount: function() {
        this.timerId = setTimeout(() => {
            reportArticleRead(this.props.topicTreeCursor).catch(() => {});
        }, 5000);
    },
    componentWillUnmount: function() {
        if (this.timerId) {
            clearTimeout(this.timerId);
        }
    },
};

/**
 * Represents a single article, it will load the article dynamically and
 * display it to the user.
 */
const ArticleViewer = component(ArticleReadMixin, ({topicTreeCursor, optionsCursor}) => {
    Util.log("render article: :%o", topicTreeCursor);
    var articleObj = optionsCursor.getIn(["temp", TopicTreeHelper.getKey(topicTreeCursor)]);
    if (articleObj && articleObj.error) {
        return <img className="video-placeholder" src="img/offline.png"/>;
    } else if (articleObj && articleObj.get("content")) {
        return <article dangerouslySetInnerHTML={{
            __html: articleObj.getIn(["content", "html_content"])
        }}/>;

    }
    return <article/>;
}).jsx;

module.exports = {
    ArticleViewer,
};
