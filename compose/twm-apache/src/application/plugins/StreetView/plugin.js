class StreetView {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "StreetView";
		this.version = 1.1;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.intervalProcessId;
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : false;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "6em";						
		this.addPlugin();
	}
	
    /**
	 * Function: mapClickFunction
	 * @param () none
	 * @returns () nothing
	 * Function that registers the map click and opens google maps street view
	 */
	mapClickFunction(e){
		// Get the click coordinate in EPSG:4326
		var centreLL = ol.proj.transform(e.coordinate, app.map.getView().getProjection(), "EPSG:4326");
		
		// Reset the map's single click function to default
		resetDefaultMapSingleClickFunction();
        
        // Get the lon and lat values
        const lon = centreLL[0];
        const lat = centreLL[1];
		
        // Create the google maps URL for this location
		const url = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + lat + "," + lon;

        // Open the google maps URL in a new tab
        window.open(url);
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		
        // Load in the button icon
		var iconSrc = '<img src="./application/plugins/StreetView/img/icon.png" width="15" height="15">';
		
        // Create the streetview button
        var button = document.createElement('button');
        button.id = "sv-streetview-btn";
		button.innerHTML = iconSrc; // Streeview icon

		let basemapEnabled = false;

		// Loop through the list of plugins and check if the basemap plugin is enabled
		for (var i = 0; i < app.config.plugins.length; i++) {
			if (app.config.plugins[i].name == "BasemapSwitcher") {
				basemapEnabled = true;
			}
		}
		
		
        // Create the streetview location div
		var element = document.createElement('div');
		element.title = "Streetview location";
		element.id = "sv-streeview-location-btn";
		element.className = 'streetview-location-btn ol-control';
		if (this.buttonLocatedTop) {
			element.style.top = this.buttonLocationOffset;
		} else {
			element.style.bottom = this.buttonLocationOffset;
		}
		if (this.buttonLocatedRight) {
			element.style.right = '.5em';
		} else {
			element.style.left = '.5em';
		}

		element.appendChild(button);
		
		// Create a new open layers control for the streetview location button
		var streetviewLocationTransition = new ol.control.Control({
			element: element    
		});
		
		// Add the new control to the map
		app.map.addControl(streetviewLocationTransition);

		// Add the click event to the streetview location button
        $("#sv-streeview-location-btn").click(function() {
            // Redirect the map's single click function to this mapClickFunction\
		    redirectMapSingleClickFunction("crosshair", app.plugins.StreetView.mapClickFunction);
        });
	
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}