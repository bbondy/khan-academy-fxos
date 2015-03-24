/* @flow */

"use strict";

var _ = require("underscore"),
    React = require("react"),
    classNames = require("classNames"),
    models = require("../models"),
    Util = require("../util"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    Cursor = require('immutable/contrib/cursor');

/**
 * Represents a single root, domain, subject, topic, or tutorial
 * item in the topic list.
 * This is represented as a single list item, and when clicked, the
 * list view will be replaced with a bunch of different TopicListItem
 * which are the children of the clicked item.
 */
class TopicListItem extends React.Component {
    render(): any {
        var topicClassObj = {
            "topic-item": true,
            faded: this.props.optionsCursor.get("showDownloadsOnly") &&
                TopicTreeHelper.getDownloadCount(this.props.topicCursor),
        };
        topicClassObj[TopicTreeHelper.getId(this.props.parentDomainCursor)] = true;
        var topicClass = classNames(topicClassObj);
        return <li className={topicClass}>
            { this.props.topicCursor === this.props.parentDomainCursor &&
                <div className="color-block"/> }
            <a href="javascript:void(0)"
               onClick={_.partial(this.props.onClickTopic, this.props.topicCursor,this.props.parentDomainCursor)}>
                <p className="topic-title">{TopicTreeHelper.getTitle(this.props.topicCursor)}</p>
            </a>
        </li>;
    }
}
TopicListItem.propTypes = {
    topicCursor: React.PropTypes.object.isRequired,
    parentDomainCursor: React.PropTypes.object.isRequired,
    onClickTopic: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

/**
 * Represents a single video item in the topic list.
 * This renders the list item and not the actual video.
 * When clicked, it will render the video corresponding to this list item.
 */
class ContentListItem extends React.Component {
    render(): any {
        var contentNodeClass = classNames({
          "article-node": TopicTreeHelper.isArticle(this.props.topicTreeCursor),
          "video-node": TopicTreeHelper.isVideo(this.props.topicTreeCursor),
          "exercise-node": TopicTreeHelper.isExercise(this.props.topicTreeCursor),
          completed: TopicTreeHelper.isCompleted(this.props.topicTreeCursor),
          "in-progress": TopicTreeHelper.isStarted(this.props.topicTreeCursor),
        });
        var pipeClassObj = {
            pipe: true,
            completed: TopicTreeHelper.isCompleted(this.props.topicTreeCursor),
            "in-progress": TopicTreeHelper.isStarted(this.props.topicTreeCursor),
        };
        var subwayIconClassObj = {
            "subway-icon": true,
        };
        var contentClassObj = {
            "video-item": TopicTreeHelper.isVideo(this.props.topicTreeCursor),
            "article-item": TopicTreeHelper.isArticle(this.props.topicTreeCursor),
            "exercise-item": TopicTreeHelper.isExercise(this.props.topicTreeCursor),
            faded: this.props.optionsCursor.get("showDownloadsOnly") &&
                !TopicTreeHelper.isDownloaded(this.props.topicTreeCursor)
        };
        if (this.props.parentDomainCursor) {
            subwayIconClassObj[TopicTreeHelper.getId(this.props.parentDomainCursor)] = true;
            contentClassObj[TopicTreeHelper.getId(this.props.parentDomainCursor)] = true;
            pipeClassObj[TopicTreeHelper.getId(this.props.parentDomainCursor)] = true;
        }
        var subwayIconClass = classNames(subwayIconClassObj);
        var pipeClass = classNames(pipeClassObj);
        var contentClass = classNames(contentClassObj);
        return <li className={contentClass}>
            <div className={subwayIconClass}>
                <a href="javascript:void(0)"
                   onClick={_.partial(this.props.onClick, this.props.topicTreeCursor)}>
                    <div className={contentNodeClass}/>
                </a>
                <div className={pipeClass}/>
            </div>
            <a href="javascript:void(0)"
               onClick={_.partial(this.props.onClick, this.props.topicTreeCursor)}>
                <p className="content-title">{TopicTreeHelper.getTitle(this.props.topicTreeCursor)}</p>
            </a>
        </li>;
    }
}
ContentListItem.propTypes = {
    topicTreeCursor: React.PropTypes.object.isRequired,
    parentDomainCursor: React.PropTypes.object.isRequired,
    onClick: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

/**
 * Represents a single topic and it displays a list of all of its children.
 * Each child of the list is a ContentListItem
 */
class TopicViewer extends React.Component {
    render(): any {
        var topics = TopicTreeHelper.mapChildTopicCursors(this.props.topicCursor, (childTopicCursor) => {
            return <TopicListItem topicCursor={childTopicCursor}
                                  onClickTopic={this.props.onClickTopic}
                                  optionsCursor={this.props.optionsCursor}
                                  parentDomainCursor={this.props.parentDomainCursor || childTopicCursor}
                                  key={TopicTreeHelper.getKey(childTopicCursor)} />;
        });

        var contentItems = TopicTreeHelper.mapChildContentCursors(this.props.topicCursor, (topicTreeCursor) => {
            return <ContentListItem topicTreeCursor={topicTreeCursor}
                                    onClick={this.props.onClickContentItem}
                                    optionsCursor={this.props.optionsCursor}
                                    parentDomainCursor={this.props.parentDomainCursor}
                                    key={TopicTreeHelper.getKey(topicTreeCursor)} />;
        });

        return <div className="topic-list-container">
            <section data-type="list">
                <ul>
                    {topics}
                    {contentItems}
                </ul>
            </section>
        </div>;
    }
}
TopicViewer.propTypes = {
    topicCursor: React.PropTypes.object.isRequired,
    onClickTopic: React.PropTypes.func.isRequired,
    onClickContentItem: React.PropTypes.func.isRequired,
};

/**
 * Represents a list of content items.
 * This is used for displaying search results and download lists.
 * This always contains only a list of VideoListItems, or ARticleListItems.
 */
class ContentListViewer extends React.Component {
    render(): any {
        var contentItems = this.props.topicTreeCursors.map((topicTreeCursor) => {
            return <ContentListItem videoCursor={topicTreeCursor}
                                    onClick={this.props.onClickContentItem}
                                    optionsCursor={this.props.optionsCursor}
                                    key={TopicTreeHelper.getKey(topicTreeCursor)} />;
        });

        return <div className="topic-list-container">
            <section data-type="list">
                <ul>
                    {contentItems}
                </ul>
            </section>
        </div>;
    }
}
ContentListViewer.propTypes = {
    topicTreeCursors: React.PropTypes.object.isRequired,
    onClickContentItem: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

module.exports = {
    ContentListItem,
    TopicViewer,
    ContentListViewer,
};
