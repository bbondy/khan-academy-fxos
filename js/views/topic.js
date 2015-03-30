/* @flow */

"use strict";

var _ = require("underscore"),
    classNames = require("classNames"),
    models = require("../models"),
    Util = require("../util"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    component = require("omniscient"),
    Cursor = require('immutable/contrib/cursor');

/**
 * Represents a single root, domain, subject, topic, or tutorial
 * item in the topic list.
 * This is represented as a single list item, and when clicked, the
 * list view will be replaced with a bunch of different TopicListItem
 * which are the children of the clicked item.
 */
const TopicListItem = component(({topicTreeCursor, domainTopicTreeCursor, optionsCursor}, {onClickTopic}) => {
    var topicClassObj = {
        "topic-item": true,
        faded: optionsCursor.get("showDownloadsOnly") &&
            TopicTreeHelper.getDownloadCount(topicTreeCursor),
    };
    topicClassObj[TopicTreeHelper.getId(domainTopicTreeCursor)] = true;
    var topicClass = classNames(topicClassObj);
    return <li className={topicClass}>
        { TopicTreeHelper.getKey(topicTreeCursor) === TopicTreeHelper.getKey(domainTopicTreeCursor) &&
            <div className="color-block"/> }
        <a href="javascript:void(0)"
           onClick={_.partial(onClickTopic, topicTreeCursor, domainTopicTreeCursor)}>
            <p className="topic-title">{TopicTreeHelper.getTitle(topicTreeCursor)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single video item in the topic list.
 * This renders the list item and not the actual video.
 * When clicked, it will render the video corresponding to this list item.
 */
const ContentListItem = component(({topicTreeCursor, domainTopicTreeCursor, optionsCursor}, {onClick}) => {
    var contentNodeClass = classNames({
      "article-node": TopicTreeHelper.isArticle(topicTreeCursor),
      "video-node": TopicTreeHelper.isVideo(topicTreeCursor),
      "exercise-node": TopicTreeHelper.isExercise(topicTreeCursor),
      completed: TopicTreeHelper.isCompleted(topicTreeCursor),
      "in-progress": TopicTreeHelper.isStarted(topicTreeCursor),
    });
    var pipeClassObj = {
        pipe: true,
        completed: TopicTreeHelper.isCompleted(topicTreeCursor),
        "in-progress": TopicTreeHelper.isStarted(topicTreeCursor),
    };
    var subwayIconClassObj = {
        "subway-icon": true,
    };
    var contentClassObj = {
        "video-item": TopicTreeHelper.isVideo(topicTreeCursor),
        "article-item": TopicTreeHelper.isArticle(topicTreeCursor),
        "exercise-item": TopicTreeHelper.isExercise(topicTreeCursor),
        faded: optionsCursor.get("showDownloadsOnly") &&
            !TopicTreeHelper.isDownloaded(topicTreeCursor)
    };
    if (domainTopicTreeCursor) {
        subwayIconClassObj[TopicTreeHelper.getId(domainTopicTreeCursor)] = true;
        contentClassObj[TopicTreeHelper.getId(domainTopicTreeCursor)] = true;
        pipeClassObj[TopicTreeHelper.getId(domainTopicTreeCursor)] = true;
    }
    var subwayIconClass = classNames(subwayIconClassObj);
    var pipeClass = classNames(pipeClassObj);
    var contentClass = classNames(contentClassObj);
    return <li className={contentClass}>
        <div className={subwayIconClass}>
            <a href="javascript:void(0)"
               onClick={_.partial(onClick, topicTreeCursor)}>
                <div className={contentNodeClass}/>
            </a>
            <div className={pipeClass}/>
        </div>
        <a href="javascript:void(0)"
           onClick={_.partial(onClick, topicTreeCursor)}>
            <p className="content-title">{TopicTreeHelper.getTitle(topicTreeCursor)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single topic and it displays a list of all of its children.
 * Each child of the list is a ContentListItem
 */
const TopicViewer = component(({topicTreeCursor, domainTopicTreeCursor, optionsCursor}, {onClickTopic, onClickContentItem}) => {
    var topics = TopicTreeHelper.mapChildTopicCursors(topicTreeCursor, (childTopicCursor) => {
        return <TopicListItem statics={{
                                  onClickTopic: onClickTopic
                              }}
                              topicTreeCursor={childTopicCursor}
                              optionsCursor={optionsCursor}
                              domainTopicTreeCursor={domainTopicTreeCursor || childTopicCursor}
                              key={TopicTreeHelper.getKey(childTopicCursor)} />;
    });

    var contentItems = TopicTreeHelper.mapChildContentCursors(topicTreeCursor, (topicTreeCursor) => {
        return <ContentListItem statics={{
                                    onClick: onClickContentItem
                                }}
                                topicTreeCursor={topicTreeCursor}
                                optionsCursor={optionsCursor}
                                domainTopicTreeCursor={domainTopicTreeCursor}
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
}).jsx;

/**
 * Represents a list of content items.
 * This is used for displaying search results and download lists.
 * This always contains only a list of VideoListItems, or ARticleListItems.
 */
const ContentListViewer = component(({topicTreeCursors, optionsCursor, onClickContentItem}) => {
    var contentItems = topicTreeCursors.map((topicTreeCursor) => {
        return <ContentListItem statics={{
                                    onClick: onClickContentItem
                                }}
                                videoCursor={topicTreeCursor}
                                optionsCursor={optionsCursor}
                                key={TopicTreeHelper.getKey(topicTreeCursor)} />;
    });

    return <div className="topic-list-container">
        <section data-type="list">
            <ul>
                {contentItems}
            </ul>
        </section>
    </div>;
}).jsx;

module.exports = {
    ContentListItem,
    TopicViewer,
    ContentListViewer,
};
