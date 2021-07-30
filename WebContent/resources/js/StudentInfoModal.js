function StudentInfoModal() {
  var $slider = $("#studentInfoSlider");
  var $timer = $("#stdSliderValue");
  var $playBtn = $("#stdPlay");
  var $pauseBtn = $("#stdPause");
  var $reloadBtn = $(".std-reload-btn");

  var $stdName = $("#info-name");
  var $stdClass = $("#info-class");
  var $stdAssignment = $("#info-assignment");

  var $stdProblem = (".info-problem-detail");

  var $problemDetail = $(".student-info-container .info-container .info-problem-detail");
  var $note = $(".student-info-container .info-note");

  var $progressDetail = $(".student-progress");

  var currentStudent;
  var timeSpent, timeSpentString;

  //TODO ask Ashish abou this variable. It doesn't seem to get initialized, but its value is used a bunch, could be related to the bugs when jumping
  var sliderInterval;
  var playbackSpeed, paused, currentTime;

  var actionlog;
  var actionlogIndex;
  var currentQuestions;
  var questionList;
  var questionLabels;
  var lastAction;
  // var isSubmitted;
  var isRequested;
  var attemptCount;
  var startTime, endTime;
  var totalScore;
  var numQuestions;
  var studentInFocus;

  var $mainPlayBtn;

  var $scrollSwitch = $("#auto-scroll-btn");
  var autoScroll = $scrollSwitch.is(":checked");
  var setMainplayerInFocusCallback;

  $scrollSwitch.unbind('click').click(function() {
    autoScroll = $scrollSwitch.is(":checked");
  });

  this.init = function(student, questions, timeStamp = 0, $playbtn_, mainplayerInFocus_) {
    $mainPlayBtn = $playbtn_;
    currentStudent = student;
    timeSpent = student.getTimeSpent();
    timeSpentString = getFormattedSeconds(timeSpent + 1);
    actionlog = student.getactions();
    $progressDetail.html("Progress: ");
    setMainplayerInFocusCallback = mainplayerInFocus_;
    studentInFocus = true;
    if (playbackFlag) {
      currentTime = (timeSpent < timeStamp) ? timeSpent : timeStamp;
    } else {
      currentTime = timeStamp;
    }

    currentQuestions = questions;
    questionList = questions.getQuestions();
    questionLabels = questions.getQuestionLabels();
    actionlogIndex = 0;
    // isSubmitted = false;
    isRequested = false;
    attemptCount = 0;

    totalScore = currentStudent.getTotalScore().toFixed(2);
    numQuestions = questionList.length;

    $stdName.html(student.getName());
    $stdClass.html($("#class_name").html());

    plotEverything();
    showTillTime(currentTime);
    //scrollToBottomFlag = false;
    initializeSlider();
  }

  var lastScrollTop = 0;
  var totalHeightOfActionLogs = 0;
  var totalLengthOfSlider = 0;


  function scrollToBottom() {
    // $($problemDetail).scrollTop($($problemDetail)[0].scrollHeight);
    $($problemDetail).animate({
      scrollTop: $($problemDetail)[0].scrollHeight
    }, 400 / playbackSpeed);
    lastScrollTop = $($problemDetail).scrollTop();
    //scrollToBottomFlag = true;
  }

  /*$($problemDetail).scroll(function() {
    	var st = $($problemDetail).scrollTop();
    	 if (st < lastScrollTop){
    		 var currentScrollHeight = st + $problemDetail.innerHeight();
    		 var correspondingTime = totalLengthOfSlider / totalHeightOfActionLogs * currentScrollHeight;

    		 pauseSlider();
    		 currentTime = Math.floor(correspondingTime);
    		 $slider.val(currentTime)
    		 $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
    		 showTillTime(currentTime);
    	 }
		 scrollToBottomFlag = false;
    });*/

  function initializeSlider() {
    $playBtn.hide(0);
    $reloadBtn.hide(0);
    $pauseBtn.show(0);

    playbackSpeed = 1;
    paused = false;

    if (sliderInterval)
      clearInterval(sliderInterval);

    if (playbackFlag) {
      $slider.attr('max', Math.floor(timeSpent));
      $slider.val(currentTime);
      $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
    } else {
      $slider.attr('min', currentStudent.getStartTime());
      $slider.attr('max', currentTime);
      $slider.val(currentTime);
      $timer.html("- 00:00");
    }

    startSlider();
  }

  /*$($problemDetail).scroll(function() {
  	var st = $($problemDetail).scrollTop();
  	 if (st < lastScrollTop){
  		 pauseSlider();
  	 }
  });*/

  function startSlider() {
    if (sliderInterval)
      clearInterval(sliderInterval);
    if (playbackFlag) {
      sliderInterval = setInterval(function() {
        if (!paused) {
          $slider[0].stepUp();
          startAction(currentTime);
          if (currentTime < timeSpent) {
            currentTime += 1;
          }
          $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
        }
        if (currentTime >= timeSpent || paused) {
          startAction(currentTime);
          clearInterval(sliderInterval);
          $slider.val(currentTime);
          $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
          if (currentTime > timeSpent) {
            $reloadBtn.show(0);
            $playBtn.hide(0);
            $pauseBtn.hide(0);
          }
        }
      }, (1000 / playbackSpeed));
    } else {
      sliderInterval = setInterval(function() {
        // check if action log length has changed which happens every 20 seconds and call plotEverthing()
        // if it is updated
        if (actionlog.length < currentStudent.getactions().length) {
          actionlog = currentStudent.getactions();
          plotEverthing();
          showTillTime(currentTime);

        }

        $slider.attr('max', parseInt($slider.attr('max')) + 1);
        if (!paused) {
          $slider[0].stepUp();
          if (actionlog.length < actionlogIndex)
            startAction(currentTime);
          $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
          currentTime += 1;
        }
        if (paused) {
          $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
          $reloadBtn.hide(0);
          $playBtn.show(0);
          $pauseBtn.hide(0);
        }
      }, (1000));
    }
  }

  function plotEverything() {
    var activeProblem;
    var question;
    var currentAction;
    var timeTaken;
    var actionTime;
    var response;

    $problemDetail.empty();
    var actionStartTimeIndicator = "";

    actionlog.forEach(function(action, id) {
      actionStartTimeIndicator = "";
      currentAction = action.key;
      var idx = "action-" + id;

      var activeProblemIndex = currentQuestions.getProblemIndex(action.problemkey);

      // Print out several beginning states
      if (currentAction == "AssignmentStartedAction") {
        $($problemDetail).append("<div id=" + idx + ">" +
          "<span style='color:blue'>> Student started a new assignment.</span><br><hr></div>");
      }

      if (currentAction == "AssignmentFinishedAction") {
        $($problemDetail).append("<div id=" + idx + ">" +
          "<span style='color:blue'>> Student finished the assignment.</span><br>" +
          "<span style='color:blue'><b>Total Score: </b>" + totalScore + "</span>" +
          "<br><hr></div>");
      }

      // Print out the problem accordingly
      if (activeProblemIndex >= 0) {
        question = questionList[activeProblemIndex];

        // ProblemStartedAction
        if (currentAction == "ProblemStartedAction") {
          //	startTime = currentTime;
          if (playbackFlag) {
            actionStartTimeIndicator = "[ StartTime: " + getFormattedSeconds(Math.round(actionTime)) + " ]";
          } else {
            actionStartTimeIndicator = "[ Jump back in time to this question! ]"
          }
          $($problemDetail).append("<div class='log--question' id=" + idx + ">" +
            // "<div>Question " + (activeProblemIndex + 1) + " of " + numQuestions +
            "<div> " + questionLabels[activeProblemIndex] +
            "<span class='right start-timestamp' id='time-indicator-" + id + "' style='color:blue'" +
            "data-actionLiveTime=" + action.timestamp + " data-actionTime=" + actionTime + "> " +
            actionStartTimeIndicator + " </span></div><div class='problem-body'>" + question.problemText.trim() + "</div>" +
            "<p class='problem-type'> Problem Type: " + question.problemType + " <br> Answer: " + question.answerText + "</p></div>");
          $("#time-indicator-" + id).unbind('click').click(function() {
            //$(this).unbind();
            //unbind click listener for this
            console.log("Testing timestamp button");

            if (playbackFlag) {
              currentTime = Math.round($(this).data("actiontime"));
              $slider.val(currentTime);
              $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
              showTillTime(currentTime);
            } else {
              currentTime = $(this).data("actionLiveTime");
              $slider.val(currentTime);
              $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
              showTillTime(currentTime);
            }

            //console.log($(this).data("actiontime"));
            //trigger change value for slider

            //possibly update more values
          });
        }

        // AnswerRequestedAction
        if (currentAction == "AnswerRequestedAction") {
          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            "<span class='hint'> > Student requested an answer. </span><br>" +
            "<b>Answer Key:</b> " + question.answerText.trim() + "<br></div>");

          isRequested = true;
        }

        // StudentResponseAction (for Multiple Choice)
        // StudentSubmissionAction (for Open Answer)
        // if ((currentAction == "StudentResponseAction" || currentAction == "StudentSubmissionAction") && !isSubmitted) {
        if (currentAction == "StudentResponseAction" || currentAction == "StudentSubmissionAction") {
          attemptCount += 1;

          var currScore = Math.round(action.continuousScore * 100) / 100;
          var incorrectAnswer = currScore != 1 && attemptCount == 1 && question.problemType != "OpenResponseProblem";
          var otherCorrect = (actionlog[id + 1].key == "ProblemFinishedAction" && currScore != 1 && attemptCount > 1)||(question.problemType == "OpenResponseProblem");

          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            (action.continuousScore == 1 ? "<span class='correct'> > Correct Attempt #1.</span> <span class='check'> &check;</span> <br> <div class='response-body'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>" : "") +
            (otherCorrect ? "<span class='correct'> > Correct Attempt # " + attemptCount + ". </span> <br> <div class='response-body'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div> " : "") + // <span class='cross'> &cross;</span><br>" : "") +
            (incorrectAnswer ? "<span class='incorrect'> > Incorrect Attempt #" + attemptCount + ". </span>" +
              ((attemptCount == 1) ? " <span class='cross' > &cross;</span>  <br> <div class='response-body'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>" : " <br> <div class='response-body'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>") : "") +
            "</div>");
          // isSubmitted = currScore == 1;
        }

        // ProblemFinishedAction
        if (currentAction == "ProblemFinishedAction") {
          endTime = currentTime;
          timeTaken = action.timespent;

          var currScore = Math.round(action.continuousScore * 100) / 100;
          if (currScore == 1) {
            $($progressDetail).append("<span class='check' id=progress-" + idx + "> &check;</span>")
          } else {
            $($progressDetail).append("<span class='cross' id=progress-" + idx + "> &cross;</span>")
          }

          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            "> Student finished with the problem.<br>" +
            "<div class='log--report'><span style='color:blue'><b>Report</b>:</span><br>" +
            "<span style='color:blue'>> Total Attempts: " + attemptCount + "</span><br>" +
            (isRequested ? "<span style='color:blue'>> Student requested for answer key.</span><br>" : "") +
            //"<span style='color:blue'>> Time Taken: " + timeTaken +" seconds</span><br>" +
            "<span style='color:blue'>> Score: " + ((question.problemType == "OpenResponseProblem") ? "<em>Open Response Problem need to be graded.</em>" : currScore) +
            "</span></div><hr></div>");

          // isSubmitted = false;
          isRequested = false;
          attemptCount = 0;
        }
      }
    });
    totalHeightOfActionLogs = $problemDetail.prop('scrollHeight');
    $($problemDetail).children().hide(0);

    $($progressDetail).children().hide(0);
  }

  function plotEverything_old() {
    var affectiveState;
    var activeProblem;
    var question;
    var currentAction;
    var timeTaken;
    var actionTime;
    var response;

    $problemDetail.empty();
    var actionStartTimeIndicator = "";

    actionlog.forEach(function(action, id) {
      actionStartTimeIndicator = "";
      currentAction = action.key;
      var idx = "action-" + id;

      // Store affective state in case we need it
      actionTime = (playbackFlag) ? action.startTime : action.timestamp;

      affectiveState = currentStudent.getStudentAffectState(actionTime);
      var activeProblemIndex = affectiveState.activeProblemIndex;

      // Print out several beginning states
      if (currentAction == "AssignmentStartedAction") {
        $($problemDetail).append("<div id=" + idx + ">" +
          "<span style='color:blue'>> Student started a new assignment.</span><br><hr></div>");
      }

      if (currentAction == "AssignmentFinishedAction") {
        $($problemDetail).append("<div id=" + idx + ">" +
          "<span style='color:blue'>> Student finished the assignment.</span><br>" +
          "<span style='color:blue'><b>Total Score: </b>" + totalScore + "</span>" +
          "<br><hr></div>");
      }

      // Print out the problem accordingly
      if (activeProblemIndex >= 0) {
        question = questionList[activeProblemIndex];

        // ProblemStartedAction
        if ((currentAction == "ProblemStartedAction") && (isEndOfProblem)) {
          //	startTime = currentTime;
          isEndOfProblem = false;
          if (playbackFlag) {
            actionStartTimeIndicator = "[ StartTime: " + getFormattedSeconds(Math.round(actionTime)) + " ]";
          } else {
            actionStartTimeIndicator = "[ Jump back in time to this question! ]"
          }
          $($problemDetail).append("<div class='log--question' id=" + idx + ">" +
            // "<div>Question " + (activeProblemIndex + 1) + " of " + numQuestions +
            "<div> " + questionLabels[activeProblemIndex] +
            "<span class='right start-timestamp' id='time-indicator-" + activeProblemIndex + "' style='color:blue'" +
            "data-actionLiveTime=" + action.timestamp + " data-actionTime=" + actionTime + "> " +
            actionStartTimeIndicator + " </span></div><div class='problem-body'>" + question.problemText.trim() + "</div>" +
            "<p class='problem-type'> Problem Type: " + question.problemType + " <br> Answer: " + question.answerText + "</p></div>");
          $("#time-indicator-" + activeProblemIndex).unbind('click').click(function() {
            //$(this).unbind();
            //unbind click listener for this
            console.log("Testing timestamp button");

            if (playbackFlag) {
              currentTime = Math.round($(this).data("actiontime"));
              $slider.val(currentTime);
              $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
              showTillTime(currentTime);
            } else {
              currentTime = $(this).data("actionLiveTime");
              $slider.val(currentTime);
              $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
              showTillTime(currentTime);
            }

            //console.log($(this).data("actiontime"));
            //trigger change value for slider

            //possibly update more values
          });
        }

        // AnswerRequestedAction
        if (currentAction == "AnswerRequestedAction") {
          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            "<span class='hint'> > Student requested an answer. </span><br>" +
            "<b>Answer Key:</b> " + question.answerText.trim() + "<br></div>");

          isRequested = true;
        }

        // StudentResponseAction (for Multiple Choice)
        // StudentSubmissionAction (for Open Answer)
        // if ((currentAction == "StudentResponseAction" || currentAction == "StudentSubmissionAction") && !isSubmitted) {
        if (currentAction == "StudentResponseAction" || currentAction == "StudentSubmissionAction") {
          attemptCount += 1;

          var currScore = affectiveState.currentScore;
          var totalAttempt = affectiveState.currentProblemAttemptCount;
          var incorrectAnswer = currScore != 1 && attemptCount < totalAttempt;
          var otherCorrect = currScore != 1 && attemptCount == totalAttempt;

          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            (affectiveState.currentScore == 1 ? "<span class='correct'> > Correct Attempt #1.</span> <span class='check'> &check;</span> <br> <div style='padding-left: 20px;'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>" : "") +
            (otherCorrect ? "<span class='correct'> > Incorrect Attempt # " + attemptCount + ". </span> <br> <div style='padding-left: 20px;'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div> " : "") + // <span class='cross'> &cross;</span><br>" : "") +
            (incorrectAnswer ? "<span class='incorrect'> > Incorrect Attempt #" + attemptCount + ". </span>" +
              ((attemptCount == 1) ? " <span class='cross' > &cross;</span>  <br> <div style='padding-left: 20px;'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>" : " <br> <div style='padding-left: 20px;'> <span class='response-indicator'>&rdsh;</span>" + action.responseValue + " </div>") : "") +
            "</div>");
          // isSubmitted = currScore == 1;
        }

        // ProblemFinishedAction
        if ((currentAction == "ProblemFinishedAction") && (!isEndOfProblem)) {
          endTime = currentTime;
          timeTaken = action.timespent;

          var currScore = affectiveState.currentScore ? affectiveState.currentScore.toFixed(2) : 0;
          if (currScore == 1) {
            $($progressDetail).append("<span class='check' id=progress-" + idx + "> &check;</span>")
          } else {
            $($progressDetail).append("<span class='cross' id=progress-" + idx + "> &cross;</span>")
          }

          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            "> Student finished with the problem.<br>" +
            "<div class='log--report'><span style='color:blue'><b>Report</b>:</span><br>" +
            "<span style='color:blue'>> Total Attempts: " + attemptCount + "</span><br>" +
            (isRequested ? "<span style='color:blue'>> Student requested for answer key.</span><br>" : "") +
            //"<span style='color:blue'>> Time Taken: " + timeTaken +" seconds</span><br>" +
            "<span style='color:blue'>> Score: " + currScore +
            "</span></div><hr></div>");

          // isSubmitted = false;
          isEndOfProblem = true;
          isRequested = false;
          attemptCount = 0;
        }
      }
    });
    totalHeightOfActionLogs = $problemDetail.prop('scrollHeight');
    $($problemDetail).children().hide(0);

    $($progressDetail).children().hide(0);
  }

  function showTillTime(timeStamp) {
    actionlog.forEach(function(action, idx) {
      var startTime = (playbackFlag) ? action.startTime : action.timestamp;
      if (startTime < timeStamp + 1) {
        actionlogIndex = idx;
        $("#action-" + idx).show(0);
        $("#progress-action-" + idx).show(0);
      } else {
        $("#action-" + idx).hide(0);
        $("#progress-action-" + idx).hide(0);
      }
    });
    scrollToBottom();

    showAffectByTimestamp(timeStamp);
  }

  // no need to check it here because the getStudentAffectState checks for playback and live version
  function showAffectByTimestamp(timestamp) {
    var affectiveState = currentStudent.getStudentAffectState(timestamp);
    if (affectiveState.redZone) {
      $($note).html("<label>Note: </label><span class='student-red-zone'>Require Attention</span>");
    } else if (affectiveState.goldZone) {
      $($note).html("<label>Note: </label><span class='student-green-zone'>Student Doing Well</span>");
    } else $($note).html("<label>Note: </label>");
  }

  function startAction(currentTime) {
    //   var currentAction = actionlog[actionlogIndex].key;
    // var affectiveState = currentStudent.getStudentAffectState(currentTime);
    if (actionlog[actionlogIndex].endTime <= currentTime) {
      console.log(actionlog.length);
      $("#action-" + actionlogIndex).show(0);
      $("#progress-action-" + actionlogIndex).show(0);
      actionlogIndex++;
    }

    // check if next event also has the same timestamp as we are working on seconds but the system runs on nano seconds so
    // often multiple actions combinations can happen in the interval of a few seconds
    if (actionlogIndex < actionlog.length && actionlog[actionlogIndex].endTime <= currentTime) {
      startAction(currentTime);
    } else {
      if (autoScroll) {
        scrollToBottom();
      }

      showAffectByTimestamp(currentTime);
    }

  }


  $slider.on('input', function() {
    pauseSlider();
    currentTime = parseInt($slider.val());
    $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
    showTillTime(currentTime);

    if (currentTime > timeSpent) {
      clearInterval(sliderInterval);
      currentTime = timeSpent;
      $playBtn.hide(0);
      $pauseBtn.hide(0);
      $reloadBtn.show(0);
    }

  });

  $(".std-play-btn").unbind('click').click(function() {
    playSlider();
  });

  function playSlider() {
    paused = !paused;
    pauseSlider(paused);
    startSlider();
  }

  function pauseSlider(pauseSlider = true) {
    paused = pauseSlider;
    $pauseBtn.toggle(!paused);
    $playBtn.toggle(paused);
    $reloadBtn.hide(0);

    clearInterval(sliderInterval);
  }

  $(".std-speedup-btn").unbind('click').click(function() {
    if (playbackSpeed < 16) {
      clearInterval(sliderInterval);
      playbackSpeed = playbackSpeed >= 16 ? 16 : playbackSpeed * 2;
      startSlider();

      toggleSpeedBtnDisable();
    }

  });

  $(".std-speeddown-btn").unbind('click').click(function() {
    if (playbackSpeed > 1) {
      clearInterval(sliderInterval);
      playbackSpeed = playbackSpeed <= 1 ? 1 : playbackSpeed / 2;
      startSlider();

      toggleSpeedBtnDisable();
    }
  });

  // Enable or disable speed up or speed down buttons
  function toggleSpeedBtnDisable() {
    $('.std-speedup-btn').toggleClass("disabled-ctrl", playbackSpeed == 16);
    $('.std-speeddown-btn').toggleClass("disabled-ctrl", playbackSpeed == 1);
  }

  $reloadBtn.unbind('click').click(function() {
    currentTime = 0;
    actionlogIndex = 0;
    $slider.val(currentTime);
    $slider.trigger('input');
    playSlider();

  });

  keyboardJS.bind('space', function(e) {
    if (studentInFocus) {
      e.preventDefault();
      if (currentTime < timeSpent) {
        if (paused) {
          playSlider();
        } else {
          pauseSlider();
        }
      } else {
        $reloadBtn.trigger('click');
      }
      console.log("crtl space clicked in student");
    }
  });


  $(".dialog-student-cancel").unbind('click').click(function(e) {
    setMainplayerInFocusCallback(true);
    studentInFocus = false;
    if (sliderInterval)
      clearInterval(sliderInterval);
    sliderInterval = null;
    $(".dialog-container, .dialog-student").hide(0);
    //        $mainPlayBtn.trigger("click");
  });


}
