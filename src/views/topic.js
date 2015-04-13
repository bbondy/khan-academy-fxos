/* @flow */

"use strict";

const _ = require("underscore"),
    classNames = require("classnames"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    React = require("react"),
    component = require("omniscient");

/**
 * Represents a single root, domain, subject, topic, or tutorial
 * item in the topic list.
 * This is represented as a single list item, and when clicked, the
 * list view will be replaced with a bunch of different TopicListItem
 * which are the children of the clicked item.
 */
const TopicListItem = component(({topicTreeNode, domainTopicTreeNode, options}, {onClickTopic}) => {
    var topicClassObj = {
        "topic-item": true,
        faded: options.get("showDownloadsOnly") &&
            TopicTreeHelper.getDownloadCount(topicTreeNode),
    };
    topicClassObj[TopicTreeHelper.getId(domainTopicTreeNode)] = true;
    var topicClass = classNames(topicClassObj);
    return <li className={topicClass}>
        { TopicTreeHelper.getKey(topicTreeNode) === TopicTreeHelper.getKey(domainTopicTreeNode) &&
            <div className="color-block"/> }
        <a href="javascript:void(0)"
           onClick={_.partial(onClickTopic, topicTreeNode, domainTopicTreeNode)}>
            <p className="topic-title">{TopicTreeHelper.getTitle(topicTreeNode)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single video item in the topic list.
 * This renders the list item and not the actual video.
 * When clicked, it will render the video corresponding to this list item.
 */
const ContentListItem = component(({topicTreeNode, domainTopicTreeNode, options}, {onClick}) => {
    var contentNodeClass = classNames({
      "article-node": TopicTreeHelper.isArticle(topicTreeNode),
      "video-node": TopicTreeHelper.isVideo(topicTreeNode),
      "exercise-node": TopicTreeHelper.isExercise(topicTreeNode),
      completed: TopicTreeHelper.isCompleted(topicTreeNode),
      "in-progress": TopicTreeHelper.isStarted(topicTreeNode),
    });
    var pipeClassObj = {
        pipe: true,
        completed: TopicTreeHelper.isCompleted(topicTreeNode),
        "in-progress": TopicTreeHelper.isStarted(topicTreeNode),
    };
    var subwayIconClassObj = {
        "subway-icon": true,
    };
    var contentClassObj = {
        "video-item": TopicTreeHelper.isVideo(topicTreeNode),
        "article-item": TopicTreeHelper.isArticle(topicTreeNode),
        "exercise-item": TopicTreeHelper.isExercise(topicTreeNode),
        faded: options.get("showDownloadsOnly") &&
            !TopicTreeHelper.isDownloaded(topicTreeNode)
    };
    if (domainTopicTreeNode) {
        subwayIconClassObj[TopicTreeHelper.getId(domainTopicTreeNode)] = true;
        contentClassObj[TopicTreeHelper.getId(domainTopicTreeNode)] = true;
        pipeClassObj[TopicTreeHelper.getId(domainTopicTreeNode)] = true;
    }
    var subwayIconClass = classNames(subwayIconClassObj);
    var pipeClass = classNames(pipeClassObj);
    var contentClass = classNames(contentClassObj);
    return <li className={contentClass}>
        <div className={subwayIconClass}>
            <a href="javascript:void(0)"
               onClick={_.partial(onClick, topicTreeNode)}>
                <div className={contentNodeClass}/>
            </a>
            <div className={pipeClass}/>
        </div>
        <a href="javascript:void(0)"
           onClick={_.partial(onClick, topicTreeNode)}>
            <p className="content-title">{TopicTreeHelper.getTitle(topicTreeNode)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single topic and it displays a list of all of its children.
 * Each child of the list is a ContentListItem
 */
const TopicViewer = component(({topicTreeNode, domainTopicTreeNode, options}, {onClickTopic, onClickContentItem}) =>
    <div className="topic-list-container">
        <section data-type="list">
            <ul>
                {
                    // Output the child topics
                    TopicTreeHelper.mapChildTopicNodes(topicTreeNode, (childTopicNode) =>
                        <TopicListItem
                            statics={{
                                onClickTopic: onClickTopic
                            }}
                            topicTreeNode={childTopicNode}
                            options={options}
                            domainTopicTreeNode={domainTopicTreeNode || childTopicNode}
                            key={TopicTreeHelper.getKey(childTopicNode)} />
                    )
                }

                {
                    // Output the child content items
                    TopicTreeHelper.mapChildContentNodes(topicTreeNode, (topicTreeNode) =>
                        <ContentListItem
                            statics={{
                                onClick: onClickContentItem
                            }}
                            topicTreeNode={topicTreeNode}
                            options={options}
                            domainTopicTreeNode={domainTopicTreeNode}
                            key={TopicTreeHelper.getKey(topicTreeNode)} />
                    )
                }

            </ul>
        </section>
    </div>
).jsx;

/**
 * Represents a list of content items.
 * This is used for displaying search results and download lists.
 * This always contains only a list of VideoListItems, or ARticleListItems.
 */
const ContentListViewer = component(({topicTreeNodes, options}, {onClickContentItem}) =>
    <div className="topic-list-container">
        <section data-type="list">
            <ul>
                {
                    topicTreeNodes.map((topicTreeNode) => <ContentListItem statics={{
                            onClick: onClickContentItem
                        }}
                        topicTreeNode={topicTreeNode}
                        options={options}
                        key={TopicTreeHelper.getKey(topicTreeNode)} />
                    )
                }
            </ul>
        </section>
    </div>
).jsx;

module.exports = {
    ContentListItem,
    TopicViewer,
    ContentListViewer,
};
