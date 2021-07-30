<form class="login" action="/LiveChart/chooseClass" method="post">
    <label>Choose Class,Section:</label>
    <select required id="classid" name="classid" class="custom-select mb-2 mr-sm-2 mb-sm-0"></select>
	<br/>
   	<div id="assignment-select-container">
   		<br/>
	    <label>Assignment</label>
	    <select id="assignmentid" name="assignmentid" class="custom-select mb-2 mr-sm-2 mb-sm-0"></select>
	    <input id="assignmentxref" type="hidden" name="assignmentxref" value="test" />
   	</div>
   	
    <br/>
    <input required type="radio" name="version" value="playback">Play Back
    <input required type="radio" name="version" value="live">LIVE version
	<br/>

	<br/>
	<button type="submit" value="Start" id="submit" class="btn btn-primary">Start</button>
	<!-- <input type="submit" value="Start" id="submit"> -->
</form>