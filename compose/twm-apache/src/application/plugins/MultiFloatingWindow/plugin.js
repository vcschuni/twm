class MultiFloatingWindow {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "MultiFloatingWindow";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.contentFile = "application/plugins/MultiFloatingWindow/template.html";
		this.windowSpinners = new Object();
		this.windowHeights = new Object();
		this.windowCloseCallbacks = new Object();
		this.addPlugin();
	}
	
	/**
	 * Function: open
	 * @param (string) id
	 * @param (string) title
	 * @param (string) content
	 * @param (integer) width - OPTIONAL
	 * @param (integer) height - OPTIONAL
	 * @param (string) location ('left', 'right', 'middle')- OPTIONAL - DEFAULT 'left'
	 * @param (function) openCallback - OPTIONAL
	 * @param (function) closeCallback - OPTIONAL
	 * @returns () nothing
	 * Function that opens the floating window to a specified (and constrained) size
	 */
	open(id, title, content, width, height, location, openCallback, closeCallback) {
		// Show the spinner
		this.showWindowSpinner(id);
		
		// Optional parameters (set default if not specified)
		width = width || 300;
		height = height || $("#content").height() - 10;
		location = location || "left";
		openCallback = openCallback || function(){};
		this.windowCloseCallbacks[id] = closeCallback || function(){};
		
		// Contrain width and height if larger than viewport
		if (width > ($(window).width() - 10)) width = $(window).width() - 10;
		if (height > ($("#content").height() - 10)) height = $("#content").height() - 10;
		
		// Define default start position based on content DIV (assuming desktop)
		var top = $("#content").offset().top + 5;
		var left = $("#content").offset().left + 5;
		if (location == "right") left = $("#content").offset().left + $("#content").width() - width - 5;
		if (location == "middle") left = $("#content").offset().left + ($("#content").width() / 2) - (width / 2);
		
		// If mobile, center the window horizontally
		if (isMobile()) {
			var left = ($(window).width() - width) / 2;
		} 
		
		// If the window already exists, reuse it.  Otherwise create a new one from the template
		if ($("#mfw-"+id).length) {
			var mfWindow = $("#mfw-"+id);
		} else {
			// Create a clone from the template
			var mfWindow = $(".mfw-window-template").clone(true);
			mfWindow.removeClass("mfw-window-template");
			mfWindow.attr("id", "mfw-"+id);
			mfWindow.data("mfw-window-id", id);
			
			// Set the window's position and z-index;
			mfWindow.css("position", "fixed");
			
			// Set the window height and z-index
			this.windowHeights[id] = 0;
			mfWindow.css("z-index", (app.plugins.MultiFloatingWindow.getHighestZIndex() + 1));
			
			// Register the buttons
			mfWindow.find(".mfw-close-btn").click(function(){
				app.plugins.MultiFloatingWindow.close(id);
			});
			mfWindow.find(".mfw-lock-btn").click(function(){
				app.plugins.MultiFloatingWindow.lockUnlock(id);
			});
			
			// Make the window draggable
			mfWindow.draggable({
				handle: ".mfw-title",
				containment: "parent"
			});
			
			// Add the focus listener (puts the last clicked window on top)
			mfWindow.on("click", function(e) {
				var currentZI = $(this).css("z-index");
				var highestZI = app.plugins.MultiFloatingWindow.getHighestZIndex();
				if (currentZI < highestZI) {
					$(this).css("z-index", (highestZI + 1));
				}
			});
			
			// Append the window to the body
			$("#twm-content").append(mfWindow);
		}
		
		// Set the window title and content
		mfWindow.find(".mfw-title").html(title);
		mfWindow.find(".mfw-content").html("<div class='mfw-content-dyn-div'></div>");
		mfWindow.find(".mfw-content-dyn-div").append(content);
		
		// Hide the lock button if mobile
		if (isMobile()) {
			mfWindow.find(".mfw-lock-btn").hide();
		} else {
			mfWindow.find(".mfw-lock-btn").show();
		}		
		
		// Show the window
		mfWindow.show();
		
		// Ugly hack to make sure last opened window is on top
		setTimeout(function() {
			mfWindow.trigger("click"); 
		}, 30);
		
		// Set window size and position
		if (mfWindow.data("window-state") == "unlocked" || isMobile()) {
			mfWindow.css("top", top);
			mfWindow.css("left", left);
			mfWindow.width(width);
			app.plugins.MultiFloatingWindow.resetHeight(id)
		}

		// Hide the spinner
		this.hideWindowSpinner(id);
		
		// Run the callback function (after short delay)
		setTimeout(openCallback, 250);
	}
	
	/**
	 * Function: resetHeight
	 * @param (string) id
	 * @returns () nothing
	 * Function to reset the content height of the mfw
	 */
	resetHeight(id) {
		// Get the mfw by it's ID
		var mfWindow = $("#mfw-"+id);
		
		// Calculate height based on window content
		var height = mfWindow.find(".mfw-header").outerHeight() + mfWindow.find(".mfw-content-dyn-div").outerHeight() + 32; 
		
		// Contrain height if larger than viewport
		if (height > ($("#content").height() - 10)) height = $("#content").height() - 10;
		
		// Set the height
		mfWindow.height(height);
	}
	
	/**
	 * Function: close
	 * @param (string) id
	 * @returns () nothing
	 * Function to close the floating window
	 */
	close(id) {
		$("#mfw-"+id).hide(500);
		$("#mfw-"+id).remove();
		//$("#mfw-"+id+" .mfw-content").empty()
		if (this.windowCloseCallbacks[id]) {
			var fn = this.windowCloseCallbacks[id];
			fn();
		}
	}
	
	/**
	 * Function: isOpen
	 * @param (string) id
	 * @returns () nothing
	 * Function to determine whether window is open
	 */
	isOpen(id) {
		return $("#mfw-"+id).is(":visible");
	}
	
	/**
	 * Function: showWindowSpinner
	 * @param (string) id
	 * @returns () nothing
	 * Function that shows the window spinner
	 */
	showWindowSpinner(id) {
		if (id in this.windowSpinners) {
			this.windowSpinners[id].spin($("#mfw-"+id)[0]);
		} else {
			this.windowSpinners[id] = new Spinner(app.spinnerOptionsMedium).spin($("#mfw-"+id)[0]);
		}
	}

	/**
	 * Function: hideWindowSpinner
	 * @param (string) id
	 * @returns () nothing
	 * Function that hides the window spinner
	 */
	hideWindowSpinner(id) {
		setTimeout(function(){ 
			app.plugins.MultiFloatingWindow.windowSpinners[id].stop(); 
		}, 250);
	}
	
	/**
	 * Function: lockUnlock
	 * @param (string) id
	 * @returns () nothing
	 * Function to lock/unlock floating window from being respawned in it's default location and size
	 */
	lockUnlock(id) {
		if ($("#mfw-"+id).data("window-state") == "unlocked") {
			$("#mfw-"+id).find(".mfw-lock-btn span").removeClass("oi-lock-unlocked").addClass("oi-lock-locked").addClass("mfw-lock-btn-locked");
			$("#mfw-"+id).data("window-state", "locked");
		} else {
			$("#mfw-"+id).find(".mfw-lock-btn span").removeClass("oi-lock-locked").removeClass("mfw-lock-btn-locked").addClass("oi-lock-unlocked");
			$("#mfw-"+id).data("window-state", "unlocked");
		}
	}
	
	/**
	 * Function: getHighestZIndex
	 * @param () none
	 * @returns () nothing
	 * Function that gets the highest z-index of all of the open floating windows
	 */
	getHighestZIndex() {
		var highestZI = 0;
		$(".mfw-window").each(function(index, element) {
			var elementZIndex = parseInt($(element).css("z-index"));
			if (elementZIndex) {
				if ($(element).data("mfw-window-id")) {
					if (elementZIndex > highestZI) highestZI = elementZIndex;
				}
			}
		});
		return highestZI;
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Load the floating window template
		$.ajax({
			url: this.contentFile,
			cache: false,
			dataType: "html"
		})
		.done(function(content) {
			// Append the template to the body
			$("body").append(content);
			
			// Watch for window height changes on each open window.  Record window heights in a class array.
			// Make layout adjustments to the window content size if required.
			setInterval(function(){
				$(".mfw-window").each(function(index, element) {
					var mfWindow = $(element);
					var mfWindowId = mfWindow.data("mfw-window-id");
					if (!mfWindowId) return;
					if (!mfWindow.is(":visible")) return;
					if (mfWindow.height() != app.plugins.MultiFloatingWindow.windowHeights[mfWindowId]) {
						// Record new height
						app.plugins.MultiFloatingWindow.windowHeights[mfWindowId] = mfWindow.height();
						
						// Adjust window content size
						mfWindow.find(".mfw-content").height(mfWindow.height() - mfWindow.find(".mfw-header").outerHeight() - 20); 
					}
				});
			}, 100);
			
			// Log success
			logger("INFO", app.plugins.MultiFloatingWindow.name + ": Plugin successfully loaded");
		})
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", app.plugins.MultiFloatingWindow.name + ": Could not load template - " + exception);
		}); 
	}

}