class DynamicRouter {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "DynamicRouter";
		this.version = 2.0;
		this.author = "MoTT Spatial Team";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Router";
		this.tabContentFile = "application/plugins/DynamicRouter/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.points = [];
		this.summaryStatistics = {};
		this.route;
		this.waitingForMapClick = false;

		// Define route point styles
		this.pointStyles = {
			start: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(35, 119, 16, 1)",
						width: 2
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)"
					})
				})
			}),
			waypoint: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(0, 0, 255, 1)",
						width: 2
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)"
					})
				})
			}),
			end: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(255, 0, 0, 1)",
						width: 2
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)"
					})
				})
			})
		}

		// Define and add the route points layer
		var source = new ol.source.Vector({});
		this.routePointsLayer = new ol.layer.Vector({
			source: source,
			style: this.getPointStyle
		});
		this.routePointsLayer.setZIndex(607);
		app.map.addLayer(this.routePointsLayer);

		// Make route points draggable
		var modify = new ol.interaction.Modify({
			source: source,
			deleteCondition: function () { return false },
			insertVertexCondition: function () { return false },
		}); 
		modify.on("modifyend",function(evt) {
			// For each point modified (should only be 1), update it's corresponding input
			$.each(evt.features.getArray(), function(index, feature) {
				var feature4326 = transformFeature(feature, app.map.getView().getProjection(), "EPSG:4326")
				var centreLL = getFeatureCentre(feature4326);
				var inputId = feature.get("routePointId");
				$("#"+inputId).val(formatCoordinateAsString(centreLL, 4326));
				$("#"+inputId).attr("longitude", centreLL[0]);
				$("#"+inputId).attr("latitude", centreLL[1]);
			});
			app.plugins.DynamicRouter.findRoute();
		});
		app.map.addInteraction(modify);
		
		// Define and add the route path points hover layer
		this.routePathPointHoverLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 4,
					stroke: new ol.style.Stroke({
						color: "rgba(128, 128, 128, 0.7)",
						width: 2
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 0.7)"
					})
				})
			})
		});
		this.routePathPointHoverLayer.setZIndex(606);
		app.map.addLayer(this.routePathPointHoverLayer);
				
		// Define and add the route path layer
		this.routePathLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: [
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(43, 115, 218, 1)",
						width: 7
					})
				}),
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(102, 157, 246, 1)",
						width: 2
					})
				})
			]
		});
		this.routePathLayer.setZIndex(605);
		app.map.addLayer(this.routePathLayer);
		
		// Allow the creation of new route points when an existing route path is clicked on (if configured)
		if (this.pcfg.allowWayPoints) {
			app.map.on("pointerdown", function(e) {
				if (app.plugins.DynamicRouter.waitingForMapClick === false) {
					var pixel = app.map.getEventPixel(e.originalEvent);
					var isFirstFeature = true;
					app.map.forEachFeatureAtPixel(pixel, function(feature, layer) {								
						if (isFirstFeature && feature.get("routePath")) {
							var clickCoordinateMap = e.coordinate;
							var clickCoordinate4326 = ol.proj.transform(clickCoordinateMap, app.map.getView().getProjection(), "EPSG:4326");			
							app.plugins.DynamicRouter.addRoutePoint(clickCoordinate4326);
						}
						if (!feature.get("routePathHoverPoint")) isFirstFeature = false;
					});
				}
			});
		}
		
		// Highlight various elements as the mouse is moved
		app.map.on("pointermove", function(e) {
			// Clear any highlighting
			$(".dr-location-input").css("background-color", "transparent");
			app.plugins.DynamicRouter.routePathPointHoverLayer.getSource().clear();
			
			// Find features currently at the mouse pointer
			var pixel = app.map.getEventPixel(e.originalEvent);
			app.map.forEachFeatureAtPixel(pixel, function(feature, layer) {
				// Highlight route points
				if (feature.get("routePoint")) {
					var locationInputId = feature.get("routePointId");
					$("#"+locationInputId).css("background-color", "rgba(255,255,0,0.4)");
				}
				
				// Show a point snapped to the route path (ux feature that shows user that route can be dragged)
				if (feature.get("routePath")) {
					// Define GeoJSON formatter
					var gjFormat = new ol.format.GeoJSON();
					
					// Convert the OpenLayers route path into GeoJSON 4326
					var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.DynamicRouter.routePathLayer.getSource().getFeatures(), { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
					
					// Snap the current mouse location to the path
					var routePathPointFeature = new ol.Feature({geometry: new ol.geom.Point(e.coordinate)});
					var routePathPointFeature4326 = transformFeature(routePathPointFeature, app.map.getView().getProjection(), "EPSG:4326");
					var routePathPointGeoJSON = turf.point(routePathPointFeature4326.getGeometry().getCoordinates());
					var routePathPointSnappedGeoJSON = turf.nearestPointOnLine(routePathGeoJSON, routePathPointGeoJSON, {units: "kilometers"});

					// Transform that snapped location to the map projection and show it
					var routePathPointFeatures = gjFormat.readFeatures(routePathPointSnappedGeoJSON, { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
					var firstRoutePathPointFeature = routePathPointFeatures[0]; // should only be 1
					firstRoutePathPointFeature.set("routePathHoverPoint", true);
					app.plugins.DynamicRouter.routePathPointHoverLayer.getSource().addFeature(firstRoutePathPointFeature);
				}
			});
		});

		// Add the plugin
		this.addPlugin();
	}
	
	/**
	 * Function: getPointStyle
	 * @param (object) feature
	 * @returns (object) style
	 * Function that returns a style based on the passed feature's point type.
	 */
	getPointStyle(feature) {
		return app.plugins.DynamicRouter.pointStyles[feature.get("pointStyle")];
	};
	
	/**
	 * Function: addRoutePoint
	 * @param (array) coordinate (optional) - should be in 4326
	 * @returns () nothing
	 * Function that adds a route point
	 */
	addRoutePoint(coordinate) {
		// Optional params
		coordinate = coordinate || null;
		
		// Define some defaults
		var elementToAddNewRoutePointAfter = null;
		
		// Get the route point template, clone it, and add/remove classes/ids
		var clone = $(".dr-route-point-template").clone(true);
		var uniqueId = Date.now();
		clone.attr("id", "dr-route-point-" + uniqueId);
		clone.find(".dr-location-input").attr("id", "dr-route-point-input-" + uniqueId);
		clone.removeClass("dr-route-point-template");
		
		// If a coordinate was passed, then register that coordinate with the route point input
		if (coordinate) {
			clone.find(".dr-location-input").val(formatCoordinateAsString(coordinate, 4326));
			clone.find(".dr-location-input").attr("longitude", coordinate[0]);
			clone.find(".dr-location-input").attr("latitude", coordinate[1]);
		}
		
		// If a route path exists and a coordinate was passed, try to figure out where the route point input should be placed in the ordered list
		if (app.plugins.DynamicRouter.routePathLayer.getSource().getFeatures().length == 1 && coordinate) {
			
			// Define GeoJSON formatter
			var gjFormat = new ol.format.GeoJSON();
			
			// Convert the OpenLayers route path into GeoJSON 4326
			var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.DynamicRouter.routePathLayer.getSource().getFeatures(), { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
			
			// Find the distance along the route path (offset) where the new route point is closest to
			var newRoutePoint = turf.point(coordinate);
			var newRoutePointSnapped = turf.nearestPointOnLine(routePathGeoJSON, newRoutePoint, {units: "kilometers"});
			var newRoutePointOffset = newRoutePointSnapped.properties.location;
			
			// Loop through the existing router point inputs to find where to place the new route point
			$("#simple-router-form").find(".dr-location-input").each(function(index) {
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					var routePoint = turf.point([$(this).attr("longitude"), $(this).attr("latitude")]);
					var routePointSnapped = turf.nearestPointOnLine(routePathGeoJSON, routePoint, {units: "kilometers"});
					var routePointOffset = routePointSnapped.properties.location;
					if (newRoutePointOffset > routePointOffset) elementToAddNewRoutePointAfter = $(this).parent();
				}
			});			
		}
		
		// Add the route point input to the appropriate position and show it
		if (elementToAddNewRoutePointAfter == null) {
			$("#dr-route-points").append(clone);
		} else {
			elementToAddNewRoutePointAfter.after(clone);
		}
		clone.show();
		
		// Add location event handlers to the route point input
		app.plugins.DynamicRouter.addLocationInputEventHandlers("dr-route-point-" + uniqueId);
		
		// If a coordinate was passed, update the route points
		if (coordinate) app.plugins.DynamicRouter.updateRoutePointsOnMap();
	}
	
	/**
	 * Function: removeRoutePoint
	 * @param (object) route point element
	 * @returns () nothing
	 * Function that removes a route point input element.  Clears is if there are only 2 remaining.
	 */
	removeRoutePoint(rpElement) {
		if ($("#dr-route-points").find(".dr-route-point").length > 2) {
			rpElement.remove();
		} else {
			rpElement.find(".dr-location-input").val("");
			rpElement.find(".dr-location-input").attr("longitude", null);
			rpElement.find(".dr-location-input").attr("latitude", null);
		}
		app.plugins.DynamicRouter.findRoute();
	}

	/**
	 * Function: search
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search (may use several providers)
	 */
	search(request, callback, options) {
		// Setup variables
		var completeResultsList = [];
		var providersToSearchCount = 0;
		var providerSearchCompletedCount = 0;
		
		// Define the callback function that will handle all of the search results
		var overallResultsAggregator = function(list) {
			// Merge result to master list
			$.merge(completeResultsList, list);
			
			// Increment the completion count
			providerSearchCompletedCount++;

			// Return complete list if all providers have completed
			if (providerSearchCompletedCount >= providersToSearchCount) {
				callback(completeResultsList);
			}
		}
		
		// Search for a "coordinate pattern" within user input
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
		var location = convertStringToCoordinate(request.term, outputSRS);
		if (location.hasOwnProperty("category")) {
			overallResultsAggregator([{
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
			overallResultsAggregator([]);
		}
		
		// Search BC GeoCoder if configured
		if (app.plugins.DynamicRouter.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.DynamicRouter.searchBcGeoCoder(request, overallResultsAggregator, options);
		}
		
		// Search visible (and configured) layers if configured
		if (app.plugins.DynamicRouter.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.DynamicRouter.searchLayers(request, overallResultsAggregator, options);
		}
		
	}
	
	/**
	 * Function: searchBcGeoCoder
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search agains the BC geoCoder
	 */
	searchBcGeoCoder(request, callback, options) {
		// Get the map's projection 
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
		
		// Define the parameters
		var params = {
			minScore: 50,
			maxResults: app.plugins.DynamicRouter.pcfg.geoCoderMaxResults,
			echo: 'false',
			brief: true,
			autoComplete: true,
			locationDescriptor: "accessPoint", // forces geocoder to snap to road (or with 3 meters)																			   
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.DynamicRouter.pcfg.geoCoderApiKey
		};
		$.extend(params, options);
		
		// Query the DataBC GeoCoder
		$.ajax({
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			data: params
		})
		
		// Handle a successful result
		.done(function(data) {
			var list = [];
			if(data.features && data.features.length > 0) {
				list = data.features.map(function(item) {
					return {
						value: item.properties.fullAddress,
						category: "BC Places",
						data: item
					}
				});
			}
			callback(list);
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			callback([]);
		}); 
	}
	
	/**
	 * Function: searchLayers
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search on layers
	 */
	searchLayers(request, callback, options) {
		// Setup variables
		var completeLayerResultsList = [];
		var layersToSearchCount = 0;
		var layerSearchCompletedCount = 0;
		var layerIDsToSearch = [];
		
		// Define the callback function that will handle all of the layer search results
		var layerResultsAggregator = function(list) {
			// Merge result to master list
			$.merge(completeLayerResultsList, list);
			
			// Increment the completion count
			layerSearchCompletedCount++;

			// Return complete list if all layers have completed
			if (layerSearchCompletedCount >= layersToSearchCount) {
				callback(completeLayerResultsList);
			}
		}
		
		// Determine how many layers will be searched
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Default is to assume layer type is not searchable
			var layerTypeIsSearchable = false;
			
			// Vector layers
			if (layer.get("visible") === true && layer.get("title") && layer instanceof ol.layer.Vector) {
				layerTypeIsSearchable = true;
			}
			
			// WMS layers
			if (layer.get("visible") === true && layer.get("title") && typeof layer.getSource().getFeatureInfoUrl == "function") {
				layerTypeIsSearchable = true;
			}
			
			// If layer type is searchable, see if it's visible and configured
			if (layerTypeIsSearchable) {
				var layerIsSearchable = false;
				if (layer.get("visible")) {
					if (layer.get("fields")) {
						$.each(layer.get("fields"), function(index, configField) {
							if (configField.searchable) {
								layerIsSearchable = true;
								layerIDsToSearch.push(layer.ol_uid);
							}
						});
					}
				}
				if (layerIsSearchable) layersToSearchCount++;
			}
		});
		
		// If no searchable layers are configured or visible, return an empty result
		if (layerSearchCompletedCount >= layersToSearchCount) {
			callback(completeLayerResultsList);
		}

		// Iterate through each map layer
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Skip current layer if its not in layerIDsToSearch array
			if (!layerIDsToSearch.includes(layer.ol_uid)) return true;
			
			// Get the searchable fields and the fields that make up the title for this layer
			var searchableFields = [];
			var titleFields = [];
			if (layer.get("fields")) {
				$.each(layer.get("fields"), function(index, configField) {
					if (configField.searchable) {
						searchableFields.push(configField.name);
					}
					if (configField.title) {
						titleFields.push(configField.name);
					}
				});
			}			
			
			// Skip current layer if no searchable fields exist
			if (searchableFields.length == 0) return true;
			
			// Vector :: Perform a GetFeature
			if (layer instanceof ol.layer.Vector) {
				// Get all of the layers features
				var features = layer.getSource().getFeatures();
				
				// Loop through the features and searchable fields to find matches
				var matchedFeatures = [];
				$.each(features, function(index, feature) {
					if (matchedFeatures.length < app.plugins.DynamicRouter.pcfg.visibleLayerSearchMaxResults) {
						var properties = feature.getProperties();
						$.each(searchableFields, function(index, searchableField) {
							var searchableFieldValue = properties[searchableField];
							if (searchableFieldValue) {
								if (searchableFieldValue.toLowerCase().indexOf(request.term.toLowerCase()) != -1) {
									matchedFeatures.push(feature);
								}
							}
						});
					}
				});

				// Define an empty list
				var list = [];
					
				// Process results if any
				if(matchedFeatures.length > 0) {
					
					// Map results
					list = matchedFeatures.map(function(feature) {
						
						// Build the title (value)
						var value = "";
						$.each(titleFields, function(index, titleField) {
							if (value != "") value += " - ";
							value += feature.getProperties()[titleField];
						});
						
						// Build the data object (format similar to what GetFeatureInfo returns)
						var data = {};
						data.type = "Feature";
						data.id = feature.getId();
						data.geometry_name = feature.getGeometryName();
						data.geometry = {};
						data.geometry.type = feature.getGeometry().getType();
						data.geometry.coordinates = feature.getGeometry().getCoordinates();
						data.properties = feature.getProperties();
						
						// Map
						return {
							value: value,
							category: layer.get("title"),
							data: data
						}
					});
				}

				// Sort the list based on value
				list.sort(function(a, b){
					var a1 = a.value, b1 = b.value;
					if(a1 == b1) return 0;
					return a1 > b1 ? 1 : -1;
				});

				// Send to aggregator
				layerResultsAggregator(list);
			}
			
			// WMS :: Perform a GetFeatureInfo
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
					cqlFilter += searchField + " ilike '%" + request.term + "%'";
				});
	
				// Define the parameters
				var params = {
					service: "WFS",
					version: "2.0.0",
					request: "GetFeature",
					typeNames: layers,
					outputFormat: "json",
					count: app.plugins.DynamicRouter.pcfg.visibleLayerSearchMaxResults,
					srsName: app.map.getView().getProjection().getCode(),
					cql_filter: cqlFilter
				};
				$.extend(params, options);
								
				// Issue the request (async)
				$.ajax({
					type: "GET",
					url: url,
					timeout: 5000,
					data: params
				})
				
				// Handle the response
				.done(function(data) {
					// Define an empty list
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
					layerResultsAggregator(list);
				})
				
				// Handle a failure
				.fail(function(jqxhr, settings, exception) {
					layerResultsAggregator([]);
				}); 
			}
			
		});
	}
	
	/**
	 * Function: registerMapClickLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that gets and registers where the user clicked on the map
	 */
	registerMapClickLocation(target) {
		// Define function that handles the get map click location
		var mapClickFunction = function(e){
			// Get the click coordinate in EPSG:4326
			var centreLL = ol.proj.transform(e.coordinate, app.map.getView().getProjection(), "EPSG:4326");

			// Toggle function as inactive
			app.plugins.DynamicRouter.waitingForMapClick = false;
			
			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();
			
			// Set the input's lon/lat attributes (and display value)
			target.val(formatCoordinateAsString(centreLL, 4326));
			target.attr("longitude", centreLL[0]);
			target.attr("latitude", centreLL[1]);
			
			// If mobile and there is no valid route, show sidebar
			if (isMobile()) {
				if (app.plugins.DynamicRouter.routePathLayer.getSource().getFeatures().length == 0) showSidebar();
			}
			
			// Find Route
			app.plugins.DynamicRouter.findRoute();
		}
		
		// Toggle function as active
		app.plugins.DynamicRouter.waitingForMapClick = true;
		
		// Redirect the map's single click function to this mapClickFunction (temporary)
		redirectMapSingleClickFunction("crosshair", mapClickFunction);
		
		// If mobile, hide sidebar
		if (isMobile()) hideSidebar();
	}
	
	/**
	 * Function: registerDeviceLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that gets and registers the user's device location
	 */
	registerDeviceLocation(target) {
		// Get current location if possible
		if (navigator.geolocation) {
			var options = {
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0
			};
			var geoLocationSuccess = function(position) {
				// Set the input's lon/lat attributes (and display value) based on geolocation
				target.val(formatCoordinateAsString([position.coords.longitude,position.coords.latitude], 4326));
				target.attr("longitude", position.coords.longitude);
				target.attr("latitude", position.coords.latitude);
				
				// Find Route
				app.plugins.DynamicRouter.findRoute();
			}
			var geoLocationError = function(error) {
				// Display error/suggestion
				var errorNotice = bootbox.dialog({
					title: "Error",
					message: "<p class='text-center'>Cannot determine your current location.<br><br>Please turn on location services.<br></p>",
					closeButton: true,
					centerVertical: true
				});
			}
			navigator.geolocation.getCurrentPosition(geoLocationSuccess, geoLocationError, options);
		}
	}
	
	/**
	 * Function: registerSearchSelectionLocation
	 * @param (object) target
	 * @param (object) selection
	 * @returns () nothing
	 * Function that registers the user's search selection
	 */
	registerSearchSelectionLocation(target, selection) {
		// Transform the selection into a feature and get it's centre in Lon/Lat
		var olFeature = convertToOpenLayersFeature("GeoJSON", selection.data);
		var olFeature4326 = transformFeature(olFeature, "EPSG:3857", "EPSG:4326")
		var centreLL = getFeatureCentre(olFeature4326);
			
		// Set the input's lon/lat attributes based on user selection
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);
		
		// Find Route
		app.plugins.DynamicRouter.findRoute();
	}
	
	/**
	 * Function: registerFeatureLocation
	 * @param (object) target
	 * @param (object) feature
	 * @returns () nothing
	 * Function that gets and registers a features location
	 */
	registerFeatureLocation(target, feature) {
		// Get the feature's centre in Lon/Lat
		var feature4326 = transformFeature(feature, "EPSG:3857", "EPSG:4326")
		var centreLL = getFeatureCentre(feature4326);

		// Set the input's lon/lat attributes based on user selection
		target.val(formatCoordinateAsString(centreLL, 4326));
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);
		
		// Find Route
		app.plugins.DynamicRouter.findRoute();
	}
	
	/**
	 * Function: updateRoutePointsOnMap
	 * @param () none
	 * @returns () nothing
	 * Function that shows valid route points on the map
	 */
	updateRoutePointsOnMap() {
		// Clear existing route points
		app.plugins.DynamicRouter.routePointsLayer.getSource().clear();
				
		// Determine what the index is of the first and last valid route points
		var firstRoutePointIndex;
		var lastRoutePointIndex;
		$("#simple-router-form").find(".dr-location-input").each(function(routePointIndex, inputElement) {
			if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
				if (firstRoutePointIndex == null) firstRoutePointIndex = routePointIndex;
				lastRoutePointIndex = routePointIndex;
			}
		});
		
		// Add the valid route points to the route points layer
		$("#simple-router-form").find(".dr-location-input").each(function(routePointIndex, inputElement) {
			
			// Remove the color from the map marker
			$(inputElement).parent().find(".oi-map-marker").removeClass("text-success text-primary text-danger");
			
			// Only process valid route points
			if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
				// Build a feature from the route point
				var pointGeometry = new ol.geom.Point([$(this).attr("longitude"), $(this).attr("latitude")]);
				var pointGeometryInMapProjection = pointGeometry.transform("EPSG:4326", app.map.getView().getProjection());
				var pointFeature = new ol.Feature({geometry: pointGeometryInMapProjection});
				
				// Determine which point style to apply
				switch (routePointIndex) {
					case firstRoutePointIndex:
						pointFeature.set("pointStyle", "start");
						$(inputElement).parent().find(".oi-map-marker").addClass("text-success");
						break;
					case lastRoutePointIndex:
						pointFeature.set("pointStyle", "end");
						$(inputElement).parent().find(".oi-map-marker").addClass("text-danger");
						break;
					default:
						pointFeature.set("pointStyle", "waypoint");
						$(inputElement).parent().find(".oi-map-marker").addClass("text-primary");
				}

				// Set a few point properties (for use in misc functions)
				pointFeature.set("routePoint", true);
				pointFeature.set("routePointId", $(this).attr("id"));
				
				// Add the styled feature to the points layer
				app.plugins.DynamicRouter.routePointsLayer.getSource().addFeature(pointFeature);
			}
		});	
	}
	
	/**
	 * Function: findRoute
	 * @param () none
	 * @returns () nothing
	 * Function that attempts to find a route and display it on the map
	 */
	findRoute() {
		// Clear existing route path
		app.plugins.DynamicRouter.routePathLayer.getSource().clear();
		
		// Hide messages
		$("#dr-message").hide();
		
		// Clear summary
		app.plugins.DynamicRouter.summaryStatistics = {};
		app.plugins.DynamicRouter.updateSummary();
		
		// Show the route points on the map
		app.plugins.DynamicRouter.updateRoutePointsOnMap();
		
		// Determine if reverse route button should be enabled
		if (app.plugins.DynamicRouter.routePointsLayer.getSource().getFeatures().length > 1) {
			$("#dr-reverse-route-btn").prop("disabled", false);
		} else {
			$("#dr-reverse-route-btn").prop("disabled", true);
		}

		// Get the route points as a 2d array
		var points = [];
		$.each(app.plugins.DynamicRouter.routePointsLayer.getSource().getFeatures(), function(index, feature) {
			var feature4326 = transformFeature(feature, app.map.getView().getProjection(), "EPSG:4326");
			points.push(feature4326.getGeometry().getCoordinates());
		});
		// Bail if there are not enough points
		if (points.length < 2) return;
		
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.DynamicRouter.tabContent)[0]);
			
		// Convert points array into string usable by the router-form
		var pointString = "";
		$.each(points, function(index, point) {
			if (pointString != "") pointString += ",";
			pointString += point[0] + "," + point[1];
		});
		
		// Define the parameters
		var params = {
			points: pointString,
			criteria: "fastest",
			roundTrip: false,
			correctSide: false,
			apikey: app.plugins.DynamicRouter.pcfg.routerApiKey
		};
		
		// Query the DataBC Router
		$.ajax({
			url: "https://router.api.gov.bc.ca/directions.json", 
			//url: "https://router.api.gov.bc.ca/optimalDirections.json", // Does not work properly
			//url: "https://router.api.gov.bc.ca/truck/optimalDirections.json", // Optimized for commercial vehicles
			data: params,
			timeout: 7500
		})
		
		// Handle a successful result
		.done(function(data) {
			// Stop the tab spinner
			spinner.stop();
			
			// Bail if a route was not found
			if (!data.routeFound) {
				$("#dr-message").html("A route could not be found");
				$("#dr-message").show();
				return;
			}
			
			// Get, transform, and display route geometry on map
			var routeGeometry = new ol.geom.LineString(data.route);
			var routeGeometryInMapProjection = routeGeometry.transform("EPSG:"+data.srsCode, app.map.getView().getProjection());
			var routeFeature = new ol.Feature({geometry: routeGeometryInMapProjection});
			routeFeature.set("routePath", true);
			app.plugins.DynamicRouter.routePathLayer.getSource().addFeature(routeFeature);
			
			//Add routeFeature to global variable
			app.plugins.DynamicRouter.route = routeFeature;

			// Zoom to the route (only if 2 points were defined)
			if (points.length == 2) zoomToFeature(routeFeature);
			
			// Update summary
			app.plugins.DynamicRouter.summaryStatistics.travelDirections = data.directions;
			app.plugins.DynamicRouter.summaryStatistics.routeDistance = data.distance.toFixed() + " " + data.distanceUnit;
			app.plugins.DynamicRouter.updateSummary();

		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			spinner.stop();
			$("#dr-message").html("A route could not be found");
			$("#dr-message").show();
			logger("ERROR", app.plugins.DynamicRouter.name + ": Router Error");
		}); 
	}
	
	/**
	 * Function: addLocationInputEventHandlers
	 * @param (string) parentId
	 * @returns () nothing
	 * Function that adds misc event handlers to specified location input
	 */
	addLocationInputEventHandlers(parentId) {
		// Register the get location from map buttons
		$("#" + parentId + " .dr-get-location-from-map-btn").click(function(){ 
			var associatedInput = $(this).parent().find(".dr-location-input");
			app.plugins.DynamicRouter.registerMapClickLocation(associatedInput);
		});
		
		// Register the category autocompletes
		$("#" + parentId + " .dr-location-input").catcomplete({
			minLength: 3,
			source: this.search,
			autoFocus: true,
			select: function(event, selection) {
				app.plugins.DynamicRouter.registerSearchSelectionLocation($(this), selection.item);
			}
		});
		
		// Register the geolocator buttons
		$("#" + parentId + " .dr-get-geolocation-btn").click(function(){ 
			var associatedInput = $(this).parent().find(".dr-location-input");
			app.plugins.DynamicRouter.registerDeviceLocation(associatedInput);
		});

		// Register the delete route point button
		$("#" + parentId + " .dr-delete-route-point-btn").click(function(){ 
			app.plugins.DynamicRouter.removeRoutePoint($(this).parent());
		});
	}
		
	/**
	 * Function: reverseRoute
	 * @param () none
	 * @returns () nothing
	 * Function that reverse the route (if possible)
	 */
	reverseRoute() {
		// Define the array that will house the route point data
		var routePointData = [];
		
		// Loop through the existing location inputs (route points)
		$("#simple-router-form").find('.dr-location-input').each(function(index) {
			
			// Process location input if coords are valid
			if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
				
				// Create a location input object and populate it
				var inputLocation = new Object();
				inputLocation.longitude = $(this).attr("longitude");
				inputLocation.latitude = $(this).attr("latitude");
				inputLocation.text = $(this).val();
				
				// Add the location input object to the route point array
				routePointData.push(inputLocation);
				
			// Remove any route points that have invalid coordinates
			} else {
				if ($(this).parent().hasClass("dr-route-point")) $(this).parent().remove();
			}
		});
		
		// Reverse the route point data array
		var routePointDataReversed = routePointData.reverse();
		
		// Loop through the existing location inputs (route points) and add the reverse route point data
		$("#simple-router-form").find('.dr-location-input').each(function(index) {
			
			// Get the corresponding route point object
			var inputLocation = routePointDataReversed[index];
			
			// Set the input location attributes
			$(this).attr("longitude", inputLocation.longitude);
			$(this).attr("latitude", inputLocation.latitude);
			$(this).val(inputLocation.text);
			
		});

		// Re-run the Route
		app.plugins.DynamicRouter.findRoute();
	}
	
	/**
	 * Function: updateSummary
	 * @param () none
	 * @returns () nothing
	 * Function that shows/hides the route summary
	 */
	updateSummary() {
		// Defaults
		var showSummary = false;
		
		// Show route distance
		if (this.summaryStatistics.hasOwnProperty("routeDistance")) {
			$("#dr-directions-title").html("Travel Directions (" + this.summaryStatistics.routeDistance + ")<span class='oi oi-chevron-bottom'>");
			showSummary = true;
		} else {
			$("#dr-directions-title").html("Travel Directions<span class='oi oi-chevron-bottom'>");
		}
		
		// Show travel directions
		$("#dr-directions").html("");
		if (this.summaryStatistics.hasOwnProperty("travelDirections")) {
			// Build the directions table
			var directionsTable = $("<table class='table table-sm dr-directions-table'><tbody></tbody></table>");

			// Loop thru each direction leg
			$.each(this.summaryStatistics.travelDirections, function(index, leg) {
				if(leg.type != "STOPOVER"){ //Remove Stopovers from travelDirection
					// Determine which icon to use
					var navIcon;
					switch(leg.type) {
						case "START":
						case "FINISH":
							navIcon = "application/plugins/DynamicRouter/img/navigation-start-end.png";
							break;
						case "CONTINUE":
							navIcon = "application/plugins/DynamicRouter/img/navigation-continue.png";
							break;
						case "TURN_LEFT":
						case "TURN_SHARP_LEFT":
							navIcon = "application/plugins/DynamicRouter/img/navigation-turn-left.png";
							break;
						case "TURN_RIGHT":
						case "TURN_SHARP_RIGHT":
							navIcon = "application/plugins/DynamicRouter/img/navigation-turn-right.png";
							break;
						case "TURN_SLIGHT_LEFT":
							navIcon = "application/plugins/DynamicRouter/img/navigation-turn-slight-left.png";
							break;
						case "TURN_SLIGHT_RIGHT":
							navIcon = "application/plugins/DynamicRouter/img/navigation-turn-slight-right.png";
							break;
						case "FERRY":
							navIcon = "application/plugins/DynamicRouter/img/navigation-ferry.png";
							break;
						default:
							navIcon = "application/plugins/DynamicRouter/img/navigation-unknown.png";
					}
					
					// Get and cleanup the direct leg text
					var directionText = leg.text;
					var deletePos = directionText.indexOf(" for "); 
					if (deletePos != -1) directionText = directionText.substring(0, deletePos);
					
					// Build the direction leg (append the leg as data)
					var direction = $(`<tr><td><img src="${navIcon}"></td><td>${directionText}</td></tr>`).data(leg);
					
					// Add the event handlers
					direction.hover(
						function(){
							var directionPoint4326 = $(this).data().point;
							var directionGeometry = new ol.geom.Point(directionPoint4326);
							var directionGeometryInMapProjection = directionGeometry.transform("EPSG:4326", app.map.getView().getProjection());
							var directionFeature = new ol.Feature({geometry: directionGeometryInMapProjection});
							highlightFeature(directionFeature);
						},
						clearHighlightedFeatures
					);
					direction.click(function(){
						var directionPoint4326 = $(this).data().point;
						var directionGeometry = new ol.geom.Point(directionPoint4326);
						var directionGeometryInMapProjection = directionGeometry.transform("EPSG:4326", app.map.getView().getProjection());
						var directionFeature = new ol.Feature({geometry: directionGeometryInMapProjection});
						zoomToFeature(directionFeature);
						highlightFeature(directionFeature);
					});
					
					// Append leg to overall directions
					directionsTable.append(direction);
				}
			});
			
			// Add the directions table to the direction dropdown
			$("#dr-directions").append(directionsTable);
			showSummary = true;
		}
		
		// Show/hide summary
		if (showSummary) {
			$("#dr-summary").show();
		} else {
			$("#dr-summary").hide();
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
				logger("ERROR", app.plugins.DynamicRouter.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.DynamicRouter.tabNav = tabNav;
			app.plugins.DynamicRouter.tabContent = tabContent;
			
			// Allow adding of route points if so configured
			if (app.plugins.DynamicRouter.pcfg.allowWayPoints) {
				$("#dr-route-point-add-div").show();
				$("#dr-route-point-add-instructions").show();
				$("#simple-router-form #dr-route-point-add-btn").click(function(){ 
					app.plugins.DynamicRouter.addRoutePoint();
				});
			}
			
			// Add 2 route point inputs to start with
			app.plugins.DynamicRouter.addRoutePoint();
			app.plugins.DynamicRouter.addRoutePoint();
			
			// Register Reverse Route button
			$("#dr-reverse-route-btn").click(function(){ 
				app.plugins.DynamicRouter.reverseRoute();
			});

			// Make the route points sortable (so user can change the order)
			$("#dr-route-points").sortable({
				update: function (event, ui) {
					app.plugins.DynamicRouter.findRoute();
				}
			});
			
			// Register Navigate Route button
			$("#dr-navigate-route-btn").click(function(){ 
				app.plugins.DynamicRouter.navigateRoute();
			});


			// Register send to select tool button
			$("#dr-add-route-to-select-btn").click(function(){ 
				var routePoints = $("#dr-route-points .dr-route-point");
				var route = app.plugins.DynamicRouter.route;
				var routeID = app.plugins.DynamicRouter.route.ol_uid;
				var startLocation = routePoints.first().find(".dr-location-input").val();
				var endLocation = routePoints.last().find(".dr-location-input").val();
				var routeButton = $(`
					<div class="st-route-item" id="st-route-${routeID}">
						
						<div class="st-route-locations">
							<div><strong>Start:</strong> <span class="st-route-start">${startLocation}</span></div>
							<div><strong>End:</strong> <span class="st-route-end">${endLocation}</span></div>
						</div>
						

						<!-- Remove Button -->
						<button type="button" class="btn btn-sm btn-danger st-remove-route-btn" data-route-id="${routeID}">
							<span class="oi oi-x"></span>
						</button>
					</div>
				`);
				app.plugins.SelectTool.routePathLayer.getSource().addFeature(route);

				// Clear existing route path
				app.plugins.DynamicRouter.routePathLayer.getSource().clear();
		
				// Hide messages
				$("#dr-message").hide();
		
				// Clear summary
				app.plugins.DynamicRouter.summaryStatistics = {};
				app.plugins.DynamicRouter.updateSummary();


				//For select tool functionality, add the route to the select tool
				route.set('routeID', "st-route-"+route.ol_uid);
				//Append the route data to the div
				routeButton.data("routeObject", route);

				//Add route id to route
				$("#st-route-container").append(routeButton);

				// Activate the Select Tool tab
				activateSidebarTab(app.plugins.SelectTool.tabNav);
				setTimeout(() => {
					const $routeTab = $("#st-router-tab");
					if ($routeTab.length) {
						// Scroll the tab into view if needed
						$routeTab[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
						// Click the tab
						$routeTab.click();
					}
				}, 500);
				
			});

			const source = app.plugins.DynamicRouter.routePathLayer.getSource();
			//Add watcher to routePathLayer, if added route, show select tool, else hide
			if (source) {
			// When a feature is added
			source.on('addfeature', function (event) {
				if (app.plugins.SelectTool) {
					$(".dr-route-select-container").show();		
					}
			});

			// When a feature is removed
			source.on('removefeature', function (event) {
				if (app.plugins.SelectTool) {
					$(".dr-route-select-container").hide();		
					}
			});
			}


			// Log success
			logger("INFO", app.plugins.DynamicRouter.name + ": Plugin successfully loaded");
		}
			
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}