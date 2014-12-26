"use strict";

define([window.isTest ? "react-dev" : "react", "util", "models", "apiclient", "storage"],
        function(React, Util, models, APIClient, Storage) {
    var cx = React.addons.classSet;

    /**
     * Represents a single exercise, it will load the exercise dynamically and
     * display it to the user.
     */
    var ExerciseViewer = React.createClass({
        propTypes: {
            exercise: React.PropTypes.object.isRequired
        },
        mixins: [Util.BackboneMixin],
        getBackboneModels: function() {
            return [this.props.exercise];
        },
        getInitialState: function() {
            return { };
        },
        refreshRandomAssessment: function() {
            var count = this.exercise.all_assessment_items.length;
            var randomIndex = Math.floor(Math.random() * count);
            var randomAssessmentId = this.exercise.all_assessment_items[randomIndex].id;
            APIClient.getAssessmentItem(randomAssessmentId).done((result) => {
                console.log("got assessment item: %o: item data: %o", result, JSON.parse(result.item_data));
                this.setState({
                    perseusItemData: JSON.parse(result.item_data)
                });
            });
        },
        componentWillMount: function() {
            if (this.props.exercise.isPerseusExercise()) {
                APIClient.getExerciseByName(this.props.exercise.getName()).done((result) => {
                    this.exercise = result;
                    console.log("got exercise: %o", result);
                    this.refreshRandomAssessment();
                });
            }
        },
        componentDidMount: function() {
        },
        componentWillUnmount: function() {
        },
        render: function() {
            if (this.state.error) {
                return <div>Could not load exercise</div>;
            } else if (this.props.exercise.isKhanExercisesExercise()) {
                var path = `/khan-exercises/exercises/${this.props.exercise.getFilename()}`;
                return <iframe src={path}/>;
            } else if(this.state.perseusItemData) {
                console.log(this.state.perseusItemData);
                window.p = this.state.perseusItemData;
                return <div>{this.state.perseusItemData.question.content}</div>
            }
            Util.log("render exercise: :%o", this.props.exercise);
            return <div>TODO: Render exercise :)</div>;
        }
    });

    return {
        ExerciseViewer,
    };
});
