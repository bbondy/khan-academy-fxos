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
    _ = require("underscore"),
    $ = require("jquery");

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
        APIClient.getTaskInfoByExerciseName(this.props.exercise.getName()).then((info) => {
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

        // TODO: Make this load async
        window._ = _;
        window.React = React;
        window.$ = $;
        $._ = (x) => x;
        window.jQuery = $;
        window.Exercises = {
            cluesEnabled: false
        };

        console.log("before requirejs");
        var {requirejs} = require("../requirejs");
        requirejs(["./build/exercise-util-shim.js"], (ExerciseShim) => {
            console.log("before katext etc");
            var katex = require("katex"),
                KAS = require("KAS"),
                Perseus = require("Perseus");
            console.log("katex %o:", katex);
            console.log("KAS %o:", KAS);
            console.log("Perseus %o:", Perseus);

            perseusPrep(katex, KAS, MathJax, ExerciseShim.KhanUtil);
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

module.exports = {
    ExerciseViewer,
};
