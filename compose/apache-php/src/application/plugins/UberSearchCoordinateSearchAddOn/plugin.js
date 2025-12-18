class UberSearchCoordinateSearchAddOn {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "UberSearchCoordinateSearchAddOn";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.addPlugin();
	}

	/**
	 * Function: search
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search
	 */
	search(request, callback, options) {
		// Get the map's projection 
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
		
		// Search for a "coordinate pattern" within user input
		var location = convertStringToCoordinate(request.term, outputSRS);
		if (location.hasOwnProperty("category")) {
			callback([{
				value: request.term,
				category: location.category,
				data: {
					type: "Feature",
					geometry: {
						type: "Point",
						crs: {
							type: "EPSG",
							properties: {
								code: location.epsg
							}
						},
						coordinates: location.coordinate
					}
				}
			}]);
		} else {
			callback([]);
		}
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin
	 */
	addPlugin() {
		// Extend ubersearch
		app.uberSearch.searchEngines.push(this.search);
		
		// Show the uberseach input if not already
		$("#frmUberSearch").show();
		
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
	
}