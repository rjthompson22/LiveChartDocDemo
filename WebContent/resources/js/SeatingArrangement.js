function SeatingArrangement() {
    /**
     * this is a json object that you get from server
     * if this is empty then we ask the teacher to
     * pick a seating arrangement
     * */
    var seatingArrangement;
    var students;

    var $seating_arrangement_container;
    var html_for_container =
        "<div class='seating-grid-container'>" +
        "<p class='seating-title regular-txt3'>Seating arrangement of the Class</p>" +
        "<div class='row-column-controllers'>" +
        "<div class=\"seating-arrangement-grid-controllers\">"+
        // btn-outline-success
        "<button type='button' class='btn btn-outline-secondary add-row seating-controller-btn'> <i class=\"fas fa-plus-circle\"></i> Add Row </button>" +
        // btn-outline-danger
        "<button type='button' class='btn btn-outline-secondary remove-row seating-controller-btn'> <i class=\"fas fa-minus-circle\"></i> Delete Row </button>" +
        "<button type='button' class='btn btn-outline-secondary add-column seating-controller-btn'> <i class=\"fas fa-plus-circle\"></i> Add Column </button>" +
        "<button type='button' class='btn btn-outline-secondary remove-column seating-controller-btn'> <i class=\"fas fa-minus-circle\"></i> Delete Column </button>" +
        "<button type='button' class='btn btn-outline-secondary reset-seating-chart seating-controller-btn'> Reset Seating Arrangement</button>"+
        //"<button type='button' class='btn btn-outline-secondary delete-seating-chart seating-controller-btn'> Delete Seating Chart</button>"+
        "</div></div>" +
        "<div class=\"seating-content\">"+
		    "<div class='seating-arrangement'>" +
		    "</div>" +
		    "<div class='student-list-container'>" +
		    "<p class='seating-title regular-txt3'>Students in Class:</p>" +
		    "<div class='student-list'>" +
		    "</div>" +
		    "<div class='animated rubberBand drag-drop-instruction'>"+
		    "Drag & Dropable : <br/>Please drag and drop the teachers and students into the seating arrangement inside the grid."+
		    "</div>" +
		    "</div>" +
        "</div>"+

        "<div class='seating-arrangement-controller'>" +

        "<div class=\"preexistinglist-container\">"+
        "<div class=\"btn-group dropup\">" +
        "<button type=\"button\" class=\"btn btn-outline-primary dropdown-toggle\" "+
        "data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">"+
        "Pre-existing Arrangements</button>"+
		  "<div class=\"dropdown-menu student-pre-built-list\" aria-labelledby=\"dropdownMenuButton\">"+
		  	"<div class='seating-arrangement-name' data-index='-1' >Alphabetical Order.</div> <div class='dropdown-divider'></div>  "+
		  "</div>"+
		"</div>"+
        "</div>"+
        "<div class=\"name-editor-container\">"+
		"<input type=\"text\" id =\"name-input\" class='seating-arrangement-name-input' placeholder='Name of the Seating Arrangement' >"+
		"<i class=\"fas fa-trash-alt delete-seating-chart\"></i>"+
		//"<i class=\"far fa-trash-alt delete-seating-chart\"></i>"+
		//"<button type='button' class=\"btn fas fa-trash-alt fa-2x delete-seating-chart\" style=\"padding: 0px 3px 0px 3px\"></button>"+
		"</div>"+
		"<div class=\"save-cancel-container\">"+
		//"<button type='button' class='btn btn-outline-danger delete-seating-chart'>Delete</button>"+
        "<button type='button' class='btn btn-outline-secondary cancel-seating-chart seating-controller-btn'> Cancel </button>" +
        "<button type='button' class='btn btn-primary save-seating-chart seating-controller-btn'> Save and Start </button>" +
        "</div> </div> </div>" +
        // "<i class='cancel-seating-chart modal-close-icon fa fa-window-close'></i>" +
        "</div>";

    var columns_per_row = 8;
    var rows;
    var $addRow
    var $removeRow;
    var $addColumn;
    var $removeColumn;
    var $seatingArrangement;
    var $deleteArrangement;
    var $nameInput;
    var seatingArrangementJson = [];
    var activeSeatingArrangementJsonIndex = 0;
    var callback;
    var newLayoutFlag = false;
    var pauseSlider;
    var mainplayerInFocus;

    var seatingArrangementAlertDialog = new AlertDialog();
    /**
     * @global
     * @param {*} $container 
     * @param {*} students_ 
     * @param {*} callback_ 
     * @param {*} pauseslider_callback_ 
     * @param {*} mainplayerInFocus_callback_ 
     * @returns true
     */
    this.init = function($container, students_, callback_, pauseslider_callback_, mainplayerInFocus_callback_) {
        $seating_arrangement_container = $container;
        students = students_;
        callback = callback_;
        pauseSlider = pauseslider_callback_;
        mainplayerInFocus = mainplayerInFocus_callback_;
        fetchSeatingArrangements();
        return true;
    };

    /**
     * @global
     * @param {*} index 
     * @returns seating arrangement index
     */
    this.getSeatingArranementJson = function(index = activeSeatingArrangementJsonIndex) {
    	if(index == -1){
    		return seatingArrangementInAlphabeticalOrder();
    	} else {
	        return seatingArrangementJson[index];
    	}
    }

    /**
     * @global
     */
    fetchSeatingArrangements = function() {
        $.ajax({
            type: "POST",
            data: xref,
            // data: JSON.jsonObject(payload),
            // data: null,
            crossDomain: true,
            contentType: "application/json",
            dataType: "json",
            url: "/LiveChart/getSeatingChart",
            success: function(results) {
                fetchCompleted = true;
                $(".loading-cover").hide(0);
                if (results == "NOT_FOUND_EXCEPTION") {
                    drawSeatingArrangementSelector();
                } else {
                    seatingArrangementJson = [];
                    for (var i = 0; i < results.length; i++) {
                        seatingArrangementJson.push(JSON.parse(results[i]));
                    }
                    drawSeatingArrangementSelector();
                    console.log("Time to draw the new shit here");
                    console.log(seatingArrangementJson);
                    activeSeatingArrangementJsonIndex = seatingArrangementJson.length - 1;
                    $seating_arrangement_container.parent().hide(0);
                    $seating_arrangement_container.hide(0);
                    callback();
                }
            },
            complete: function() {},
            error: function() {}
        });
    }

    /**
     * 
     */
    drawSeatingArrangementSelector = function() {
        $seating_arrangement_container.html(html_for_container);
        showHideSeatingArrangement(true);
        var $studentList = $(".student-list");
        var student;

        $studentList.append("<div class='student-name teacher-desk'> <p>TEACHER DESK</p> <i class=\"fas fa-grip-vertical draggable-icon\"></i></div>");
        for (var i = 0; i < students.length; i++) {
            student = students[i];
            $studentList.append("<div class='student-name'><p>" +
                student.getName() +
                "</p><i class=\"fas fa-grip-vertical draggable-icon\"></i></div>");
        }

        $seatingArrangement = $(".seating-arrangement");
        rows = Math.ceil(students.length / columns_per_row) + 3;
        rows = (rows < 8)? 8: rows;
        var $seatingRow;
        for (var i = 0; i < rows; i++) {
            $seatingArrangement.append("<div class='seating-arrangement-row'></div>");
            $seatingRow = $($(".seating-arrangement-row")[i]);
            for (var j = 0; j < columns_per_row; j++) {
                $seatingRow.append("<div class='seating-cell'></div>");
            }
        }

        setSeatingCellsHeightWidth();
        generateDragDropPrimaryCtrl();
        setControlClickListeners();
        populatePreExistingSeatingArrangements();

    };

    /**
     * 
     */
	seatingArrangementInAlphabeticalOrder = function() {
		$('#seating-arrangement-toggle').bootstrapToggle('off', true);
		var totalcolumns = 10;
		if($(".content-block").outerWidth(true) < 1380)
			totalcolumns = 8;
		var totalrows = Math.ceil(students.length/totalcolumns)*2;

		var seatingArrangementAlphabetical = {
			totalcolumns: totalcolumns,
			totalrows: totalrows,
			seatingGrid: []
		};

		var studentNamesArray = students.map(student => student.getName()).sort(Intl.Collator().compare);
		console.log(studentNamesArray);

		var rowJsonArray = [];
		var count = 0;
		for(var i=0; i<totalrows; i++){
			rowJsonArray = [];
			for(var j=0; j<totalcolumns; j++){
				if(i == 0 && j == 0){
					rowJsonArray.push({
						"name": "TEACHER DESK",
						"row": i,
						"column": j
					});
				}else if((i%2==1)&&(count < studentNamesArray.length) && (i != 0)){
					rowJsonArray.push({
						"name": studentNamesArray[count],
						"row": i,
						"column": j
					});
					count++;
				} else {
					rowJsonArray.push({
						"row": i,
						"column": j
					});
				}
			}
			seatingArrangementAlphabetical.seatingGrid.push({"row": rowJsonArray});
		}
		console.log(seatingArrangementAlphabetical);
		return seatingArrangementAlphabetical;
	};

    /**
     * 
     */
    populatePreExistingSeatingArrangements = function() {
        if (seatingArrangementJson.length > 0) {
            for (var i = 0; i < seatingArrangementJson.length; i++) {
            	console.log(seatingArrangementJson[i]);
                $(".student-pre-built-list").append("<div class = 'seating-arrangement-name' data-index=" + i + "> " +
                    seatingArrangementJson[i].name +  "</div>");
            }
        }

        var $seatingArrangementName = $(".seating-arrangement-name");
        $seatingArrangementName.click(function() {
        	$(".drag-drop-instruction").hide();
            activeSeatingArrangementJsonIndex = $(this).data("index");
            // This changes the toggle button UI for seating arrangement in the main UI without firing the
            // click listerner as returning true indicates the click event has been completely consumed
            $('#seating-arrangement-toggle').bootstrapToggle('on', true);
            var seatingArrangement;
            if(activeSeatingArrangementJsonIndex == -1) {
            	seatingArrangement = seatingArrangementInAlphabeticalOrder()
            	$nameInput.value = "Alphabetical Order";
            } else {
            	seatingArrangement = seatingArrangementJson[activeSeatingArrangementJsonIndex];
            	$nameInput.value = seatingArrangement.name;
            }
            console.log(seatingArrangement);

            $seatingArrangement.html("");
            rows = seatingArrangement.totalrows;
            columns_per_row = seatingArrangement.totalcolumns;

            $(".student-list").html("<div class='student-name teacher-desk'> <p>TEACHER DESK</p> <i class=\"fas fa-grip-vertical draggable-icon\"></i></div>");

            var $seatingRow;
            var row_column_content;
            for (var i = 0; i < rows; i++) {
                $seatingArrangement.append("<div class='seating-arrangement-row'></div>");
                $seatingRow = $($(".seating-arrangement-row")[i]);

                for (var j = 0; j < columns_per_row; j++) {
                    row_column_content = seatingArrangement.seatingGrid[i].row[j];
                    if (row_column_content.hasOwnProperty('name')) {
                        switch (row_column_content.name.trim().toUpperCase()) {
                            case "TEACHER DESK":
                                $seatingRow.append("<div class='seating-cell teacher-cell hasStudent'> <p class='teacher-desk2'> TEACHER DESK </p> </div>");
                                break;
                            default:
                                $seatingRow.append("<div class='seating-cell hasStudent'> <p class> " + row_column_content.name + "</p> </div>");
                                break;
                        }
                    } else {
                        $seatingRow.append("<div class='seating-cell'></div>");
                    }
                }
            }
            newLayoutFlag = false;
            setSeatingCellsHeightWidth();
            generateDragDropPrimaryCtrl();
            setControlClickListeners();
        });
    };

    /**
     * 
     */
    setSeatingCellsHeightWidth = function() {
        $seatingCells = $(".seating-cell");
        $seatingCells.css({
            "width": (100 / columns_per_row) + "%"
        });

        if (rows * 14 > 100) {
            $(".seating-arrangement-row").css({
                "height": (100 / rows) + "%"
            });
        } else {
            $(".seating-arrangement-row").css({
                "height": "unset"
            });
        }

    };

    /**
     * 
     */
    generateDragDropPrimaryCtrl = function() {
        makeDraggable($(".student-name"));
        makeDraggable($(".hasStudent"));
        makeDroppable($(".seating-cell"), ".student-name, .hasStudent");
    };

    /**
     * 
     */
    makeDraggable = function($make_draggable) {
        $make_draggable.draggable({
            containment: "body",
            cursor: "grab",
            revert: "invalid",
            appendTo: "body",
            helper: "clone",
            zindex: 1000,
            start: function(event, ui) {
                $(ui.helper).css({
                    "width": $(this).css("width"),
                    "height": $(this).css("height")
                });
                //$(ui.helper).css({ "z-index": "1000" });
                // $(ui.helper).css({"max-width": "18%",
                //                   "max-height": "15%"});

            },
            stop: function(event, ui) {
                $(ui.helper).css({ "z-index": "unset" });
                // $(ui.helper).css("max-width", "");
            },
            drag: function() {
                $(this).css("z-index", "1000");
                console.log($(this).css("z-index"));
            }
        });
    };

    /**
     * 
     */
    makeDroppable = function($make_droppable, accepts) {
        $make_droppable.droppable({
            accept: accepts,
            hoverClass: "hovered",
            drop: function upondrop(event, ui) {
                handleDrop(event, ui, $(this));
            }
        });
        // .css({
        //     "width": (94 / columns_per_row) + "%"
        // });

    };

    /**
     * 
     */
    handleDrop = function(event, ui, $droppedOn) {
    	$(".drag-drop-instruction").hide();
        console.log(event);
        var $dropped = $(ui.draggable);
        if ($dropped.hasClass("seating-cell")) {
            var droppedOnHtml = $droppedOn.html();
            $droppedOn.html($dropped.html());
            $droppedOn.addClass("hasStudent");
            if (droppedOnHtml == null || droppedOnHtml == "") {
                $dropped.removeClass("hasStudent").html("");
            } else {
                $dropped.html(droppedOnHtml);
            }

            if($droppedOn.hasClass("teacher-cell") && !$dropped.hasClass("teacher-cell")) {
            	$dropped.toggleClass("teacher-cell");
            	$droppedOn.toggleClass("teacher-cell");
            } else if(!$droppedOn.hasClass("teacher-cell") && $dropped.hasClass("teacher-cell")) {
        		$dropped.toggleClass("teacher-cell");
        		$droppedOn.toggleClass("teacher-cell");
            }

            newLayoutFlag = true;
        } else if ($droppedOn.is(':empty')) {
            var pclass = ($dropped.hasClass("teacher-desk")) ? "teacher-desk2" : "";
            if (!(pclass === "teacher-desk2")) {
                ui.draggable.draggable('disable');
                $dropped.detach();
            } else {
            	$droppedOn.addClass("teacher-cell");
            }
            $droppedOn.html("<p class='" + pclass + "'>" + $dropped.find('p').html() + "</p>");
            $droppedOn.addClass("hasStudent");
            newLayoutFlag = true;
            $dropped.draggable("option", "revert", false)
            //$droppedOn.droppable('disable');
        } else {
            $dropped.draggable("option", "revert", true)
        }
        generateDragDropPrimaryCtrl();
    };

    setControlClickListeners = function() {
    	$nameInput = document.getElementById("name-input");
        $resetSeatingChart = $(".reset-seating-chart");
        $addRow = $(".add-row");
        $removeRow = $(".remove-row");
        $addColumn = $(".add-column");
        $removeColumn = $(".remove-column");
        $saveSeatingChart = $(".save-seating-chart");
        $cancelSeatingChart = $(".cancel-seating-chart");
        $deleteArrangement = $(".delete-seating-chart");

        // $nameInput.value = "Testing Arrangement " + (activeSeatingArrangementJsonIndex + 1);

        $resetSeatingChart.unbind('click').click(function() {
            console.log("resetSeatingChart click triggered this will reset the seating arrangement.");
            //check all students have been given a position
            drawSeatingArrangementSelector();
            $(".drag-drop-instruction").show();
        });

        $addRow.unbind('click').click(function() {
            $seatingArrangement.append("<div class='seating-arrangement-row'></div>");
            var $seatingRow = $($(".seating-arrangement-row")[rows]);
            for (var j = 0; j < columns_per_row; j++) {
                $seatingRow.append("<div class='seating-cell'></div>");
            }
            rows++;
            setSeatingCellsHeightWidth();
            generateDragDropPrimaryCtrl();
        });

        $removeRow.unbind('click').click(function() {
            var $row = $($(".seating-arrangement-row")[rows - 1]);
            if (!$row.find(".hasStudent").length > 0) {
                $row.detach();
                $seatingArrangement = $(".seating-arrangement");
                rows--;
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
              seatingArrangementAlertDialog.init("A1", "Attention user! The bottom row is not empty.");
            }
        });

        $addColumn.unbind('click').click(function() {
            columns_per_row++;
            $(".seating-arrangement-row").append("<div class='seating-cell'></div>");
            $seatingArrangement = $(".seating-arrangement");
            setSeatingCellsHeightWidth();
            generateDragDropPrimaryCtrl();
        });

        $removeColumn.unbind('click').click(function() {
            var $column = $(".seating-arrangement-row > .seating-cell:last-of-type");
            if (!$column.hasClass("hasStudent")) {
                $column.detach();
                columns_per_row--;
                $seatingArrangement = $(".seating-arrangement");
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
              seatingArrangementAlertDialog.init("A1", "Attention user! The right most column is not empty.");
            }
        });

        $deleteArrangement.unbind('click').click(function() {
        	if(activeSeatingArrangementJsonIndex === -1) {
        		alert("You cannot delete alphabetical order.");
        	} else {
	        	var dbID = seatingArrangementJson[activeSeatingArrangementJsonIndex].dbID;
	        	mainplayerInFocus(true);
	        	makeAPICall(3, { "dbID": dbID });
        	}
        });

        $deleteArrangement.unbind('click').click(function() {
        	if(activeSeatingArrangementJsonIndex === -1) {
        		seatingArrangementAlertDialog.init("A1", "You cannot delete alphabetical order.");
        	} else {
	        	var dbID = seatingArrangementJson[activeSeatingArrangementJsonIndex].dbID;
	        	mainplayerInFocus(true);
	        	makeAPICall(3, { "dbID": dbID });
        	}
        });

        $saveSeatingChart.unbind('click').click(function() {
            console.log("saveSeatingChart click triggered this will have an ajax api call for saving seating arrangement.");
            //check all students have been given a position
            if ($(".student-list > .student-name").length == 1) {
                clearEmptyRowsAndColumns();
                var jsonObject = extractSeatingChartJson();
                if (jsonObject.seatingGrid.length != 0) {
                    makeAPICall(1, { "groupXRef": xref, "seatingArrangement": JSON.stringify(jsonObject) });
                } else if (jsonObject.seatingGrid.length != 0) {
                    seatingArrangementAlertDialog.init("A1", "There is nothing to save.");
                }
            } else if ($(".student-list > .student-name").length > 1) {
                seatingArrangementAlertDialog.init("A1", "All the students haven't been placed in the seating arrangement. " +
                    "If the student isn't attending the class then just put him at the " +
                    "end of the class where they won't get in the way.");
            }
        });

        $cancelSeatingChart.unbind('click').click(function() {
            $(".loading-cover").hide(0);
            $(".dialog-container, .dialog-setting").hide(0);
            drawSeatingArrangementSelector();
            mainplayerInFocus(true);
            showHideSeatingArrangement(false);
        });

        /**This is outside the view in the main display but I put it here cause it is the controller*/
        $(".seating-arrangement-btn").unbind('click').click(function() {
            showHideSeatingArrangement(true);
            mainplayerInFocus(false);
            pauseSlider();
        });

    };

    clearEmptyRowsAndColumns = function() {
        var $column;
        // removing empty columns at the end
        while (columns_per_row > 0) {
            $column = $(".seating-arrangement-row > .seating-cell:last-of-type");
            if (!$column.hasClass("hasStudent")) {
                $column.detach();
                columns_per_row--;
                $seatingArrangement = $(".seating-arrangement");
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
                break;
            }
        }
        // removing empty columns at the begining
        while (columns_per_row > 0) {
            $column = $(".seating-arrangement-row > .seating-cell:first-of-type");
            if (!$column.hasClass("hasStudent")) {
                $column.detach();
                columns_per_row--;
                $seatingArrangement = $(".seating-arrangement");
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
                break;
            }
        }

        // removing empty rows at the end
        while (rows > 0) {
            var $row = $($(".seating-arrangement-row")[rows - 1]);
            if (!$row.find(".hasStudent").length > 0) {
                $row.detach();
                $seatingArrangement = $(".seating-arrangement");
                rows--;
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
                break;
            }
        }

        // remove empty rows at the begining
        while (rows > 0) {
            var $row = $($(".seating-arrangement-row")[0]);
            if (!$row.find(".hasStudent").length > 0) {
                $row.detach();
                $seatingArrangement = $(".seating-arrangement");
                rows--;
                setSeatingCellsHeightWidth();
                generateDragDropPrimaryCtrl();
            } else {
                break;
            }
        }
    };

    extractSeatingChartJson = function() {
        var $rows = $(".seating-arrangement-row");
        var $row;
        var $columns;
        var $column;
        var name;

        if(activeSeatingArrangementJsonIndex === -1) {
        	name = "Alphabetical Order";
        } else if($nameInput.value === "") {
        	name = "Testing Arrangement: " + (activeSeatingArrangementJsonIndex + 1);
        } else {
        	name = $nameInput.value;
        }

        var jsonObject = {
            "totalcolumns": columns_per_row,
            "totalrows": rows,
            "seatingGrid": [],
        	"name": name
        };
        var rowJsonArray = [];
        var $p;
        for (var i = 0; i < rows; i++) {
            rowJsonArray = [];
            $row = $($rows[i]);
            $columns = $row.find(".seating-cell");
            for (var j = 0; j < columns_per_row; j++) {
                $column = $($columns[j]);
                $p = $column.find("p");

                rowJsonArray.push({
                    "name": $p.html(),
                    "row": i.toString(),
                    "column": j.toString()
                });
            }
            console.log(rowJsonArray);
            jsonObject.seatingGrid.push({ "row": rowJsonArray });
        }
        console.log(JSON.stringify(jsonObject, null, 2));
        return jsonObject;
    };

    makeAPICall = function(callType, payload) {
        if (newLayoutFlag || callType == 3) {
            /**
             * callType :
             *      1 : save API call
             *      2 : update API call
             *      3 : delete API call
             *      4 : add new chart API call
             *      NOTE: Not sure yeat but 4 and 1 could possibly
             *            eventually be done in the same place
             */
            $(".loading-cover").show(0);
            var url;

            switch (callType) {
                case 1:
                    url = "/LiveChart/saveSeatingChart";
	 				seatingArrangementJson.push(JSON.parse(payload.seatingArrangement));
            		activeSeatingArrangementJsonIndex = seatingArrangementJson.length - 1;
                    break;
                case 2:
                    url = "/LiveChart/saveSeatingChart";
                    break;
                case 3:
                    url = "/LiveChart/deleteSeatingChart";
                    break;
                case 4:
                    url = "/LiveChart/saveSeatingChart";
                    break;
                default:
                    return;
                    break;
            }

            $.ajax({
                type: "POST",
                data: JSON.stringify(payload),
                // data: JSON.jsonObject(payload),
                // data: null,
                crossDomain: true,
                contentType: "application/json",
                dataType: "json",
                url: url,
                success: function(result) {
                    console.log(result);
                    newLayoutFlag = false;
                    //$(".seating-arrangement-name").last().trigger("click");
                },
                complete: function() {
                    showHideSeatingArrangement(false);
					$(".loading-cover").hide(0);
                    fetchSeatingArrangements();
                    callback();
                },
                error: function() {
                    activeSeatingArrangementJsonIndex = (activeSeatingArrangementJsonIndex == (seatingArrangementJson.length - 1)) ? activeSeatingArrangementJsonIndex-- : activeSeatingArrangementJsonIndex;
                    seatingArrangementJson.pop(seatingArrangementJson.length - 1);
                    //alert("there was an error in the API call, call type was " + callType);
                }
            });
        } else {
            showHideSeatingArrangement(false);
            callback();
        }
    }

    /**
    	If showHideFlag is true then show(0) if false then hide(0)
    */
    showHideSeatingArrangement = function(showHideFlag) {
        if (showHideFlag) {
            $seating_arrangement_container.parent().show(0);
            $seating_arrangement_container.show(0);
        } else {
            $seating_arrangement_container.parent().hide(0);
            $seating_arrangement_container.hide(0);
        }
    };
}
