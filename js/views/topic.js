/* @flow */

"use strict";

var _ = require("underscore"),
    React = require("react"),
    classNames = require("classNames"),
    models = require("../models"),
    Util = require("../util"),
    {getId, getKey, getDownloadCount, mapChildTopicCursors, mapChildContentCursors, getTitle} = require("../data/topic-tree"),
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
                getDownloadCount(this.props.topicCursor),
        };
        topicClassObj[getId(this.props.parentDomainCursor)] = true;
        var topicClass = classNames(topicClassObj);
        return <li className={topicClass}>
            { this.props.topicCursor === this.props.parentDomainCursor ?
                <div className="color-block"/> : null }
            <a href="javascript:void(0)"
               onClick={_.partial(this.props.onClickTopic, this.props.topicCursor)}>
                <p className="topic-title">{getTitle(this.props.topicCursor)}</p>
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
class VideoListItem extends React.Component {
    render(): any {
        var videoNodeClass = classNames({
          "video-node": true,
          completed: this.props.video.isCompleted(),
          "in-progress": this.props.video.isStarted()
        });
        var pipeClassObj = {
            pipe: true,
            completed: this.props.video.isCompleted(),
            "in-progress": this.props.video.isStarted()
        };
        var subwayIconClassObj = {
            "subway-icon": true
        };
        var videoClassObj = {
            "video-item": true,
            faded: this.props.optionsCursor.get("showDownloadsOnly") &&
                !this.props.video.isDownloaded()
        };
        var parentDomain = this.props.video.getParentDomain();
        if (parentDomain) {
            subwayIconClassObj[parentDomain.getId()] = true;
            videoClassObj[parentDomain.getId()] = true;
            pipeClassObj[parentDomain.getId()] = true;
        }
        var subwayIconClass = classNames(subwayIconClassObj);
        var pipeClass = classNames(pipeClassObj);
        var videoClass = classNames(videoClassObj);
        return <li className={videoClass}>
            <div className={subwayIconClass}>
                <a href="javascript:void(0)"
                   onClick={_.partial(this.props.onClickVideo,
                           this.props.video)}>
                    <div className={videoNodeClass}/>
                </a>
                <div className={pipeClass}/>
            </div>
            <a href="javascript:void(0)"
               onClick={_.partial(this.props.onClickVideo,
                       this.props.video)}>
                <p className="video-title">{this.props.video.getTitle()}</p>
            </a>
        </li>;
    }
}
VideoListItem.propTypes = {
    video: React.PropTypes.object.isRequired,
    onClickVideo: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

/**
 * Represents a single article item in the topic list.
 * This renders the list item and not the actual article.
 * When clicked, it will render the article corresponding to this list item.
 */
class ArticleListItem extends React.Component {
    render(): any {
        var articleNodeClass = classNames({
          "article-node": true,
          completed: this.props.article.isCompleted(),
          "in-progress": this.props.article.isStarted()
        });
        var pipeClassObj = {
            pipe: true,
            completed: this.props.article.isCompleted(),
            "in-progress": this.props.article.isStarted()
        };
        var subwayIconClassObj = {
            "subway-icon": true
        };
        var articleClassObj = {
            "article-item": true,
            faded: this.props.optionsCursor.get("showDownloadsOnly") &&
                !this.props.article.isDownloaded()
        };
        var parentDomain = this.props.article.getParentDomain();
        subwayIconClassObj[parentDomain.getId()] = true;
        articleClassObj[parentDomain.getId()] = true;
        pipeClassObj[parentDomain.getId()] = true;
        var subwayIconClass = classNames(subwayIconClassObj);
        var pipeClass = classNames(pipeClassObj);
        var articleClass = classNames(articleClassObj);
        return <li className={articleClass}>
            <div className={subwayIconClass}>
                <a href="javascript:void(0)" onClick={_.partial(this.props.onClickArticle, this.props.article)}>
                    <div className={articleNodeClass}/>
                </a>
                <div className={pipeClass}/>
            </div>
            <a href="javascript:void(0)" onClick={_.partial(this.props.onClickArticle, this.props.article)}>
                <p className="article-title">{this.props.article.getTitle()}</p>
            </a>
        </li>;
    }
}
ArticleListItem.propTypes = {
    article: React.PropTypes.object.isRequired,
    onClickArticle: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

/**
 * Represents a single exercise item in the topic list.
 * This renders the list item and not the actual exercise.
 * When clicked, it will render the exercise corresponding to this list item.
 */
class ExerciseListItem extends React.Component {
    render(): any {
        var exerciseNodeClass = classNames({
          "exercise-node": true,
          completed: this.props.exercise.isCompleted(),
          "in-progress": this.props.exercise.isStarted()
        });
        var pipeClassObj = {
            pipe: true,
            completed: this.props.exercise.isCompleted(),
            "in-progress": this.props.exercise.isStarted()
        };
        var subwayIconClassObj = {
            "subway-icon": true
        };
        var exerciseClassObj = {
            "exercise-item": true,
            faded: this.props.optionsCursor.get("showDownloadsOnly") &&
                !this.props.exercise.isDownloaded()
        };
        var parentDomain = this.props.exercise.getParentDomain();
        subwayIconClassObj[parentDomain.getId()] = true;
        exerciseClassObj[parentDomain.getId()] = true;
        pipeClassObj[parentDomain.getId()] = true;
        var subwayIconClass = classNames(subwayIconClassObj);
        var pipeClass = classNames(pipeClassObj);
        var exerciseClass = classNames(exerciseClassObj);
        Util.log("Exercise: %o", this.props.exercise);
        return <li className={exerciseClass}>
            <div className={subwayIconClass}>
                <a href="javascript:void(0)" onClick={_.partial(this.props.onClickExercise, this.props.exercise)}>
                    <div className={exerciseNodeClass}/>
                </a>
                <div className={pipeClass}/>
            </div>
            <a href="javascript:void(0)" onClick={_.partial(this.props.onClickExercise, this.props.exercise)}>
                <p className="exercise-title">{this.props.exercise.getTitle()}</p>
            </a>
        </li>;
    }
}
ExerciseListItem.propTypes = {
    exercise: React.PropTypes.object.isRequired,
    onClickExercise: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

/**
 * Represents a single topic and it displays a list of all of its children.
 * Each child of the list is a TopicListItem, VideoListItem, or ArticleListItem.
 */
class TopicViewer extends React.Component {
    render(): any {
        var parentDomainCursor = this.props.parentDomainCursor;
        var topics = mapChildTopicCursors(this.props.topicCursor, (childTopicCursor) => {
            return <TopicListItem topicCursor={childTopicCursor}
                                  onClickTopic={this.props.onClickTopic}
                                  optionsCursor={this.props.optionsCursor}
                                  parentDomainCursor={parentDomainCursor || childTopicCursor}
                                  key={getKey(childTopicCursor)} />;
        });

        var contentItems = mapChildContentCursors(this.props.topicCursor, (contentItemCursors) => {
            if (contentItem.isVideo()) {
                return <VideoListItem videoCursor={contentItemCursor}
                                      onClickVideo={this.props.onClickContentItem}
                                      optionsCursor={this.props.optionsCursor}
                                      key={getKey(contentItemCursor)} />;
            } else if (contentItem.isArticle()) {
                return <ArticleListItem articleCursor={contentItemCursor}
                                        onClickArticle={this.props.onClickContentItem}
                                        optionsCursor={this.props.optionsCursor}
                                        key={getKey(contentItemCursor)} />;
            }
            return <ExerciseListItem exerciseCursor={contentItemCursor}
                                     onClickExercise={this.props.onClickContentItem}
                                     optionsCursor={this.props.optionsCursor}
                                     key={key(contentItemCursor)} />;
        });

        var topicList = <section data-type="list">
                    <ul>
                    {topics}
                        {contentItems}
                        </ul>
                </section>;
        return <div className="topic-list-container">
                {topicList}
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
        var contentItems;
        if (this.props.collection.models) {
            contentItems = _(this.props.collection.models).map((contentItem) => {
                if (contentItem.isVideo()) {
                    return <VideoListItem video={contentItem}
                                          onClickVideo={this.props.onClickContentItem}
                                          optionsCursor={this.props.optionsCursor}
                                          key={contentItem.getId()} />;
                } else if (contentItem.isArticle()) {
                    return <ArticleListItem article={contentItem}
                                            onClickArticle={this.props.onClickContentItem}
                                            key={contentItem.getId()} />;
                }
                return <ExerciseListItem exercise={contentItem}
                                         onClickExercise={this.props.onClickContentItem}
                                         key={contentItem.getId()} />;
            });
        }

        var topicList = <section data-type="list">
            <ul>
                {contentItems}
            </ul>
        </section>;

        return <div className="topic-list-container">
                {topicList}
        </div>;
    }
}
ContentListViewer.propTypes = {
    collection: React.PropTypes.object.isRequired,
    onClickContentItem: React.PropTypes.func.isRequired,
    optionsCursor: React.PropTypes.func.isRequired,
};

module.exports = {
    TopicListItem,
    VideoListItem,
    ArticleListItem,
    ExerciseListItem,
    TopicViewer,
    ContentListViewer,
};
