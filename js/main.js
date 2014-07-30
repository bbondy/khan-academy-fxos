/**
 * @jsx React.DOM
 */

"use strict";

define(["react", "models", "ka"], function(React, models, KA) {

    function partial( fn /*, args...*/) {
      var aps = Array.prototype.slice;
      var args = aps.call(arguments, 1);
      return function() {
        return fn.apply(this, args.concat(aps.call(arguments)));
      };
    }

    var TopicItem = React.createClass({
        getInitialState: function() {
            return {};
        },
        render: function() {
            var divStyle = {
                float: "left;",
                width: "20px;",
                height: "100%",
                marginRight: "15px"
            };
                //backgroundColor: domain.color
            return <li>
                <div style={divStyle}/>
                <a href="#" onClick={partial(this.props.onClickTopic, this.props.topic)}>
                    <p>{this.props.topic.get("title")}</p>
                </a>
            </li>;
        }
    });

    var VideoItem = React.createClass({
        render: function() {
            var divStyle = {
                float: "left;",
                width: "20px;",
                height: "100%",
                marginRight: "15px"
            };
            //backgroundColor: domain.color
            return <li>
                <div style={divStyle}/>
                <a href="#" onClick={partial(this.props.onClickVideo, this.props.video)}>
                    <p>{this.props.video.get("title")}</p>
                </a>
            </li>;
        }
    });

    var BackButton = React.createClass({
        render: function() {
            var divStyle = {
                float: "left;",
                width: "20px;",
                height: "100%",
                marginRight: "15px"
            };
                //backgroundColor: domain.color
            return <li>
                <div style={divStyle}/>
                <a href="#" onClick={partial(this.props.onClickBack, this.props.model)}>
                    <p>Back</p>
                </a>
            </li>;
        }
    });

    var LoginButton = React.createClass({
        render: function() {
            var divStyle = {
                textAlign: "right",
                marginRight: "15px"
            };
                //backgroundColor: domain.color
            return <div style={divStyle}>
                <a href="#" onClick={partial(this.props.onClickLogin, this.props.model)}>
                    LOGIN
                </a>
            </div>;
        }
    });

    var TopicViewer = React.createClass({
        componentDidMount: function() {
        },
        render: function() {
            console.log("rendering!");
            var topics = _(this.props.topic.get("topics").models).map(function(topic) {
                return <TopicItem topic={topic}
                                  onClickTopic={this.props.onClickTopic}
                                  key={topic.get("slug")}/>;
            }.bind(this));
            var videos = _(this.props.topic.get("videos").models).map(function(video) {
                return <VideoItem video={video}
                                  onClickVideo={this.props.onClickVideo}
                                  key={video.get("slug")}/>;
            }.bind(this));

            var listStyle = {
                padding: "0",
                marginTop: "50px"
            };

            var backButton;
            if (this.props.topic.get("parent")) {
                backButton = <BackButton model={this.props.topic}
                                         onClickBack={this.props.onClickBack}/>;
            }

            var topicList =
                <div>
                    <section id="drawer" role="region">
                    <header className="fixed">
                        <a href="#"><span className="icon icon-menu">hide sidebar</span></a>
                        <a href="#drawer"><span className="icon icon-menu">show sidebar</span></a>
                        <h1>Khan Academy</h1>
                    </header>
                    </section>
                    <section data-type="list" style={listStyle}>
                        { !KA.isLoggedIn ?
                        <LoginButton model={this.props.topic}
                                    onClickLogin={this.props.onClickLogin}/> : null }
                        <ul style={listStyle}>
                        {backButton}
                        {topics}
                        {videos}
                        </ul>
                    </section>
                </div>;
            return topicList;
        }
    });

    var VideoViewer = React.createClass({
        render: function() {
            console.log("props for video viewer: ");
            console.log(this.props);
            return <div>
                 <BackButton model={this.props.video}
                             onClickBack={this.props.onClickBack}/>;
                 <video width="320" height="240" controls>
                    <source src={this.props.video.get("download_urls").mp4} type="video/mp4"/>
                 </video>
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
            console.log("onClickVideo for model: ");
            console.log(model);
            this.setState({currentModel: model});
        },
        onClickTopic: function(model) {
            console.log("onClickTopic for model: ");
            console.log(this);
            console.log(model);
            this.setState({currentModel: model});
        },
        onClickBack: function(model) {
            console.log("Click back on model: ");
            console.log(model);
            this.setState({currentModel: model.get("parent")});
        },
        onClickLogin: function() {
            KA.login();
        },
        render: function() {
            if (this.state.currentModel.isTopic()) {
                return <TopicViewer topic={this.state.currentModel}
                                    onClickTopic={this.onClickTopic}
                                    onClickVideo={this.onClickVideo}
                                    onClickBack={this.onClickBack}
                                    onClickLogin={this.onClickLogin}/>;
            }

            return <VideoViewer  video={this.state.currentModel}
                                 onClickBack={this.onClickBack}/>;
        }
    });

    var mountNode = document.getElementById("app");
    var topic = new models.TopicModel();

    // TODO: remove, just for easy inpsection
    window.topic = topic;

    // Init everything
    var initPromise = KA.init();
    $.when(topic.fetch(), initPromise).done(function(topicData) {
        console.log('init proimse: ');
        console.log(initPromise);
        React.renderComponent(<MainView model={topic}/>, mountNode);
        if (KA.isLoggedIn) {
            console.log('logged in, getUserVideos!');
            KA.getUserVideos().done(function(data) {
                console.log(data[0].video.description);
            });
        } else {
            console.log('No... nhuh uh!');
        }
     });
});
