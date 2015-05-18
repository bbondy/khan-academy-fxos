/* @flow */

"use strict";

import Util from "../util";
import React from "react";
import {getKey} from "../data/topic-tree-helper";
import {reportArticleRead} from "../user";
import component from "omniscient";

const ArticleReadMixin = {
    componentDidMount: function() {
        this.timerId = setTimeout(() => {
            reportArticleRead(this.props.user, this.props.topicTreeNode, this.props.statics.editUser).catch(() => {});
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
export const ArticleViewer = component(ArticleReadMixin, ({topicTreeNode, tempStore}) => {
    Util.log("render article: :%o", topicTreeNode);
    var articleObj = tempStore.getIn([getKey(topicTreeNode)]);
    if (articleObj && articleObj.get("error")) {
        return <img className="video-placeholder" src="img/offline.png"/>;
    } else if (articleObj && articleObj.get("content")) {
        return <article dangerouslySetInnerHTML={{
            __html: articleObj.getIn(["content", "html_content"])
        }}/>;

    }
    return <article/>;
}).jsx;
