<form class="login" action="/LiveChart/chooseClass" method="post">
    <h2 id="h2-login" >Choose your class and section</h2>
    <p class="select-section">Choose Class,Section:</p>
    <select required id="classid" name="classid"></select>
	    <br/>
   	<div id="assignment-select-container">
	    <p class="select-section">Assignment</p>
	    <select id="assignmentid" name="assignmentid"></select>
	    <input id="assignmentxref" type="hidden" name="assignmentxref" value="test" />
   	</div>
    <!-- <br/> -->
    <br/>
    <input required type="radio" name="version" value="playback">Play Back
    <input required type="radio" name="version" value="live">LIVE version
	<br/>
	<button type="submit" value="Start" id="submit" class="btn btn-primary">Start</button>
	<!-- <input type="submit" value="Start" id="submit"> -->
</form>