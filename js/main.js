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

    var TopicItem = React.createClass({
        getInitialState: function() {
            return {};
        },
        render: function() {
            var divStyle = {
                float: "left;",
                width: "0px;",
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

    var SigninButton = React.createClass({
        render: function() {
            var divStyle = {
                textAlign: "right",
                marginRight: "15px"
            };
                //backgroundColor: domain.color
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
            console.log("rendering!");
            if (this.props.topic.get("topics")) {
                var topics = _(this.props.topic.get("topics").models).map((topic) => {
                    return <TopicItem topic={topic}
                                      onClickTopic={this.props.onClickTopic}
                                      key={topic.get("slug")}/>;
                });
            }

            if (this.props.topic.get("videos")) {
                var videos = _(this.props.topic.get("videos").models).map((video) => {
                    return <VideoItem video={video}
                                      onClickVideo={this.props.onClickVideo}
                                      key={video.get("slug")}/>;
                });
            }

            var backButton;
            if (this.props.topic.get("parent")) {
                backButton = <BackButton model={this.props.topic}
                                         onClickBack={this.props.onClickBack}/>;
            }

            var topicList = <section data-type="list">
                        <header>{this.props.topic.getTitle()}</header>
                            <ul>
                            { !KA.isLoggedIn() ?
                                <SigninButton model={this.props.topic}
                                              onClickSignin={this.props.onClickSignin}/> : null }
                            {backButton}
                            {topics}
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
        onClickSignin: function() {
            KA.login();
        },
        render: function() {
            var control;
            if (this.state.currentModel.isTopic()) {
                control = <TopicViewer topic={this.state.currentModel}
                                       onClickTopic={this.onClickTopic}
                                       onClickVideo={this.onClickVideo}
                                       onClickBack={this.onClickBack}
                                       onClickSignin={this.onClickSignin}/>;
            } else {
                control = <VideoViewer  video={this.state.currentModel}
                                        onClickBack={this.onClickBack}/>;
            }
            //return <div>{control}</div>;
            return <div>
                <section id="drawer" role="region">
                    <header className="fixed">
                        <a href="#"><span className="icon icon-menu">hide sidebar</span></a>
                        <a href="#drawer"><span className="icon icon-menu">show sidebar</span></a>
                        <h1>Khan Academy</h1>
                    </header>
                </section>
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
    var topic = new models.TopicModel();

    // TODO: remove, just for easy inpsection
    window.topic = topic;
    window.KA = KA;

    // Init everything
    $.when(topic.fetch(), Storage.init(), KA.init()).done(function(topicData) {
        console.log('init proimse: ');
        React.renderComponent(<MainView model={topic}/>, mountNode);
        if (KA.isLoggedIn()) {
            KA.getTopicTree().done(function(data) {
                console.log(data);
            });
        } else {
            console.log('Not logged in!');
        }
     });
});
