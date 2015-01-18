"use strict";

// Perseus module uses React directly and uses $._ directly for
// localization, so we do this as a hack to get it to work
function perseusPrep($, React, katex, KAS, MathJax) {
    window.React = React;
    $._ = function(x) { return x; };
    window.$_ = function(x) { return x; };
    window.katex = katex;
    window.KAS = KAS;
    window.MathJax = MathJax;
}

define(["jquery", "react", "util", "models", "apiclient", "storage", "katex", "kas", "mathjax", "../khan-exercises/khan-exercise"],
        function($, React, Util, models, APIClient, Storage, katex, KAS, MathJax, Khan_) {
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

            // Pick a random problem type:
            var problemTypes = this.exercise.problem_types;
            var randomProblemTypeGroupIndex = Math.floor(Math.random() * problemTypes.length);
            var randomProblemTypeGroup = this.exercise.problem_types[randomProblemTypeGroupIndex];
            this.problemTypeName = randomProblemTypeGroup.name;

            var randomProblemTypeIndex = Math.floor(Math.random() * randomProblemTypeGroup.items.length);

            this.randomAssessmentSHA1 = randomProblemTypeGroup.items[randomProblemTypeIndex].sha1;
            this.randomAssessmentId = randomProblemTypeGroup.items[randomProblemTypeIndex].id;

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
            Util.log("score: %o", score);
            var attemptNumber = 1; // TODO
            var isCorrect = score.correct;
            var secondsTaken = 10; //TODO
            var data = {};
            APIClient.getTaskIfnoByExerciseName(this.props.exercise.getName()).then((info) => {
                data.taskId = info.id;
                return APIClient.getUserExercise(this.props.exercise.getName());
            }).then((info) => {
                var problemNumber = info.total_done + 1;
                Util.log("submitting exercise progress for problemNumber: %i", problemNumber);
                console.log("taskId: " + data.taskId);
                console.log("problemNumber: " + problemNumber);
                console.log("problem type name: " + this.problemTypeName);
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
                    Util.log("Perseus init done %o, %o", Perseus);
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
            } else if (this.ItemRenderer && this.state.perseusItemData) {
                var showHintsButton = this.state.perseusItemData.hints.length > this.state.hintsUsed;
                var hint;
                if (this.state.currentHint !== -1 &&
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
                                      data-l10n-id="hint"
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
