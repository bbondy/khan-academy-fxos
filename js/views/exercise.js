/* @flow */

"use strict";

// Perseus module uses React directly and uses $._ directly for
// localization, so we do this as a hack to get it to work
function perseusPrep(katex, KAS, MathJax) {
    $._ = function(x) { return x; };
    window.$_ = function(x) { return x; };
    window.katex = katex;
    window.KAS = KAS;
}

var React = require("react/addons"),
    Util = require("../util"),
    APIClient = require("../apiclient"),
    l10n = require("../l10n"),
    _ = require("underscore"),
    $ = require("jquery");

window.Exercises = {
    cluesEnabled: false
};

/**
 * Represents a single exercise, it will load the exercise dynamically and
 * display it to the user.
 */
var ExerciseViewer = React.createClass({
    propTypes: {
        exercise: React.PropTypes.object.isRequired
    },
    mixins: [Util.BackboneMixin],
    getBackboneModels: function(): Array<any> {
        return [this.props.exercise];
    },
    getInitialState: function() {
        return {
            hintsUsed: 0,
            currentHint: -1
        };
    },
    refreshUserExerciseInfo: function() {
        return APIClient.getTaskInfoByExerciseName(this.props.exercise.getName()).then((info) => {
            this.setState({
                taskId: info.id,
                taskAttemptHistory: info.task_attempt_history
            });
            return APIClient.getUserExercise(this.props.exercise.getName());
        }).then((info) => {
            // TODO: Call this instead when the exercise loads and after submitting
            // Stash out info for the UI
            this.setState({
                level: info.exercise_progress.level,
                mastered: info.exercise_progress.mastered,
                practiced: info.exercise_progress.practiced,
                problemNumber: info.total_done + 1,
                streak: info.streak
            });
        });

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

        this.refreshUserExerciseInfo().then(() => {
            APIClient.getAssessmentItem(this.randomAssessmentId).done((result) => {
                var assessment = JSON.parse(result.item_data);
                Util.log("Got assessment item: %o: item data: %o", result, assessment);
                this.setState({
                    perseusItemData: assessment
                });
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
        APIClient.reportExerciseProgress(this.props.exercise.getName(), this.state.problemNumber,
            this.randomAssessmentSHA1, this.randomAssessmentId,
            secondsTaken, this.state.hintsUsed, isCorrect,
            attemptNumber, this.problemTypeName, this.state.taskId).done(() => {
                if (isCorrect) {
                    this.refreshRandomAssessment();
                } else {
                    // Refresh attempt info so it shows up as wrong
                    this.refreshUserExerciseInfo();
                }
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

        // TODO: Make this load async
        window._ = _;
        window.React = React;
        window.$ = $;
        $._ = (x) => x;
        window.jQuery = $;


        var Khan = require("../../khan-exercises/main");
        var MathJax = require("../../bower_components/MathJax/MathJax.js");
        Khan = window.Khan;
        MathJax = window.MathJax;
        window.KhanUtil = Khan.Util;

        console.log("Khan: %o", Khan);

        var katex = require("../../bower_components/katex/katex"),
            KAS = require("../../bower_components/KAS/kas"),
            Perseus = require("../../bower_components/perseus/perseus-2");
        console.log("katex %o:", katex);
        console.log("KAS %o:", KAS);
        console.log("Perseus %o:", Perseus);

        perseusPrep(katex, KAS, MathJax, Khan.Util);
        Perseus.init({}).then(() => {
            Util.log("Perseus init done %o, %o", Perseus);
            this.ItemRenderer = Perseus.ItemRenderer;
            this.forceUpdate();
        });
    },
    componentDidMount: function() {
    },
    componentWillUnmount: function() {
    },
    render: function(): any {
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

            // Always show 5 attempt icons with either pending, correct, hint or wrong
            var attemptIcons = [];
            this.state.taskAttemptHistory = this.state.taskAttemptHistory.slice(-5);
            for (var i = 0; i < 5; i++) {
                if (i >= this.state.taskAttemptHistory.length) {
                    attemptIcons.push(<i className="attempt-icon attempt-pending fa fa-circle-o"></i>);
                } else if (this.state.taskAttemptHistory[i].seen_hint) {
                    attemptIcons.push(<i className="attempt-icon attempt-hint  fa fa-lightbulb-o"></i>);
                } else if (!this.state.taskAttemptHistory[i].correct) {
                    attemptIcons.push(<i className="attempt-icon attempt-wrong fa fa-times-circle-o"></i>);
                } else {
                    attemptIcons.push(<i className="attempt-icon attempt-correct fa fa-check-circle-o"></i>);
                }
            }

            var streakText;
            if (this.state.streak > 5) {
                streakText = l10n.get("correct-streak", {
                    count: this.state.streak
                });
            }

            content = <div className="framework-perseus">
                          <div className="problem-history">
                              {attemptIcons}
                              <div>
                                  {streakText}
                              </div>
                          </div>

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

module.exports = {
    ExerciseViewer,
};
