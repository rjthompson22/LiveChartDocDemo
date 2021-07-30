$(function(){
	/**
	 * @global
	 */
 	$(".log-inout").click(function(){
		// Cookies.remove('ASSISTmentsServiceDev', { path: '' });
		// Cookies.remove('ASSISTmentsServiceDev');
		// Cookies.remove('ASSISTmentsServiceDevRM');
		// Cookies.remove('JSESSIONID');
		// window.location.href = "https://new.assistments.org/";
		// window.location.href = "https://accounts-dev.assistments.org/?callingPartnerRef=TNG&callbackURL=http://localhost:8080/LiveChart/index";
		window.location.href = "/LiveChart/signout";

	});

	$(".header-title1, .assistmentsLogo-clickable").click(function() {
		window.location.href = "/LiveChart/index";
	});
});
