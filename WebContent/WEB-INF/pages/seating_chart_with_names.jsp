<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<html>
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="shortcut icon" href="<c:url value='/resources/images/ASSISTments_Icon.png'/>" />
	<title>LIVE CHART</title>

	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/page_loading_cover.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/live_choose_class.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/seating_chart_with_names.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/live_chart.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/AlertDialog.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/tutor_problem_levels.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/SeatingArrangement.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/lib/css/bootstrap.min.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/lib/css/animate.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/media.css' />">
	<link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/colorblindness.css' />">
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/js.cookie.min.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/jquery.min.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/popper.min.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/jquery-ui.min.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/jquery.ui.touch-punch.min.js'/>"></script>
	<%-- <link rel="stylesheet" type="text/css" id="u0" referrerpolicy="origin"
		href="https://cdn.tiny.cloud/1/3uaesszjevxkycwbjbtq0eqek0i6bwlmue00u7umeylyndw0/tinymce/5.4.2-90/skins/ui/oxide/skin.min.css">
	<script
		src="https://cdn.tiny.cloud/1/3uaesszjevxkycwbjbtq0eqek0i6bwlmue00u7umeylyndw0/tinymce/5/tinymce.min.js"
		referrerpolicy="origin"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/wiris.js'/>"></script> --%>
	<script src="https://kit.fontawesome.com/6982610a85.js"
		crossorigin="anonymous"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/bootstrap.min.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/lib/js/keyboard.min.js'/>"></script>

	<link href="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/css/bootstrap4-toggle.min.css" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/gh/gitbrent/bootstrap4-toggle@3.6.1/js/bootstrap4-toggle.min.js"></script>

