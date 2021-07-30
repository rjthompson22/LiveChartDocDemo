<nav class="header-nav-bar">
	<%-- <img class="assistmentsLogo" src="<c:url value='/resources/images/assistmentsHorizLogo-white.png'/>"/> --%>
	<img class="assistmentsLogo assistmentsLogo-clickable" src="<c:url value='/resources/images/LIVE-CHART_icon_64px.png'/>"/>
	<%-- <h1 id="title1" class="header-title1 rubberBand"
		style="text-align: center; color: white">LIVE-CHART</h1> --%>
	<div class="dropdown-user">
		<button type="button" class="btn user-ctrl dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
		    ${teacherUserName}
		</button>
		<div class="dropdown-menu dropdown-menu-right">
			<button class="dropdown-item log-inout" type="button">Log Out</button>
		</div>
	</div>
</nav>
