<form class="login dialog-setting" action="/LiveChart/chooseClass" method="post">
	<h2>Choose new class and section</h2>
    <p class="select-section">Choose Class,Section:</p>
    <select required id="classid" name="classid"></select>
		<br/>
   	<div id="assignment-select-container">
	    <p class="select-section">Assignment</p>
	    <select id="assignmentid" name="assignmentid" ></select>
	    <input id="assignmentxref" type="hidden" name="assignmentxref" value="test" />
   	</div>
   	
    <br/>
    <input required type="radio" name="version" value="playback">Play Back
    <input required type="radio" name="version" value="live">LIVE version
	<br/>
	<div class="ctrl-button-container">
		<!-- <button type="button" class="btn btn-outline-primary" id="dialog-setting-start">Start logging</button> -->
		<button type="button" class="btn btn-outline-secondary dialog-setting-cancel">Cancel</button>
		<button type="submit" value="Start" id="submit" class="btn btn-primary">Start</button>
	</div>
</form>