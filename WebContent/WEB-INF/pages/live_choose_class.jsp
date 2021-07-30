<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<html>
	<head>
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <link rel="shortcut icon" href="<c:url value='/resources/images/ASSISTments_Icon.png'/>" />
	  <title>LIVE CHART</title>
	  
	  <link rel="stylesheet" type="text/css"
		href="<c:url value='/resources/css/page_loading_cover.css' />">
	  <link rel="stylesheet" type="text/css" href="<c:url value='/resources/css/live_choose_class.css' />">
	  <link rel="stylesheet" type="text/css" href="<c:url value='/resources/lib/css/bootstrap.min.css' />">
	  <script type="text/javascript" src="<c:url value='/resources/lib/js/jquery.min.js'/>"></script>
	  <script type="text/javascript" src="<c:url value='/resources/lib/js/jquery.mobile-1.4.5.min.js'/>"></script>
	  <script type="text/javascript"
		src="<c:url value='/resources/lib/js/popper.min.js'/>"></script>
	  <script type="text/javascript"
		src="<c:url value='/resources/lib/js/bootstrap.min.js'/>"></script>
	</head>
	
	<body class="gradient-bg">
		<div class="loading loading-cover" style="display: none;">
			<button class="btn btn-primary" type="button" disabled>
			  <span class="spinner-grow " role="status" aria-hidden="true"></span>
			  Loading
			</button>
		</div>
		<%@ include file = "modal/index-banner-modal.jsp" %>
		<%@ include file = "modal/class-selection-index-modal.jsp" %>
		
		<!-- <div class="error-dialog-container">
			<div class="error-diaog">
				<h2>An internal error occured!!</h2>
			</div>
		</div> -->
	</body>
	
	<script type="text/javascript">  
		var serverErrorFlag= ${internalErrorFlag};
		var groupdata = ${groupdata}; 
		var teacherUserName = "${teacherUserName}";
		var rooturl = "http://localhost:8080/LiveChart/";
	</script>
	<script type="text/javascript" src="<c:url value='/resources/js/common_methods.js'/>"></script>
	<script type="text/javascript" src="<c:url value='/resources/js/live_choose_class.js'/>"></script>
</html>
