$( function(){
	/**
	 * @global
	 */
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		
	if(serverErrorFlag) {
		alert("Something went wrong on the serverside! Note to dev: Check the console to see where he error occured.");
	}	
	
	var $dropdown = $("#classid");
	$dropdown.append("<option value='' data-id='-1'>&nbsp;</option>");
	
	console.log(typeof groupdata);
	console.log(groupdata);
	
	console.log(teacherUserName);
	
	var jsonGroup = "";
	for (i = 0; i < groupdata.data.length; i++) {
	    jsonGroup = groupdata.data[i].group;
	    $dropdown.append("<option value=" + jsonGroup.xref +" data-id="+ i +">" + jsonGroup.name + "</option>");
	}
	
	var $assignmentSelectContainer = $("#assignment-select-container");
	var $assignmentid = $("#assignmentid");
	var $assignmentxref = $("#assignmentxref");
	$assignmentSelectContainer.hide(0);
	
	/**
	 * @global
	 */
	$dropdown.change(function () {
		var id = $("#classid option:selected").data("id");
		if(id == -1){
			$assignmentSelectContainer.hide(0);
		} else {
			$assignmentSelectContainer.show(0);
			
			$assignmentid.html("<option value='' data-id='-1'>&nbsp;</option>");
			var jsonAssignments = groupdata.data[id].assignments;
			for(j=0; j<jsonAssignments.length; j++){
				var jsonAssignment = jsonAssignments[j];
				var date = new Date(jsonAssignment.assignDates.releaseDate.epochSecond * 1000);
				var date_string = " ["+ monthNames[date.getMonth()] + "/"+
								  ("0" + date.getDate()).slice(-2) + "/"+ date.getFullYear()+"] ";
				$assignmentid.append("<option value='"+ jsonAssignment.name +" "+ date_string +"' data-value=" + jsonAssignment.xref +" data-id="+ j +">"+ date_string + ":" + jsonAssignment.name + "</option>");
			}
			
			$assignmentid.change(function(){
				var xref = $("#assignmentid option:selected").data("value");
				$assignmentxref.val(xref);
				console.log($assignmentxref.val());
				/*$.ajax({
					type: "POST",
					data: JSON.stringify(xref),
					crossDomain: true,
					contentType: "application/json",
					dataType: "json",
					url: rooturl+"getAssignmentsInGrp",
					success: function(result) {
						console.log(result);			
					},
					complete: function() {},
					error: function() {}
				});*/
			});
		}
		console.log("This is a test log that gets triggered when the dropdown value changes.");
	});
});