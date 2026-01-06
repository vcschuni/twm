class ZoomToInitialExtent {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ZoomToInitialExtent";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.intervalProcessId;
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : true;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "3.5em";				
		this.addPlugin();
	}	
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
        // Load in the button icon
		var iconSrc = '<img src="./application/plugins/ZoomToInitialExtent/img/initialExtentIcon.png" width="15" height="15">';
		
		var button = document.createElement('button');
 		button.innerHTML = iconSrc; 

		
		var element = document.createElement('div');
		element.title = "Intial Extent";
		element.id = "initial-extent-btn";
		element.className = 'initial-extent-btn ol-control';
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

		$(".initial-extent-btn").click(function(){
			app.map.getView().setZoom(app.config.map.default.zoom);
			var centreIn4326 = [app.config.map.default.centre.longitude,app.config.map.default.centre.latitude];
			var centreIn3857 = ol.proj.transform(centreIn4326,'EPSG:4326', app.map.getView().getProjection().getCode());
			app.map.getView().setCenter(centreIn3857);

		});
	
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}