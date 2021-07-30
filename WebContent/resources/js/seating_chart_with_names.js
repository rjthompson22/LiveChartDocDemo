$(function() {
  //ScreenOrientation.lock('landscape')

  // let's make a master document with live chart vocabulary
  // Luc paquette: sequence mining to map towards affects (supervised) instead of mining
  // 				 sequences based on affect (unsupervised) does this sound correct?

  var alertDialog = new AlertDialog();

  var numberOfStudentsPerRow = 6;
  var students = [];
  var questions;
  //$(".dropdown-menu").hide(0);
  $(".seating-arrangement-root-container").hide(0);
  $(".dialog-student").hide(0);
  var seatingArrangement;
  var maxTimeSpent = 0;
  var maxTimeSpentString = '';
  var currentPlaybackTime;
  var currentLiveTime;
  var fullscreenMode = false;

  var paused, playbackSpeed;
  var $slider = $("#mainSlider");
  var $timer = $("#sliderValue");
  var $playBtn = $("#play");
  var $pauseBtn = $("#pause");
  var $reloadBtn = $(".reload-btn");

  var $fullScreenBtn = $('#fullscreen');
  var $normalScreenBtn = $('#normalscreen');


  /**
   * This is just minor bookkeeping to indicate whether the class is in live mode or in playback mode.
   */
  if (playbackFlag) {
    $(".live-playback-indicator").removeClass("live-indicator").html("Playback");
  } else {
    $(".live-playback-indicator").removeClass("playback-indicator").html(" <span>&bull;</span> LIVE ");
  }

  /**
   * 
   */
  function initializeSliderButtons() {
    paused = false;
    playbackSpeed = 1;
    currentPlaybackTime = 0;

    $pauseBtn.show(0);
    $playBtn.hide(0);
    $reloadBtn.hide(0);

    $fullScreenBtn.show(0);
    $normalScreenBtn.hide(0);
  }
  initializeSliderButtons();

  var $dialog_setting_close = $("#dialog-setting-close");
  var $dialog_container = $(".dialog-container, .dialog-setting");
  $("#dialog-setting-close, .dialog-setting-cancel").click(function() {
    $dialog_container.hide(0);
  });

  var $setting_icon = $(".setting-btn");
  $setting_icon.click(function() {
    pauseSlider();
    $dialog_container.show(0);
  });

  /**
   * 
   */
  var $setting_start = $("#dialog-setting-start");
  $setting_start.click(function() {
    $dialog_container.hide(0);
  });

  var studentReportDetailCoreJson;

  $("#dialog-setting-start").prop('disabled', true);
  $.ajax({
    type: "POST",
    data: xref,
    crossDomain: true,
    contentType: "application/json",
    dataType: "json",
    url: "/LiveChart/getStudentReportDetail",
    success: function(result) {
      studentReportDetailCoreJson = result;
      // console.log(result);

      // parse the qustions in the problem set
      questions = new Questions();
      questions.init(studentReportDetailCoreJson[0].problems);

      // parse and combine the respective users and their userRepors
      var users = studentReportDetailCoreJson[0].users;
      var userReport = studentReportDetailCoreJson[0].userReport;
      $("#dialog-setting-start").prop('disabled', false);

      for (var i = 0; i < users.length; i++) {
        var student = new Student();
        student.init(users[i], userReport[i], questions.getTotalQuestions());
        students.push(student);
      }

      // check for pre-existing seating arrangement
      seatingArrangement = new SeatingArrangement();
      seatingArrangement.init($(".seating-arrangement-container"), students, testingSeatingArrangementCompletion, pauseSlider, setMainplayerInFocus);

    },
    complete: function() {
      if (seatingArrangement == null) {
        $(".loading-cover").hide(0);
        $(".dialog-setting").show(0);
      }
      if (!playbackFlag)
        ajaxTimeoutController = setTimeout(function() {
          updateForLive();
        }, 20000);
    },
    error: function() {
      // Probably redirect to previous page with notification that it did not
      // work or the type of error.
    }
  });

  //assistmentsgedu
  var updateForLiveInterval;
  var count = 0;
  var ajaxTimeoutController;

  /**
   * 
   */
  function updateForLive() {
    // console.log("interval request trigger", new Date().toUTCString());
    $.ajax({
      type: "POST",
      data: xref,
      crossDomain: true,
      contentType: "application/json",
      dataType: "json",
      url: "/LiveChart/getStudentReportDetail",
      success: function(result) {
        studentReportDetailCoreJson = result;
        // console.log("interval ajax POST result", new Date().toUTCString());
        // console.log(result);
        var userReport = studentReportDetailCoreJson[0].userReport;
        var users = studentReportDetailCoreJson[0].users;

        var usersXref = studentReportDetailCoreJson[0].users.map(x => x.userXref);

        var userIdx = 0;
        for (var i = 0; i < students.length; i++) {
          userIdx = usersXref.indexOf(students[i].getStudentXref());
          // console.log(users[userIdx].firstname);
          students[i].updateUserReport(userReport[userIdx]);
          // console.log(students[i].getName(), users[userIdx]);
        }
        // console.log(students);
      },
      complete: function() {
        if (count < 180) {
          count++;
          ajaxTimeoutController = setTimeout(function() {
            updateForLive();
          }, 20000);
        } else {
          alertDialog.init("A1", "The Live feature is only designed to track for 60 minutes in a single session. If you wish to continue tracking the students then please refresh your page.");
        }
      },
      error: function() {}
    });
  }

  /**
   * 
   */
  function rearrangeStudentsInAlphabeticalOrder() {
    var new_students = [];
    var $studentNames = $(".info-block-general .student-info .student-name-info");
    // console.log("student names length : " + $studentNames.length);

    var studentNamesArray = students.map(student => student.getName());

    // console.log(studentNamesArray);
    // console.log(studentNamesArray.sort());
  }

  /**
   * 
   */
  function rearrangeStudents() {
    //rearrangeStudentsInAlphabeticalOrder()
    var new_students = [];
    var $studentNames = $(".info-block-general .student-info .student-name-info");
    var $studentInfo = $(".info-block-general .student-info");
    // console.log("student names length : " + $studentNames.length);
    for (var i = 0; i < $studentNames.length; i++) {
      for (var j = 0; j < students.length; j++) {
        if (students[j].getName() == $($studentNames[i]).html().trim()) {
          new_students.push(students[j]);
          break;
        }
      }
      // console.log(students[j].getName() + " : " + $($studentNames[i]).html().trim());
    }

    if (new_students.length == students.length) {
      students = new_students;
      students.forEach(function(student, index) {
        student.resetStudentAffectState();

        for (var i = 0; i < $studentNames.length; i++) {
          if (student.getName() == $($studentNames[i]).html().trim()) {
            //attaching data to each student div.
            $($studentInfo[i]).data("student_index", index);
            break;
          }
        }
      });

    } else {
      // console.log(students);
      // console.log(new_students);
      rearrangeStudents();
    }

  }

  var alphabeticalSeatingArrangement = false;
  var viewPerProblem = false;
  var $seatingArrangementToggle = $("#seating-arrangement-toggle");
  var $viewPerProblemToggle = $("#view-per-problem-toggle");
  var $colorBlindnessToggle = $("#color-blindness-toggle");

  /**
   * if the toggle is off that means the seating arrangement should be alphabetical
   */ 
  $seatingArrangementToggle.change(function() {
    testingSeatingArrangementCompletion();
  });
  
  /**
   * 
   */
  $viewPerProblemToggle.change(function() {
  	$(".info-block-general").toggleClass("tutoring-problem-levels");
  	testingSeatingArrangementCompletion();
  	// tutoring-problem-levels 
  });
  
  //$viewPerProblemToggle.bootstrapToggle('off');
  
  /**
   * 
   */
  $colorBlindnessToggle.change(function() {
    $(".root-container").toggleClass("colorblind-green");
  });
  /**
   * TODO: need to change this eventually into something more reasonable
   * the SeatingArrangements.js callback calls this function
   */
  
  function testingSeatingArrangementCompletion() {
    alphabeticalSeatingArrangement = $seatingArrangementToggle.parent().hasClass("off");
    viewPerProblem = $viewPerProblemToggle.parent().hasClass("off");
    var seatingarrangementJson = (alphabeticalSeatingArrangement) ? seatingArrangement.getSeatingArranementJson(-1) : seatingArrangement.getSeatingArranementJson();
    if (Object.keys(seatingarrangementJson).length > 0) {
      clearInterval(sliderInterval);
      if(!viewPerProblem){
	      drawStudentsPerProblem(seatingArrangement.getSeatingArranementJson(-1));
      } else {
      	drawStudents(seatingarrangementJson);
	      // drawStudentsPerProblem(seatingArrangementJson);
      }
      $(".loading-cover").hide(0);
      $dialog_container.hide(0);
    } else {
      alertDialog.init("A1", "Something happened while trying to call the callback functions to draw the seatingArrangement this is a logic flaw and should have never happened");
    }
  }

  /**
   * 
   * @param {*} seatingArrangementJson_0 
   */
  function drawStudents(seatingArrangementJson_0) {

    if (seatingArrangementJson_0.totalrows > 11) {
      alertDialog.init("A1", "Hi teacher! Just a heads up. The LIVE-CHART system was designed" +
        " with a class that has at most about 60 students within 12 rows and 12 columns." +
        " We would encourage arranging your class in a similar " +
        "arrangement to have the best user experience.");
    }

    var $infoBlockGeneral = $(".info-block-general");
    var studentRowHtml = "<div class=\"student-row\" > </div>";
    $infoBlockGeneral.html("<span class=\"info-block-general-title \">Class: XYZ</span>");
    $(".student-row").html("");

    var $infoBlockZones = $(".info-block-zones");
    // disable-gold-zone
    $infoBlockZones.html("<div class='info-red-zone'></div> <div class='info-gold-zone expand-reveal'></div>");

    var studentInfoPrefix = "<div class=\"student-info \" > <img class='good-job-badge' src='/LiveChart/resources/images/well-done.png'>" +
      "<div class=\"teacher-student-avatar-container\"> <img class=\"student-img student-img-regular\" src=\"/LiveChart/resources/images/student-final.png\"/>" +
      "<img class=\"student-img student-img-gold\" src=\"/LiveChart/resources/images/student-final-gold.png\"/> " +
      "<img class=\"student-img student-img-red\" src=\"/LiveChart/resources/images/student-final-red.png\"/>" +
      "<p class=\"student-name-info\">";
    var studentInfoPrefixEmptySlots = "<div class=\"empty-space\" >";
    var teacherInfoPrefix = "<div class=\"teacher-space\" > <div class=\"teacher-student-avatar-container\"> <img class=\"teacher-img\" src=\"/LiveChart/resources/images/teacher-final.png\"/> <p class=\"teacher-name-info\">";

    /**
    	Should we do last 5 questions instead so it can be more real-time: March's idea which I whole-heartedly concur with.
    */
    var studentInfoSuffix = "</p> </div> <span class=\"custom-floating-icon\"></span>" +
      "<p class='student-info-description'>Last 5 problems:</p>" +
      "<p class='last-five-problems'></p>" +
      //"<div class=\"progress\">" +
      //"<div class=\"progress-bar progress-bar-striped bg-success\" style=\"width:40%\"> Free Space </div>" +
      //"<div class=\"progress-bar progress-bar-striped bg-warning\" style=\"width:10%\"> Warning </div>" +
      //"<div class=\"progress-bar progress-bar-striped bg-danger\" style=\"width:20%\"> Danger </div>" +
      //"<div class=\"progress-bar progress-bar-striped progress-bar-animated\" role=\"progressbar\""+
      //" aria-valuenow=\"75\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 75%\"></div>" +
      //"</div>" +
      //Assignment
      "<p class='absence-complete-indicator'>Absent!</p>" +
      "<p class='student-info-description'>Progress:<span class=\"assignment-progress-indicator\">&nbsp;</span></p>" +
      "<div class=\"progress\">" +
      "<div class=\"current-assignment-progress progress-bar\" role=\"progressbar\"" +
      " aria-valuenow=\"75\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 100%\"></div>" +
      "</div>" +
      "</div>";
    var teacherInfoSuffix = "</p> </div> </div>";
    var studentInfoSuffixEmptySlots = " </div>";
    var user;
    var $studentRow = $(".info-block-general .student-row");
    var $studentRows;

    var seatingGridInfo;
    for (var i = 0; i < seatingArrangementJson_0.totalrows; i++) {
      $infoBlockGeneral.append(studentRowHtml);
      $studentRows = $(".info-block-general .student-row");
      $studentRow = $($studentRows[$studentRows.length - 1]);

      seatingGridInfo = seatingArrangementJson_0.seatingGrid[i].row;

      for (var j = 0; j < seatingArrangementJson_0.totalcolumns; j++) {
        if (seatingGridInfo[j].hasOwnProperty('name')) {
          switch (seatingGridInfo[j].name.trim().toUpperCase()) {
            case "TEACHER DESK":
              $studentRow.append(teacherInfoPrefix + seatingGridInfo[j].name + teacherInfoSuffix);
              break;
            default:
              $studentRow.append(studentInfoPrefix + seatingGridInfo[j].name + studentInfoSuffix);
              break;
          }
        } else {
          $studentRow.append(studentInfoPrefixEmptySlots + "&nbsp;" + studentInfoSuffixEmptySlots);
        }
      }
    }

    $(".student-info").addClass('disabled');
    $(".student-info, .empty-space, .teacher-space").css({
      "width": (96 / seatingArrangementJson_0.totalcolumns) + "%"
    });

    $infoBlockGeneral.append("<div class=\"playback-live-ended\"> The session has ended!!</div>");
    $(".info-red-zone").html(
      "<span class=\"info-red-zone-title \">Requires Attention!</span><div class=\"student-row\"> <p class=\"student-info expand-reveal2\"" +
      " id=\"placeholder-red\" >Name of student requiring attention.</p> </div>"
    );

    // disable-gold-zone
    $(".info-gold-zone").html(
      "<span class=\"info-gold-zone-title  \">Students Doing Well [ <span class='blue hide'>HIDE!</span> ]</span><div class=\"student-row\">" +
      "<p class=\"student-info expand-reveal2\" id=\"placeholder-gold\" >Name of student doing well.</p></div>"
    );

    $infoGoldZoneTitle = $(".info-gold-zone-title");

    // $(".info-gold-zone > .student-row, .progress").hide(0);
    $(".progress").hide(0);
    $infoGoldZoneTitle.click(function() {
      $(".info-gold-zone").toggleClass("disable-gold-zone");
      $(".info-gold-zone > .student-row").toggle();
      $(this).html(($(this).find('.show').length > 0) ?
        "Students Doing Well [ <span class='blue hide'>HIDE!</span> ]" :
        "Students Doing Well [ <span class='blue show'>SHOW!</span> ]");
    });

    rearrangeStudents();
    if (playbackFlag) {
      // this is if it is in playback mode
      maxTimeSpent = Math.max(...students.map(std => Math.round(std.getTimeSpent())));
      maxTimeSpentString = getFormattedSeconds(maxTimeSpent);
    } else {
      // this is if it is in live mode
      // This is here because the idea is or live version the time on the player time indicator is gonna appear as
      // -20:21/00:00 LIVE if the first action in the class was made 20 minutes and 21 seconds ago
      liveStartTime = Math.min(...students.map(std => std.getStartTime()).filter(x => x > 0));
      currentLiveTime = Math.floor(new Date().getTime() / 1000) - 20;
    }
    loadSlider();

    // open up student info modal
    /*
	$(".student-info").click(function(e) {
        	if($(this).hasClass('disabled')) return false;

            pauseSlider();
            var studentIndex = $(e.currentTarget).data('student_index')
            var studentData = students[studentIndex];
            var studentModal = new StudentInfoModal();
            $(".dialog-container, .dialog-student").show(0);
            studentModal.init(studentData, questions, currentPlaybackTime, $($playbtn[0]));

        });
	*/
  }

  /**
   * 
   * @param {*} seatingArrangementJson_0 
   */
  function drawStudentsPerProblem(seatingArrangementJson_0) {

    if (seatingArrangementJson_0.totalrows > 11) {
      alertDialog.init("A1", "Hi teacher! Just a heads up. The LIVE-CHART system was designed" +
        " with a class that has at most about 60 students within 12 rows and 12 columns." +
        " We would encourage arranging your class in a similar " +
        "arrangement to have the best user experience.");
    }

    var $infoBlockGeneral = $(".info-block-general").addClass("tutoring-problem-levels");
    var studentRowHtml = "<div class=\"student-row\" > </div>";
    $infoBlockGeneral.html("<span class=\"info-block-general-title \">Class: XYZ</span>");
    // had to add this new div because the content was getting squished too tightly because of the larger number of
    // questions in the problem set. The div now allows us to have the functionality to overlfow if needed
    // NOTE: this is only required in the problem level analysis
    $infoBlockGeneral.html("<i class=\"fa fa-chevron-circle-left scroll-left\" aria-hidden=\"true\"></i>" +
      "<i class=\"fa fa-chevron-circle-right scroll-right\" aria-hidden=\"true\"></i>" +
      "<div class=\"tutoring-problem-level-analysis-container\">" +
      "</div>");

    let leftScrollValue = 0;
    var scrollUpdateValue = $infoBlockGeneral.outerWidth() / 4;
    var $problemLevelAnalysisContainer = $(".tutoring-problem-level-analysis-container");

    var $scrollLeft = $(".scroll-left");
    var $scrollRight = $(".scroll-right");

    $scrollLeft.click(function() {
      leftScrollValue -= scrollUpdateValue;
      if (leftScrollValue <= 0) {
        $(this).hide(0);
        leftScrollValue = 0;
      }
      $scrollRight.show(0);
      $problemLevelAnalysisContainer.scrollLeft(leftScrollValue);
    });

    $scrollRight.click(function() {
      leftScrollValue += scrollUpdateValue;
      if ((leftScrollValue + $problemLevelAnalysisContainer.width()) > $problemLevelAnalysisContainer[0].scrollWidth) {
        leftScrollValue = $problemLevelAnalysisContainer[0].scrollWidth - $problemLevelAnalysisContainer.width();
        $(this).hide(0);
      }
      $scrollLeft.show(0);
      $problemLevelAnalysisContainer.scrollLeft(leftScrollValue);
    });
    $(".student-row").html("");

    var $infoBlockZones = $(".info-block-zones");
    // disable-gold-zone
    $infoBlockZones.html("<div class='info-red-zone'></div> <div class='info-gold-zone expand-reveal'></div>");

    var studentInfoPrefix = "<div class=\"student-info \" data-is-absentee-completed= 'false' data-active-problem='0'> <img class='good-job-badge' src='/LiveChart/resources/images/well-done.png'>" +
      "<div class=\"teacher-student-avatar-container\"> <img class=\"student-img student-img-regular\" src=\"/LiveChart/resources/images/student-final.png\"/>" +
      "<img class=\"student-img student-img-gold\" src=\"/LiveChart/resources/images/student-final-gold.png\"/> " +
      "<img class=\"student-img student-img-red\" src=\"/LiveChart/resources/images/student-final-red.png\"/>" +
      "<p class=\"student-name-info\">";
    var studentInfoPrefixEmptySlots = "<div class=\"empty-space\" >";
    var teacherInfoPrefix = "<div class=\"teacher-space\" > <div class=\"teacher-student-avatar-container\"> <img class=\"teacher-img\" src=\"/LiveChart/resources/images/teacher-final.png\"/> <p class=\"teacher-name-info\">";

    /**
    	Should we do last 5 questions instead so it can be more contextually relevant: March's idea which I whole-heartedly concur with.
    */
    var studentInfoSuffix = "</p> </div> <span class=\"custom-floating-icon\"></span>" +
      "<p class='student-info-description'>Last 5 problems:</p>" +
      "<p class='last-five-problems'></p>" +
      //Assignment
      "<p class='absence-complete-indicator'>Absent!</p>" +
      // "<p class='student-info-description'>Progress:<span class=\"assignment-progress-indicator\">&nbsp;</span></p>" +
      // "<div class=\"progress\">" +
      // "<div class=\"current-assignment-progress progress-bar\" role=\"progressbar\"" +
      // " aria-valuenow=\"75\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 100%\"></div>" +
      // "</div>" +
      "</div>";
    var teacherInfoSuffix = "</p> </div> </div>";
    var studentInfoSuffixEmptySlots = " </div>";
    var user;
    var $studentRow = $(".info-block-general .student-row");
    var $studentRows;

    var seatingGridInfo;
    var questionText = "Problem ";
	var questionLabels = questions.getQuestionLabels();
    questionText = (questions.getTotalQuestions() > 4) ? "P" : questionText;

    for (var i = 0; i < questions.getTotalQuestions(); i++) {
      $problemLevelAnalysisContainer.append(studentRowHtml);
      $studentRows = $(".info-block-general .student-row");
      $studentRow = $($studentRows[$studentRows.length - 1]).addClass("question" + i + ((i > 0) ? " empty-question" : ""));
      $studentRow.html("<button type='button' class='btn btn-outline-primary question-inidcator' data-question-idx='" + i + 
      					"'>" + questionLabels[i].replace(/Problem /g, questionText) + "</button>");
    }

    // adding two more columns for completed and absentees
    var additionalColumns = ["Absentees", "Incomplete", "Completions"]
    for (var i = 0; i < additionalColumns.length; i++) {
      $problemLevelAnalysisContainer.append(studentRowHtml);
      $studentRows = $(".info-block-general .student-row");
      $studentRow = $($studentRows[$studentRows.length - 1]).addClass([additionalColumns[i].toLowerCase(), 'nonquestion']);
      $studentRow.html("<p class='label-inidcator'>" + additionalColumns[i] + "</p>");
    }

    var seatingGridInfo;
    for (var i = 0; i < seatingArrangementJson_0.totalrows; i++) {
      $studentRow = $($studentRows[0]);

      seatingGridInfo = seatingArrangementJson_0.seatingGrid[i].row;

      for (var j = 0; j < seatingArrangementJson_0.totalcolumns; j++) {
        if (seatingGridInfo[j].hasOwnProperty('name')) {
          switch (seatingGridInfo[j].name.trim().toUpperCase()) {
            case "TEACHER DESK":
              // do nothing if teacher desk is the key word
              break;
            default:
              // otherwise add the student name to the problem 1 stack
              $studentRow.append(studentInfoPrefix + seatingGridInfo[j].name + studentInfoSuffix);
              break;
          }
        }
      }
    }

    $(".student-info").each(function(index) {
      $(this).data("students-index", index);
    });

    //$(".student-row").css({
    //  "width": (94 / questions.getTotalQuestions())+"%"
    //});

    $(".student-info").addClass('disabled');

    if ($($(".student-info")[0]).outerWidth() < 400) {
      $(".student-info, .empty-space, .teacher-space").css({
        "width": "96%"
      });
    } else {
      $(".student-info, .empty-space, .teacher-space").css({
        "width": "38%"
      });
    }

    $(".info-red-zone").html(
      "<span class=\"info-red-zone-title \">Requires Attention!</span><div class=\"student-row\"> <p class=\"student-info expand-reveal2\"" +
      " id=\"placeholder-red\" >Name of student requiring attention.</p> </div>"
    );

    // disable-gold-zone
    $(".info-gold-zone").html(
      "<span class=\"info-gold-zone-title  \">Students Doing Well [ <span class='blue hide'>HIDE!</span> ]</span><div class=\"student-row\">" +
      "<p class=\"student-info expand-reveal2\" id=\"placeholder-gold\" >Name of student doing well.</p></div>"
    );

    $infoGoldZoneTitle = $(".info-gold-zone-title");

    // $(".info-gold-zone > .student-row, .progress").hide(0);
    $(".progress").hide(0);
    $infoGoldZoneTitle.click(function() {
      $(".info-gold-zone").toggleClass("disable-gold-zone");
      $(".info-gold-zone > .student-row").toggle();
      $(this).html(($(this).find('.show').length > 0) ?
        "Students Doing Well [ <span class='blue hide'>HIDE!</span> ]" :
        "Students Doing Well [ <span class='blue show'>SHOW!</span> ]");
    });

    rearrangeStudents();

    $(".question-inidcator").click(function() {
      alertDialog.init("QuestionDetail", questions.getQuestions()[$(this).data("question-idx")]);
    });

    if (playbackFlag) {
      // this is if it is in playback mode
      maxTimeSpent = Math.max(...students.map(std => Math.round(std.getTimeSpent())));
      maxTimeSpentString = getFormattedSeconds(maxTimeSpent);
    } else {
      // this is if it is in live mode
      // This is here because the idea is or live version the time on the player time indicator is gonna appear as
      // -20:21/00:00 LIVE if the first action in the class was made 20 minutes and 21 seconds ago
      liveStartTime = Math.min(...students.map(std => std.getStartTime()).filter(x => x > 0));
      currentLiveTime = Math.floor(new Date().getTime() / 1000) - 20;
    }
    loadSlider();
  }


  $(window).on('beforeunload', function() {
    clearInterval([sliderInterval]);
  });

  var sliderInterval;

  /**
   * 
   */
  function loadSlider() {
    initializeSliderButtons();

    if (playbackFlag) {
      $slider.attr('max', maxTimeSpent);
      $slider.val(0);
      $timer.html('00:00 / ' + maxTimeSpentString);
    } else {
      $slider.attr('min', liveStartTime);
      $slider.attr('max', currentLiveTime);
      $slider.val(currentLiveTime);
      $timer.html("-00:00 ");
      $(".absence-complete-indicator").html("Not Started!");
      initiateLiveAction(currentLiveTime);
    }
    startSlider();
  }


  /**
   * Can we rewrite this because this is functionally correct but it doesn't feel correct
   * because I keep finding bugs in it.
   * Let us use the jquery UI slider instead. The code is more standardized and easier to
   * understand and breakdown.
   *
   * -Ashish
   */
  var liveStartTime = 0;

  function initiateLiveAction(currentLiveTime) {
    // console.log("currentPlaybackTime : ", currentPlaybackTime);
    // console.log("maxTimeSpent : ", maxTimeSpent);
    // console.log("LIVE controller code goes in here!!");
    console.log("The session started certain while ago: ", getFormattedSeconds(Math.floor(currentLiveTime)));

    // while (currentPlaybackTime < (maxTimeSpent - 200)) {
    //   startActionLIVE(currentPlaybackTime);
    //   $slider.val(currentPlaybackTime);
    //   $timer.html(getFormattedSeconds(currentPlaybackTime) + ' / ' + maxTimeSpentString);
    //   currentPlaybackTime++;
    // }
  }

  var setMainplayerInFocus = function(bool) {
    mainplayerInFocus = bool;
  }

  /**
   * 
   */
  function startSlider() {
  	if (sliderInterval)
		clearInterval(sliderInterval);
    
    if (playbackFlag) {
      sliderInterval = setInterval(function() {
        if (!paused) {
          $slider[0].stepUp();
          if(!viewPerProblem){
	      	startActionPlaybackProblemLevel(currentPlaybackTime);
          } else {
          	startActionPlayback(currentPlaybackTime);
          }
          $timer.html(getFormattedSeconds(currentPlaybackTime) + ' / ' + maxTimeSpentString);
          currentPlaybackTime += 1;
        }
        if (parseInt($slider.val()) == maxTimeSpent || paused) {
          if(!viewPerProblem){
	      	startActionPlaybackProblemLevel(currentPlaybackTime);
          } else {
          	startActionPlayback(currentPlaybackTime);
          }
          clearInterval(sliderInterval);
          $slider.val(currentPlaybackTime);
          $timer.html(getFormattedSeconds(currentPlaybackTime) + ' / ' + maxTimeSpentString);
          if (currentPlaybackTime == maxTimeSpent) {
            $reloadBtn.show(0);
            $playBtn.hide(0);
            $pauseBtn.hide(0);
          }
        }
      }, (1000 / playbackSpeed));
    } else {
      sliderInterval = setInterval(function() {
        $slider.attr('max', parseInt($slider.attr('max')) + 1);
        if (!paused) {
          $slider[0].stepUp();
          startActionLIVE(currentLiveTime);
          // this needs to be changes as it increases with time if the live version is paused
          $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
          currentLiveTime += 1;
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

  $slider.on('input', function() {
    $(".disabled-complete").removeClass("disabled-complete");
    pauseSlider();

    if (playbackFlag) {
      currentPlaybackTime = parseInt($slider.val());
      $timer.html(getFormattedSeconds(currentPlaybackTime) + ' / ' + maxTimeSpentString);
      startActionPlayback(currentPlaybackTime);
      if (currentPlaybackTime >= maxTimeSpent) {
        currentPlaybackTime = maxTimeSpent;
        $playBtn.hide(0);
        $pauseBtn.hide(0);
        $reloadBtn.show(0);
      }
    } else {
      // This is the LIVE portion so there is no point in showing
      // reload buttons and manipulating the play pause buttons
      currentLiveTime = parseInt($slider.val());
      $timer.html("-" + getFormattedSeconds($slider.attr('max') - $slider.val()));
      $(".absence-complete-indicator").html("Not Started!");
      startActionLIVE(currentLiveTime);
    }
  });


  /**
   * 
   * @param {*} currentPlaybackTime 
   */
  function startActionPlayback(currentPlaybackTime) {
    var $studentInfos = $(".info-block-general .student-info");
    var $infoRedZone = $(".info-red-zone");
    var $infoGoldZone = $(".info-gold-zone");
    var $infoBlockZones = $(".info-block-zones");
    var $placeholderRed = $("#placeholder-red");
    var $placeholderGold = $("#placeholder-gold");

    var affectiveStateFlags;
    var lastFiveCorrectness;
    var $lastFiveProblems;
    var $studentInfo;
    var studentNameID;
    var $assignmentProgressIndicator;

    for (var i = 0; i < $studentInfos.length; i++) {
      $studentInfo = $($studentInfos[i]);
      studentNameID = students[i].getName().replace(/\s+/g, '').replace(/[^\w\s]/gi, '');
      if (currentPlaybackTime < students[i].getTimeSpent()) {
        // clear everything before ploting
        // $($studentInfo[i]).removeClass("disabled");
        $studentInfo.find(".absence-complete-indicator").html("Completed!").hide(0);

        $lastFiveProblems = $studentInfo.find(".last-five-problems");

        affectiveStateFlags = students[i].getStudentAffectState(currentPlaybackTime);

        lastFiveCorrectness = students[i].getLastFiveProblemCorrectness(affectiveStateFlags.activeProblemIndex);
        if (lastFiveCorrectness && affectiveStateFlags.activeProblemIndex != null) {
          $lastFiveProblems.html('');
          lastFiveCorrectness.forEach(correct => {
            if (correct) {
              $lastFiveProblems.append("<span class='check' > &check;</span>");
            } else {
              $lastFiveProblems.append("<span class='cross' > &cross;</span>");
            }
          });
        }
        if (affectiveStateFlags.activeProblemIndex != null)
          $studentInfo.find(".assignment-progress-indicator").html("&nbsp;" + (affectiveStateFlags.activeProblemIndex + 1) + "/" + questions.getTotalQuestions());

        if (affectiveStateFlags) {
          //clear everything before ploting
          $studentInfo.removeClass("disabled");
          $studentInfo.find(".progress").show(0);
          $studentInfo.find(".current-assignment-progress").attr('aria-valuenow', affectiveStateFlags.progressPercentage)
            .css({
              'width': affectiveStateFlags.progressPercentage + '%'
            });
          if (affectiveStateFlags.redZone && !($studentInfo.hasClass("red-marked"))) {
            // $studentInfo[0].scrollIntoView({
            //    behavior: "smooth", // or "auto" or "instant"
            //    block: "start" // or "end"
            // });
            // $infoBlockZones[0].scrollIntoView({
            //    behavior: "smooth", // or "auto" or "instant"
            //    block: "start" // or "end"
            // });

            // $studentInfo.find(".student-img-red").show(0);
            // $studentInfo.find(".student-img-regular").hide(0);
            $studentInfo.addClass("red-marked");
            if ($infoRedZone.is(":hidden")) {
              $infoRedZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderRed.is(":hidden")) {
              $placeholderRed.hide(0);
            }
            $infoRedZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_red\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[i].getName() + "</p>");
            $("#" + studentNameID + "_red").click(function() {});
          } else if (!affectiveStateFlags.redZone) {
            if ($("#" + studentNameID + "_red").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("red-marked");
              $("#" + studentNameID + "_red").remove();
            }
          }

          if (affectiveStateFlags.goldZone && !($studentInfo.hasClass("gold-marked"))) {
            // $studentInfo.find(".good-job-badge").show(0);
            // $(".student-img-gold").show(0);
            // $(".student-img-regular").hide(0);
            $studentInfo.addClass("gold-marked ");
            $studentInfo.find(".custom-floating-icon").show(0);
            if ($infoGoldZone.is(":hidden")) {
              $infoGoldZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderGold.is(":hidden")) {
              $placeholderGold.hide(0);
            }
            $infoGoldZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_gold\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[i].getName() + "</p>");
            $("#" + studentNameID + "_gold").click(function() {});
          } else if (!affectiveStateFlags.goldZone) {
            if ($("#" + studentNameID + "_gold").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("gold-marked");
              $("#" + studentNameID + "_gold").remove();
            }
          }
        }
      } else {
        $studentInfo.find(".absence-complete-indicator").show(0);
        if (!$studentInfo.hasClass('disabled'))
          $studentInfo.addClass("disabled-complete");

        $("#" + studentNameID + "_red, #" + studentNameID + "_gold").remove();

        if ($placeholderGold.is(":hidden") && $infoGoldZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderGold.show(0);
        }
        if ($placeholderRed.is(":hidden") && $infoRedZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderRed.show(0);
        }
      }
    }
  }

  /**
   * 
   * @param {*} currentPlaybackTime 
   */
  function startActionPlaybackProblemLevel(currentPlaybackTime) {
    var $studentInfos = $(".info-block-general .student-info");
    var $infoRedZone = $(".info-red-zone");
    var $infoGoldZone = $(".info-gold-zone");
    var $infoBlockZones = $(".info-block-zones");
    var $placeholderRed = $("#placeholder-red");
    var $placeholderGold = $("#placeholder-gold");

    var affectiveStateFlags;
    var lastFiveCorrectness;
    var $lastFiveProblems;
    var $studentInfo;
    var studentNameID;
    var $assignmentProgressIndicator;
    var studentNameIDs = students.map(std => std.getName());
    var index = 0;
    var $detachedObj = null;
    var $parentStudentRow;
    for (var i = 0; i < $studentInfos.length; i++) {
      $studentInfo = $($studentInfos[i]);
      index = studentNameIDs.indexOf($studentInfo.find(".student-name-info").html().trim());

      studentNameID = students[index].getName().replace(/\s+/g, '').replace(/[^\w\s]/gi, '');
      if (currentPlaybackTime < students[index].getTimeSpent()) {
        // clear everything before ploting
        // $($studentInfo[index]).removeClass("disabled");
        $studentInfo.removeClass("disabled-complete");
        $studentInfo.find(".absence-complete-indicator").hide(0);

        $lastFiveProblems = $studentInfo.find(".last-five-problems");

        affectiveStateFlags = students[index].getStudentAffectState(currentPlaybackTime);

        lastFiveCorrectness = students[index].getLastFiveProblemCorrectness(affectiveStateFlags.activeProblemIndex);
        if ($studentInfo.data("active-problem") != (affectiveStateFlags.activeProblemIndex + 1) && affectiveStateFlags.activeProblemIndex >= 0 && (affectiveStateFlags.activeProblemIndex + 1) < questions.getTotalQuestions()) {
          $parentStudentRow = $studentInfo.parent();
          $detachedObj = $studentInfo.detach();
          if ($parentStudentRow.find(".student-info").length == 0) {
            $parentStudentRow.addClass("empty-question");
          }
            $detachedObj.appendTo(".question" + (affectiveStateFlags.activeProblemIndex + 1));
            $(".question" + (affectiveStateFlags.activeProblemIndex + 1)).removeClass("empty-question");
            $studentInfo.data("active-problem", (affectiveStateFlags.activeProblemIndex + 1));
        }

        if (lastFiveCorrectness && affectiveStateFlags.activeProblemIndex != null) {
          $lastFiveProblems.html('');
          lastFiveCorrectness.forEach(correct => {
            if (correct) {
              $lastFiveProblems.append("<span class='check' > &check;</span>");
            } else {
              $lastFiveProblems.append("<span class='cross' > &cross;</span>");
            }
          });
          if ((affectiveStateFlags.activeProblemIndex + 1) < questions.getTotalQuestions())
          	$lastFiveProblems.append("<i class=\"fa fa-lightbulb-o thinking-flash\" aria-hidden=\"true\"></i>");
        }

        if (affectiveStateFlags.activeProblemIndex != null)
          $studentInfo.find(".assignment-progress-indicator").html("&nbsp;" + (affectiveStateFlags.activeProblemIndex + 1) + "/" + questions.getTotalQuestions());

        if (affectiveStateFlags.activeProblemIndex == (questions.getTotalQuestions() - 1)) {
          $studentInfo.find(".absence-complete-indicator").html("Completed!").hide(0);
        } else if ($studentInfo.find(".absence-complete-indicator").html() != "Completed!" && affectiveStateFlags.activeProblemIndex < (questions.getTotalQuestions() - 1)) {
          $studentInfo.find(".absence-complete-indicator").html("Incomplete!").hide(0);
        }

        if (affectiveStateFlags) {
          //clear everything before ploting
          $studentInfo.removeClass("disabled");
          $studentInfo.find(".progress").show(0);
          $studentInfo.find(".current-assignment-progress").attr('aria-valuenow', affectiveStateFlags.progressPercentage)
            .css({
              'width': affectiveStateFlags.progressPercentage + '%'
            });
          if (affectiveStateFlags.redZone && !($studentInfo.hasClass("red-marked"))) {
            $studentInfo.addClass("red-marked");
            if ($infoRedZone.is(":hidden")) {
              $infoRedZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderRed.is(":hidden")) {
              $placeholderRed.hide(0);
            }
            $infoRedZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_red\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[index].getName() + "</p>");
            $("#" + studentNameID + "_red").click(function() {});
          } else if (!affectiveStateFlags.redZone) {
            if ($("#" + studentNameID + "_red").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("red-marked");
              $("#" + studentNameID + "_red").remove();
            }
          }

          if (affectiveStateFlags.goldZone && !($studentInfo.hasClass("gold-marked"))) {
            // $studentInfo.find(".good-job-badge").show(0);
            // $(".student-img-gold").show(0);
            // $(".student-img-regular").hide(0);
            $studentInfo.addClass("gold-marked ");
            $studentInfo.find(".custom-floating-icon").show(0);
            if ($infoGoldZone.is(":hidden")) {
              $infoGoldZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderGold.is(":hidden")) {
              $placeholderGold.hide(0);
            }
            $infoGoldZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_gold\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[index].getName() + "</p>");
            $("#" + studentNameID + "_gold").click(function() {});
          } else if (!affectiveStateFlags.goldZone) {
            if ($("#" + studentNameID + "_gold").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("gold-marked");
              $("#" + studentNameID + "_gold").remove();
            }
          }
        }
      } else {
        // $studentInfo.find(".absence-complete-indicator").show(0);
        $parentStudentRow = $studentInfo.parent();
        if ($parentStudentRow.find(".student-info").length == 1 && $parentStudentRow.hasClass("question"+ (questions.getTotalQuestions() - 1))) {
            $parentStudentRow.addClass("empty-question");
        }
        if (!$studentInfo.data("is-absentee-completed")) {
          $studentInfo.data("is-absentee-completed", true);
          if ($studentInfo.find(".absence-complete-indicator").html() == "Completed!") {
            $detachedObj = $studentInfo.detach();
            $detachedObj.appendTo(".completions");
          } else if ($studentInfo.find(".absence-complete-indicator").html() == "Absent!") {
            $detachedObj = $studentInfo.detach();
            $detachedObj.appendTo(".absentees");
          } else {
            $detachedObj = $studentInfo.detach();
            $detachedObj.appendTo(".incomplete");
          }
        }
        if (!$studentInfo.hasClass('disabled'))
          $studentInfo.addClass(["disabled-complete", "disabled-complete-probelm-analysis"]).removeClass(["red-marked", "gold-marked"]);

        $("#" + studentNameID + "_red, #" + studentNameID + "_gold").remove();

        if ($placeholderGold.is(":hidden") && $infoGoldZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderGold.show(0);
        }
        if ($placeholderRed.is(":hidden") && $infoRedZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderRed.show(0);
        }
      }
    }
    var $problemLevelAnalysisContainer = $(".tutoring-problem-level-analysis-container");
    var $scrollLeft = $(".scroll-left");
    var $scrollRight = $(".scroll-right");

    // if (($problemLevelAnalysisContainer.width() + $problemLevelAnalysisContainer.scrollLeft()) < $problemLevelAnalysisContainer[0].scrollWidth) {
      $scrollLeft.hide(0);
      $scrollRight.hide(0);
    // } else {
      if (($problemLevelAnalysisContainer.width() + $problemLevelAnalysisContainer.scrollLeft()) < $problemLevelAnalysisContainer[0].scrollWidth) {
        $scrollRight.show(0);
      }

      if ($problemLevelAnalysisContainer.scrollLeft() > 0) {
        $scrollLeft.show(0);
      }
    // }
  }

  function startActionLIVE(currentLiveTime) {
    var $studentInfos = $(".info-block-general .student-info");
    var $infoRedZone = $(".info-red-zone");
    var $infoGoldZone = $(".info-gold-zone");
    var $infoBlockZones = $(".info-block-zones");
    var $placeholderRed = $("#placeholder-red");
    var $placeholderGold = $("#placeholder-gold");

    var affectiveStateFlags;
    var lastFiveCorrectness;
    var $lastFiveProblems;
    var $studentInfo;
    var studentNameID;
    var $assignmentProgressIndicator;

    for (var i = 0; i < $studentInfos.length; i++) {
      $studentInfo = $($studentInfos[i]);
      studentNameID = students[i].getName().replace(/\s+/g, '').replace(/[^\w\s]/gi, '');
      if (students[i].getStartTime() < currentLiveTime && students[i].getStartTime() > 0) {
        // clear everything before ploting
        // $($studentInfo[i]).removeClass("disabled");
        $studentInfo.find(".absence-complete-indicator").html("Completed!").hide(0);

        $lastFiveProblems = $studentInfo.find(".last-five-problems");

        affectiveStateFlags = students[i].getStudentAffectState(currentLiveTime);

        lastFiveCorrectness = students[i].getLastFiveProblemCorrectness(affectiveStateFlags.activeProblemIndex);
        if (lastFiveCorrectness && affectiveStateFlags.activeProblemIndex != null) {
          $lastFiveProblems.html('');
          lastFiveCorrectness.forEach(correct => {
            if (correct) {
              $lastFiveProblems.append("<span class='check' > &check;</span>");
            } else {
              $lastFiveProblems.append("<span class='cross' > &cross;</span>");
            }
          });
        }
        if (affectiveStateFlags.activeProblemIndex != null)
          $studentInfo.find(".assignment-progress-indicator").html("&nbsp;" + (affectiveStateFlags.activeProblemIndex + 1) + "/" + questions.getTotalQuestions());

        if (affectiveStateFlags) {
          //clear everything before ploting
          $studentInfo.removeClass("disabled");
          $studentInfo.find(".progress").show(0);
          $studentInfo.find(".current-assignment-progress").attr('aria-valuenow', affectiveStateFlags.progressPercentage)
            .css({
              'width': affectiveStateFlags.progressPercentage + '%'
            });
          if (affectiveStateFlags.redZone && !($studentInfo.hasClass("red-marked"))) {

            $studentInfo.addClass("red-marked");
            if ($infoRedZone.is(":hidden")) {
              $infoRedZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderRed.is(":hidden")) {
              $placeholderRed.hide(0);
            }
            $infoRedZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_red\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[i].getName() + "</p>");
            $("#" + studentNameID + "_red").click(function() {});
          } else if (!affectiveStateFlags.redZone) {
            if ($("#" + studentNameID + "_red").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("red-marked");
              $("#" + studentNameID + "_red").remove();
            }
          }

          if (affectiveStateFlags.goldZone && !($studentInfo.hasClass("gold-marked"))) {
            $studentInfo.addClass("gold-marked ");
            $studentInfo.find(".custom-floating-icon").show(0);
            if ($infoGoldZone.is(":hidden")) {
              $infoGoldZone.show(0); //show the view if it is hidden
            }
            if (!$placeholderGold.is(":hidden")) {
              $placeholderGold.hide(0);
            }
            $infoGoldZone.find(".student-row").append("<p class=\"student-info expand-reveal2\" id=\"" + studentNameID + "_gold\" " +
              "data-activeProblem=\"" + affectiveStateFlags.activeProblemIndex + "\" data-student_index=\"" + i + "\">" +
              students[i].getName() + "</p>");
            $("#" + studentNameID + "_gold").click(function() {});
          } else if (!affectiveStateFlags.goldZone) {
            if ($("#" + studentNameID + "_gold").data("activeProblem") != affectiveStateFlags.activeProblemIndex) {
              $studentInfo.removeClass("gold-marked");
              $("#" + studentNameID + "_gold").remove();
            }
          }
        }
      } else {
        $studentInfo.find(".absence-complete-indicator").show(0);
        // if (!$studentInfo.hasClass('disabled'))
        //   $studentInfo.addClass("disabled-complete");

        $("#" + studentNameID + "_red, #" + studentNameID + "_gold").remove();

        if ($placeholderGold.is(":hidden") && $infoGoldZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderGold.show(0);
        }
        if ($placeholderRed.is(":hidden") && $infoRedZone.find(".student-row").find(".student-info").length == 1) {
          $placeholderRed.show(0);
        }
      }
    }
  }

  $(".fullscreen-btn").click(function(e) {
    fullscreenMode = !fullscreenMode;
    toggleFullScreen(fullscreenMode);
  });

  function toggleFullScreen(fullscreen) {
    $fullScreenBtn.toggle(!fullscreen);
    $normalScreenBtn.toggle(fullscreen);
    $('.header-nav-bar').toggle(!fullscreen);
    $('#footer-container').toggle(!fullscreen);
    $('.content-block').toggleClass('content-block-fullscreen');
    $('.info-block').toggleClass('info-block-fullscreen');
  }

  function pauseSlider(pauseSlider = true) {
    paused = pauseSlider;
    $pauseBtn.toggle(!paused);
    $playBtn.toggle(paused);
    $reloadBtn.hide(0);

    clearInterval(sliderInterval);
  }

  var $playbtn = $(".play-btn");

  $playbtn.click(function() {
    paused = !paused;
    pauseSlider(paused);
    startSlider();
  });

  var mainplayerInFocus = true;
  keyboardJS.bind('space', function(e) {
    if (mainplayerInFocus) {
      e.preventDefault();
      if (!paused) {
        $($playbtn[1]).trigger("click");
      } else {
        $($playbtn[0]).trigger("click");
      }
      // console.log("crtl space clicked");
    }
  });

  $(".speedup-btn").click(function() {
    if (playbackSpeed < 16) {
      clearInterval(sliderInterval);
      playbackSpeed = playbackSpeed >= 16 ? 16 : playbackSpeed * 2;
      startSlider();

      toggleSpeedBtnDisable();
    }

    function setMainplayerInFocus(bool) {
      mainplayerInFocus = bool;
    }

    function setMainplayerInFocus(bool) {
    	mainplayerInFocus = bool;
    }

  });

  $(".speeddown-btn").click(function() {
    if (playbackSpeed > 1) {
      clearInterval(sliderInterval);
      playbackSpeed = playbackSpeed <= 1 ? 1 : playbackSpeed / 2;
      startSlider();

      toggleSpeedBtnDisable();
    }
  });


  //Enable or disable speed up or speed down buttons
  function toggleSpeedBtnDisable() {
    $('.speedup-btn').toggleClass("disabled-ctrl", playbackSpeed == 16);
    $('.speeddown-btn').toggleClass("disabled-ctrl", playbackSpeed == 1);
  }

  $reloadBtn.click(function() {
    $reloadBtn.hide(0);
    $pauseBtn.show(0);
    testingSeatingArrangementCompletion();
  });

  // open up student info modal
  $(document).on('click', '.student-info', function(e) {
    if ($(this).hasClass('disabled')) return false;

    setMainplayerInFocus(false);

    var studentIndex = $(e.currentTarget).data('student_index')
    var studentData = students[studentIndex];
    $(".dialog-container, .dialog-student").show(0);
    if (playbackFlag) {
      pauseSlider();
      var studentModal = new StudentInfoModal();
      studentModal.init(studentData, questions, currentPlaybackTime, $($playbtn[0]), setMainplayerInFocus);
    } else {
      var studentModal = new StudentInfoModal();
      studentModal.init(studentData, questions, currentLiveTime, $($playbtn[0]), setMainplayerInFocus);
    }
  });

});
