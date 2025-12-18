class LayerSearch {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "LayerSearch";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Layer Search";
		this.tabContentFile = "application/plugins/LayerSearch/tab-content.html";
		this.searchLayer;
		this.deferSearch = false;
		this.spinner;
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.featureStore = [];
		this.currentGeoLocation = [];
		this.addPlugin();
	}
	
	/**
	 * Function: sortTableByRowAttribute
	 * @param (object) jQuery table object
	 * @param (string) row attribute
	 * @param (string) direction to sort on (ASC or DESC)
	 * Function to sort a table based on a row's attribute
	 */
	sortTableByRowAttribute(table, attribute, direction) {
		var rows = table.children("tbody").children("tr");
		rows.sort(function(a, b) {
			if (isNumeric($(a).attr(attribute)) && isNumeric($(b).attr(attribute))) {
				var A = Number($(a).attr(attribute));
				var B = Number($(b).attr(attribute));
			} else {	
				var A = $(a).attr(attribute).toUpperCase();
				var B = $(b).attr(attribute).toUpperCase();
			}	
			if (direction == "ASC") {
				if(A < B) return -1;
				if(A > B) return 1;
			} else {
				if(A > B) return -1;
				if(A < B) return 1;
			}
			return 0;
		});
		$.each(rows, function(index, row) {
			table.children('tbody').append(row);
		});
	}
	
	/**
	 * Function: addSearchableLayersToSelectControl
	 * @param () none
	 * @returns () nothing
	 * Function to add layers configured to be searchable to the layer search select control
	 */
	addSearchableLayersToSelectControl() {
		// Empty the layer select control
		$("#ls-search-layer-select").empty();
		
		// Loop through all of the map layers looking for ones that are configured for searching
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Get the layer ID
			var layerId = ol.util.getUid(layer);
			
			// Determine if layer configured for searching
			var addAsSearchLayer = false;
			var fields = layer.get("fields");
			if (fields) {
				$.each(fields, function(index2, field) {
					if (field.searchCriteria) {
						if (field.searchCriteria.length > 0) addAsSearchLayer = true;
					}
				});
			}

			// Add as search layer if configured
			if (addAsSearchLayer === true) {
				$("#ls-search-layer-select").prepend(new Option(layer.get("title"), layerId));
			}
		});
		
		// Register the layer select change handler
		$("#ls-search-layer-select").on("change", function(e){
			// Build search controls
			var selectedLayerId = $("#ls-search-layer-select option:selected").val();
			app.plugins.LayerSearch.addSearchControls(selectedLayerId);
		});

		// Only show layer select control if more than one layer
		if ($("#ls-search-layer-select option").length > 1) $("#ls-search-layer-select-container").show();
		
		// Set selection to first option and trigger change
		$("#ls-search-layer-select").val($("#ls-search-layer-select option:first").val());
		$("#ls-search-layer-select").trigger("change");
	}
	
	/**
	 * Function: addSearchControls
	 * @param (int) layerId
	 * @returns () nothing
	 * Function to add search controls specific to the layer
	 */
	addSearchControls(layerId) {
		// Remove existing controls and hide search and results fieldsets
		$("#ls-search-controls").empty();
		$("#ls-fs-search-controls").hide();
		$("#ls-fs-search-results").hide();
		
		// Get the search layer
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				app.plugins.LayerSearch.searchLayer = layer;
			}
		});
		
		// Bail if not found
		if (!app.plugins.LayerSearch.searchLayer) return;
		
		// Loop through all of the configured layer fields
		var fields = app.plugins.LayerSearch.searchLayer.get("fields");
		$.each(fields, function(fieldIndex, field) {
			
			// If serch criteria are present, build the search controls
			if (field.searchCriteria) {

				// Loop through the search criteria defined for this field
				$.each(field.searchCriteria, function(index, searchCriterion) {
					
					// Only build the search criterion control if configured correctly
					if (searchCriterion.name && searchCriterion.type && searchCriterion.cql) {
					
						// Define the control
						var control;

						// Build the control specific to field search criterion type
						switch (searchCriterion.type) {
							
							// Checkbox Type
							case "boolean":
								// Get the control template, clone it, and set some basic properties
								control = $(".ls-checkbox-template").clone(true);
								control.removeClass("ls-checkbox-template");
								control.find(".title").html(searchCriterion.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").change(function(){
									if (this.checked === true) {
										var cql = searchCriterion.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", 1);
										control.attr("cqlFilterPart", cql);
									} else {
										control.attr("cqlFilterPart", null);
									}
								});
								break;
							
							// Textfield Type
							case "string":
								// Get the control template, clone it, and set some basic properties
								control = $(".ls-textfield-template").clone(true);
								control.removeClass("ls-textfield-template");
								control.find(".input-group-text").html(searchCriterion.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").change(function(e){
									if (e.which == 13) e.preventDefault();
									if ($(this).val() != "") {
										var cql = searchCriterion.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", $(this).val());
										control.attr("cqlFilterPart", cql);
									} else {
										control.attr("cqlFilterPart", null);
									}
								});
								break;
							
							// Numberfield Type
							case "number":
								// Get the control template, clone it, and set some basic properties
								control = $(".ls-numberfield-template").clone(true);
								control.removeClass("ls-numberfield-template");
								control.find(".input-group-text").html(searchCriterion.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").change(function(e){
									if (e.which == 13) e.preventDefault();
									if ($(this).val() != "") {
										var cql = searchCriterion.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", $(this).val());
										control.attr("cqlFilterPart", cql);
									} else {
										control.attr("cqlFilterPart", null);
									}
								});
								break;
						}
						
						// If a control was built, add it to the UX
						if (control) {
							$("#ls-search-controls").append(control);
							control.show();
						}
						
					}
				});
			}
		});
		
		// Add the search button
		var searchBtn = $("<button class='btn btn-sm btn-block btn-success mt-3' type='button'>Search</button>");
		searchBtn.click(function(){
			app.plugins.LayerSearch.search();
		});
		$("#ls-search-controls").append(searchBtn);
				
		// Show the search fieldset
		$("#ls-fs-search-controls").show();	
	}
	
	/**
	 * Function: search
	 * @param () none
	 * @returns () nothing
	 * Function that searches the layer based on the defined criteria
	 */
	search() {
		// Bail if the application is set to defer the search
		if (app.plugins.LayerSearch.deferSearch === true) return;
		
		// Defer any additional searches until complete
		app.plugins.LayerSearch.deferSearch = true;
		
		// Clear the results table
		$("#ls-search-results .ls-feature-table tbody").empty();
		
		// Reset the feature store
		app.plugins.LayerSearch.featureStore = [];
		
		// Add the tab spinner
		app.plugins.LayerSearch.spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.LayerSearch.tabContent)[0]);
		
		// Define the search layer url (modify to point to WFS if required)
		if (app.plugins.LayerSearch.searchLayer.getSource() instanceof ol.source.TileWMS) {
			var searchUrl = app.plugins.LayerSearch.searchLayer.getSource().getUrls()[0]; // TileWMS
		} else if (app.plugins.LayerSearch.searchLayer.getSource() instanceof ol.source.ImageWMS) {
			var searchUrl = app.plugins.LayerSearch.searchLayer.getSource().getUrl(); // ImageWMS
		} else {
			app.plugins.LayerSearch.showResults(false, []);
			logger("WARN", app.plugins.LayerSearch.name + ": Could not determine search url for layer " + app.plugins.LayerSearch.searchLayer.get("title"));
			return;
		}
		var searchUrl = searchUrl.replace(new RegExp("/ows", "ig"), "/wfs");
			
		// Define the search layer name
		var searchLayerName;
		$.each(app.plugins.LayerSearch.searchLayer.getSource().getParams(), function(parameterName, parameterValue) {
			if (parameterName.toUpperCase() == "LAYERS") searchLayerName = parameterValue;
		});
		
		// Define and build the CQL Filter object (grouped by field name)
		var cqlFilterObject = new Object();
		$("#ls-search-controls").find(".ls-search-control").each(function() {
			var fieldName = $(this).attr("fieldName");
			var cqlFilterPart = $(this).attr("cqlFilterPart");
			if (fieldName && cqlFilterPart) {
				if (!cqlFilterObject[fieldName]) cqlFilterObject[fieldName] = [];
				cqlFilterObject[fieldName].push(cqlFilterPart);
			}
		});
		
		// Convert CQL filter object (which is already grouped) into a CQL filter array
		var cqlFilterArray = [];
		$.each(cqlFilterObject, function(fieldName, cqlFilterParts) {
			cqlFilterArray.push("(" + cqlFilterParts.join(" OR ") + ")");
		});
		
		// Add the spatial filter if requested (AND only if other filters have been defined)
		if (app.plugins.LayerSearch.pcfg.limitSearchToMapExtent === true && cqlFilterArray.length > 0) {
			// Get current map extent
			var mapExtent = app.map.getView().calculateExtent(app.map.getSize());
			
			// Get the name of the geometry column name
			var geometryField;
			$.each(app.plugins.LayerSearch.searchLayer.get("attributes"), function(index, attribute) {
				if (attribute.type.startsWith("gml:")) {
					geometryField = attribute.name;
				}
			});

			// Bail if current layer has no geometry field defined
			if (geometryField == null) {
				logger("ERROR", app.plugins.LayerSearch.name + ": "+app.plugins.LayerSearch.searchLayer.get("title")+" does not have a geometry field defined");
				app.plugins.LayerSearch.showResults(false, []);
				return;
			}
			
			// Transform map extent to the layers native projection if required
			if (app.map.getView().getProjection().getCode() != app.plugins.LayerSearch.searchLayer.get("nativeProjection")) {
				var mapExtent = ol.proj.transformExtent(mapExtent, app.map.getView().getProjection().getCode(), app.plugins.LayerSearch.searchLayer.get("nativeProjection"));
			}
			
			// Build the spatial filter (if requested) and add it to the CQL Filter array
			var spatialFilter = "BBOX("+geometryField+","+mapExtent[0]+","+mapExtent[1]+","+mapExtent[2]+","+mapExtent[3]+")";
			cqlFilterArray.push("("+spatialFilter+")");
		}
				
		// Convert CQL filter array into a string
		var cqlFilter;
		if (cqlFilterArray.length > 0) {
			cqlFilter = cqlFilterArray.join(" AND ");
		} 

		// If the cql filter is null, hide results and bail
		if (cqlFilter == null) {
			app.plugins.LayerSearch.showResults(true, []);
			return;
		}
		
		// Build the request options
		var options = {
			service: "WFS",
			version: "2.0.0",
			request: "GetFeature", 
			typeNames: searchLayerName,
			outputFormat: "application/json",
			count: app.plugins.LayerSearch.pcfg.maxResults,
			srsName: app.map.getView().getProjection().getCode(),
			cql_filter: cqlFilter
		}

		// Issue the request
		$.ajax({
			type: "GET",
			url: searchUrl,
			dataType: "json",
			data: options
		})
		
		// Handle the response
		.done(function(response) {
			app.plugins.LayerSearch.showResults(true, response);
			if (isMobile()) $("#ls-search-control").click();
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			app.plugins.LayerSearch.showResults(false, []);
			logger("ERROR", app.plugins.LayerSearch.name + ": Error querying " + searchLayerName);
		}); 
		
	}
	
	/**
	 * Function: showResults
	 * @param (boolean) success
	 * @param (array) results
	 * @returns () nothing
	 * Function that shows the results
	 */
	showResults(success, results) {
		// Stop the spinner and stop deferring
		app.plugins.LayerSearch.deferSearch = false;
		app.plugins.LayerSearch.spinner.stop();
		
		// Show the results fieldset
		$("#ls-fs-search-results").show();
		
		// Show failure if needed
		if (success === false) {
			$("#ls-search-results .ls-feature-table tbody").append("<tr><td><center><i>Error</i></center></td></tr>");
			return;
		}
				
		// Get the features
		var features = (results.features) ? results.features : [];
		
		// Show no results if thats the case
		if (features.length == 0) {
			$("#ls-search-results .ls-feature-table tbody").append("<tr><td><center><i>No Results</i></center></td></tr>");
			return;
		}
		
		// Get the search layer "title" field(s)
		var titleFields = [];
		$.each(app.plugins.LayerSearch.searchLayer.get("fields"), function(index, field) {
			if (field.title) titleFields.push(field.name);
		});
		
		// If no title field(s) were configured, then choose first field
		if (titleFields.length == 0) titleFields.push(app.plugins.LayerSearch.searchLayer.get("fields")[0].name);
		
		// Loop thru the resultant features	
		$.each(features, function(index, feature) {
			// Validate that feature has geometry
			if (feature.geometry == null) return;
			
			// Add raw feature to the feature store
			app.plugins.LayerSearch.featureStore.push(feature);
			var featureStoreId = app.plugins.LayerSearch.featureStore.length - 1;
			
			// Build the feature title
			var featureTitle = "";
			if (feature.properties) {
				$.each(titleFields, function(index, titleField) {
					if (feature.properties[titleField]) {
						if (featureTitle != "") {
							featureTitle += " - ";
						}						
						featureTitle += feature.properties[titleField];
					}
				});
			}
			
			// Calculate the euclidean distance from feature to device location (if configured)
			var distance = 0;
			if (app.plugins.LayerSearch.currentGeoLocation.length == 2 && app.plugins.LayerSearch.pcfg.sortResultsByClosest === true) {
				// Determine the feature location (in 4326 coords)
				var featureCoord = ol.proj.transform(feature.geometry.coordinates, app.map.getView().getProjection().getCode(), "EPSG:4326");
			
				// Calc distance in kilometers
				distance = turf.distance(app.plugins.LayerSearch.currentGeoLocation, featureCoord, "kilometers");
			}
			
			// Build the table row
			var row = $("<tr></tr>");
			row.attr("featureStoreId", featureStoreId);
			row.attr("distance", distance);
			row.addClass("ls-tr-feature");
			
			// Build feature title td and add to tr
			var ftTd = $("<td></td>");
			ftTd.addClass("ls-td-feature-title");
			ftTd.append(featureTitle);
			row.append(ftTd);
						
			// Add row to the results table
			$("#ls-search-results .ls-feature-table tbody").append(row);
			
		});
		
		// Register all of the highlight feature event handlers
		$(".ls-tr-feature").hover( 
			function() {
				var featureStoreId = $(this).attr("featureStoreId");
				var feature = app.plugins.LayerSearch.featureStore[featureStoreId];
				var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
				highlightFeature(olFeature);
				$(this).css("background-color", "rgba(0, 255, 255, 0.3)");
			},
			function() {
				clearHighlightedFeatures();
				$(this).css("background-color", "");
			}
		);
		
		// Register all of the click feature event handlers
		$(".ls-tr-feature").click(function() {
			// Get the feature
			var featureStoreId = $(this).attr("featureStoreId");
			var feature = app.plugins.LayerSearch.featureStore[featureStoreId];
			var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
			
			// Zoom to minimum level (if configured)
			if (isNumeric(app.plugins.LayerSearch.pcfg.minimumZoomWhenIdentifying)) {
				if (app.map.getView().getZoom() < app.plugins.LayerSearch.pcfg.minimumZoomWhenIdentifying) {
					app.map.getView().setZoom(app.plugins.LayerSearch.pcfg.minimumZoomWhenIdentifying);
				}
			}
			
			// Centre on the feature
			centreOnFeature(olFeature);
			
			// Try to show the identify2popup if configured for this application
			if (app.plugins.Identify2Popup) {
				
				// Approximate click coordinate by using feature's center
				var extent = olFeature.getGeometry().getExtent();
				var centre = ol.extent.getCenter(extent);
				app.plugins.Identify2Popup.clickEventCoordinate = centre;
				
				// Show popup
				app.plugins.Identify2Popup.clear();
				app.plugins.Identify2Popup.resultsAggregator(app.plugins.LayerSearch.searchLayer, [feature]);
				app.plugins.Identify2Popup.showResult();
			
			// Or try to show the identify2tab if configured for this application
			} else if (app.plugins.Identify2Tab) {
				app.plugins.Identify2Tab.clear();
				app.plugins.Identify2Tab.resultsAggregator(app.plugins.LayerSearch.searchLayer, [feature]);
				app.plugins.Identify2Tab.showResult();
			}
		});
		
		// Sort results by distance if configured
		if (app.plugins.LayerSearch.currentGeoLocation.length == 2 && app.plugins.LayerSearch.pcfg.sortResultsByClosest === true) {
			var table = $("#ls-search-results .ls-feature-table");
			app.plugins.LayerSearch.sortTableByRowAttribute(table, "distance", "ASC")
		}
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.LayerSearch.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.LayerSearch.tabNav = tabNav;
			app.plugins.LayerSearch.tabContent = tabContent;
			
			// Add filterable layers to filter layer selector
			app.plugins.LayerSearch.addSearchableLayersToSelectControl();
			
			// Get the users location if configured
			if (app.plugins.LayerSearch.pcfg.sortResultsByClosest === true) {
				getGeoLocation(function(coords){
					app.plugins.LayerSearch.currentGeoLocation = coords;
				});
			}
			
			// Run search when ever map extent changes (if configured)
			if (app.plugins.LayerSearch.pcfg.limitSearchToMapExtent === true) {
				$(app.map).on("moveend", app.plugins.LayerSearch.search);
			}
			
			// Prevent default submit on form
			$("#ls-form").submit(function(e){
				return false;
			});
			
			// Log success
			logger("INFO", app.plugins.LayerSearch.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}