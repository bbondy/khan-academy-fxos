/* @flow */

"use strict";

import React from "react";
import Util from "../util";
import APIClient from "../apiclient";
import l10n from "../l10n";
import {getName, getFilename, isPerseusExercise, isKhanExercisesExercise} from "../data/topic-tree-helper";
import component from "omniscient";
import $ from "jquery";
import {isSignedIn} from "../user";
import _ from "underscore";

// Perseus module uses React directly and uses $._ directly for
// localization, so we do this as a hack to get it to work
function perseusPrep(katex, KAS) {
    $._ = function(x) { return x; };
    window.$_ = function(x) { return x; }; // eslint-disable-line
    window.katex = katex;
    window.KAS = KAS;
}

window.Exercises = {
    cluesEnabled: false
};

/**
 * Component used to render a completion notice for when a stack of tasks
 * is complete.
 */
const TaskCompleteView = component(({level}) =>
    <div>
        <h1 data-l10n-id="you-did-it">You did it!</h1>
        <p>
        {
            l10n.get("level-indicator", {
                level: level
            })
        }
        </p>
        { level !== "mastered" &&
            <p data-l10n-id="level-up-info">To level up more, you need to do mastery challenges.</p>
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
                    problemNumber: exerciseInfo && exerciseInfo.total_done + 1 || 1,
                    streak: exerciseInfo && exerciseInfo.streak,
                    taskId: taskInfo.id,
                    taskAttemptHistory: taskInfo.task_attempt_history,
                    longestStreak: exerciseInfo && exerciseInfo.longest_streak
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
        this.refs.perseusExercise.refs.itemRenderer.showHint();
        this.props.statics.editExercise((exercise) => exercise.merge({
                hintsUsed: (this.props.exerciseStore.get("hintsUsed") || 0) + 1,
            })
        );
    },
    onClickSubmitAnswer: function() {
        var score = this.refs.perseusExercise.refs.itemRenderer.scoreInput();
        Util.log("score: %o", score);
        var secondsTaken = (new Date().getTime() - this.startTime) / 1000 | 0;
        var attemptNumber = ++this.attemptNumber;
        var isCorrect = score.correct;
        var hintsUsed = this.props.exerciseStore.get("hintsUsed") || 0;
        APIClient.reportExerciseProgress({
            exerciseName: getName(this.props.topicTreeNode),
            problemNumber: this.props.exerciseStore.get("problemNumber"),
            assessmentSHA1: this.randomAssessmentSHA1,
            assessmentId: this.randomAssessmentId,
            secondsTaken: secondsTaken,
            hintsUsedCount: hintsUsed,
            isCorrect: isCorrect,
            attemptNumber: attemptNumber,
            problemType: this.problemTypeName,
            taskId: this.props.exerciseStore.get("taskId")
        }).then(() => {
            if (isCorrect) {
                const getNumSuccessful = (exerciseStore) => {
                    var taskAttemptHistory = exerciseStore.get("taskAttemptHistory");
                    if (!taskAttemptHistory) {
                        return 0;
                    }
                    taskAttemptHistory = taskAttemptHistory.slice(-5);
                    return _.reduce(taskAttemptHistory.toJS(), (total, task) => {
                        return total + (task.correct && !task.seen_hint) ? 1 : 0;
                    }, 0);
                };
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
                this.refreshUserExerciseInfo().then((userExerciseInfo) => {
                    this.props.statics.editExercise((exercise) =>
                        exercise.merge({
                            level: userExerciseInfo.level,
                            mastered: userExerciseInfo.mastered,
                            practiced: userExerciseInfo.practiced,
                            problemNumber: userExerciseInfo.problemNumber,
                            streak: userExerciseInfo.streak,
                            taskId: userExerciseInfo.taskId,
                            taskAttemptHistory: userExerciseInfo.taskAttemptHistory || [],
                            longestStreak: userExerciseInfo.longestStreak
                        })
                    );
                });
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
        require("../../bower_components/MathJax/MathJax.js");

        Khan = window.Khan;
        window.KhanUtil = Khan.Util;

        const katex = require("katex"),
            KAS = require("../../bower_components/KAS/kas"),
            Perseus = require("../../bower_components/perseus/perseus-3");
        perseusPrep(katex, KAS, Khan.Util);
        Perseus.init({}).then(() => {
            Util.log("Perseus init done %o, %o", Perseus);
            this.ItemRenderer = Perseus.ItemRenderer;
            this.forceUpdate();
        });
    },
};

const TaskAttempts = component(({taskAttemptHistory}) =>
        <div>
        {
            _.map(_.range(5), (i) => {
                if (i >= taskAttemptHistory.length) {
                    return <i className="attempt-icon attempt-pending fa fa-circle-o"></i>;
                } else if (taskAttemptHistory.get(i).get("seen_hint")) {
                    return <i className="attempt-icon attempt-hint  fa fa-lightbulb-o"></i>;
                } else if (!taskAttemptHistory.get(i).get("correct")) {
                    return <i className="attempt-icon attempt-wrong fa fa-times-circle-o"></i>;
                } else {
                    return <i className="attempt-icon attempt-correct fa fa-check-circle-o"></i>;
                }
            })

        }
        </div>).jsx;

const StreakInfo = component(({streak, longestStreak}) => {
    var streakText;
    if (streak > 5) {
        streakText = l10n.get("correct-streak", {
            count: streak,
        });
    }
    var longestStreakText;
    if (longestStreak > 5) {
        longestStreakText = l10n.get("longest-correct-streak", {
            count: longestStreak,
        });
    }

    return <div>
        <div>
            {streakText}
        </div>
        <div>
            {longestStreakText}
        </div>
    </div>;
}).jsx;

/**
 * Component used to render a legacy exercise
 */
const LegacyExerciseViewer = component(({filePath}) => <iframe src={filePath}/>).jsx;
const ExerciseLoadError = component(() => <div data-l10n-id="exercise-load-error">Could not load exercise</div>).jsx;
const ProblemHistory = component(({exerciseStore}) => <div className="problem-history">
    <TaskAttempts taskAttemptHistory={exerciseStore.get("taskAttemptHistory").slice(-5)}/>
    <StreakInfo streak={exerciseStore.get("streak")} longestStreak={exerciseStore.get("longestStreak") }/>
</div>).jsx;

const PerseusExercise = component(({exerciseStore, showHintsButton, ItemRenderer}, {onClickSubmitAnswer, onClickRequestHint}) => <div>
    <ItemRenderer ref="itemRenderer"
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
            onClick={onClickSubmitAnswer}>Submit Answer</button>
    { !showHintsButton ? null :
    <button className="submit-answer-button"
            data-l10n-id="hint"
            onClick={onClickRequestHint}>Hint</button>
    }
    <div id="hintsarea"/>
</div>).jsx;


/**
 * Component used to render an exercise.
 */
export const ExerciseViewer = component(ExerciseMixin, function({topicTreeNode, exerciseStore}) {
    var content;
    if (exerciseStore.get("error")) {
        content = <ExerciseLoadError/>;
    } else if (isKhanExercisesExercise(topicTreeNode)) {
        content = <LegacyExerciseViewer filePath={`/khan-exercises/exercises/${getFilename(topicTreeNode)}`}/>;
    } else if (exerciseStore.get("taskComplete")) {
        content = <TaskCompleteView level={exerciseStore.get("level")} mastered={exerciseStore.get("mastered")} />;
    } else if (this.ItemRenderer && exerciseStore.get("perseusItemData")) {
        content = <div className="framework-perseus">
            <ProblemHistory exerciseStore={exerciseStore}/>
            <PerseusExercise exerciseStore={exerciseStore}
                             ref="perseusExercise"
                             showHintsButton={exerciseStore.get("perseusItemData").get("hints").length > (exerciseStore.get("hintsUsed") || 0)}
                             ItemRenderer={this.ItemRenderer}
                             statics={{
                                 onClickRequestHint: this.onClickRequestHint,
                                 onClickSubmitAnswer: this.onClickSubmitAnswer,
                             }}/>
        </div>;
    }

    Util.log("render exercise: :%o", topicTreeNode);
    return <div className="exercise">
        {content}
    </div>;
}).jsx;
