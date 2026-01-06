class RestrictionFinder {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "RestrictionFinder";
		this.version = 2.0;
		this.author = "MoTT Spatial Team";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Restrictions On Route";
		this.tabContentFile = "application/plugins/RestrictionFinder/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.defaultWidth = 2.6;
		this.defaultHeight = 4.15;
		this.points = [];
		this.summaryStatistics = {};
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
			app.plugins.RestrictionFinder.findRoute();
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
						color: "rgba(43, 115, 218, 0.5)",
						width: 7
					})
				}),
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(102, 157, 246, 0.5)",
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
				if (app.plugins.RestrictionFinder.waitingForMapClick === false) {
					var pixel = app.map.getEventPixel(e.originalEvent);
					var isFirstFeature = true;
					app.map.forEachFeatureAtPixel(pixel, function(feature, layer) {								
						if (isFirstFeature && feature.get("routePath")) {
							var clickCoordinateMap = e.coordinate;
							var clickCoordinate4326 = ol.proj.transform(clickCoordinateMap, app.map.getView().getProjection(), "EPSG:4326");			
							app.plugins.RestrictionFinder.addRoutePoint(clickCoordinate4326);
						}
						if (!feature.get("routePathHoverPoint")) isFirstFeature = false;
					});
				}
			});
		}
		
		// Highlight various elements as the mouse is moved
		app.map.on("pointermove", function(e) {
			// Clear any highlighting
			$(".rf-location-input").css("background-color", "transparent");
			app.plugins.RestrictionFinder.routePathPointHoverLayer.getSource().clear();
			
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
					var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures(), { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
					
					// Snap the current mouse location to the path
					var routePathPointFeature = new ol.Feature({geometry: new ol.geom.Point(e.coordinate)});
					var routePathPointFeature4326 = transformFeature(routePathPointFeature, app.map.getView().getProjection(), "EPSG:4326");
					var routePathPointGeoJSON = turf.point(routePathPointFeature4326.getGeometry().getCoordinates());
					var routePathPointSnappedGeoJSON = turf.nearestPointOnLine(routePathGeoJSON, routePathPointGeoJSON, {units: "kilometers"});

					// Transform that snapped location to the map projection and show it
					var routePathPointFeatures = gjFormat.readFeatures(routePathPointSnappedGeoJSON, { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
					var firstRoutePathPointFeature = routePathPointFeatures[0]; // should only be 1
					firstRoutePathPointFeature.set("routePathHoverPoint", true);
					app.plugins.RestrictionFinder.routePathPointHoverLayer.getSource().addFeature(firstRoutePathPointFeature);
				}
			});
		});
		
		// Define and add the restrictions layer (CLUSTERED LAYER)
		this.styleCache = {};
		this.restrictionLayer = new ol.layer.Vector({
			title: "Restrictions",
			preventIdentify: true,
			source: new ol.source.Cluster({
				distance: 35,
				source: new ol.source.Vector({})
			}),
			style: function(cluster, resolution) {
				
				// Get a count of features in this cluster
				var featureCount = cluster.get("features").length;
				
				// Build a unique list of restriction types in this cluster
				var restrictionTypes = [];
				$.each(cluster.get("features"), function(index, feature) {
					switch (feature.get("properties")["RESTRICTION_GROUP"]) {
						case "Horiz":
							if (!restrictionTypes.includes("width")) restrictionTypes.push("width");
							break;
						case "Lane 1":
						case "Lane 2":
						case "Lane 3":
						case "Lane 4":
						case "On/off Ramp":
							if (!restrictionTypes.includes("height")) restrictionTypes.push("height");
							break;
						default:
							if (!restrictionTypes.includes("unknown")) restrictionTypes.push("unknown");
					}
				});
				
				// Decide what icon to use for this cluster
				var iconSrc = "application/plugins/RestrictionFinder/img/restriction-violation-unknown.png";
				if (restrictionTypes.includes("width") && restrictionTypes.includes("height")) {
					iconSrc = "application/plugins/RestrictionFinder/img/restriction-violation-height-and-width.png";
				} else if (restrictionTypes.includes("width") && !restrictionTypes.includes("height")) {
					iconSrc = "application/plugins/RestrictionFinder/img/restriction-violation-width.png";
				} else if (!restrictionTypes.includes("width") && restrictionTypes.includes("height")) {
					iconSrc = "application/plugins/RestrictionFinder/img/restriction-violation-height.png";
				}
				
				// Define a unique cluster key for this style (for the style cache)
				var styleKey = md5(iconSrc) + "-" + featureCount;
				
				// Define the icon text label
				var textLabel = "";
				if (featureCount > 1) textLabel = featureCount.toString();
				
				// Build the style
				var style = app.plugins.RestrictionFinder.styleCache[styleKey];
				if (!style) {
					style = [new ol.style.Style({
						image: new ol.style.Icon({
							anchor: [16, 18],
							anchorXUnits: "pixels",
							anchorYUnits: "pixels",
							scale: 1.0,
							src: iconSrc
						}),
						text: new ol.style.Text({
							text: textLabel,
							font: "bold 11px serif",
							offsetX: 0,
							offsetY: 0,
							fill: new ol.style.Fill({
								color: "#000000"
							})
						})
					})];
					app.plugins.RestrictionFinder.styleCache[styleKey] = style;
				}
				return style;
			}
		});
		this.restrictionLayer.setZIndex(607);
		app.map.addLayer(this.restrictionLayer);
		
		// Define and add an empty restriction highlight layer
		this.restrictionHighlightLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [16, 18],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 1.0,
					src: "application/plugins/RestrictionFinder/img/restriction-violation-highlight.png"
				})
			})
		});
		this.restrictionHighlightLayer.setZIndex(608);
		app.map.addLayer(this.restrictionHighlightLayer);
		
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
		return app.plugins.RestrictionFinder.pointStyles[feature.get("pointStyle")];
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
		var clone = $(".rf-route-point-template").clone(true);
		var uniqueId = Date.now();
		clone.attr("id", "rf-route-point-" + uniqueId);
		clone.find(".rf-location-input").attr("id", "rf-route-point-input-" + uniqueId);
		clone.removeClass("rf-route-point-template");
		
		// If a coordinate was passed, then register that coordinate with the route point input
		if (coordinate) {
			clone.find(".rf-location-input").val(formatCoordinateAsString(coordinate, 4326));
			clone.find(".rf-location-input").attr("longitude", coordinate[0]);
			clone.find(".rf-location-input").attr("latitude", coordinate[1]);
		}
		
		// If a route path exists and a coordinate was passed, try to figure out where the route point input should be placed in the ordered list
		if (app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures().length == 1 && coordinate) {
			
			// Define GeoJSON formatter
			var gjFormat = new ol.format.GeoJSON();
			
			// Convert the OpenLayers route path into GeoJSON 4326
			var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures(), { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});
			
			// Find the distance along the route path (offset) where the new way point is closest to
			var newRoutePoint = turf.point(coordinate);
			var newRoutePointSnapped = turf.nearestPointOnLine(routePathGeoJSON, newRoutePoint, {units: "kilometers"});
			var newRoutePointOffset = newRoutePointSnapped.properties.location;
			
			// Loop through the existing route point inputs to find where to place the new route point
			$("#restriction-finder-form").find(".rf-location-input").each(function(index) {
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
			$("#rf-route-points").append(clone);
		} else {
			elementToAddNewRoutePointAfter.after(clone);
		}
		clone.show();
		
		// Add location event handlers to the way point input
		app.plugins.RestrictionFinder.addLocationInputEventHandlers("rf-route-point-" + uniqueId);
		
		// If a coordinate was passed, update the route points
		if (coordinate) app.plugins.RestrictionFinder.updateRoutePointsOnMap();
	}
	
	/**
	 * Function: removeRoutePoint
	 * @param (object) route point element
	 * @returns () nothing
	 * Function that removes a route point input element.  Clears is if there are only 2 remaining.
	 */
	removeRoutePoint(rpElement) {
		if ($("#rf-route-points").find(".rf-route-point").length > 2) {
			rpElement.remove();
		} else {
			rpElement.find(".rf-location-input").val("");
			rpElement.find(".rf-location-input").attr("longitude", null);
			rpElement.find(".rf-location-input").attr("latitude", null);
		}
		app.plugins.RestrictionFinder.findRoute();
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
		if (app.plugins.RestrictionFinder.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.RestrictionFinder.searchBcGeoCoder(request, overallResultsAggregator, options);
		}
		
		// Search visible (and configured) layers if configured
		if (app.plugins.RestrictionFinder.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.RestrictionFinder.searchLayers(request, overallResultsAggregator, options);
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
			maxResults: app.plugins.RestrictionFinder.pcfg.geoCoderMaxResults,
			echo: 'false',
			brief: true,
			autoComplete: true,
			locationDescriptor: "accessPoint", // forces geocoder to snap to road (or with 3 meters)
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.RestrictionFinder.pcfg.geoCoderApiKey
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
				
				// TODO: need to handle clustered versus non-clustered layers (see Identify2Popup example)
				
				// Get all of the layers features
				var features = layer.getSource().getFeatures();
				
				// Loop through the features and searchable fields to find matches
				var matchedFeatures = [];
				$.each(features, function(index, feature) {
					if (matchedFeatures.length < app.plugins.RestrictionFinder.pcfg.visibleLayerSearchMaxResults) {
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
					count: app.plugins.RestrictionFinder.pcfg.visibleLayerSearchMaxResults,
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
			app.plugins.RestrictionFinder.waitingForMapClick = false;
			
			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();
			
			// Set the input's lon/lat attributes (and display value)
			target.val(formatCoordinateAsString(centreLL, 4326));
			target.attr("longitude", centreLL[0]);
			target.attr("latitude", centreLL[1]);
			
			// If mobile and there is no valid route, show sidebar
			if (isMobile()) {
				if (app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures().length == 0) showSidebar();
			}
			
			// Find Route
			app.plugins.RestrictionFinder.findRoute();
		}
		
		// Toggle function as active
		app.plugins.RestrictionFinder.waitingForMapClick = true;
		
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
				app.plugins.RestrictionFinder.findRoute();
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
		app.plugins.RestrictionFinder.findRoute();
	}
	
	/**
	 * Function: updateRoutePointsOnMap
	 * @param () none
	 * @returns () nothing
	 * Function that shows valid route points on the map
	 */
	updateRoutePointsOnMap() {
		// Clear existing route points
		app.plugins.RestrictionFinder.routePointsLayer.getSource().clear();
		
		// Determine what the index is of the first and last valid route points
		var firstRoutePointIndex;
		var lastRoutePointIndex;
		$("#restriction-finder-form").find(".rf-location-input").each(function(routePointIndex, inputElement) {
			if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
				if (firstRoutePointIndex == null) firstRoutePointIndex = routePointIndex;
				lastRoutePointIndex = routePointIndex;
			}
		});
		
		// Add the valid route points to the route points layer
		$("#restriction-finder-form").find('.rf-location-input').each(function(routePointIndex, inputElement) {
			
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
				app.plugins.RestrictionFinder.routePointsLayer.getSource().addFeature(pointFeature);
			}
		});	
	}
	
	/**
	 * Function: findRoute
	 * @param () none
	 * @returns () nothing
	 * Function that attempts to find and display a route based on inputs
	 */
	findRoute() {
		// Clear existing route points, route path, and restrictions layers
		app.plugins.RestrictionFinder.routePathLayer.getSource().clear();
		app.plugins.RestrictionFinder.clearSelectionBuffer();
		app.plugins.RestrictionFinder.restrictionLayer.getSource().getSource().clear();
		
		// Hide messages
		$("#rf-message").hide();
		
		// Disable the find restrictions button
		$("#rf-find-restrictions-btn").attr("disabled", true);
		
		// Clear summary
		app.plugins.RestrictionFinder.summaryStatistics = {};
		app.plugins.RestrictionFinder.updateSummary();
		
		// Clear the restrictions list
		$("#restriction-list").html("");

		// Show the route points on the map
		app.plugins.RestrictionFinder.updateRoutePointsOnMap();

		// Determine if reverse route button should be enabled
		if (app.plugins.RestrictionFinder.routePointsLayer.getSource().getFeatures().length > 1) {
			$("#rf-reverse-route-btn").prop("disabled", false);
		} else {
			$("#rf-reverse-route-btn").prop("disabled", true);
		}

		// Build a route points 2D array
		var points = [];
		$("#restriction-finder-form").find('.rf-location-input').each(function(routePointIndex, inputElement) {
			if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
				points.push([$(this).attr("longitude"), $(this).attr("latitude")]);
			}
		});

		// Bail if there are not enough points
		if (points.length < 2) return;
		
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.RestrictionFinder.tabContent)[0]);
			
		// Convert points array into string usable by the router-form
		var pointString = "";
		$.each(points, function(index, point) {
			if (pointString != "") pointString += ",";
			pointString += point[0] + "," + point[1];
		});
		
		// Define the parameters
		var params = {
			points: pointString,
			partition: ["ownership","isTruckRoute","isFerry"],
			restrictionSource: "ITN",
			vehicleType:"truck",
			truckRouteMultiplier:3,
			criteria: "shortest",
			enable: ["tr","gdf","xc"],
			roundTrip: false,
			correctSide: false,
			apikey: app.plugins.RestrictionFinder.pcfg.routerApiKey
		};

		// Clear restriction list
		$("#restriction-list").html("");
		
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
			// Stop the spinner
			spinner.stop();
			
			// Bail if a route was not found
			if (!data.routeFound) {
				$("#rf-message").html("A route could not be found");
				$("#rf-message").show();
				return;
			}

			// Get, transform, and display route geometry on map
			var routeGeometry = new ol.geom.LineString(data.route);
			var routeGeometryInMapProjection = routeGeometry.transform("EPSG:"+data.srsCode, app.map.getView().getProjection());
			var routeFeature = new ol.Feature({geometry: routeGeometryInMapProjection});
			routeFeature.set("routePath", true);						   
			app.plugins.RestrictionFinder.routePathLayer.getSource().addFeature(routeFeature);
			
			// Enable find features button
			$("#rf-find-restrictions-btn").attr("disabled", false);
									
			// Zoom to the route (only if 2 points were defined)
			if (points.length == 2) zoomToFeature(routeFeature);
			
			// Show selection buffer (if configured to do so)
			if (app.plugins.RestrictionFinder.pcfg.showSelectionBuffer) {
				app.plugins.RestrictionFinder.showSelectionBuffer();
			}
			
			// Update summary
			app.plugins.RestrictionFinder.summaryStatistics.travelDirections = data.directions;
			app.plugins.RestrictionFinder.summaryStatistics.routeDistance = data.distance.toFixed() + " " + data.distanceUnit;
			app.plugins.RestrictionFinder.updateSummary();
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			spinner.stop();
			$("#rf-message").html("A route could not be found");
			$("#rf-message").show();
			logger("ERROR", app.plugins.RestrictionFinder.name + ": Router Error");
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
		$("#" + parentId + " .rf-get-location-from-map-btn").click(function(){ 
			var associatedInput = $(this).parent().find(".rf-location-input");
			app.plugins.RestrictionFinder.registerMapClickLocation(associatedInput);
		});
		
		// Register the category autocompletes
		$("#" + parentId + " .rf-location-input").catcomplete({
			minLength: 3,
			source: this.search,
			autoFocus: true,
			select: function(event, selection) {
				app.plugins.RestrictionFinder.registerSearchSelectionLocation($(this), selection.item);
			}
		});
		
		// Register the geolocator buttons
		$("#" + parentId + " .rf-get-geolocation-btn").click(function(){ 
			var associatedInput = $(this).parent().find(".rf-location-input");
			app.plugins.RestrictionFinder.registerDeviceLocation(associatedInput);
		});

		// Register the clear input buttons
		$("#" + parentId + " .rf-clear-input-btn").click(function(){ 
			// Clear the input and attributes
			var associatedInput = $(this).parent().find(".rf-location-input");
			associatedInput.val("");
			associatedInput.attr("longitude", null);
			associatedInput.attr("latitude", null);
			
			// Find Route
			app.plugins.RestrictionFinder.findRoute();
		});

		// Register the delete route point buttons
		$("#" + parentId + " .rf-delete-route-point-btn").click(function(){ 
			app.plugins.RestrictionFinder.removeRoutePoint($(this).parent());
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
		$("#restriction-finder-form").find(".rf-location-input").each(function(index) {
			
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
				if ($(this).parent().hasClass("rf-route-point")) $(this).parent().remove();
			}
		});
		
		// Reverse the route point data array
		var routePointDataReversed = routePointData.reverse();
		
		// Loop through the existing location inputs (route points) and add the reverse route point data
		$("#restriction-finder-form").find('.rf-location-input').each(function(index) {
			
			// Get the corresponding route point object
			var inputLocation = routePointDataReversed[index];
			
			// Set the input location attributes
			$(this).attr("longitude", inputLocation.longitude);
			$(this).attr("latitude", inputLocation.latitude);
			$(this).val(inputLocation.text);
			
		});

		// Re-run the Route
		app.plugins.RestrictionFinder.findRoute();
	}
	
	/**
	 * Function: clearAll
	 * @param () none
	 * @returns () nothing
	 * Function that clears everything back to default 
	 */
	clearAll() {
		// Remove all route points
		$("#rf-route-points").empty();
		
		// Add 2 route point inputs to start with
		app.plugins.RestrictionFinder.addRoutePoint();
		app.plugins.RestrictionFinder.addRoutePoint();
		
		// Set default height & width
		$("#rf-height-input").val(app.plugins.RestrictionFinder.defaultHeight);
		$("#rf-width-input").val(app.plugins.RestrictionFinder.defaultWidth);
		
		// Clear route path and route points by runnning the function with everything cleared
		app.plugins.RestrictionFinder.findRoute();
	}
	
	/**
	 * Function: findRestrictions
	 * @param () none
	 * @returns () nothing
	 * Function that queries the restrictions layer for features in close proximity to route
	 */
	findRestrictions() {
		// Clear existing restrictions
		app.plugins.RestrictionFinder.restrictionLayer.getSource().getSource().clear();
		
		// Clear restriction list
		$("#restriction-list").html("");
		
		// Hide messages
		$("#rf-message").hide();
				
		// Partially clear summary
		delete app.plugins.RestrictionFinder.summaryStatistics.heightViolations;
		delete app.plugins.RestrictionFinder.summaryStatistics.widthViolations;
		app.plugins.RestrictionFinder.updateSummary();
		
		// Get the route feature (from the layer)
		if (app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures().length == 0) return;
		var routeFeature = app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures()[0];
		
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.RestrictionFinder.tabContent)[0]);
		
		// Transform route feature into restriction layer's native projection
		var routeFeatureInLayerNativeProj = transformFeature(routeFeature, app.map.getView().getProjection().getCode(), "EPSG:"+app.plugins.RestrictionFinder.pcfg.restrictionLayerNativeEPSG);
		
		// Transform the route feature into WKT format
		var wktFormat = new ol.format.WKT();
		var routeWKT = wktFormat.writeGeometry(routeFeatureInLayerNativeProj.getGeometry());

		// Transform into a plain coordinate string
		var coordinates = routeWKT.replace("LINESTRING", "");
		coordinates = coordinates.replace("(", "");
		coordinates = coordinates.replace(")", "");
		
		// Build XML packet
		var xml = 	 "<wfs:GetFeature service='WFS' version='2.0.0' outputFormat='json' count='1000' "
						+"xmlns:wfs='http://www.opengis.net/wfs/2.0' "
						+"xmlns:fes='http://www.opengis.net/fes/2.0' "
						+"xmlns:gml='http://www.opengis.net/gml/3.2' "
						+"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' "
						+"xsi:schemaLocation='http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd'>"
						+"<wfs:Query typeNames='"+app.plugins.RestrictionFinder.pcfg.restrictionLayerName+"' srsName='"+app.map.getView().getProjection().getCode()+"'>"
							+"<fes:Filter>"
									+"<fes:DWithin>"
										+"<fes:ValueReference>"+app.plugins.RestrictionFinder.pcfg.restrictionLayerGeometryFieldName+"</fes:ValueReference>"
										+"<fes:Distance units='meter'>"+app.plugins.RestrictionFinder.pcfg.searchDistanceInMetres+"</fes:Distance>"
										+"<gml:LineString srsName='http://www.opengis.net/gml/srs/epsg.xml#"+app.plugins.RestrictionFinder.pcfg.restrictionLayerNativeEPSG+"'>"
											+"<gml:coordinates cs=' ' ts=','>"+coordinates+"</gml:coordinates>"
										+"</gml:LineString>"
									+"</fes:DWithin>"
							+"</fes:Filter>"
						+"</wfs:Query>"
					+"</wfs:GetFeature>";

		// Issue the request
		$.ajax({
			type: "POST",
			url: app.plugins.RestrictionFinder.pcfg.restrictionLayerUrl,
			contentType: "text/xml",
			data: xml,
			dataType: "json"
		})
		
		// Handle the response
		.done(function(response) {
			spinner.stop();
			app.plugins.RestrictionFinder.processReturnedRestrictions(response.features);
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			spinner.stop();
			logger("ERROR", app.plugins.RestrictionFinder.name + ": Error querying restriction layer");
		}); 	
	}
	
	/**
	 * Function: validateRestrictions
	 * @param (array) restriction
	 * @returns (array) validated restrictions
	 * Function that removes any invalid restrictions
	 */
	validateRestrictions(restrictions) {
		var validatedRestrictions = [];
		$.each(restrictions, function(index, restriction) {	
			// Only keep restrictions with values greater than zero
			if (restriction.properties.RESTRICTION_VALUE <= 0) return;
			
			// Made it this far, add restriction
			validatedRestrictions.push(restriction);
		});
		return validatedRestrictions;
	}
	
	/**
	 * Function: orderRestrictions
	 * @param (array) restriction
	 * @returns (array) ordered restrictions
	 * Function that orders restrictions using the route
	 */
	orderRestrictions(restrictions) {
		// Get the coordinate pairs (in 4326) from the route layer
		var routeFeature = app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures()[0];
		var routeFeature4326 = transformFeature(routeFeature, app.map.getView().getProjection(), "EPSG:4326");
		var routeGeometry = routeFeature4326.getGeometry();
		var routeCoordinates = routeGeometry.getCoordinates();

		// Convert the route coordinates into a TURF feature collection of points
		var routePoints = [];
		$.each(routeCoordinates, function(index, routeCoordinate) {
			routePoints.push(turf.point(routeCoordinate));
		});
		var routePointsFC = turf.featureCollection(routePoints);
		
		// For each restriction, get the closest route point and assign it's index to the restriction (as sortOrder)
		$.each(restrictions, function(index, restriction) {
			var restrictionCoordinate = restriction.geometry.coordinates;
			var restrictionCoordinate4326 = ol.proj.transform(restrictionCoordinate, app.map.getView().getProjection(), "EPSG:4326");
			var restrictionPoint = turf.point(restrictionCoordinate4326);
			var nearestRoutePoint = turf.nearest(restrictionPoint, routePointsFC); // turf operations must be done in 4326
			restrictions[index].properties.sortOrder = nearestRoutePoint.properties.featureIndex;
		});
		
		// Sort the restrictions based on sortOrder
		restrictions.sort(function(a, b){
			var a1 = a.properties.sortOrder, b1 = b.properties.sortOrder;
			if(a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});

		// Return the ordered restrictions
		return restrictions;
	}
	
	/**
	 * Function: processReturnedRestrictions
	 * @param (array) restriction
	 * @returns () nothing
	 * Function that processes the returned restrictions
	 */
	processReturnedRestrictions(restrictions) {
		// Get the height and width of load as entered by user
		var loadWidth = $("#rf-width-input").val();
		var loadHeight = $("#rf-height-input").val();

		// Validate restrictions
		var validatedRestrictions = this.validateRestrictions(restrictions);

		// Order the restrictions
		var orderedRestrictions = this.orderRestrictions(validatedRestrictions);
		
		// Determine if restrictions were violated
		var heightViolationCount = 0;
		var widthViolationCount = 0;
		$.each(orderedRestrictions, function(index, restriction) {		
			// Assume restriction is not violated (default)
			orderedRestrictions[index]["hasViolation"] = false;
			
			// Determine if restriction is violated (and do counts)
			switch (restriction.properties.RESTRICTION_GROUP) {
				case "Horiz":
					if (restriction.properties.RESTRICTION_VALUE <= loadWidth) {
						orderedRestrictions[index]["hasViolation"] = true;
						widthViolationCount++;
					}
					 break;
				case "Lane 1": // Fall through
				case "Lane 2":
				case "Lane 3":
				case "Lane 4":
				case "On/off Ramp":
					 if (restriction.properties.RESTRICTION_VALUE <= loadHeight) {
						orderedRestrictions[index]["hasViolation"] = true;
						heightViolationCount++;
					 }
					 break;
			}
		});
		
		// Update summary
		app.plugins.RestrictionFinder.summaryStatistics.heightViolations = heightViolationCount;
		app.plugins.RestrictionFinder.summaryStatistics.widthViolations = widthViolationCount;
		app.plugins.RestrictionFinder.updateSummary();
		
		// If no violations were found, bail
		if (heightViolationCount == 0 && widthViolationCount == 0) {
			return;
		}

		// Group (cluster) restrictions by location
		var restrictionGroups = {};
		$.each(orderedRestrictions, function(index, restriction) {
			// Define the group id
			var groupId = md5(restriction.properties.DECIMAL_DEGREES_LATITUDE + "_" + restriction.properties.DECIMAL_DEGREES_LONGITUDE);
			
			// Add the group id to the properties of each restriction
			orderedRestrictions[index].properties.groupId = groupId; // to be used later for cross-referencing points to ToC restriction tables
			
			// Add the restriction to the restriction group
			if (!(groupId in restrictionGroups)) restrictionGroups[groupId] = [];
			restrictionGroups[groupId].push(restriction);
		});

		// Only keep grouped (clustered) restrictions that have at least one violation
		var restrictionGroupsWithViolations = {};
		$.each(restrictionGroups, function(groupIndex, restrictionGroup) {
			var hasViolation = false; // Assume group has no violations to start
			$.each(restrictionGroup, function(index, restriction) {
				if (restriction.hasViolation) hasViolation = true;
			});
			if (hasViolation) restrictionGroupsWithViolations[groupIndex] = restrictionGroup;
		});

		/**
		 * Build a data object suitable for populating the sidebar
		 * with restrictions.
		 * At the top level there is an array container two arrays...
		 * One for each direction. Within these arrays we store 5
		 * placeholders.. one for each lane starting with lane 1 
		 * and potentially going to lane 5. If we find a pull-out 
		 * lane we can put that automatically in lane 5.
		 */
		let groupedRestrictions = {}; // This will hold the new object
		
		// Cycle through point locations (clusters)
		$.each(restrictionGroupsWithViolations, (key, cluster) => {
					
			var newCluster = [
				[null,null,null,null,null], // North or East Direction Lane Heights - (i.e. [Lane 1, Lane 2, Lane 3, Lane 4, On/off Ramp] )
				[null,null,null,null,null],  // South or West Direction Lane Heights  (i.e. [Lane 1, Lane 2, Lane 3, Lane 4, On/off Ramp] )
				[null], // North or East Direction Width 
				[null] // South or West Direction Width
			];

			// Cycle through restrictions
			$.each(cluster, (index, restriction) => {
				var restrictionType = restriction.properties.RESTRICTION_GROUP;
				var restrictionDirection = restriction.properties.DIRECTION_TYPE_CODE;
				switch (restrictionType) {
					case "Lane 1":
					case "Lane 2":
					case "Lane 3":
					case "Lane 4":
						var laneNumber = parseInt(restrictionType.replace("Lane ", ""));
						if (/[NE]/i.test(restrictionDirection)) {
							newCluster[0][laneNumber - 1] = restriction;
						} else if (/[SW]/i.test(restrictionDirection)) {
							newCluster[1][laneNumber - 1] = restriction;
						} else {
							console.warn("WARNING: Direction not found for height restriction");
						}
						break;
					
					case "On/off Ramp":
						if (/[NE]/i.test(restrictionDirection)) {
							newCluster[0][4] = restriction; // Always place on/off ramps in the 4th index
						} else if (/[SW]/i.test(restrictionDirection)) {
							newCluster[1][4] = restriction; // Always place on/off ramps in the 4th index
						} else {
							console.warn("WARNING: Direction not found for off ramp height restriction");
						}
						break;
					
					case "Horiz":
						if (/[NE]/i.test(restrictionDirection)) {
							newCluster[2] = restriction;
						} else if (/[SW]/i.test(restrictionDirection)) {
							newCluster[3] = restriction;
						} else {
							console.warn("WARNING: Direction not found for width restriction");
						}
						break;
					
					default:
						console.warn("WARNING: Restriction type not found");
				}
			});
			
			groupedRestrictions[key] = newCluster;
		});

		// Iterate yet again to render obstructions
		$.each(groupedRestrictions, (key, cluster) => {
			// Get the restrictions list element
			var restrictionsList = $('#restriction-list');
			
			// Define the public comments array
			var publicComments = [];

			// Get the first restriction in the cluster
			var firstRestrictionInCluster = null;
			$.each(cluster, function(key1, value1) {
				if (Array.isArray(value1)) {
					$.each(value1, function(key2, value2) {
						if (!firstRestrictionInCluster && value2 !== null) firstRestrictionInCluster = value2;
					});
				} else {
					if (!firstRestrictionInCluster && value1 !== null) firstRestrictionInCluster = value1;
				}
			});
			
			// Use the first restriction in the cluster to get some common attributes
			const p = firstRestrictionInCluster.properties;
			if (!p) return; // Get out if there's no data
			const structureName = p.STRUCTURE_NAME;
			const routeName = p.ROUTE_NAME;
			const direction = p.DIRECTION_TYPE_CODE; //???????????????  Not sure we can do this...

			// Define the restriction container mouse enter function
			const highlightRestriction = function ()  {
				// Bail if mobile
				if (isMobile()) return;
				
				// Get restriction group id
				var resGroupId = $(this).attr("id")
				
				// Iterate through the restriction layer and find the first restriction that belongs to the restriction group (via groupId).  Get 
				// it's geometry either from the singular feature or the feature cluster.
				var features = app.plugins.RestrictionFinder.restrictionLayer.getSource().getFeatures();
				var highlightFeature = null;
				$.each(features, function(index, feature) {
					// Handle cluster
					if (feature.get("features")) {
						$.each(feature.get("features"), function(index, subFeature) {
							if (subFeature.getProperties().properties.groupId == resGroupId) {
								highlightFeature = feature;
								return false; // break
							}
						});
					
					// Handle single feature
					} else {
						if (feature.getProperties().properties.groupId == resGroupId) {
							highlightFeature = feature;
							return false; // break
						}
					}
				});

				// Clear exisitng highlights and set new one
				app.plugins.RestrictionFinder.restrictionHighlightLayer.getSource().clear();
				app.plugins.RestrictionFinder.restrictionHighlightLayer.getSource().addFeature(highlightFeature);
			};
			
			// Define the restriction container mouse leave function
			const unhighlightRestriction = function (e)  {
				app.plugins.RestrictionFinder.restrictionHighlightLayer.getSource().clear();			
			};
			
			// Define the restriction container mouse click function
			const zoomToRestriction = function (e)  {
				if (isMobile()) hideSidebar();
				var data = $(this).data();
				var olFeature = convertToOpenLayersFeature("GeoJSON", data);
				zoomToFeature(olFeature);
				
				// Trigger highlight after short delay
				var ele = $(this);
				setTimeout(function() {
					ele.trigger("mouseenter");
				}, 250);
			};
			
			// Define the restriction container mouse double click function
			const openStreetView = function (e)  {
				e.stopPropagation();
				var data = $(this).parents(".restriction").data();
				var olFeature = convertToOpenLayersFeature("GeoJSON", data);
				var centreLL = ol.proj.transform(olFeature.getGeometry().getCoordinates(), app.map.getView().getProjection(), "EPSG:4326");
				var streetViewUrl = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint="+centreLL[1]+","+centreLL[0];
				window.open(streetViewUrl);
			};
			
			// Add the restriction container (use the group key as the id)
			const rest = $(`<div id="${key}" class="restriction"></div>`)
				.data(firstRestrictionInCluster)
				.on("mouseenter", highlightRestriction)
				.on("mouseleave", unhighlightRestriction)
				.on("click", zoomToRestriction)
				.appendTo(restrictionsList);

			// Add header container and information
			const restHeader = $('<div class="restriction-header"></div>').appendTo(rest);
			const structNameElement = $(`<div class="structure-name">${structureName}</div>`).appendTo(restHeader);
			const structureId = "Structure " + (p.STRUCTURE_NO ? "#" + p.STRUCTURE_NO + ", " : "") + (p.STRUCTURE_ID ? "ID:" + p.STRUCTURE_ID : "");
			$(`<div class="structure-id">${structureId}</div>`).appendTo(restHeader);
			$(`<div class="route-name">${routeName}</div>`).appendTo(restHeader);

			// Add StreetView Button
			$(`<div class="rf-streetview-btn" title="Open Streetview"></div>`)
				.on("click", openStreetView)
				.appendTo(structNameElement);

			/**
			* Each direction can have zero or more lanes.
			* Determine which configuration is the case so we 
			* don't display a direction with no lanes restrictions.
			*/
			const neLanesExist = cluster[0].filter((d) => d).length > 0; // boolean
			const swLanesExist = cluster[1].filter((d) => d).length > 0; // boolean
			const neWidthExists = (cluster[2][0] === null) ? false : true; // boolean
			const swWidthExists = (cluster[3][0] === null) ? false : true; // boolean
			const restLanes = $('<div class="restriction-lanes"></div>').appendTo(rest);

			// Add the South or West direction label and define it's lane container
			let swLanesContainer;
			let swDirectionContainer;
			if (swLanesExist || swWidthExists) {
				swDirectionContainer = $('<div class="sw-direction"></div>').appendTo(restLanes);
				if (/[NS]/.test(direction)) {
					swDirectionContainer.append(`<div class="direction-name">South</div>`);
				} else {
					swDirectionContainer.append(`<div class="direction-name">West</div>`);
				}
				if (swLanesExist) swLanesContainer = $('<div class="sw-direction-lanes"></div>').appendTo(swDirectionContainer);
			}

			// Add the North or East direction label and define it's lane container
			let neLanesContainer;
			let neDirectionContainer;
			if (neLanesExist || neWidthExists) {
				neDirectionContainer = $('<div class="ne-direction"></div>').appendTo(restLanes);
				if (/[NS]/.test(direction)) {
					neDirectionContainer.append(`<div class="direction-name">North</div>`)
				} else {
					neDirectionContainer.append(`<div class="direction-name">East</div>`)
				}
				if (neLanesExist) neLanesContainer = $('<div class="ne-direction-lanes"></div>').appendTo(neDirectionContainer);
			}
			
			// Insert divider between SW and NE directions if both exist
			if (swDirectionContainer && neDirectionContainer) $('<div class="lane-direction-divider"></div>').insertAfter(restLanes.find(".sw-direction").first());

			// Cycle through all of the South or West lanes and add them to the SW Lanes container
			if (swLanesExist) {
				$.each(cluster[1].reverse(), (_,lane) => {
					if (!lane) return;

					const restLane = $('<div class="lane"></div>').appendTo(swLanesContainer);

					// For violation status and spacing
					if (lane.hasViolation) {
						restLane.addClass("hasViolation");
						restLane.append('<div class="arrow oi oi-ban"></div>');
					} else {
						restLane.addClass("hasNoViolation");
						restLane.append('<div class="arrow oi oi-check"></div>');
					}
					
					// Add lane name
					var laneName = (lane.properties.RESTRICTION_GROUP == "On/off Ramp") ? "Ramp" : lane.properties.RESTRICTION_GROUP;
					restLane.append(`<div class="lane-number">${laneName}</div>`);
					
					// Add direction arrow
					restLane.append('<div class="arrow oi oi-arrow-thick-bottom"></div>');
					
					// Add restriction value
					restLane.append(`<div class="restriction-value"><span class="oi oi-resize-height"></span> ${lane.properties.RESTRICTION_VALUE}m</div>`);
					
					// Add restriction comment to public comments array if present
					if (lane.properties.PUBLIC_COMMENT) {
						publicComments.push(`<span class="oi oi-pin"></span> ${lane.properties.RESTRICTION_GROUP} ${lane.properties.DIRECTION_TYPE_CODE}: ${lane.properties.PUBLIC_COMMENT}`);
					}
				});
			}
			
			// Cycle through all of the North or East lanes and add them to the NE Lanes container
			if (neLanesExist) {
				$.each(cluster[0], (_,lane) => {
					if (!lane) return;
					
					const restLane = $('<div class="lane"></div>').appendTo(neLanesContainer);

					// Add direction arrow
					restLane.append('<div class="arrow oi oi-arrow-thick-top"></div>');
					
					// Add lane name
					var laneName = (lane.properties.RESTRICTION_GROUP == "On/off Ramp") ? "Ramp" : lane.properties.RESTRICTION_GROUP;
					restLane.append(`<div class="lane-number">${laneName}</div>`);
					
					// For violation status and spacing
					if (lane.hasViolation) {
						restLane.addClass("hasViolation");
						restLane.append('<div class="arrow oi oi-ban"></div>');
					} else {
						restLane.addClass("hasNoViolation");
						restLane.append('<div class="arrow oi oi-check"></div>');
					}
					
					// Add restriction value
					restLane.append(`<div class="restriction-value"><span class="oi oi-resize-height"></span> ${lane.properties.RESTRICTION_VALUE}m</div>`);

					// Add restriction comment to public comments array if present
					if (lane.properties.PUBLIC_COMMENT) {
						publicComments.push(`<span class="oi oi-pin"></span> ${lane.properties.RESTRICTION_GROUP} ${lane.properties.DIRECTION_TYPE_CODE}: ${lane.properties.PUBLIC_COMMENT}`);
					}
				});
			}
			
			// Add South or West width restrictions
			if (swWidthExists) {
				var swWidthRes = cluster[3];
				var swWidthContainer = $(`<div class="lane restriction-value"><span class="oi oi-resize-width"></span> ${swWidthRes.properties.RESTRICTION_VALUE}m</div>`).appendTo(swDirectionContainer);
				if (swWidthRes.hasViolation) {
					swWidthContainer.addClass("hasViolation");
				} else {
					swWidthContainer.addClass("hasNoViolation");
				}
				
				// Add restriction comment to public comments array if present
				if (swWidthRes.properties.PUBLIC_COMMENT) {
					publicComments.push(`<span class="oi oi-pin"></span> ${swWidthRes.properties.RESTRICTION_GROUP} ${swWidthRes.properties.DIRECTION_TYPE_CODE}: ${swWidthRes.properties.PUBLIC_COMMENT}`);
				}
			}
			
			// Add North or East width restrictions
			if (neWidthExists) {
				var neWidthRes = cluster[2];
				var neWidthContainer = $(`<div class="lane restriction-value"><span class="oi oi-resize-width"></span> ${neWidthRes.properties.RESTRICTION_VALUE}m</div>`).appendTo(neDirectionContainer);
				if (neWidthRes.hasViolation) {
					neWidthContainer.addClass("hasViolation");
				} else {
					neWidthContainer.addClass("hasNoViolation");
				}
				
				// Add restriction comment to public comments array if present
				if (neWidthRes.properties.PUBLIC_COMMENT) {
					publicComments.push(`<span class="oi oi-pin"></span> ${neWidthRes.properties.RESTRICTION_GROUP} ${neWidthRes.properties.DIRECTION_TYPE_CODE}: ${neWidthRes.properties.PUBLIC_COMMENT}`);
				}
			}
			
			// The public comment(s) container and content
			const restFooter = $('<div class="restriction-footer"></div>').appendTo(rest);
			if (publicComments.length > 0) {
				publicComments.sort();
				var allComments = publicComments.join("<br>");
				restFooter.append(`${allComments}`);
			}
			
		});
		
		// Add the grouped (clustered) restrictions to the map
		$.each(restrictionGroupsWithViolations, function(index, cluster) {
			var olFeature = convertToOpenLayersFeature("GeoJSON", cluster[0]);
			app.plugins.RestrictionFinder.restrictionLayer.getSource().getSource().addFeature(olFeature);
		});
		
		// Redraw the layout
		doLayout();
		
	}
	
	/**
	 * Function: showSelectionBuffer
	 * @param () none
	 * @returns () nothing
	 * Function that creates a selection buffer layer and shows the selection buffer polygon
	 */
	showSelectionBuffer() {
		// Get the selection buffer layer (if exists)
		var selectionBufferLayer;
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (layer.get("title") == "Restriction Inclusion Zone") { 
				selectionBufferLayer = layer;
			} 
		});
		
		// If the selection buffer layer does not exist, add it to the map
		if (!selectionBufferLayer) {
			selectionBufferLayer = new ol.layer.Vector({
				title: "Restriction Inclusion Zone",
				type: "overlay",
				preventRefresh: true,
				preventIdentify: true,
				visible: false,
				source: new ol.source.Vector({}),
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(0, 0, 0, 0.6)",
						width: 1
					}),
						fill: new ol.style.Fill({
						color: "rgba(173, 216, 230, 0.35)"
					})
				})
			});
			selectionBufferLayer.setZIndex(499);
			app.map.addLayer(selectionBufferLayer);
			
			// Add to the layer controller (if present)
			if (app.plugins.LayerController) {
				app.plugins.LayerController.addOverlayLayerControl(selectionBufferLayer, true);
			}
		}
		
		// Build a buffer from the route feature
		var routeFeature = app.plugins.RestrictionFinder.routePathLayer.getSource().getFeatures()[0];
		var gjFormat = new ol.format.GeoJSON();
		var routeFeatureIn4326 = transformFeature(routeFeature, app.map.getView().getProjection().getCode(), "EPSG:4326");
		var gjRouteIn4326 = gjFormat.writeFeatureObject(routeFeatureIn4326);
		var gjSelectionBuffer4326 = turf.buffer(gjRouteIn4326, app.plugins.RestrictionFinder.pcfg.searchDistanceInMetres, {units: "meters"});
		var selectionBufferFeature4326 = convertToOpenLayersFeature("GeoJSON", gjSelectionBuffer4326);
		var selectionBufferFeature = transformFeature(selectionBufferFeature4326, "EPSG:4326", app.map.getView().getProjection().getCode());
		selectionBufferLayer.getSource().addFeature(selectionBufferFeature);

	}
	
	/**
	 * Function: clearSelectionBuffer
	 * @param () none
	 * @returns () nothing
	 * Function that clears the selection buffer layer if it exists
	 */
	clearSelectionBuffer() {
		// Get the selection buffer layer (if exists)
		var selectionBufferLayer;
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (layer.get("title") == "Restriction Inclusion Zone") { 
				selectionBufferLayer = layer;
			} 
		});
		
		// If the selection buffer layer was found
		if (selectionBufferLayer) {
			// Remove the layer from the overlay fieldset (if exists)
			$(".lc-fs-overlays .lc-fs-content").children("div").each(function () {
				if ($(this).attr("layerId") == ol.util.getUid(selectionBufferLayer)) {
					$(this).remove();
				}
			});
			
			// Remove the layer from the map
			app.map.removeLayer(selectionBufferLayer);
		}
	}
	
	/**
	 * Function: updateSummary
	 * @param () none
	 * @returns () nothing
	 * Function that shows/hides the route and restriction summary
	 */
	updateSummary() {
		// Defaults
		var showSummary = false;
		
		// Show route distance
		if (this.summaryStatistics.hasOwnProperty("routeDistance")) {
			$("#rf-td-routeDistance").html(this.summaryStatistics.routeDistance);
			showSummary = true;
		}
		
		// Show travel directions
		$("#rf-directions").html("");
		if (this.summaryStatistics.hasOwnProperty("travelDirections")) {
			// Build the directions table
			var directionsTable = $("<table class='table table-sm rf-directions-table'><tbody></tbody></table>");

			// Loop thru each direction leg
			$.each(this.summaryStatistics.travelDirections, function(index, leg) {
				if(leg.type != "STOPOVER"){ //Remove Stopovers from travelDirection
					// Determine which icon to use
					var navIcon;
					switch(leg.type) {
						case "START":
						case "FINISH":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-start-end.png";
							break;
						case "CONTINUE":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-continue.png";
							break;
						case "TURN_LEFT":
						case "TURN_SHARP_LEFT":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-turn-left.png";
							break;
						case "TURN_RIGHT":
						case "TURN_SHARP_RIGHT":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-turn-right.png";
							break;
						case "TURN_SLIGHT_LEFT":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-turn-slight-left.png";
							break;
						case "TURN_SLIGHT_RIGHT":
							navIcon = "application/plugins/RestrictionFinder/img/navigation-turn-slight-right.png";
							break;
						case "FERRY":
							navIcon = "application/plugins/DynamicRouter/img/navigation-ferry.png";
							break;
						default:
							navIcon = "application/plugins/RestrictionFinder/img/navigation-unknown.png";
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
			$("#rf-directions").append(directionsTable);
			showSummary = true;
		}
		
		// Show height violation count
		if (this.summaryStatistics.hasOwnProperty("heightViolations")) {
			$("#rf-td-heightViolations").html(this.summaryStatistics.heightViolations);
			if (this.summaryStatistics.heightViolations == 0) {
				$("#rf-td-heightViolations").removeClass("rf-red").addClass("rf-green");
			} else {
				$("#rf-td-heightViolations").removeClass("rf-green").addClass("rf-red");
			}
			showSummary = true;
		} else {
			$("#rf-td-heightViolations").html("n/a");
			$("#rf-td-heightViolations").removeClass("rf-green").removeClass("rf-red");
		}
		
		// Show width violation count
		if (this.summaryStatistics.hasOwnProperty("widthViolations")) {
			$("#rf-td-widthViolations").html(this.summaryStatistics.widthViolations);
			if (this.summaryStatistics.widthViolations == 0) {
				$("#rf-td-widthViolations").removeClass("rf-red").addClass("rf-green");
			} else {
				$("#rf-td-widthViolations").removeClass("rf-green").addClass("rf-red");
			}
			showSummary = true;
		} else {
			$("#rf-td-widthViolations").html("n/a");
			$("#rf-td-widthViolations").removeClass("rf-green").removeClass("rf-red");
		}
		
		// Show/hide summary
		if (showSummary) {
			$("#rf-summary").show();
		} else {
			$("#rf-summary").hide();
		}
	}
	
	/**
	 * Function: scroll2SelectedRestrictions
	 * @param (object) event
	 * @returns () nothing
	 * Function that scrolls the sidebar to the clicked on restrictions
	 */
	scroll2SelectedRestrictions(event) {
		// Get all features close to click
		var pixel = app.map.getEventPixel(event.originalEvent);
		var foundFeatures = app.map.getFeaturesAtPixel(pixel, {
			hitTolerance: 10, 
			layerFilter: function(l) { 
				if (ol.util.getUid(l) == ol.util.getUid(app.plugins.RestrictionFinder.restrictionLayer)) return true; else return false;
			}
		});
	
		// Convert returned features into a format similar to what GetFeatureInfo returns
		var cf = [];
		$.each(foundFeatures, function(index, feature) {
			// Cluster vector layer
			if (feature.get("features")) {
				$.each(feature.get("features"), function(index2, clusterFeature) {
					var f = {};
					f.type = "Feature";
					f.id = clusterFeature.getId() ? clusterFeature.getId() : md5(clusterFeature);
					f.geometry_name = clusterFeature.getGeometryName();
					f.geometry = {};
					f.geometry.type = clusterFeature.getGeometry().getType();
					f.geometry.coordinates = clusterFeature.getGeometry().getCoordinates();
					f.properties = clusterFeature.getProperties()["properties"];
					cf.push(f);
				});
			
			// Non cluster vector layer
			} else {
				var f = {};
				f.type = "Feature";
				f.id = feature.getId() ? feature.getId() : md5(feature);
				f.geometry_name = feature.getGeometryName();
				f.geometry = {};
				f.geometry.type = feature.getGeometry().getType();
				f.geometry.coordinates = feature.getGeometry().getCoordinates();
				f.properties = feature.getProperties();
				cf.push(f);
			}
		});
		
		// Sort based on sortOrder (so we scroll to the top one in the list)
		cf.sort(function(a, b){
			var a1 = a.properties.sortOrder, b1 = b.properties.sortOrder;
			if(a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});
		
		// Use the first feature to set the scroll position
		if (cf.length > 0) {
			// Get the group id from the first feature
			var firstRestrictionGroupId = cf[0].properties.groupId;

			// If you can find a matching restriction div/table with the current group id, scroll to it
			if ($("#"+firstRestrictionGroupId).length > 0) {
				// Define the executeScroll function
				var executeScroll = function() {
					var currentScrollPosition = $("#RestrictionFinder-tab-content").scrollTop();
					var offset = Math.floor($("#"+firstRestrictionGroupId).offset().top - 160);
					var newScrollPosition = currentScrollPosition + offset;
					$("#RestrictionFinder-tab-content").animate({
						scrollTop: newScrollPosition,
						scrollLeft: 0
					}, 1500);
				}
				
				// Show the Restriction Finder tab
				activateSidebarTab(app.plugins.RestrictionFinder.tabNav);
				
				// If the sidebar is closed, open it
				if ($("#sidebar").is(":visible") === false) showSidebar();
				
				// Scoll to restriction after short pause
				setTimeout(function(){
						executeScroll();
				}, 500);				
			}
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
				logger("ERROR", app.plugins.RestrictionFinder.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.RestrictionFinder.tabNav = tabNav;
			app.plugins.RestrictionFinder.tabContent = tabContent;
			
			// Set default height & width
			$("#rf-height-input").val(app.plugins.RestrictionFinder.defaultHeight);
			$("#rf-width-input").val(app.plugins.RestrictionFinder.defaultWidth);
			
			// Allow adding of way points if so configured
			if (app.plugins.RestrictionFinder.pcfg.allowWayPoints) {
				$("#rf-route-point-add-div").show();
				$("#rf-route-point-add-instructions").show();
				$("#restriction-finder-form #rf-route-point-add-btn").click(function(){ 
					app.plugins.RestrictionFinder.addRoutePoint();
				});
			}
			
			// Add 2 route point inputs to start with
			app.plugins.RestrictionFinder.addRoutePoint();
			app.plugins.RestrictionFinder.addRoutePoint();
			
			// Register Reverse Route button
			$("#rf-reverse-route-btn").click(function(){ 
				app.plugins.RestrictionFinder.reverseRoute();
			});
			
			// Make the route points sortable (so user can change the order)
			$("#rf-route-points").sortable({
				update: function (event, ui) {
					app.plugins.RestrictionFinder.findRoute();
				}
			});
			
			// Register load height change handler
			$("#rf-height-input").change(function() { 
				app.plugins.RestrictionFinder.restrictionLayer.getSource().getSource().clear();
				$("#restriction-list").html("");
				delete app.plugins.RestrictionFinder.summaryStatistics.heightViolations;
				delete app.plugins.RestrictionFinder.summaryStatistics.widthViolations;
				app.plugins.RestrictionFinder.updateSummary();
			});
			
			// Register load width change handler
			$("#rf-width-input").change(function() { 
				app.plugins.RestrictionFinder.restrictionLayer.getSource().getSource().clear();
				$("#restriction-list").html("");
				delete app.plugins.RestrictionFinder.summaryStatistics.heightViolations;
				delete app.plugins.RestrictionFinder.summaryStatistics.widthViolations;
				app.plugins.RestrictionFinder.updateSummary();
			});
			
			// Register Clear All Button
			$("#rf-clear-all-btn").click(function(){ 
				app.plugins.RestrictionFinder.clearAll();
			});
			
			// Register Find Restrictions Button
			$("#rf-find-restrictions-btn").click(function(){ 
				app.plugins.RestrictionFinder.findRestrictions();
			});
			
			// Register single click
			app.plugins.RestrictionFinder.singleClick = app.map.on("click", function(event) {
				app.plugins.RestrictionFinder.scroll2SelectedRestrictions(event);
			});
			
			// Log success
			logger("INFO", app.plugins.RestrictionFinder.name + ": Plugin successfully loaded");
		}
			
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
	
}