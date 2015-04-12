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

const React = require("react"),
    Util = require("../util"),
    APIClient = require("../apiclient"),
    l10n = require("../l10n"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    $ = require("jquery");

window.Exercises = {
    cluesEnabled: false
};

class TaskCompleteView extends React.Component {
    render() {
        return <div>TODO: Task complete UI</div>;
    }
}
/**
 * Represents a single exercise, it will load the exercise dynamically and
 * display it to the user.
 */
const ExerciseViewer = React.createClass({
    propTypes: {
        topicTreeNode: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {
            hintsUsed: 0,
        };
    },
    refreshUserExerciseInfo: function() {
        return new Promise((resolve, reject) => {
            $.when(APIClient.getTaskInfoByExerciseName(TopicTreeHelper.getName(this.props.topicTreeNode)),
                    APIClient.getUserExercise(TopicTreeHelper.getName(this.props.topicTreeNode)))
            .then((taskInfo, exerciseInfo) => {
                Util.log("getTaskInfoByExerciseName: %o", taskInfo);
                Util.log("getUserExercise: %o", exerciseInfo);
                resolve({
                    level: exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.level,
                    mastered: exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.mastered,
                    practiced: exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.practiced,
                    problemNumber: exerciseInfo.total_done + 1,
                    streak: exerciseInfo.streak,
                    taskId: taskInfo.id,
                    taskAttemptHistory: taskInfo.task_attempt_history,
                    longestStreak: exerciseInfo.longest_streak
                });
            }).catch(() => {
                reject();
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

        return Promise.all([this.refreshUserExerciseInfo(),
            APIClient.getAssessmentItem(this.randomAssessmentId)]).then((results) => {
                var userExerciseInfo = results[0],
                    assessmentItem = results[1];
                var assessment = JSON.parse(assessmentItem.item_data);
                Util.log("Got assessment item: %o: item data: %o", assessmentItem, assessment);
                this.setState({
                    hintsUsed: 0,
                    perseusItemData: assessment,
                    level: userExerciseInfo.level,
                    mastered: userExerciseInfo.mastered,
                    practiced: userExerciseInfo.practiced,
                    problemNumber: userExerciseInfo.problemNumber,
                    streak: userExerciseInfo.streak,
                    taskId: userExerciseInfo.taskId,
                    taskAttemptHistory: userExerciseInfo.taskAttemptHistory || [],
                    longestStreak: userExerciseInfo.longestStreak
                });
            });
    },
    onClickRequestHint: function() {
        this.refs.itemRenderer.showHint();
        this.setState({
            hintsUsed: this.state.hintsUsed + 1,
        });
    },
    onClickSubmitAnswer: function() {
        var score = this.refs.itemRenderer.scoreInput();
        Util.log("score: %o", score);
        const Khan = require("../../khan-exercises/main") || window.Khan,
            MathJax = require("../../bower_components/MathJax/MathJax.js") || window.MathJax;
        window.KhanUtil = Khan.Util;

        const katex = require("../../bower_components/katex/katex"),
            KAS = require("../../bower_components/KAS/kas"),
            Perseus = require("../../bower_components/perseus/perseus-2");
        perseusPrep(katex, KAS, MathJax, Khan.Util);
        Perseus.init({}).then(() => {
            Util.log("Perseus init done %o, %o", Perseus);
            this.ItemRenderer = Perseus.ItemRenderer;
            this.forceUpdate();
        });
    },
    render: function(): any {
        var content;
        if (this.state.error) {
            content = <div>Could not load exercise</div>;
        } else if (TopicTreeHelper.isKhanExercisesExercise(this.props.topicTreeNode)) {
            var path = `/khan-exercises/exercises/${TopicTreeHelper.getFilename(this.props.toipcTreeNode)}`;
            content = <iframe src={path}/>;
        } else if (this.state.taskComplete) {
            return <TaskCompleteView/>;
        } else if (this.ItemRenderer && this.state.perseusItemData) {
            var showHintsButton = this.state.perseusItemData.hints.length > this.state.hintsUsed;
            // Always show 5 attempt icons with either pending, correct, hint or wrong
            var attemptIcons = [];
            var taskAttemptHistory = this.state.taskAttemptHistory.slice(-5);
            for (var i = 0; i < 5; i++) {
                if (i >= taskAttemptHistory.length) {
                    attemptIcons.push(<i className="attempt-icon attempt-pending fa fa-circle-o"></i>);
                } else if (taskAttemptHistory[i].seen_hint) {
                    attemptIcons.push(<i className="attempt-icon attempt-hint  fa fa-lightbulb-o"></i>);
                } else if (!taskAttemptHistory[i].correct) {
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
            var longestStreakText;
            if (this.state.longestStreak > 5) {
                longestStreakText = l10n.get("longest-correct-streak", {
                    count: this.state.longestStreak
                });
            }

            content = <div className="framework-perseus">
                          <div className="problem-history">
                              {attemptIcons}
                              <div>
                                  {streakText}
                              </div>
                              <div>
                                  {longestStreakText}
                              </div>
                          </div>

                          <this.ItemRenderer ref="itemRenderer"
                                             item={this.state.perseusItemData}
                                             key={this.state.problemNumber}
                                             problemNum={this.state.problemNumber}
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
                          <div id="hintsarea"/>
                      </div>;
        }

        Util.log("render exercise: :%o", this.props.topicTreeNode);
        return <div className="exercise">
            {content}
        </div>;
    }
});

module.exports = {
    ExerciseViewer,
};
