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
            return {
                hintsUsed: 0,
                currentHint: -1
            };
        },
        refreshRandomAssessment: function() {
            var count = this.exercise.all_assessment_items.length;
            var randomIndex = Math.floor(Math.random() * count);
            this.randomAssessmentSHA1 = this.exercise.all_assessment_items[randomIndex].sha1;
            this.randomAssessmentId = this.exercise.all_assessment_items[randomIndex].id;
            var problemTypes = this.exercise.problem_types;
            this.problemTypeName = problemTypes[problemTypes.length - 1].name;
            APIClient.getAssessmentItem(this.randomAssessmentId).done((result) => {
                var assessment = JSON.parse(result.item_data);
                Util.log("Got assessment item: %o: item data: %o", result, assessment);
                this.setState({
                    perseusItemData: assessment
                });
            });
        },
        onClickRequestHint: function() {
            this.refs.itemRenderer.showHint();
            this.setState({
                hintsUsed: this.state.hintsUsed + 1,
                currentHint: this.state.currentHint + 1
            });
        },
        onClickSubmitAnswer: function() {
            var score = this.refs.itemRenderer.scoreInput();
            Util.log('score: %o', score);
            var attemptNumber = 1; // TODO
            var isCorrect = score.correct;
            var secondsTaken = 10; //TODO
            var problemType = ""; // TODO
            var data = {};
            APIClient.getTaskIfnoByExerciseName(this.props.exercise.getName()).then((info) => {
                data.taskId = info.id;
                return APIClient.getUserExercise(this.props.exercise.getName());
            }).then((info) => {
                var problemNumber = info.total_done + 1;
                Util.log("submitting exercise progress for problemNumber: %i", problemNumber);
                console.log('taskId: ' + data.taskId);
                console.log('problemNumber: ' + problemNumber);
                return APIClient.reportExerciseProgress(this.props.exercise.getName(), problemNumber,
                                                        this.randomAssessmentSHA1, this.randomAssessmentId,
                                                        secondsTaken, this.state.hintsUsed, isCorrect,
                                                        attemptNumber, this.problemTypeName, data.taskId);
            }).done(() => {
                this.refreshRandomAssessment();
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
                var showHintsButton = this.state.perseusItemData.hints.length > this.state.hintsUsed;
                var hint;
                if (this.state.currentHint != -1 &&
                        this.state.currentHint < this.state.perseusItemData.hints.length) {
                }
                content = <div className="framework-perseus">
                              <this.ItemRenderer ref="itemRenderer"
                                                 item={this.state.perseusItemData}
                                                 problemNum={Math.floor(Math.random() * 50) + 1}
                                                 initialHintsVisible={0}
                                                 enabledFeatures={{
                                                     highlight: true,
                                                     toolTipFormats: true
                                                 }} />
                              <div id="workarea"/>
                              <div id="solutionarea"/>

                              <button className="submit-answer-button"
                                      data-l10n-id="submit-answer"
                                      onClick={this.onClickSubmitAnswer}>Submit Answer</button>
                              { !showHintsButton ? null :
                              <button className="submit-answer-button"
                                      data-l10n-id="submit-answer"
                                      onClick={this.onClickRequestHint}>Hint</button>
                              }
                              {hint}
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
