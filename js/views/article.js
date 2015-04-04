/* @flow */

"use strict";

const React = require("react"),
    Util = require("../util"),
    models = require("../models"),
    APIClient = require("../apiclient"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    Immutable = require("immutable"),
    {reportArticleRead} = require("./article-actions");
    Storage = require("../storage");

/**
 * Represents a single article, it will load the article dynamically and
 * display it to the user.
 */
const ArticleViewer = React.createClass({
    propTypes: {
        topicTreeCursor: React.PropTypes.object.isRequired
    },
    componentWillMount: function() {
        if (TopicTreeHelper.isDownloaded(this.props.topicTreeCursor)) {
            this.p1 = Storage.readText(TopicTreeHelper.getId(this.props.topicTreeCursor)).then((result) => {
                Util.log("rendered article from storage");
                this.props.optionsCursor.setIn(
                    ["temp", TopicTreeHelper.getKey(this.props.topicTreeCursor)],
                    Immutable.fromJS({
                        error: false,
                        content: result,
                    }));
            });
        } else {
            this.p1 = APIClient.getArticle(TopicTreeHelper.getId(this.props.topicTreeCursor)).then((result) => {
                Util.log("rendered article from web");
                this.props.optionsCursor.setIn(
                    ["temp", TopicTreeHelper.getKey(this.props.topicTreeCursor)],
                    Immutable.fromJS({
                        error: false,
                        content: result,
                    }));
            }).catch(() => {
                if (!this.isMounted()) {
                    return;
                }
                this.props.optionsCursor.setIn(
                    ["temp", TopicTreeHelper.getKey(this.props.topicTreeCursor)],
                    Immutable.fromJS({
                        error: true,
                    }));
            });
        }
    },
    componentDidMount: function() {
        this.timerId = setTimeout(this.onReportComplete.bind(this), 5000);
    },
    onReportComplete: function() {
        reportArticleRead(this.props.topicTreeCursor);
    },
    componentWillUnmount: function() {
        clearTimeout(this.timerId);
    },
    render: function(): any {
        Util.log("render article: :%o", this.props.topicTreeCursor);
        var articleObj = this.props.optionsCursor.getIn(["temp", TopicTreeHelper.getKey(this.props.topicTreeCursor)]);
        if (articleObj && articleObj.error) {
            return <img className="video-placeholder" src="img/offline.png"/>;
        } else if (articleObj && articleObj.content) {
            return <article dangerouslySetInnerHTML={{
                __html: articleObj.content.html_content
            }}/>;

        }
        return <article/>;
    }
});

module.exports = {
    ArticleViewer,
};
