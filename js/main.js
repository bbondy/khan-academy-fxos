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
        "coach-res": "#3C5466"
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
                marginRight: "15px",
                backgroundColor: DomainColorMap[this.props.topic.get("slug")]
            };
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

    var VideoViewer = React.createClass({
        render: function() {
            console.log("props for video viewer: ");
            console.log(this.props);
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

                console.log('render title');
                var parentDomain = this.props.model.getParentDomain();
                var style;
                if (parentDomain) {
                    var domainColor = DomainColorMap[parentDomain.get("slug")];
                    if (domainColor) {
                    console.log('render title color found');
                        style = {
                            backgroundColor: domainColor
                        };
                    }
                }

                return <section id="drawer" role="region" className="skin-dark">
                    <header className="fixed" style={style}>
                        {backButton}
                        <h1>{this.props.model.get("translated_title")}</h1>
                    </header>
                    <Search model={this.props.model}/>
                </section>;
        }
    });


    var Search = React.createClass({
        render: function() {
            var style = {
                width: "100%",
                height: "3em;",
                position: "relative"
            };
            return <div>
                <input type="text" placeholder="Search..." required="" style={style}/>
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
                                       onClickSignin={this.onClickSignin}/>;
            } else {
                control = <VideoViewer  video={this.state.currentModel}/>;
            }
            //return <div>{control}</div>;
            return <div>
                <AppHeader model={this.state.currentModel}
                           onClickBack={this.onClickBack}/>
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

            console.log('init proimse: ');
            React.renderComponent(<MainView model={topic}/>, mountNode);
            Storage.readText("data.json").done(function(data) {
                console.log('read: ' + data);
            });
            if (KA.isLoggedIn()) {
                KA.getTopicTree().done(function(data) {
                    console.log(data);
                });
            } else {
                console.log('Not logged in!');
            }

            // TODO: remove, just for easy inpsection
            window.topic = topic;
            window.KA = KA;
        });
     });
});
