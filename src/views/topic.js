/* @flow */

"use strict";

import _ from "underscore";
import classNames from "classnames";
import {getDownloadCount, getId, getKey, getTitle, isArticle, isVideo,
    isExercise, isCompleted, isStarted, isDownloaded, mapChildTopicNodes,
    mapChildContentNodes} from "../data/topic-tree-helper";
import React from "react";
import component from "omniscient";

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
            getDownloadCount(topicTreeNode),
    };
    topicClassObj[getId(domainTopicTreeNode)] = true;
    var topicClass = classNames(topicClassObj);
    return <li className={topicClass}>
        { getKey(topicTreeNode) === getKey(domainTopicTreeNode) &&
            <div className="color-block"/> }
        <a href="javascript:void(0)"
           onClick={_.partial(onClickTopic, topicTreeNode, domainTopicTreeNode)}>
            <p className="topic-title">{getTitle(topicTreeNode)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single video item in the topic list.
 * This renders the list item and not the actual video.
 * When clicked, it will render the video corresponding to this list item.
 */
export const ContentListItem = component(({topicTreeNode, domainTopicTreeNode, options}, {onClick}) => {
    var contentNodeClass = classNames({
      "article-node": isArticle(topicTreeNode),
      "video-node": isVideo(topicTreeNode),
      "exercise-node": isExercise(topicTreeNode),
      completed: isCompleted(topicTreeNode),
      "in-progress": isStarted(topicTreeNode),
    });
    var pipeClassObj = {
        pipe: true,
        completed: isCompleted(topicTreeNode),
        "in-progress": isStarted(topicTreeNode),
    };
    var subwayIconClassObj = {
        "subway-icon": true,
    };
    var contentClassObj = {
        "video-item": isVideo(topicTreeNode),
        "article-item": isArticle(topicTreeNode),
        "exercise-item": isExercise(topicTreeNode),
        faded: options.get("showDownloadsOnly") &&
            !isDownloaded(topicTreeNode)
    };
    if (domainTopicTreeNode) {
        subwayIconClassObj[getId(domainTopicTreeNode)] = true;
        contentClassObj[getId(domainTopicTreeNode)] = true;
        pipeClassObj[getId(domainTopicTreeNode)] = true;
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
            <p className="content-title">{getTitle(topicTreeNode)}</p>
        </a>
    </li>;
}).jsx;

/**
 * Represents a single topic and it displays a list of all of its children.
 * Each child of the list is a ContentListItem
 */
export const TopicViewer = component(({topicTreeNode, domainTopicTreeNode, options}, {onClickTopic, onClickContentItem}) =>
    <div className="topic-list-container">
        <section data-type="list">
            <ul>
                {
                    // Output the child topics
                    mapChildTopicNodes(topicTreeNode, (childTopicNode) =>
                        <TopicListItem
                            statics={{
                                onClickTopic: onClickTopic
                            }}
                            topicTreeNode={childTopicNode}
                            options={options}
                            domainTopicTreeNode={domainTopicTreeNode || childTopicNode}
                            key={getKey(childTopicNode)} />
                    )
                }

                {
                    // Output the child content items
                    mapChildContentNodes(topicTreeNode, (topicTreeNode) =>
                        <ContentListItem
                            statics={{
                                onClick: onClickContentItem
                            }}
                            topicTreeNode={topicTreeNode}
                            options={options}
                            domainTopicTreeNode={domainTopicTreeNode}
                            key={getKey(topicTreeNode)} />
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
export const ContentListViewer = component(({topicTreeNodes, options}, {onClickContentItem}) =>
    <div className="topic-list-container">
        <section data-type="list">
            <ul>
                {
                    topicTreeNodes.map((topicTreeNode) => <ContentListItem statics={{
                            onClick: onClickContentItem
                        }}
                        topicTreeNode={topicTreeNode}
                        options={options}
                        key={getKey(topicTreeNode)} />
                    )
                }
            </ul>
        </section>
    </div>
).jsx;
