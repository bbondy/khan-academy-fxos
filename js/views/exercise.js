"use strict";

// Perseus module uses React directly and uses $._ directly for
// localization, so we do this as a hack to get it to work
function perseusPrep($, React, katex, KAS, MathJax) {
    window.React = React;
    $._ = function(x) { return x; };
    window.$_ = function(x) { return x; };
    window.katex = katex
    window.KAS = KAS;
    window.MathJax = MathJax;
}

define(["jquery", "react", "util", "models", "apiclient", "storage", "katex", "kas", "mathjax"],
        function($, React, Util, models, APIClient, Storage, katex, KAS, MathJax) {
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
            var randomAssessmentSHA1 = this.exercise.all_assessment_items[randomIndex].sha1;
            var randomAssessmentId = this.exercise.all_assessment_items[randomIndex].id;
            var problemTypes = this.exercise.problem_types;
            var problemTypeName = problemTypes[problemTypes.length - 1].name;
            APIClient.getAssessmentItem(randomAssessmentId).done((result) => {
                Util.log("got assessment item: %o: item data: %o", result, JSON.parse(result.item_data));
                this.setState({
                    perseusItemData: JSON.parse(result.item_data)
                });
                console.log("submitting exercise progres");
                // test
                var problemNumber = 2;
                var attemptNumber = 1;
                var isCorrect = true;
                var hintsUsed = 0;
                var secondsTaken = 10;
                var problemType = "";
                // TODO: Need to properly determine the problemNumber or else you get an out of order exception
                // on the server side (500 HTTP status code).
                APIClient.reportExerciseProgress(this.props.exercise.getName(), problemNumber,
                                                 randomAssessmentSHA1, randomAssessmentId,
                                                 secondsTaken, hintsUsed, isCorrect, attemptNumber,
                                                 problemTypeName);
            });
        },
        componentWillMount: function() {
            if (this.props.exercise.isPerseusExercise()) {
                APIClient.getExerciseByName(this.props.exercise.getName()).done((result) => {
                    this.exercise = result;
                    Util.log("got exercise: %o", result);
                    this.refreshRandomAssessment();
                });
            }

            perseusPrep($, React, katex, KAS, MathJax);
            require(["perseus"], (Perseus) => {
                Perseus.init({}).then(() => {
                    Util.log("Perseus init done");
                    this.ItemRenderer = Perseus.ItemRenderer;
                    this.forceUpdate();
                });
            });
        },
        componentDidMount: function() {
        },
        componentWillUnmount: function() {
        },
        render: function() {
            var content;
            if (this.state.error) {
                content = <div>Could not load exercise</div>;
            } else if (this.props.exercise.isKhanExercisesExercise()) {
                var path = `/khan-exercises/exercises/${this.props.exercise.getFilename()}`;
                content = <iframe src={path}/>;
            } else if(this.ItemRenderer && this.state.perseusItemData) {
                content = <div>
                              <this.ItemRenderer item={this.state.perseusItemData}
                                                 problemNum={Math.floor(Math.random() * 50) + 1}
                                                 initialHintsVisible={this.state.perseusItemData.hints.length}
                                                 enabledFeatures={{
                                                     highlight: true,
                                                     toolTipFormats: true
                                                 }} />
                              <div id="workarea"/>
                              <div id="solutionarea"/>
                              <div id="hintsarea"/>
                          </div>;
                }

            Util.log("render exercise: :%o", this.props.exercise);
            return <div className="exercise">
                {content}
            </div>;
        }
    });

    return {
        ExerciseViewer,
    };
});
