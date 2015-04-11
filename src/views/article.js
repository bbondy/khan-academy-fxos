/* @flow */

"use strict";

const _ = require("underscore"),
    Util = require("../util"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    {reportArticleRead} = require("./article-actions"),
    component = require("omniscient");

const ArticleReadMixin = {
    componentDidMount: function() {
        this.timerId = setTimeout(() => {
            reportArticleRead(this.props.topicTreeNode).catch(() => {});
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
const ArticleViewer = component(ArticleReadMixin, ({topicTreeNode, options}) => {
    Util.log("render article: :%o", topicTreeNode);
    var articleObj = options.getIn(["temp", TopicTreeHelper.getKey(topicTreeNode)]);
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
