class ShowClickCoordinates {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ShowClickCoordinates";
		this.version = 1.0;
		this.author = "";
		this.pcfg = getPluginConfig(this.name);
		if (typeof this.pcfg.displayLocatedRight != "undefined") {
		   this.displayLocatedRight = (this.pcfg.displayLocatedRight);
		} else {
			this.displayLocatedRight = false; // default	
		}
		if (typeof this.pcfg.displayLocatedTop != "undefined") {
		   this.displayLocatedTop = (this.pcfg.displayLocatedTop);
		} else {
			this.displayLocatedTop = true; // default
		}
		this.displayVerticalOffset = (this.pcfg.displayVerticalOffset) ? this.pcfg.displayVerticalOffset : "8px";	
		this.displayHorizontalOffset = (this.pcfg.displayHorizontalOffset) ? this.pcfg.displayHorizontalOffset : "8px";	
		this.addPlugin(); // Initializes the plugin
	}
	
	/**
	 * Function: update
	 * @param (string) text to display
	 * @returns () nothing
	 * Function that updates the display of coordinates
	 */
	update(text) {
		if (text) {
			$("#map #coordinates").show();
			$("#map #coordinates").html(text);
		} else {
			$("#map #coordinates").hide();
		}
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Create, style and add the html element to the map
		$("#map").append('<div id="coordinates"></div>');
		var coordElement = $("#coordinates")
		var css =  {
				"color": "#eee",
				"z-index": 2000,
				"font-size": "12px",
				"position": "absolute",
				"background": "rgba(0,60,136,0.3)",
				"border-radius": "4px",
				"padding": "2px",
				"display": "none"
			}
		coordElement.css(css);		

		// adjust as per config.js preferences
		if (this.displayLocatedTop) {
			coordElement.css("top" ,this.displayVerticalOffset);
		} else {
			coordElement.css("bottom",this.displayVerticalOffset);
		}
		if (this.displayLocatedRight) {
			coordElement.css("right",this.displayHorizontalOffset);
		} else {
			coordElement.css("left",this.displayHorizontalOffset);
		}		
		
		// Register map event that clears the coordinates
		$(app.map).on("moveend", function(e) {
			app.plugins.ShowClickCoordinates.update(null);
		});
		
		// Register map event that shows the click coordinates
		app.map.on("click", function(e) {
			var coord = ol.proj.transform(e.coordinate, app.map.getView().getProjection().getCode(), "EPSG:4326");
			app.plugins.ShowClickCoordinates.update(coord[0].toFixed(5) + "&deg; " + coord[1].toFixed(5) + "&deg;");
		});		
		
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}
