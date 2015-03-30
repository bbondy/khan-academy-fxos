/* @flow */

"use strict";

var $ = require("jquery"),
    React = require("react"),
    l10n = require("../l10n"),
    component = require("omniscient"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    topicViews = require("./topic");

var ContentListViewer = topicViews.ContentListViewer;

/**
 * Represents the topic search input item which is right below the header.
 */
class TopicSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchValue: ""
        };
    }
    onChange(event: any) {
        var topicSearch = event.target.value;
        this.setState({
            searchValue: topicSearch
        });
        this.props.onTopicSearch(topicSearch);
    }
    onFocus(event: any) {
        setTimeout(() => {
            $("html, body").stop(true, true).animate({
                scrollTop: $(this.refs.search.getDOMNode()).offset().top
            }, 500);
        }, 500);
    }
    onBlur(event: any) {
        $("html, body").stop(true, true).animate({
            scrollTop: 0
        }, 700);
    }

    render(): any {
        var text = l10n.get("search");
        if (TopicTreeHelper.getTitle(this.props.topicTreeCursor)) {
            text = l10n.get("search-topic", {
                topic: TopicTreeHelper.getTitle(this.props.topicTreeCursor)
            });
        }
        return <div>
            <input ref="search"
                   className="search app-chrome"
                   type="searh"
                   placeholder={text}
                   value={this.state.searchValue}
                   required=""
                   onChange={this.onChange.bind(this)}
                   onFocus={this.onFocus.bind(this)}
                   onBlur={this.onBlur.bind(this)}
                   />
        </div>;

    }
}
TopicSearch.propTypes = {
    topicTreeCursor: React.PropTypes.object.isRequired,
    onTopicSearch: React.PropTypes.func.isRequired
};

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
