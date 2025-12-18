/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: classes.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Houses generic TWM classes.
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * Class: UberSearch
 * @param () none
 * @returns () nothing
 * Class responsbile for instantiating and executing an uber search
 */
class UberSearch {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		// Set misc variables
		app.uberSearchTimer = null;		
		var iconFeature = new ol.Feature({ geometry: new ol.geom.Point([0,0])});
		const iconStyle = new ol.style.Style({image: new ol.style.Icon({
			anchor:[0.5,0.5],
			displacement: [0, 24],			
			src:"application/img/GeoCoderMarker.png"})});
		iconFeature.setStyle(iconStyle);
		const iconSource = new ol.source.Vector({features: [iconFeature]});
		const iconLayer = new ol.layer.Vector({source: iconSource, name: "uberIcon"});
		
		// Prevent the default submit for the uberSearch form
		$("#frmUberSearch").on('submit',function(e){
			e.preventDefault();
		});
		
		// Register input category autocomplete
		$("#uberSearch").catcomplete({
			minLength: 3,
			source: this.execute,
			autoFocus: true,
			select: function(event, selection) {
				// Get the selected item data
				var data = selection.item.data;
				
				// If the selection has geometry
				if (data.geometry && data.geometry.type && data.geometry.coordinates) {				
					// Convert to an Openlayers feature
					var olFeature = convertToOpenLayersFeature("GeoJSON", data);					
					
					// Highlight and zoom to feature
					zoomToFeature(olFeature);
					var centre = app.map.getView().getCenter();
					
					// Place mark to indicate where we zoomed to
					app.map.removeLayer(iconLayer); // remove any previous marker	
					iconFeature.getGeometry().setCoordinates(centre);
					app.map.addLayer(iconLayer);
					iconLayer.setZIndex(nextAvailableOverlayLayerZIndex());
					
					// Marker already indicates a point, so no highlight required
					if (olFeature.getGeometry().getType() != 'Point') highlightFeature(olFeature); 
					
					// If is mobile and sidebar is visible, close the sidebar
					if (isMobile() && $("#sidebar").is(":visible")) hideSidebar();

				}	
			}
		});
		
		// Register the uberSearch clear button
		$("#uberSearchClearBtn").on("click",function() {
			$("#uberSearch").val("");
			clearHighlightedFeatures();
			app.map.removeLayer(iconLayer);
		});
		
		// Instantiate the available search engines
		this.searchEngines = [];
	}
	
	/**
	 * Function: search
	 * @param () none
	 * @returns () nothing
	 * Function that executes the search
	 */
	execute(request, callback, options) {
		// Define the variables that will track/accumulate the results
		var completeList = [];
		var completedCount = 0;
		
		// Clear pending search if another request was issued soon after
		if (app.uberSearchTimer) {
			clearTimeout(app.uberSearchTimer);
			app.uberSearchTimer = null;
		}

		// Wait a tick before executing search/filter
		app.uberSearchTimer = setTimeout(function () {
			
			// Add the ubersearch spinner
			var spinner = new Spinner(app.spinnerOptionsTextInput).spin($("#frmUberSearch")[0]);
			
			// Define the call back function for each individal search engine
			var accumulator = function(list) {
				completeList = completeList.concat(list);
				completedCount++;
				if (completedCount >= app.uberSearch.searchEngines.length) {
					callback(completeList);
					spinner.stop();
				}
			}
			
			// Call each identified query function
			$.each(app.uberSearch.searchEngines, function(index, searchEngine) {
				searchEngine(request, accumulator, options);
			});
			
		}, 250);
		
	}
}