class UberSearchLayerSearchAddOn {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "UberSearchLayerSearchAddOn";
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
		// Setup variables
		var completeList = [];
		var layerIdsToSearch = [];
		var layerSearchCompletedCount = 0;
		
		// Define the callback function that will handle all of the layer search results
		var resultsAggregator = function(list) {
			// Merge result to master list
			$.merge(completeList, list);
			
			// Increment the completion count
			layerSearchCompletedCount++;

			// Return complete list if all layers have completed
			if (layerSearchCompletedCount >= layerIdsToSearch.length) {
				callback(completeList);
			}
		}
		
		// Determine which layers will be searched
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Default to not adding layer to search list
			var addLayerToSearchList = false;
			
			// Vector layers
			if (layer.get("visible") === true && layer.get("title") && layer instanceof ol.layer.Vector ) {
				if (layer.get("fields")) {
					$.each(layer.get("fields"), function(index, configField) {
						if (configField.searchable) addLayerToSearchList = true;
					});
				}
			}
			
			// WMS layers
			if (layer.get("visible") === true && layer.get("title") && typeof layer.getSource().getFeatureInfoUrl == "function") {
				if (layer.get("fields")) {
					$.each(layer.get("fields"), function(index, configField) {
						if (configField.searchable) addLayerToSearchList = true;
					});
				}
			}
			
			// Add layer to search list if it made the cut
			if (addLayerToSearchList) layerIdsToSearch.push(ol.util.getUid(layer));
		});
		
		// If no searchable layers are configured or visible, return an empty result
		if (layerIdsToSearch.length == 0) {
			callback(completeList);
			return;
		}
		
		// Iterate through each map layer
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Skip layer if it is not defined as a searchable layer	
			if (layerIdsToSearch.includes(ol.util.getUid(layer)) === false) return true;
			
			// Get the searchable fields and the fields that make up the title for this layer
			var searchableFields = [];
			var titleFields = [];
			if (layer.get("fields")) {
				$.each(layer.get("fields"), function(index, configField) {
					if (configField.searchable) {
						if (configField.searchType) {
							searchableFields.push([configField.name,configField.searchType]);
						} else {
							searchableFields.push([configField.name,"string"]);
						}
					}
					if (configField.title) {
						titleFields.push(configField.name);
					}
				});
			}

			// If no title fields were configured, then simply use the first searchable field
			if (titleFields.length == 0 && searchableFields.length > 0) {
				titleFields.push(searchableFields[0][0]);
			}
			
			// Vector layer query
			if (layer instanceof ol.layer.Vector ) {
				// Define an empty results list
				var list = [];
				
				// Define the function that searches a passed feature using the search term.  If it finds a macth, it adds it to the results list
				var searchFeatureUsingSearchTerm = function(feature) {
					// Get feature properties
					var properties = feature.getProperties();
					
					// Assume no match
					var featureHasMatch = false;
					// Loop thru each searchable field and try to find a search term match
					$.each(searchableFields, function(index, searchField) {
						if (searchField[1] == "number") { // look for exact match
							var fieldValue = (properties[searchField[0]]) ? properties[searchField[0]] : 0;
							if (fieldValue == request.term) featureHasMatch = true;
						} else { // assume string. Need to revisit if more searchTypes added
							var fieldValue = (properties[searchField[0]]) ? properties[searchField[0]].toString() : "";
							if (fieldValue.toUpperCase().indexOf(request.term.toUpperCase()) != -1) featureHasMatch = true;
						}
					});
					
					// Add feature to search results if there is a match (and max results is not exceeded)
					if (featureHasMatch && list.length < app.plugins.UberSearchLayerSearchAddOn.pcfg.maxResults) {
						// Build feature title (value)
						var value = "";
						$.each(titleFields, function(index, titleField) {
							if (value != "") value += " - ";
							value += properties[titleField];
						});
						
						// Build a feature that can be consumed by the uberSearch
						var f = {};
						f.type = "Feature";
						f.id = feature.getId();
						f.geometry_name = feature.getGeometryName();
						f.geometry = {};
						f.geometry.type = feature.getGeometry().getType();
						f.geometry.coordinates = feature.getGeometry().getCoordinates();
						f.properties = feature.getProperties();

						// Add result to the list
						list.push({
							value: value,
							category: layer.get("title"),
							data: f
						});
					}
				}
				
				// Get the features from the current layer
				var features = layer.getSource().getFeatures();
				
				// Loop thru layer features
				$.each(features, function(index, feature) {
					
					// Cluster layer
					if (feature.get("features")) {
						// Loop thru each feature within the cluster
						$.each(feature.get("features"), function(index2, clusterFeature) {
							searchFeatureUsingSearchTerm(clusterFeature);
						});
					
					// Non cluster layer
					} else {
						searchFeatureUsingSearchTerm(feature);
					}

				});
				
				// Return results
				resultsAggregator(list);
			}
			
			// WMS layer query
			if (typeof layer.getSource().getFeatureInfoUrl == "function") {
				// ImageWMS layers have a single url in their source, TileWMS have multiple
				var url = "";
				if (layer.get("source").urls) {
					url = layer.getSource().getUrls()[0];
				} else {
					url = layer.getSource().getUrl();
				}
				
				// Get layer details
				var layers;
				$.each(layer.getSource().getParams(), function(parameterName, parameterValue) {
					if (parameterName.toUpperCase() == "LAYERS") layers = parameterValue;
				});
				
				// Build the CQL filter statement
				var cqlFilter = "";
				$.each(searchableFields, function(index, searchField) {
					if (cqlFilter != "") cqlFilter += " OR ";
					if ( (searchField[1]=="number")) { // don't search numeric field with text
						if (Number.isInteger(parseInt(request.term))) {
							cqlFilter += searchField[0] + " = " + request.term;
						}
					} else { // default to string. Revisit if more data types added
						cqlFilter += searchField[0] + " ilike '%" + request.term + "%'";
					}
				});
	
				// Define the parameters
				var params = {
					service: "WFS",
					version: "2.0.0",
					request: "GetFeature",
					typeNames: layers,
					outputFormat: "json",
					count: app.plugins.UberSearchLayerSearchAddOn.pcfg.maxResults,
					srsName: app.map.getView().getProjection().getCode(),
					cql_filter: cqlFilter
				};
				$.extend(params, options);

				// Define request timeout
				var requestTimeout = (app.plugins.UberSearchLayerSearchAddOn.pcfg.requestTimeout) ? app.plugins.UberSearchLayerSearchAddOn.pcfg.requestTimeout : 5000;
								
				// Issue the request (async)
				$.ajax({
					type: "GET",
					url: url,
					timeout: requestTimeout,
					xhrFields: {
						withCredentials: layer.get("withCredentials")
					},
					data: params
				})
				
				// Handle the response
				.done(function(data) {
					// Define an empty results list
					var list = [];
					
					// Process results if any
					if(data.features && data.features.length > 0) {
						
						// Map results
						list = data.features.map(function(item) {
							
							// Build the title (value)
							var value = "";
							$.each(titleFields, function(index, titleField) {
								if (value != "") value += " - ";
								value += item.properties[titleField];
							});

							// Map
							return {
								value: value,
								category: layer.get("title"),
								data: item
							}
						});
					}

					// Send to aggregator
					resultsAggregator(list);
				})
				
				// Handle a failure
				.fail(function(jqxhr, settings, exception) {
					resultsAggregator([]);
				}); 
			}
		});
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