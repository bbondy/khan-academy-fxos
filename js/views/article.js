/* @flow */

"use strict";

var React = require("react"),
    Util = require("../util"),
    models = require("../models"),
    APIClient = require("../apiclient"),
    Storage = require("../storage");

/**
 * Represents a single article, it will load the article dynamically and
 * display it to the user.
 */
var ArticleViewer = React.createClass({
    propTypes: {
        article: React.PropTypes.object.isRequired
    },
    mixins: [Util.BackboneMixin],
    getBackboneModels: function(): Array<any> {
        return [this.props.article];
    },
    getInitialState: function() {
        return {};
    },
    componentWillMount: function() {
        if (this.props.article.isDownloaded()) {
            this.p1 = Storage.readText(this.props.article.getId()).then((result) => {
                Util.log("rendered article from storage");
                this.props.article.set("content", result);
            });
        } else {
            this.p1 = APIClient.getArticle(this.props.article.getId()).then((result) => {
                Util.log("rendered article from web");
                this.props.article.set("content", result.translated_html_content);
            }).catch(() => {
                if (!this.isMounted()) {
                    return;
                }
                this.setState({articleDownloadError: true});
            });
        }
    },
    componentDidMount: function() {
        this.timerId = setTimeout(this.onReportComplete.bind(this), 5000);
    },
    onReportComplete: function() {
        if (models.CurrentUser.isSignedIn()) {
            models.CurrentUser.reportArticleRead(this.props.article);
        }
    },
    componentWillUnmount: function() {
        clearTimeout(this.timerId);
    },
    render: function(): any {
        Util.log("render article: :%o", this.props.article);
        if (this.state.articleDownloadError) {
            return <img className="video-placeholder" src="img/offline.png"/>;
        } else if (this.props.article.get("content")) {
            return <article dangerouslySetInnerHTML={{
                __html: this.props.article.get("content")
            }}/>;

        }
        return <article/>;
    }
});

module.exports = {
    ArticleViewer,
};
