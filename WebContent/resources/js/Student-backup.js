/**
 * 
 */
function Student() {
  var student;
  var userReport;
  var actionLogSequence = [];
  var problemLogSequence = [];
  /** the problemLogFlag is an array of booleans where true indicates correct answer (1) and
   * false indicates incorrect answer (0) or partial credit.
   */
  var problemLogFlags = [];
  var length;

  var active_problem_index = -1;

  var studentStartTime = 0;
  var studentEndTime = 0;
  var adjustedTotalTimeSpent = 0;
  var correct_count_seq = 0;
  var incorrect_count_seq = 0;
  var affectiveStatesLog = [];
  var totalScore;
  var totalProblems;

  this.init = function(student_, userReport_, totalProblems_ = 0) {
    student = student_;
    userReport = userReport_;
    totalProblems = totalProblems_;
    var actions = userReport_.actions;

    if (actions == null)
      return;

    totalScore = 0;
    actionLogSequence = computeActionLogSequence(actions);

    var problemLogs = userReport.problemLogs;
    problemLogSequence = computeProblemLogSequence(problemLogs);

    console.log(problemLogFlags, "problemLogFlags");
    problemLogFlags = problemLogSequence.map(problemLog => problemLog.score == 1);
    console.log(problemLogFlags, "problemLogFlags");

    /**
     * This is the test code to test the stage 2 of the
     * live versions of the LIVE-CHART
     * start
     */
    // if (actions.length > 5) {
    //   var problemIds = actionLogSequence.map(x => x.problemkey);
    //   var lastProblemId = problemLogSequence[problemLogSequence.length - 1].problemId.toString();
    //   var deleteproblemIdIndex = problemIds.indexOf(lastProblemId);
    //   actionLogSequence.length = deleteproblemIdIndex;
    //   actions.length = deleteproblemIdIndex;
    //   problemLogSequence.length = problemLogSequence.length - 1;
    // }
    /**
     * This is the test code to test the stage 2 of the
     * live versions of the LIVE-CHART
     * end
     */
    if (actionLogSequence.length > 0) {
      studentStartTime = actionLogSequence[0].timestamp;
      studentEndTime = actionLogSequence[actions.length - 1].timestamp;
      length = actionLogSequence.length - 1;

      affectiveStatesLog = generateAffectiveStatesFromTime(actionLogSequence, problemLogSequence);
    }
  };

  /**
   *  @global
   */ 
  computeActionLogSequence = function(actions, actionLogSequence = [], startindex = 0) {
    var timespent = 0;
    var startTime = 0;
    for (var i = startindex; i < actions.length; i++) {
      // TODO: should the adjusted time be calculated separately?
      if (i == actions.length - 1) {
        timespent = 1;
      } else if (actions[i + 1] == 'AssignmentResumedAction') {
        // TODO: Where is the AFK tag getting implemented?
        timespent = 1;
      } else {
        timespent = (actions[i + 1].timestamp - actions[i].timestamp) / 1000;
      }

      if (timespent < 1) timespent = 1;

      startTime = (i > 0) ? actionLogSequence[i - 1].endTime : 0;

      actionLogSequence.push({
        timestamp: Math.floor(actions[i].timestamp / 1000),
        key: actions[i].key.match("impl\.(.*)\/pub")[1],
        problemkey: actions[i].path.match("#(.*)") ? actions[i].path.match("#(.*)")[1] : 0,
        manifestKey: actions[i].manifestKey,
        timespent: timespent,
        startTime: startTime,
        endTime: startTime + timespent
      });

      /*if(studentStartTime != 0 && studentStartTime > startTime) {
      	studentStartTime = startTime;
      } else {
      	studentStartTime = startTime;
      }

      if(studentEndTime != 0 && studentEndTime < (startTime + timespent)) {
      	studentStartTime = startTime + timespent;
      } else {
      	studentStartTime = startTime + timespent;
      }*/

      adjustedTotalTimeSpent += timespent;
    }
    return actionLogSequence;
  };

  computeProblemLogSequence = function(problemLogs, problemLogSequence = [], startindex = 0) {

    for (var j = startindex; j < problemLogs.length; j++) {
      if (problemLogs[j].continuousScore == null && problemLogs[j].endTime == null)
        break;
      problemLogSequence.push({
        problemId: problemLogs[j].problemId,
        answerText: problemLogs[j].answerText,
        score: problemLogs[j].continuousScore,
        hintCount: problemLogs[j].hintCount,
        attemptCount: problemLogs[j].attemptCount,
        bottomHint: problemLogs[j].bottomHint
      });
      totalScore += problemLogs[j].continuousScore;
    }
    return problemLogSequence;
  };

  /**
   * Eventually this is where all the affect work is going to stemm from
   * if live then we need to add the mechanism to
   * append the new data to preexisting data
   * */
  generateAffectiveStatesFromTime = function(actionLogSequence, problemLogSequence, startindex = 0, affectiveStatesLog = []) {
    console.log(actionLogSequence, student);

    var index = 0;
    var i;
    var lastActiveProblemLog;
    var currentTime = actionLogSequence[startindex].startTime;

    console.log("The crash happened here before :)");
    console.log(actionLogSequence);
    console.log(problemLogSequence);
    console.log('\n');

    while (currentTime <= actionLogSequence[(actionLogSequence.length - 1)].startTime) {
      index = 0;
      for (i = startindex; i < actionLogSequence.length; i++) {
        if (currentTime >= actionLogSequence[i].startTime && currentTime < actionLogSequence[i].endTime) {
          index = i;
          break;
        }
      }

      var action_at_index = actionLogSequence[index];

      switch (action_at_index.key) {
        case "ProblemStartedAction":
          active_problem_index = problemLogSequence.findIndex(pl => pl.problemId == action_at_index.problemkey);
          /**
           *	@author ashish
           * if a student is half way done through the problem then there is no end time for the problem
           * in these situations we manipulate the action logs of the student but do not log the problem
           * logs as the action indicate a student's activity without requiring the information on the
           * problem problem. Also not doing this will make the seating arrangement jump to -1/#total problems
           * because the activeProblemIndex gets fucked up when the problemKey/id from actionLogs cannot be
           * found in the problemLogs
           */

          if (active_problem_index == -1) {
            console.log(affectiveStatesLog);
            return affectiveStatesLog;
          } else if ((active_problem_index - 1) > -1) {
            lastActiveProblemLog = problemLogSequence[active_problem_index - 1];
            if (lastActiveProblemLog.score < 1) {
              correct_count_seq = 0;
              incorrect_count_seq++;
            } else if (lastActiveProblemLog.score == 1) {
              incorrect_count_seq = 0;
              correct_count_seq++;
            }
          }
          break;
        case "ProblemFinishedAction":
          last_problem_flag = true;
          // this basically means the last problem was done so the progress bar
          // can show 100% status
          if (active_problem_index == (problemLogSequence.length - 1)) {
            active_problem_index++;
          }
          break;

        default:
          break;
      }

      affectiveStatesLog.push({
        timestamp: actionLogSequence[index].timestamp,
        currentTime: currentTime,
        redZone: (incorrect_count_seq >= 3) ? true : false,
        goldZone: (correct_count_seq >= 3) ? true : false,
        activeProblemIndex: (active_problem_index - 1),
        totalProblems: problemLogSequence.length,
        progressPercentage: ((active_problem_index) > -1) ? (active_problem_index / totalProblems) * 100 : 0,
        lastProblemCorrect: ((active_problem_index - 1) > -1) ? problemLogSequence[active_problem_index - 1].score : 0,
        currentScore: ((active_problem_index) > -1 && active_problem_index < problemLogSequence.length) ?
          problemLogSequence[active_problem_index].score : 0,
        currentProblemAttemptCount: ((active_problem_index) > -1 && active_problem_index < problemLogSequence.length) ?
          problemLogSequence[active_problem_index].attemptCount : 0,
      });

      currentTime = actionLogSequence[index].endTime;
    }
    console.log(affectiveStatesLog);
    return affectiveStatesLog;
  };

  this.getactions = function() {
    return actionLogSequence;
  };

  /**
   * this is the code to update userReport for LIVE feature which get's updated in real time.
   * upon reception of the information from the Backend
   *
   * */
  this.updateUserReport = function(newUserReport) {

    var actions = newUserReport.actions;
    var problemLogs = newUserReport.problemLogs;
    if (actions.length > actionLogSequence.length || problemLogs.length > problemLogSequence.length) {
      console.log("the log needs to be updated");
      actionLogSequence = computeActionLogSequence(actions, actionLogSequence, actionLogSequence.length);
      problemLogSequence = computeProblemLogSequence(problemLogs, problemLogSequence, problemLogSequence.length);

      problemLogFlags = problemLogSequence.map(problemLog => problemLog.score == 1);
      if (actionLogSequence.length > 0 && problemLogSequence.length > 0) {
        studentStartTime = actionLogSequence[0].timestamp;
        studentEndTime = actionLogSequence[actions.length - 1].timestamp;
        affectiveStatesLog = generateAffectiveStatesFromTime(actionLogSequence, problemLogSequence, affectiveStatesLog.length, affectiveStatesLog);
        length = actionLogSequence.length - 1;
      }
    }
    // var userReportDifference = newUserReport.filter( x => !userReport.includes(x));
    // if(userReportDifference.length > 0){
    // userReport.push(...userReportDifference);
    // make the function call to update the action logs here
    // }
  }

  this.getProblemId = function() {
    if (active_problem_index > -1 && active_problem_index < problemLogSequence.length) {
      var activeProblemLog = problemLogSequence[active_problem_index];
      return activeProblemLog.problemId;
    } else {
      return -1;
    }
  };

  this.getlength = function() {
    return length;
  };

  this.getStudentAffectState = function(currentTime) {
    // this is fine for now but we might have to implement a shorting algorithm with
    // O(log n) to optimize this as it is a presorted list
    var affectiveState = {};
    if (playbackFlag) {
      for (var i = 0; i < affectiveStatesLog.length; i++) {
        affectiveState = affectiveStatesLog[i];
        if (affectiveState.currentTime == currentTime) {
          return affectiveState;
        } else if (affectiveState.currentTime > currentTime && i > 0) {
          return affectiveStatesLog[i - 1];
        }
      }
    } else {
      for (var i = affectiveStatesLog.length - 1; i >= 0; i--) {
        affectiveState = affectiveStatesLog[i];
        if (affectiveState.timestamp <= currentTime) {
          return affectiveState;
        }
      }
    }
    return {};
  };

  this.getLastFiveProblemCorrectness = function(index) {
    index = (index < -1) ? -1 : index;
    var start = index - 4;
    return problemLogFlags.slice((start > -1) ? start : 0, index + 1);
  };

  this.resetStudentAffectState = function() {
    active_problem_index = -1;
  }

  this.getName = function() {
    return (student.firstname + " " + student.lastname).trim();
  };

  this.getStudentXref = function() {
    return student.userXref;
  }

  /**
   * Refactor this code to getAdjustedTimeSpent
   */
  this.getTimeSpent = function() {
    return Math.round(adjustedTotalTimeSpent);
  };

  this.getStartTime = function() {
    return studentStartTime;
  };

  this.getEndTime = function() {
    return studentEndTime;
  };

  this.getTotalScore = function() {
    return totalScore;
  }
}


