<div class="dialog-student">
	<div class="dialog-student-container">
		<p class="regular-txt4 left" id="dialog-setting-title">Student Information 
			<i class="dialog-student-cancel modal-close-icon fa fa-window-close button-action"></i>
		</p>
		
		<div class="student-info-container">
			<div class="info-general">
				<p>Student Name: <span id="info-name"></span></p>
				<p class="student-progress">Progress: </p>
				<div class="info-options-right">
					<!-- auto scroll switch -->
					<span class="switch-label">Auto scroll: </span>
					<label class="switch">
					  <input id="auto-scroll-btn" type="checkbox" checked>
					  <span class="switch-slider round"></span>
					</label>
				</div>
				<div class="info-note">
				</div>
			</div>
			<div class="info-container">
				<div class="info-problem-detail"></div>
			</div>
		</div>
	</div>
	<div class="content-slider clearfix">
			<input class="slider-range" type="range" min="0" max="100" value="0" id="studentInfoSlider">
			<div class="content-slider-btn">
				<div class="btn-left">
					<i class="fa fa-backward button-action std-speeddown-btn slider-btn"></i>
					<i class="fa fa-play button-action std-play-btn slider-btn" id="stdPlay"></i>
					<i class="fa fa-pause button-action std-play-btn slider-btn" id="stdPause"></i>					
					<i class="fa fa-redo button-action std-reload-btn slider-btn" title="Reload"></i>
					<i class="fa fa-forward button-action std-speedup-btn slider-btn"></i>
					<span class="slider-value" id="stdSliderValue">0 : 00</span>
				</div>
			</div>
		</div>
</div>
