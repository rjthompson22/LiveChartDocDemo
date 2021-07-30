function AlertDialog() {

  /**
   * @global
   */
  var dialog_root = "<div class='alert-dialog-root'>" +
    "<div class='alert-dialog-header'>" +
    "</div>" +
    "<div class='alert-dialog-body'>" +
    "</div>" +
    "<div class='alert-dialog-footer'>" +
    "</div>" +
    "</div>";

  var dialogA1_footer_content1 = "<button type='button' class='btn btn-primary' id='alert-dialog-okay-btn'> Okay </button>";

  var dialogA1_footer_content2 = "<button type='button' class='btn btn-outline-secondary' id='alert-dialog-cancel-btn'> Cancel </button>" +
    "<button type='button' class='btn btn-primary' id='alert-dialog-okay-btn'> Okay </button>";

  var $alert_dialog_container = $(".alert-dialog-container");
  var $alert_dialog_header;
  var $alert_dialog_body;
  var $alert_dialog_footer;
  /**
   * author: AshihJumbo
   * This class serves as the notification dialog window across all platforms.
   * The following are the types of dialogs
   * A1. regulat alert dialog with one "OK" button
   *
   *
   * NOTE: the alert dialog has a strict structural layout of :
   * header, body, footer
   * header has the title of the dialog
   * body has the body and relevant information for the dialog
   * footer is primarily for buttons that are actionable for the user
   */
  this.init = function(type, message, callback = null) {
    $alert_dialog_container.html(dialog_root);
    switch (type) {
      case 'A1':
        showDialogA1(message, callback);
        break;
      case 'QuestionDetail':
        showQuestionDetail(message);
        break;
      default:
        break;
    }
    $alert_dialog_container.show(0);
  }

  /**
   * @global
   */
  showDialogA1 = function(message, callback) {
    $alert_dialog_header = $(".alert-dialog-header");
    $alert_dialog_body = $(".alert-dialog-body");
    $alert_dialog_footer = $(".alert-dialog-footer");

    $alert_dialog_header.html("Attention Teacher!");
    $alert_dialog_body.html(message);
    $alert_dialog_footer.html(dialogA1_footer_content2);

    $("#alert-dialog-okay-btn").click(function() {
      $alert_dialog_container.hide(0);
      // $(this).unbind('click');
      if (callback != null) {
        callback();
      }
    });

    $("#alert-dialog-cancel-btn").click(function(){
      $alert_dialog_container.hide(0);
    });
  }

  /**
   * @global
   */
  showQuestionDetail = function(question){
    $(".alert-dialog-root").addClass("alert-dialog-root2");
    $alert_dialog_header = $(".alert-dialog-header");
    $alert_dialog_body = $(".alert-dialog-body");
    $alert_dialog_footer = $(".alert-dialog-footer");

    $alert_dialog_header.html("Problem Details:");
    var bodyHtml="<div style='margin-left:1rem;'>Problem Type: "+question.problemType+" </p><hr>"+ 
    	  "<div class=\"problem-body\">"+question.problemText+"</div>"+
    	  "<hr>"+
          "<p class='answer-text'> Answer: Greater than 1</p><hr>"+
          //"<p class='problem-body'>"+question.problemText+"</p>"+
          //"<p class='answer-text'> Answer: "+question.answerText+"</p>"+
          "<p>First common wrong answer: <b>Less than 1</b></p>"+
          "<p>Overall Class info: <b>4/6 (67%)</b></p>"+
          "<p>First CWA Feedback: <br>nbsp;nbsp;nbsp;Good job noticing that they're not the same size. What would you need to multiply each side in P by to get the corresponding side in Q?</p>"+
          "<p>Instructional Recommendation for 1st CWA: N/A</p><hr>"+
          "<p>Second common wrong answer: <b>Equal to 1</b> </p>"+
          "<p>Overall Class info:  <b>2/6 (33%)</b></p>"+
          "<p>Second CWA Feedback: <br>nbsp;nbsp;nbsp;Remember that multiplying by a scale factor of 1 results in an exact copy. What would you need to multiply each side in P by to get the corresponding side in Q?</p>"+
          "<p>Instructional Recommendation for 2nd CWA: N/A</p><hr>"+
          "<p>Third common wrong answer: N/A</p>"+
          "<p>Overall Class info:  N/A</p>"+
          "<p>Third CWA Feedback: <br>N/A</p>"+
          "<p>Instructional Recommendation for 3rd CWA: N/A </p><hr>"+
          "<hr>"+
          "<p>Instructional Recommendation for Problem: <br><b>Students are struggling with the lack of side lengths in these figures or the order in which they appear. Revisit the blackline master from"+
          " lesson 5 activity 2 2 issues? - lack of numbers and ordering <br>act 5.2 BLMs & tracing paper to go from original to copy</b></p><div>";

    $alert_dialog_body.html(bodyHtml);
    $alert_dialog_footer.html(dialogA1_footer_content1);

    /**
     * @global
     */
    $("#alert-dialog-okay-btn").click(function() {
      $alert_dialog_container.hide(0);
      // $(this).unbind('click');
      if (callback != null) {
        callback();
      }
    });
  }
}
