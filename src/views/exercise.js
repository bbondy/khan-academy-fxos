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
    {getName, getFilename, isPerseusExercise, isKhanExercisesExercise} = require("../data/topic-tree-helper"),
    component = require("omniscient"),
    $ = require("jquery"),
    {isSignedIn} = require("../user"),
    _ = require("underscore");

window.Exercises = {
    cluesEnabled: false
};

const TaskCompleteView = component(({level}) =>
    <div>
        <h1>You did it!</h1>
        <p>Level: {level}</p>
        { level !== "mastered" &&
            <p>To level up more, you need to do mastery challenges.</p>
        }
    </div>
).jsx;

/**
 * Represents a single exercise, it will load the exercise dynamically.
 * Most of this will be refactored when parent state is brought up.
 */
const ExerciseMixin = {
    refreshUserExerciseInfo: function() {
        var promises = [APIClient.getTaskInfoByExerciseName(getName(this.props.topicTreeNode))];
        if (isSignedIn()) {
            promises.push(APIClient.getUserExercise(getName(this.props.topicTreeNode)));
        }
        return new Promise((resolve, reject) => {
            Promise.all(promises).then((result) => {
                const taskInfo = result[0];
                const exerciseInfo = result[1];
                this.startTime = new Date().getTime();
                Util.log("getTaskInfoByExerciseName: %o", taskInfo);
                Util.log("getUserExercise: %o", exerciseInfo);
                resolve({
                    level: exerciseInfo && exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.level,
                    mastered: exerciseInfo && exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.mastered,
                    practiced: exerciseInfo && exerciseInfo.exercise_progress && exerciseInfo.exercise_progress.practiced,
                    problemNumber: exerciseInfo && (exerciseInfo.total_done + 1) || 1,
                    streak: exerciseInfo && exerciseInfo.streak,
                    taskId: taskInfo.id,
                    taskAttemptHistory: taskInfo.task_attempt_history,
                    longestStreak: exerciseInfo && exerciseInfo.longest_streak
                });
            }).catch((e) => {
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
                this.attemptNumber = 0;
                var userExerciseInfo = results[0],
                    assessmentItem = results[1];
                var assessment = JSON.parse(assessmentItem.item_data);
                Util.log("Got assessment item: %o: item data: %o userExerciseInfo: %o", assessmentItem, assessment, userExerciseInfo);
                this.props.statics.editExercise((exercise) =>
                    exercise.merge({
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
                    }));
            });
    },
    onClickRequestHint: function() {
        this.refs.itemRenderer.showHint();
        this.props.statics.editExercise((exercise) => exercise.merge({
                hintsUsed: (this.props.exerciseStore.get("hintsUsed") || 0) + 1,
            })
        );
    },
    onClickSubmitAnswer: function() {
        var score = this.refs.itemRenderer.scoreInput();
        Util.log("score: %o", score);
        var secondsTaken = (new Date().getTime() - this.startTime) / 1000 | 0;
        var attemptNumber = ++this.attemptNumber;
        var isCorrect = score.correct;
        var hintsUsed = this.props.exerciseStore.get("hintsUsed") || 0;
        APIClient.reportExerciseProgress(getName(this.props.topicTreeNode), this.props.exerciseStore.get("problemNumber"),

            this.randomAssessmentSHA1, this.randomAssessmentId,
            secondsTaken, hintsUsed, isCorrect,
            attemptNumber, this.problemTypeName, this.props.exerciseStore.get("taskId")).then(() => {
                if (isCorrect) {
                    // If we have another correct and we already have 4 correct,
                    // then show task complete view.
                    if (this.props.exerciseStore.get("streak") >= 4 &&
                            hintsUsed === 0 && getNumSuccessful(this.props.exerciseStore) === 4) {
                        this.props.statics.editExercise((exercise) =>
                            exercise.merge({
                                taskComplete: true
                            })
                        );
                        return;
                    }
                    this.refreshRandomAssessment();
                } else {
                    // Refresh attempt info so it shows up as wrong
                    this.refreshUserExerciseInfo();
                }
            });
    },
    componentWillMount: function() {
        if (isPerseusExercise(this.props.topicTreeNode)) {
            APIClient.getExerciseByName(getName(this.props.topicTreeNode)).then((result) => {
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

        const katex = require("katex"),
            KAS = require("../../bower_components/KAS/kas"),
            Perseus = require("../../bower_components/perseus/perseus-3");
        perseusPrep(katex, KAS, MathJax, Khan.Util);
        Perseus.init({}).then(() => {
            Util.log("Perseus init done %o, %o", Perseus);
            this.ItemRenderer = Perseus.ItemRenderer;
            this.forceUpdate();
        });
    },
};

const getNumSuccessful = (exerciseStore) => {
    var taskAttemptHistory = exerciseStore.get("taskAttemptHistory");
    if (!taskAttemptHistory) {
        return 0;
    }
    taskAttemptHistory = taskAttemptHistory.slice(-5);
    return _.reduce(taskAttemptHistory.toJS(), (total, task) => {
        return total + ((task.correct && !task.seen_hint) ? 1 : 0);
    }, 0);
};

const ExerciseViewer = component(ExerciseMixin, function({topicTreeNode, exerciseStore}) {
    var content;
    if (exerciseStore.get("error")) {
        content = <div>Could not load exercise</div>;
    } else if (isKhanExercisesExercise(topicTreeNode)) {
        var path = `/khan-exercises/exercises/${getFilename(toipcTreeNode)}`;
        content = <iframe src={path}/>;
    } else if (exerciseStore.get("taskComplete")) {
        content = <TaskCompleteView level={exerciseStore.get("level")} mastered={exerciseStore.get("mastered")} />;
    } else if (this.ItemRenderer && exerciseStore.get("perseusItemData")) {
        var showHintsButton = exerciseStore.get("perseusItemData").get("hints").length > (exerciseStore.get("hintsUsed") || 0);
        // Always show 5 attempt icons with either pending, correct, hint or wrong
        var attemptIcons = [];
        var taskAttemptHistory = exerciseStore.get("taskAttemptHistory").slice(-5);
        for (var i = 0; i < 5; i++) {
            if (i >= taskAttemptHistory.length) {
                attemptIcons.push(<i className="attempt-icon attempt-pending fa fa-circle-o"></i>);
            } else if (taskAttemptHistory.get(i).get("seen_hint")) {
                attemptIcons.push(<i className="attempt-icon attempt-hint  fa fa-lightbulb-o"></i>);
            } else if (!taskAttemptHistory.get(i).get("correct")) {
                attemptIcons.push(<i className="attempt-icon attempt-wrong fa fa-times-circle-o"></i>);
            } else {
                attemptIcons.push(<i className="attempt-icon attempt-correct fa fa-check-circle-o"></i>);
            }
        }

        var streakText;
        if (exerciseStore.get("streak") > 5) {
            streakText = l10n.get("correct-streak", {
                count: exerciseStore.get("streak"),
            });
        }
        var longestStreakText;
        if (exerciseStore.get("longestStreak") > 5) {
            longestStreakText = l10n.get("longest-correct-streak", {
                count: exerciseStore.get("longestStreak"),
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
                                         item={exerciseStore.get("perseusItemData").toJS()}
                                         key={exerciseStore.get("problemNumber")}
                                         problemNum={exerciseStore.get("problemNumber")}
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

    Util.log("render exercise: :%o", topicTreeNode);
    return <div className="exercise">
        {content}
    </div>;
}).jsx;

module.exports = {
    ExerciseViewer,
};
