/**
 * @jsx React.DOM
 */

"use strict";

define(["react", "models", "ka", "storage"], function(React, models, KA, Storage) {

    function partial( fn /*, args...*/) {
      var aps = Array.prototype.slice;
      var args = aps.call(arguments, 1);
      return function() {
        return fn.apply(this, args.concat(aps.call(arguments)));
      };
    }

    var DomainColorMap = {
        "new-and-noteworthy": "#ffffff",
        "math": "#156278",
        "science": "#822F3D",
        "economics-finance-domain": "#BB7B31",
        "humanities": "#C43931",
        "computing": "#568F3D",
        "test-prep": "#512D60",
        "partner-content": "#399B7C",
        "talks-and-interviews": "#3C5466",
        "coach-res": "#3C5466",
        "::app-search": "#3C5466"
    };

    var TopicItem = React.createClass({
        getInitialState: function() {
            return {};
        },
        render: function() {
            var divStyle = {
                float: "left;",
                width: "12px;",
                height: "100%",
                backgroundColor: DomainColorMap[this.props.topic.get("slug")]
            };
            return <li>
                { this.props.topic.isRootChild() ? <div style={divStyle}/> : null }
                <a href="#" onClick={partial(this.props.onClickTopic, this.props.topic)}>
                    <p className="topic-title">{this.props.topic.get("title")}</p>
                </a>
            </li>;
        }
    });

    var VideoItem = React.createClass({
        //console.log('inside video node: ' + this.props.completed);
        render: function() {
            var cx = React.addons.classSet;
            var videoNodeClass = cx({
              'video-node': true,
              'completed': this.props.completed
            });
            var pipeClassObj = {
                'pipe': true,
                'completed': this.props.completed
            };
            var subwayIconClassObj = {
                'subway-icon': true
            };
            var parentDomain = this.props.video.getParentDomain();
            subwayIconClassObj[parentDomain.get("id")] = true;
            pipeClassObj[parentDomain.get("id")] = true;
            var subwayIconClass = cx(subwayIconClassObj);
            var pipeClass = cx(pipeClassObj);
            console.log('subway icon class;');
            console.log(subwayIconClass);
            return <li className="video">
                <div className={subwayIconClass}>
                    <a href="#" onClick={partial(this.props.onClickVideo, this.props.video)}>
                        <div className={videoNodeClass}/>
                    </a>
                    <div className={pipeClass}/>
                </div>
                <a href="#" onClick={partial(this.props.onClickVideo, this.props.video)}>
                    <p className="video-title">{this.props.video.get("title")}</p>
                </a>
            </li>;
        }
    });

    var BackButton = React.createClass({
        render: function() {
            return <div>
                <a className="icon-menu-link " href="#" onClick={partial(this.props.onClickBack, this.props.model)}>
                    <span className="icon icon-back">Back</span>
                </a>
            </div>;
        }
    });

    var SigninButton = React.createClass({
        render: function() {
            var divStyle = {
                textAlign: "right",
                marginRight: "15px"
            };
            return <div style={divStyle}>
                <a href="#" onClick={partial(this.props.onClickSignin, this.props.model)}>
                    Sign In
                </a>
            </div>;
        }
    });

    var TopicViewer = React.createClass({
        componentDidMount: function() {
        },
        render: function() {
            if (this.props.topic.get("topics")) {
                var topics = _(this.props.topic.get("topics").models).map((topic) => {
                    return <TopicItem topic={topic}
                                      onClickTopic={this.props.onClickTopic}
                                      key={topic.get("slug")}/>;
                });
            }

            if (this.props.topic.get("videos")) {
                var videos = _(this.props.topic.get("videos").models).map((video) => {
                    var completed = KA.completedVideos.indexOf(video.get("id")) !== -1;
                    console.log('is video complete: ' + completed);
                    return <VideoItem video={video}
                                      onClickVideo={this.props.onClickVideo}
                                      key={video.get("slug")} completed={completed} />;
                });
            }

            var topicList = <section data-type="list">
                            <ul>
                            { !KA.isLoggedIn() ?
                                <SigninButton model={this.props.topic}
                                              onClickSignin={this.props.onClickSignin}/> : null }
                            {topics}
                            {videos}
                            </ul>
                    </section>;
            return <div>
                    {topicList}
            </div>;
        }
    });

    var VideoListViewer = React.createClass({
        render: function() {
            if (this.props.collection.models) {
                var videos = _(this.props.collection.models).map((video) => {
                    return <VideoItem video={video}
                                      onClickVideo={this.props.onClickVideo}
                                      key={video.get("slug")}/>;
                });
            }

            var topicList = <section data-type="list">
                <ul>
                    {videos}
                </ul>
            </section>;

            return <div>
                    {topicList}
            </div>;
        }
    });

    var VideoViewer = React.createClass({
        render: function() {
            return <div>
                 <video width="320" height="240" controls>
                    <source src={this.props.video.get("download_urls").mp4} type="video/mp4"/>
                 </video>
            </div>;
        }
    });

    var AppHeader = React.createClass({
        render: function() {
                var backButton;
                if (this.props.model.get("parent")) {
                    backButton = <BackButton model={this.props.model}
                                             onClickBack={this.props.onClickBack}/>;
                }

                var parentDomain = this.props.model.getParentDomain();
                var style;
                if (parentDomain) {
                    var domainColor = DomainColorMap[parentDomain.get("slug")];
                    if (domainColor) {
                        style = {
                            backgroundColor: domainColor
                        };
                    }
                }

                var title = "Khan Academy";
                if (this.props.model.get("translated_title")) {
                    title = this.props.model.get("translated_title");
                } else if (this.props.model.isVideoList()) {
                    title = "Search";
                }

                return <section id="drawer" role="region" className="skin-dark">
                    <header className="fixed" style={style}>
                        {backButton}
                        <h1>{title}</h1>
                    </header>
                    <Search model={this.props.model}
                            onSearch={this.props.onSearch}/>
                </section>;
        }
    });


    var Search = React.createClass({
        getInitialState: function() {
            return {value: ''};
        },
        componentWillReceiveProps: function() {
            this.state.value = '';
        },
        onChange: function(event) {
            var search = event.target.value;
            this.setState({value: search});
            this.props.onSearch(search);
        },
        render: function() {
            var style = {
                width: "100%",
                height: "3em;",
                position: "relative"
            };
            var text = "Search...";
            if (this.props.model.get("translated_title")) {
                text = "Search " + this.props.model.get("translated_title");
            }
            return <div>
                <input type="text"
                       placeholder={text}
                       value={this.state.value}
                       required=""
                       style={style}
                       onChange={this.onChange}/>
            </div>;

        }
    });

    var MainView = React.createClass({
        getInitialState: function() {
            return {
                currentModel: this.props.model
            };
        },
        onClickVideo: function(model) {
            this.setState({currentModel: model});
        },
        onClickTopic: function(model) {
            this.setState({currentModel: model});
        },
        onClickBack: function(model) {
            this.setState({currentModel: model.get("parent")});
        },
        onClickSignin: function() {
            KA.login();
        },
        onSearch: function(search) {
            if (!search) {
                this.setState({"currentModel": this.state.searchingModel, searchingModel: null});
                return;
            }
            var searchingModel = this.state.searchingModel;
            if (!searchingModel) {
                searchingModel = this.state.currentModel;
            }
            var results = searchingModel.findVideos(search);
            var videoList = new models.VideoList(results);
            this.setState({"currentModel": videoList, searchingModel: searchingModel});
        },
        render: function() {
            var control;
            if (this.state.currentModel.isTopic()) {
                control = <TopicViewer topic={this.state.currentModel}
                                       onClickTopic={this.onClickTopic}
                                       onClickVideo={this.onClickVideo}
                                       onClickSignin={this.onClickSignin}/>;
            } else if (this.state.currentModel.isVideoList()) {
                control = <VideoListViewer collection={this.state.currentModel}/>;
            } else {
                control = <VideoViewer  video={this.state.currentModel}/>;
            }
            //return <div>{control}</div>;
            return <div>
                <AppHeader model={this.state.currentModel}
                           onClickBack={this.onClickBack}
                           onSearch={this.onSearch}/>
                {control}
            </div>;
        }
    });

    /*
    // I thought this was supposed to be needed, but it seems to not be needed
    $.ajaxSetup({
        xhr: function() {return new window.XMLHttpRequest({mozSystem: true});}
    });
    */

    var mountNode = document.getElementById("app");

    // Init everything
    $.when(Storage.init(), KA.init()).done(function(topicData) {
        KA.getTopicTree().done(function(topicTreeData) {
            var topic = new models.TopicModel(topicTreeData, {parse: true});
            React.renderComponent(<MainView model={topic}/>, mountNode);
            Storage.readText("data.json").done(function(data) {
                console.log('read: ' + data);
            });
            if (KA.isLoggedIn()) {
                KA.getUserVideos().done(function(data) {
                    console.log("getUserVideos:");
                    console.log(data);
                });
            } else {
                console.log('Not logged in!');
            }

            // TODO: remove, just for easy inpsection
            window.topic = topic;
            window.KA = KA;
            window.React = React;
        });
     });
});
