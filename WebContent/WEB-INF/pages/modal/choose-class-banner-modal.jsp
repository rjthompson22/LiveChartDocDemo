<div class="header-nav-bar">
	<img class="assistmentsLogo assistmentsLogo-clickable" src="<c:url value='/resources/images/LIVE-CHART_icon_64px.png'/>"/>
	<img class="assistmentsLogo2 assistmentsLogo-clickable" src="<c:url value='/resources/images/assistmentsHorizLogo-white-min.png'/>"/>
	<%-- <h1 id="title1" class="header-title1 rubberBand"
		style="text-align: center; color: white">LIVE-CHART<!-- <a href="/LiveChart/index" >LIVE-CHART</a> --> </h1> --%>
	<div class="dropdown-user">
		<button type="button" class="btn user-ctrl dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
		    ${teacherUserName}
		</button>
		<%-- <span class="dropdown-toggle">${teacherUserName}</span> --%>
		<div class="dropdown-menu dropdown-menu-right">
			<button class="dropdown-item log-inout" type="button">Log Out</button>
			<!-- <a href = "/LiveChart/signout" class="dropdown-item regular-txt2 log-inout">Log Out</a> -->
		</div>
	</div>
</div>