function Questions() {
  var questions = [];
  var numberOfQuestions;
  let questionsMap = new Map();
  var prids = [];
  this.init = function(problems) {
    var prid;
    var value;
    for (var i = 0; i < problems.length; i++) {
      questions.push({
        //problemText: problems[i].problem.question.replace(/<[^>]*>?/gm, ''),
        problemText: problems[i].problem.question.replace(/src="\/images/g, "src=\"https://www.assistments.org/images"),
        commonWrongAnswer: problems[i].commonWrongAnswer,
        answerText: problems[i].answerText,
        key: problems[i].problem.key
      });
      //extracting the prid from the key
      prid = problems[i].problem.key;
      prid = prid.slice(prid.indexOf('PR'), prid.length);
      prid = prid.replace(/\//g, '');
      prid = prid.slice(0, prid.indexOf('#'));
      
      if (problems[i].problem.name == "Main Problem"){
	      questionsMap.set(prid, [{
	      	problemType: problems[i].problem['@class'].substring(37),
	      	problemText: problems[i].problem.question.replace(/src="\/images/g, "src=\"https://www.assistments.org/images"),
	        commonWrongAnswer: problems[i].commonWrongAnswer,
	        answerText: problems[i].answerText
	      }]);
	      prids.push(prid);
      } else {
      	value = questionsMap.get(prid);
      	value.push({
	      	problemType: problems[i].problem['@class'].substring(37),
	      	problemText: problems[i].problem.question.replace(/src="\/images/g, "src=\"https://www.assistments.org/images"),
	        commonWrongAnswer: problems[i].commonWrongAnswer,
	        answerText: problems[i].answerText
	      });
      	questionsMap.set( prid, value);
      }
    }
    numberOfQuestions = problems.length;
  };

  this.getQuestions = function() {
    return questions;
  };

  this.getTotalQuestions = function() {
    return numberOfQuestions;
  }

  this.getQuestionByProblemId = function(problemId) {
    return jQuery.map(questions, function(obj) {
      var key = obj.key;
      if (key.includes(problemId))
        return obj;
    });
  };

  this.getQuestionText = function(problemId) {
    var question = getQuestionByProblemId(problemId);
    // the question should always be a single
    // object if everything is working properly
    // QUESTION: Would this assumption be broken if the probelem is a
    //           multipart problem or a  scaffolding problem?
    return question[0].problemText;
  };
}
