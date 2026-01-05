class ZoomToGeoLocation {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ZoomToGeoLocation";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.intervalProcessId;
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : true;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "5em";				
		this.addPlugin();
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		
		var showBlip = this.pcfg.showBlip;
		var button = document.createElement('button');
		button.innerHTML = '⌖'; // Device location icon
		
		var element = document.createElement('div');
		element.title = "Device location!";
		element.id = "device-location-btn";
		element.className = 'device-location-btn ol-control';
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
		
		var deviceLocationTransition = new ol.control.Control({
			element: element
		});
		
		app.map.addControl(deviceLocationTransition);

		$(".device-location-btn").click(function(){
			if (showBlip){
				showGeoLocationOnMap(); // Display the user locations blip on the map
			}
			zoomToGeoLocation(app.config.map.zoom.max); // Zoom into the user coordinates with the max zoom level
		});
	
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}