</head>
<body class="root-container">
	<div class="loading loading-cover">
	<!-- Loading&#8230; -->

		<button class="btn btn-primary" type="button" disabled>
		  <span class="spinner-grow " role="status" aria-hidden="true"></span>
		  Loading
		</button>

	</div>
	<%@ include file = "modal/choose-class-banner-modal.jsp" %>

	<div class="alert-dialog-container">
	</div>

	<div class="dialog-container">
		<%@ include file = "modal/student-info-modal.jsp" %>
		<%@ include file = "modal/settings-modal.jsp" %>
	</div>

	<div class="content-block">
		<div class="info-block">
			<div class="info-block-header">
				<p class="regular-txt1">
					<!-- <span class="supp-info">
						Teacher: <span>Miss Pat</span>
					</span>
					<span class="supp-info">
						Assigned Date: <span> mm-dd-yyyy </span>
					</span> -->
					<span class="supp-info">
						Assignment: <span> ${assignmentName} </span>
					</span>
				</p>
				<p class="regular-txt1 seating-arrangement-toggle-container" >
					<span>Per-Problem:&nbsp;&nbsp;</span>
					<input class="regular-txt1" id="view-per-problem-toggle" type="checkbox" data-toggle="toggle" data-on="On" data-width="100%" data-off="Off" data-onstyle="info" data-offstyle="warning">
					<!-- <input class="regular-txt1" type="checkbox" checked data-toggle="toggle" data-on="Actual" data-width="100%" data-off="Alphabetical" data-onstyle="info" data-offstyle="secondary"> -->
				</p>				
				<p class="regular-txt1 seating-arrangement-toggle-container" >
					<span>Seating Arrangement:&nbsp;&nbsp;</span>
					<input class="regular-txt1" id="seating-arrangement-toggle" type="checkbox" checked data-toggle="toggle" data-on="Actual" data-width="100%" data-off="Alphabetical" data-onstyle="info" data-offstyle="warning">
					<!-- <input class="regular-txt1" type="checkbox" checked data-toggle="toggle" data-on="Actual" data-width="100%" data-off="Alphabetical" data-onstyle="info" data-offstyle="secondary"> -->
				</p>
				<p class="regular-txt1 seating-arrangement-toggle-container" >
					<span>Color Blindness:&nbsp;&nbsp;</span>
					<input class="regular-txt1" id="color-blindness-toggle" type="checkbox" checked data-toggle="toggle" data-on="No" data-width="100%" data-off="Yes" data-onstyle="info" data-offstyle="warning">
					<!-- <input class="regular-txt1" type="checkbox" checked data-toggle="toggle" data-on="Actual" data-width="100%" data-off="Alphabetical" data-onstyle="info" data-offstyle="secondary"> -->
				</p>
				<i class="fas fa-users-cog top-right-btn2 button-action seating-arrangement-btn" id="seating-arrangement" title="Seating Arrangement"></i>
				<i class="fas fa-cog top-right-btn button-action setting-btn" id="setting-icon" title="Setting"></i>
			</div>

			<div id="info-block-board">
				<div class="info-block-zones"></div>
				<!-- https://economix.blogs.nytimes.com/2009/09/11/class-size-around-the-world/ -->
				<!-- It seems the average American classroom size is 23.1: Neil wants it to be 35 for now. -->
				<div class="info-block-general"></div>
			</div>

			<div class="content-slider" id="content-slider">
				<input class="slider-range" type="range" min="0" max="100" value="0" id="mainSlider">
				<div class="content-slider-btn">
					<div class="btn-left">
						<i class="fa fa-backward button-action speeddown-btn slider-btn disabled-ctrl" title="Speed down: By 2"></i>
						<i class="fa fa-play button-action play-btn slider-btn" title="Play" id="play"></i>
						<i class="fa fa-pause button-action play-btn slider-btn" title="Pause" id="pause"></i>
						<i class="fa fa-redo button-action reload-btn slider-btn" title="Reload"></i>
						<i class="fa fa-forward button-action slider-btn speedup-btn" title="Speed up: &times; 2"></i>
						<span class="slider-value" id="sliderValue">00:00:00</span>
						<span class="live-playback-indicator live-indicator playback-indicator"> <span>&bull;</span> LIVE </span>
					</div>
					<div class="btn-right">
							<!-- <i class="fa fa-users-cog button-action seating-arrangement-btn slider-btn" title="Seating Arrangement"></i> -->
							<i class="fa fa-cog button-action setting-btn slider-btn" title="Setting"></i>
							<i class="fas fa-expand button-action fullscreen-btn slider-btn" title="Fullscreen" id="fullscreen"></i>
							<i class="fas fa-compress button-action fullscreen-btn slider-btn" title="exit fullscreen" id="normalscreen"></i>
					</div>

				</div>
			</div>
		</div>
	</div>
	<div class="seating-arrangement-root-container">
		<div class="seating-arrangement-container"></div>
	</div>


	<nav class="context-menu" id="context-menu">
		<ul class="context-menu__items">
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Idle"> <i
					class="fa fa-eye"></i>Mark Student Idle
			</a></li>
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Active"> Mark Student
					Active </a></li>
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Visit"> Mark Student
					Visited </a></li>
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Learning"> Mark Student
					Learning </a></li>
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Struggling"> Mark
					Student Struggling </a></li>
			<li class="context-menu__item"><a href="#"
				class="context-menu__link" data-action="Correctness"> Mark
					Student on Correctness Streak </a></li>
		</ul>
	</nav>

	<div id="footer-container" class="container">
		<div id="footer">
			<hr>
			<div class="d-flex flex-column align-items-center">
				<span> ASSISTments is a nonprofit 501(C)(3) developed at <a
					href="https://www.wpi.edu/">WPI</a>
				</span> <span> <a
					href="https://new.assistments.org/terms-and-conditions"
					target="_blank">Terms of Use</a> | <a
					href="https://new.assistments.org/privacy-policy" target="_blank">Privacy
						Policy</a>
				</span> <span> <span><a
						href="mailto:assistments-help@wpi.edu">assistments-help@wpi.edu</a></span>
					| <span>&copy; 2020 ASSISTments</span>
				</span>
			</div>
		</div>
	</div>

	<script type="text/javascript" charset="utf-8">
		var playbackFlag = ${playbackFlag};
		var serverErrorFlag= ${internalErrorFlag};
		var groupdata = ${groupdata};
		var teacherUserName = "${teacherUserName}";
		var xref = ${xrefs};
		var assignmentName = "${assignmentName}";
	</script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/AlertDialog.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/common_methods.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/Student.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/StudentInfoModal.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/util.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/seating_chart_with_names.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/SeatingArrangement.js'/>"></script>
	<script type="text/javascript"
		src="<c:url value='/resources/js/live_choose_class.js'/>"></script>
</body>
</html>
