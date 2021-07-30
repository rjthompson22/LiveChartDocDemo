/**
 * @global
 */
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
  var lastAction;
  var isSubmitted;
  var isRequested;
  var attemptCount;
  var isEndOfProblem;
  var startTime, endTime;
  var totalScore;
  var numQuestions;
  var studentInFocus;

  var $mainPlayBtn;

  var $scrollSwitch = $("#auto-scroll-btn");
  var autoScroll = $scrollSwitch.is(":checked");
  var setMainplayerInFocusCallback;

  $scrollSwitch.click(function() {
    autoScroll = $scrollSwitch.is(":checked");
  });

  this.init = function(student, questions, timeStamp = 0, $playbtn_, mainplayerInFocus_) {
    $mainPlayBtn = $playbtn_;
    currentStudent = student;
    timeSpent = student.getTimeSpent();
    currentTime = (timeSpent < timeStamp) ? timeSpent : timeStamp;
    timeSpentString = getFormattedSeconds(timeSpent);
    actionlog = student.getactions();
    $progressDetail.html("Progress: ");
    setMainplayerInFocusCallback = mainplayerInFocus_;
    studentInFocus = true;

    currentQuestions = questions;
    questionList = questions.getQuestions();
    actionlogIndex = 0;
    isSubmitted = false;
    isEndOfProblem = true;
    isRequested = false;
    attemptCount = 0;

    totalScore = currentStudent.getTotalScore().toFixed(2);
    numQuestions = questionList.length;

    $stdName.html(student.getName());
    $stdClass.html($("#class_name").html());

    plotEverything();
    showTillTime(timeStamp);
    //scrollToBottomFlag = false;
    initializeSlider();
  }

  var lastScrollTop = 0;
  var totalHeightOfActionLogs = 0;
  var totalLengthOfSlider = 0;


  /**
   * @global
   */
  function scrollToBottom() {
    $($problemDetail).scrollTop($($problemDetail)[0].scrollHeight);
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
    $playBtn.hide();
    $reloadBtn.hide();
    $pauseBtn.show();

    playbackSpeed = 1;
    paused = false;

    totalLengthOfSlider = Math.floor(timeSpent);
    $slider.attr('max', totalLengthOfSlider);
    if (sliderInterval)
      clearInterval(sliderInterval);
    $slider.val(currentTime);
    $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);

    startSlider();
  }

  $($problemDetail).scroll(function() {
    var st = $($problemDetail).scrollTop();
    if (st < lastScrollTop) {
      pauseSlider();
    }
  });

  function startSlider() {
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
        clearInterval(sliderInterval);
        $slider.val(currentTime);
        $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
        if (currentTime >= timeSpent) {
          $reloadBtn.show();
          $playBtn.hide();
          $pauseBtn.hide();
        }
      }
    }, (1000 / playbackSpeed));
  }

  function plotEverything() {
    var affectiveState;
    var activeProblem;
    var question;
    var currentAction;
    var timeTaken;
    var actionTime;

    $problemDetail.html("");

    actionlog.forEach(function(action, id) {
      currentAction = action.key;
      var idx = "action-" + id;

      // Store affective state in case we need it
      actionTime = action.startTime;

      affectiveState = currentStudent.getStudentAffectState(actionTime);
      var activeProblemIndex = affectiveState.activeProblemIndex + 1;

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

          $($problemDetail).append("<div class='log--question' id=" + idx + ">" +
            "<div>Question " + (activeProblemIndex + 1) + " of " + numQuestions +
            "<span class='right start-timestamp' id='time-indicator-" + activeProblemIndex + "' style='color:blue' data-actionTime=" + actionTime + "> " +
            "[ StartTime: " + getFormattedSeconds(Math.round(actionTime)) +
            "] </span></div><br>" + question.problemText.trim() + "<br></div>");
          $("#time-indicator-" + activeProblemIndex).unbind('click').click(function() {
            //$(this).unbind();
            //unbind click listener for this
            console.log("Testing timestamp button");

            currentTime = Math.round($(this).data("actiontime"));
            $slider.val(currentTime);
            $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
            showTillTime(currentTime);

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
        if ((currentAction == "StudentResponseAction" || currentAction == "StudentSubmissionAction") && !isSubmitted) {
          attemptCount += 1;

          var currScore = affectiveState.currentScore;
          var totalAttempt = affectiveState.currentProblemAttemptCount;
          var incorrectAnswer = currScore != 1 && attemptCount < totalAttempt;
          var otherCorrect = currScore != 1 && attemptCount == totalAttempt;

          $($problemDetail).append("<div class='log--action' id=" + idx + ">" +
            (affectiveState.currentScore == 1 ? "<span class='correct'> > Student provided the correct answer in Attempt #1.</span> <span class='check'> &check;</span><br>" : "") +
            (otherCorrect ? "<span class='correct'> > Student provided the correct answer in Attempt # " + attemptCount + ". </span> <br>" : "") + // <span class='cross'> &cross;</span><br>" : "") +
            (incorrectAnswer ? "<span class='incorrect'> > Student did not provide the correct answer in Attempt #" + attemptCount + ". </span>" +
              ((attemptCount == 1) ? " <span class='cross' > &cross;</span><br>" : "") : "") +
            "</div>");
          isSubmitted = currScore == 1;
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
            "<span style='color:blue'>> Time Taken: " + timeTaken + " seconds</span><br>" +
            "<span style='color:blue'>> Score: " + currScore +
            "</span></div><hr></div>");

          isSubmitted = false;
          isEndOfProblem = true;
          isRequested = false;
          attemptCount = 0;
        }
      }
    });
    totalHeightOfActionLogs = $problemDetail.prop('scrollHeight');
    $($problemDetail).children().hide();

    $($progressDetail).children().hide();
  }

  function showTillTime(timeStamp) {
    actionlog.forEach(function(action, idx) {
      if (action.startTime < timeStamp) {
        actionlogIndex = idx;
        $("#action-" + idx).show();
        $("#progress-action-" + idx).show();
      } else {
        $("#action-" + idx).hide();
        $("#progress-action-" + idx).hide();
      }

    });
    scrollToBottom();

    showAffectByTimestamp(timeStamp);
  }

  function showAffectByTimestamp(timestamp) {
    var affectiveState = currentStudent.getStudentAffectState(timestamp);
    if (affectiveState.redZone) {
      $($note).html("<label>Note: </label><span class='student-red-zone'>Require Attention</span>");
    } else if (affectiveState.goldZone) {
      $($note).html("<label>Note: </label><span class='student-green-zone'>Student Doing Well</span>");
    } else $($note).html("<label>Note: </label>");
  }

  function startAction(currentTime) {
    var currentAction = actionlog[actionlogIndex].key;
    var affectiveState = currentStudent.getStudentAffectState(currentTime);

    if (actionlog[actionlogIndex].endTime <= currentTime) {
      $("#action-" + actionlogIndex).show();
      $("#progress-action-" + actionlogIndex).show();
      actionlogIndex++;
    }

    if (autoScroll) {
      scrollToBottom();
    }

    showAffectByTimestamp(currentTime);
  }


  $slider.on('input', function() {
    pauseSlider();
    currentTime = parseInt($slider.val());
    $timer.html(getFormattedSeconds(currentTime) + ' / ' + timeSpentString);
    showTillTime(currentTime);

    if (currentTime >= timeSpent) {
      clearInterval(sliderInterval);
      currentTime = timeSpent;
      $playBtn.hide();
      $pauseBtn.hide();
      $reloadBtn.show();
    }

  });

  $(".std-play-btn").click(function() {
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
    $reloadBtn.hide();

    clearInterval(sliderInterval);
  }

  $(".std-speedup-btn").click(function() {
    if (playbackSpeed < 16) {
      clearInterval(sliderInterval);
      playbackSpeed = playbackSpeed >= 16 ? 16 : playbackSpeed * 2;
      startSlider();

      toggleSpeedBtnDisable();
    }

  });

  $(".std-speeddown-btn").click(function() {
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

  $reloadBtn.click(function() {
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


  $(".dialog-student-cancel").click(function(e) {
    setMainplayerInFocusCallback(true);
    studentInFocus = false;
    if (sliderInterval)
      clearInterval(sliderInterval);
    sliderInterval = null;
    $(".dialog-container, .dialog-student").hide(0);
    //        $mainPlayBtn.trigger("click");
  });


}
