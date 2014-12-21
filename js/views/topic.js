"use strict";

define([window.isTest ? "react-dev" : "react", "util", "models"],
        function(React, Util, models) {
    var cx = React.addons.classSet;

    /**
     * Represents a single root, domain, subject, topic, or tutorial
     * item in the topic list.
     * This is represented as a single list item, and when clicked, the
     * list view will be replaced with a bunch of different TopicListItem
     * which are the children of the clicked item.
     */
    var TopicListItem = React.createClass({
        propTypes: {
            topic: React.PropTypes.object.isRequired,
            onClickTopic: React.PropTypes.func.isRequired
        },
        getInitialState: function() {
            return {};
        },
        render: function() {
            var topicClassObj = {
                'topic-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    this.props.topic.get("downloadCount") === 0
            };
            var parentDomain = this.props.topic.getParentDomain();
            topicClassObj[parentDomain.getId()] = true;
            var topicClass = cx(topicClassObj);

            return <li className={topicClass}>
                { this.props.topic.isRootChild() ?
                    <div className="color-block"/> : null }
                <a href="javascript:void(0)"
                   onClick={Util.partial(this.props.onClickTopic,
                       this.props.topic)}>
                    <p className="topic-title">{this.props.topic.getTitle()}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single video item in the topic list.
     * This renders the list item and not the actual video.
     * When clicked, it will render the video corresponding to this list item.
     */
    var VideoListItem = React.createClass({
        componentDidMount: function() {
        },
        propTypes: {
            video: React.PropTypes.object.isRequired,
            onClickVideo: React.PropTypes.func.isRequired
        },
        render: function() {
            var videoNodeClass = cx({
              'video-node': true,
              'completed': this.props.video.isCompleted(),
              'in-progress': this.props.video.isStarted()
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.video.isCompleted(),
                'in-progress': this.props.video.isStarted()
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var videoClassObj = {
                'video-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    !this.props.video.isDownloaded()
            };
            var parentDomain = this.props.video.getParentDomain();
            if (parentDomain) {
                subwayIconClassObj[parentDomain.getId()] = true;
                videoClassObj[parentDomain.getId()] = true;
                pipeClassObj[parentDomain.getId()] = true;
            }
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            this.videoClass = cx(videoClassObj);
            return <li className={this.videoClass}>
                <div className={subwayIconClass}>
                    <a href="javascript:void(0)"
                       onClick={Util.partial(this.props.onClickVideo,
                               this.props.video)}>
                        <div className={videoNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="javascript:void(0)"
                   onClick={Util.partial(this.props.onClickVideo,
                           this.props.video)}>
                    <p className="video-title">{this.props.video.getTitle()}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single article item in the topic list.
     * This renders the list item and not the actual article.
     * When clicked, it will render the article corresponding to this list item.
     */
    var ArticleListItem = React.createClass({
        propTypes: {
            article: React.PropTypes.object.isRequired,
            onClickArticle: React.PropTypes.func.isRequired
        },
        render: function() {
            var articleNodeClass = cx({
              'article-node': true,
              'completed': this.props.article.isCompleted(),
              'in-progress': this.props.article.isStarted()
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.article.isCompleted(),
                'in-progress': this.props.article.isStarted()
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var articleClassObj = {
                'article-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    !this.props.article.isDownloaded()
            };
            var parentDomain = this.props.article.getParentDomain();
            subwayIconClassObj[parentDomain.getId()] = true;
            articleClassObj[parentDomain.getId()] = true;
            pipeClassObj[parentDomain.getId()] = true;
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var articleClass = cx(articleClassObj);
            return <li className={articleClass}>
                <div className={subwayIconClass}>
                    <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickArticle, this.props.article)}>
                        <div className={articleNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickArticle, this.props.article)}>
                    <p className="article-title">{this.props.article.getTitle()}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single exercise item in the topic list.
     * This renders the list item and not the actual exercise.
     * When clicked, it will render the exercise corresponding to this list item.
     */
    var ExerciseListItem = React.createClass({
        propTypes: {
            exercise: React.PropTypes.object.isRequired,
            onClickExercise: React.PropTypes.func.isRequired
        },
        render: function() {
            var exerciseNodeClass = cx({
              'exercise-node': true,
              'completed': this.props.exercise.isCompleted(),
              'in-progress': this.props.exercise.isStarted()
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.exercise.isCompleted(),
                'in-progress': this.props.exercise.isStarted()
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var exerciseClassObj = {
                'exercise-item': true,
                'faded': models.AppOptions.get("showDownloadsOnly") &&
                    !this.props.exercise.isDownloaded()
            };
            var parentDomain = this.props.exercise.getParentDomain();
            subwayIconClassObj[parentDomain.getId()] = true;
            exerciseClassObj[parentDomain.getId()] = true;
            pipeClassObj[parentDomain.getId()] = true;
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            var exerciseClass = cx(exerciseClassObj);
            console.log('---');
            console.log(this.props.exercise);
            console.log(this.props.exercise.getTitle());
            return <li className={exerciseClass}>
                <div className={subwayIconClass}>
                    <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickExercise, this.props.exercise)}>
                        <div className={exerciseNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="javascript:void(0)" onClick={Util.partial(this.props.onClickExercise, this.props.exercise)}>
                    <p className="exercise-title">{this.props.exercise.getTitle()}</p>
                </a>
            </li>;
        }
    });

    /**
     * Represents a single topic and it displays a list of all of its children.
     * Each child of the list is a TopicListItem, VideoListItem, or ArticleListItem.
     */
    var TopicViewer = React.createClass({
        componentDidMount: function() {
        },
        propTypes: {
            topic: React.PropTypes.object.isRequired,
            onClickTopic: React.PropTypes.func.isRequired,
            onClickContentItem: React.PropTypes.func.isRequired
        },
        render: function() {
            var topics;
            if (this.props.topic.get("topics")) {
                topics = _(this.props.topic.get("topics").models).map((topic) => {
                    return <TopicListItem topic={topic}
                                          onClickTopic={this.props.onClickTopic}
                                          key={topic.getId()}/>;
                });
            }

            var contentItems;
            if (this.props.topic.get("contentItems")) {
                contentItems = _(this.props.topic.get("contentItems").models).map((contentItem) => {
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
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
                            {topics}
                            {contentItems}
                            </ul>
                    </section>;
            return <div className="topic-list-container">
                    {topicList}
            </div>;
        }
    });

    /**
     * Represents a list of content items.
     * This is used for displaying search results and download lists.
     * This always contains only a list of VideoListItems, or ARticleListItems.
     */
    var ContentListViewer = React.createClass({
        propTypes: {
            collection: React.PropTypes.object.isRequired,
            onClickContentItem: React.PropTypes.func.isRequired,
            onClickTranscript: React.PropTypes.func.isRequired
        },
        render: function() {
            var contentItems;
            if (this.props.collection.models) {
                contentItems = _(this.props.collection.models).map((contentItem) => {
                    if (contentItem.isVideo()) {
                        return <VideoListItem video={contentItem}
                                              onClickVideo={this.props.onClickContentItem}
                                              key={contentItem.getId()} />;
                    } else if(contentItem.isArticle()) {
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
    });

    return {
        TopicListItem,
        VideoListItem,
        ArticleListItem,
        ExerciseListItem,
        TopicViewer,
        ContentListViewer,
    };
});
