class CLSPSearch {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "CLSPSearch";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "CLSearch";
		this.tabContentFile = "application/plugins/CLSPSearch/tab-content.html";
		this.clspsUrl = ""; // passed in from config
		this.response = "";
		this.resultsTreeData = [];
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.featureStore = [];  // Used to store all of the features and attributes
		this.searchRadiusFeature = new ol.Feature();
		this.searchRadiusLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(255, 255, 0, 0.5)",
					width: 8
				}),
					fill: new ol.style.Fill({
					color: "rgba(255, 255, 0, 0.2)"
				})
			})
		});
		this.searchRadiusLayer.setZIndex(604);
		app.map.addLayer(this.searchRadiusLayer);
		this.addPlugin();
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
		if (app.plugins.CLSPSearch.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.CLSPSearch.searchBcGeoCoder(request, overallResultsAggregator, options);
		}
		
		// Search visible (and configured) layers if configured
		if (app.plugins.CLSPSearch.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.CLSPSearch.searchLayers(request, overallResultsAggregator, options);
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
			maxResults: app.plugins.CLSPSearch.pcfg.geoCoderMaxResults,
			echo: 'false',
			brief: true,
			autoComplete: true,
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.CLSPSearch.pcfg.geoCoderApiKey
		};
		$.extend(params, options);
		
		// Query the DataBC GeoCoder
		$.ajax({
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			data: params,
			timeout: 7500
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
			// Skip layer if not a WMS layer
			if (typeof layer.getSource().getFeatureInfoUrl != "function") return true;
			
			var layerIsSearchable = false;
			if (layer.get("visible")) {
				if (layer.get("fields")) {
					$.each(layer.get("fields"), function(index, configField) {
						if (configField.searchable) {
							layerIsSearchable = true;
						}
					});
				}
			}
			if (layerIsSearchable) layersToSearchCount++;
		});
		
		// Iterate through each map layer
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			
			// Skip layer if not a WMS layer
			if (typeof layer.getSource().getFeatureInfoUrl != "function") return true; 	
			
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

			// If no title fields were configured, then simply use the first searchable field
			if (titleFields.length == 0 && searchableFields.length > 0) {
				titleFields.push(searchableFields[0]);
			}
						
			// If the layer is visible and has search fields, query it
			if (layer.get("visible") && searchableFields.length > 0) {			

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
					count: app.plugins.CLSPSearch.pcfg.visibleLayerSearchMaxResults,
					srsName: app.map.getView().getProjection().getCode(),
					cql_filter: cqlFilter
				};
				$.extend(params, options);
								
				// Issue the request (async)
				$.ajax({
					type: "GET",
					url: url,
					timeout: 7500,
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
		
		// If no searchable layers are configured or visible, return an empty result
		if (layerSearchCompletedCount >= layersToSearchCount) {
			callback(completeLayerResultsList);
		}
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
		var feature4326 = transformFeature(feature, "EPSG:3857", "EPSG:4326"); // Assume feature was delivered in 3857
		var centreLL = getFeatureCentre(feature4326);
		
		// Set the input's lon/lat attributes based on user selection
		target.val(formatCoordinateAsString(centreLL, 4326));
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);
		
		// Register the search radius
		app.plugins.CLSPSearch.registerSearchRadius();
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
			
			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();
			
			// Set the input's lon/lat attributes (and display value)
			target.val(formatCoordinateAsString(centreLL, 4326));
			target.attr("longitude", centreLL[0]);
			target.attr("latitude", centreLL[1]);
			
			// Show the search point
			app.plugins.CLSPSearch.registerSearchRadius();
			
			// If mobile, show sidebar
			if (isMobile()) showSidebar();
		}
		
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
				
				// Register the search radius
				app.plugins.CLSPSearch.registerSearchRadius();
			}
			var geoLocationError = function(error) {
				// Display error/suggestion
				var errorNotice = bootbox.dialog({
					title: "Error",
					message: "<p class='text-center'>Cannot determine your current location.<br><br>Please turn on location services.<br></p>",
					closeButton: true
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
		var olFeature4326 = transformFeature(olFeature, "EPSG:3857", "EPSG:4326"); // Assume feature was delivered in 3857
		var centreLL = getFeatureCentre(olFeature4326);
		
		// Set the input's lon/lat attributes based on user selection
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);
		
		// Register the search radius
		app.plugins.CLSPSearch.registerSearchRadius();
	}
	
	/**
	 * Function: registerSearchRadius
	 * @param () none
	 * @returns () nothing
	 * Function that registers the search radius
	 */
	registerSearchRadius() {
		// Disable search button
		$("#clsps-overlay-search-btn").prop('disabled', true);
		
		// Clear results
		$("#clsps-results").empty();
		$("#clsps-no-results").hide();
		
		// Clear existing search radius
		app.plugins.CLSPSearch.searchRadiusLayer.getSource().clear();
		
		// Get the search from "lat/lon".  Bail if empty.
		var sLongitude = $(".clsps-search-point .clsps-location-input").attr("longitude");
		var sLatitude = $(".clsps-search-point .clsps-location-input").attr("latitude");
		if (!sLongitude || !sLatitude) return;
		
		// Get the search distance in metres
		var sDistanceMetres = $("#clsps-search-distance-input").val() * 1000;

		// Adjust radius for current projection (important especially for 3857)
		var radius = sDistanceMetres / ol.proj.getPointResolution(app.map.getView().getProjection(), 1, ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()));
		
		// Build a search radius feature using the search from location and the specified radius (in map projection)
		var searchCircle = new ol.geom.Circle(ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()), radius);
		var searchPolygon = ol.geom.Polygon.fromCircle(searchCircle, 24); // Use 24 sides to reduce the length of the search query string later on
		app.plugins.CLSPSearch.searchRadiusFeature = new ol.Feature(searchPolygon);
		
		// Show that search radius polygon (if configured for app)
		if (app.plugins.CLSPSearch.pcfg.showSearchRadiusOnMap) {
			app.plugins.CLSPSearch.searchRadiusLayer.getSource().addFeature(app.plugins.CLSPSearch.searchRadiusFeature);
		}
		
		// Zoom to that search radius feature
		zoomToFeature(app.plugins.CLSPSearch.searchRadiusFeature);
		
		// Enable search button
		$("#clsps-overlay-search-btn").prop('disabled', false);
	}
	
	/**
	 * Function: findFeatures
	 * @param () none
	 * @returns () nothing
	 * Function finds features using the specified search parameters
	 */
	findFeatures() {
		// Get the search distance in metres and alert if <= 0
		var sDistanceMetres = $("#clsps-search-distance-input").val() * 1000;
		if (sDistanceMetres <= 0) {
			var errorNotice = bootbox.dialog({
				title: "Error",
				message: "<p class='text-center'>Search Distance must be greater than 0<br></p>",
				closeButton: true
			});
			return;
		}	
		
		// Clear the results tree and feature store
		app.plugins.CLSPSearch.featureStore = [];
		app.plugins.CLSPSearch.resultsTreeData = [];
		
		// Clear results
		$("#clsps-results").empty();
		$("#clsps-no-results").hide();
				
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CLSPSearch.tabContent)[0]);

		// Define misc variables
		var layersToSearchCount = 0;
		var layerSearchCompletedCount = 0;
		
		// make an ESRI polygon for CLSPSearch
		var esriPolygon = '{"spatialReference":{"latestWkid":3857,"wkid":102100},"rings":[[';
		var rings = "";
		app.plugins.CLSPSearch.searchRadiusFeature.getGeometry().getCoordinates()[0].forEach( function(cord) {
			rings += "["+cord[0]+","+cord[1]+"],";
		});	
		esriPolygon += rings.slice(0, -1) + ']]}'

		var textJSON = '{"queryLayers":['+
		'{"title":"Parcels","id":"1", "orderByFields":"PARCELDESIGNATOR", "outFields":"PARCELDESIGNATOR,PLANNO,FIRSTNATION,PARCELFC_ENG,REMAINDERIND,REMAINDERIND_ENG,PIN,WEBREF_ENG"},'+
		'{"title":"Survey Plans","id":"0", "orderByFields":"PLANNO", "outFields":"PLANNO,P2_DESCRIPTION,P3_DATESURVEYED,SURVEYOR,ALTERNATEPLANNO,WEBREF_ENG"},'+
		'{"title":"Protected Areas","id":"7", "orderByFields":"PARCELDESIGNATOR", "outFields":"PARCELDESIGNATOR,PLANNO,PARCELFC_ENG,REMAINDERIND,REMAINDERIND_ENG,PIN,WEBREF_ENG"},'+
		'{"title":"Surveys in Progress","id":"9", "orderByFields":"PROJECTNUMBER", "outFields":"PROJECTNUMBER,DESCRIPTION,WEBREF_ENG"}'+
		']}';
		const layersToQuery = JSON.parse(textJSON);
		layersToQuery.queryLayers.forEach(function(l){
			// Request survey plans in this area
			$.ajax({
				type: "POST",
				async: false,
				url: app.plugins.CLSPSearch.clspsUrl + l.id + "/query",
				contentType: "application/x-www-form-urlencoded",
				crossDomain: true,
				data: {
					f: "geojson",
					geometry: esriPolygon,
					orderByFields: l.orderByFields,
					outFields: l.outFields,
					returnDistinctValues: false,
					returnGeometry: true,
					spatialRel: "esriSpatialRelIntersects",
					where: "1=1",
					geometryType: "esriGeometryPolygon",
					inSR: "102100",
					featureEncoding: "esriDefault"
				},
				headers: {'accept': 'application/json'}
			})
			
			// Handle the response
			.done(function(response) {
				app.plugins.CLSPSearch.response = response;
				app.plugins.CLSPSearch.addToResultsTreeData(response.features,l.title,l.id);
			})
			
			// Handle a failure
			.fail(function(jqxhr, settings, exception) {
				logger("ERROR", app.plugins.CLSPSearch.name + ": Error querying CLSPSearch");
				app.plugins.CLSPSearch.notifyUserOfFailure("Error querying CLSPSearch" );
				return;
			}); 
		});
		app.plugins.CLSPSearch.showResults();
		spinner.stop();

	}
	
	/**
	 * Function: notifyUserOfFailure
	 * @param (errorText) String
	 * @returns () nothing
	 * Function that notifies user that the SM Session has expired
	 */
	notifyUserOfFailure(errorText) {
			bootbox.dialog({
				title: "CLSPSearch query error",
				message: "<br><center><span style='color:red;'>"+errorText+" </span></center><br>",
				size: "medium",
				closeButton: true
			});
	}	
	
	/**
	 * Function: addToResultsTreeData
	 * @param (object) features
	 * @returns () nothing
	 * Function that adds a result set to the tree view data array
	 */
	addToResultsTreeData(features,title,id) {
		var parentNode = new Object();
		parentNode.text = "Canada Lands "+title+" (" + features.length + ")";
		parentNode.icon = "oi oi-folder";
		parentNode.class = "clsps-treeview-layer";
		parentNode.nodes = [];
		
		// Add each feature found as a child to the parent
		$.each(features, function(index, JSONFeature) {
			// create a 'real' ol feature in map coordinates
			var OlFeature = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(JSONFeature)
			});
			var feature = transformFeature(OlFeature.getFeatures()[0],  "EPSG:4326", "EPSG:3857");			
			// Add parent layer layerId to feature (for later use)
			feature.layerId = 420+id;
			feature.ol_uid = 420+id+index;
			
			// Add feature to feature store
			app.plugins.CLSPSearch.featureStore.push(feature);
			var featureTitle = "";
			$.each(feature.getKeys(), function(key) {
				if ((feature.getKeys()[key] != 'geometry')&&(feature.getKeys()[key] != 'WEBREF_ENG')) {
					featureTitle +=  feature.getKeys()[key] + ": <i>" + feature.get(feature.getKeys()[key]) +"</i><br/>";
				}
			});				
			featureTitle +=  "<a href='" + feature.get("WEBREF_ENG") +"' target='_blank'>Survey Plan Details</a><br/>";
						
			// Build the child (feature) node
			var childNode = new Object();
			childNode.id = "clsps-feature-" + (app.plugins.CLSPSearch.featureStore.length - 1);
			childNode.text = featureTitle;
			childNode.icon = "oi oi-map";
			childNode.class = "clsps-treeview-feature";
			
			// Add child node to parent (layer) node
			parentNode.nodes.push(childNode);
		});
		
		// Add the parent to the results tree data array
		app.plugins.CLSPSearch.resultsTreeData.push(parentNode);
	}
	
	
	/**
	 * Function: showResults
	 * @param () none
	 * @returns () nothing
	 * Function that show the results in a tree view
	 */
	showResults() {	
		/* old
		$( "#clsps-tree" ).accordion({active: 0, heightStyle: "content"});
		*/
		// Show tree if there are results
		if (app.plugins.CLSPSearch.resultsTreeData.length > 0) {
			// Add a tree view div
			$("#clsps-results").append("<div id='clsps-tree'></div>");
			
			// Register and build the treeview
			$("#clsps-tree").bstreeview({
				data: app.plugins.CLSPSearch.resultsTreeData,
				expandIcon: 'oi oi-minus',
				collapseIcon: 'oi oi-plus',
				indent: 1.6,
				openNodeLinkOnNewTab: true
			});
			
			/* Add click event handlers to all of the features
			$(".clsps-treeview-feature").click(function(){
				var featureStoreId = this.id.replace("clsps-feature-", "");
				app.plugins.CLSPSearch.showFeaturePopup(featureStoreId);
			});
			*/
			// Add hover event handlers to all of the features
			$(".clsps-treeview-feature").hover(
				function(){
					// Get the feature
					var featureStoreId = this.id.replace("clsps-feature-", "");
					var feature = app.plugins.CLSPSearch.featureStore[featureStoreId];

					// Highlight it
					highlightFeature(feature);
				},
				function(){
					clearHighlightedFeatures();
				}
			);
			
		// Show no results
		} else {
			$("#clsps-no-results").show();
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
				logger("ERROR", app.plugins.CLSPSearch.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.CLSPSearch.tabNav = tabNav;
			app.plugins.CLSPSearch.tabContent = tabContent;
			
			// Register the get location from map buttons
			$(".clsps-search-point .clsps-get-location-from-map-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".clsps-location-input");
				app.plugins.CLSPSearch.registerMapClickLocation(associatedInput);
			});
			
			// Register the category autocompletes
			$(".clsps-search-point .clsps-location-input").catcomplete({
				minLength: 3,
				source: app.plugins.CLSPSearch.search,
				autoFocus: true,
				select: function(event, selection) {
					app.plugins.CLSPSearch.registerSearchSelectionLocation($(this), selection.item);
				}
			});
			
			// Register the geolocator buttons
			$(".clsps-search-point .clsps-get-geolocation-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".clsps-location-input");
				app.plugins.CLSPSearch.registerDeviceLocation(associatedInput);
			});

			// Register the clear input buttons
			$(".clsps-search-point .clsps-clear-input-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".clsps-location-input");
				associatedInput.val("");
				associatedInput.attr("longitude", null);
				associatedInput.attr("latitude", null);
				app.plugins.CLSPSearch.searchRadiusLayer.getSource().clear();
				$("#clsps-overlay-search-btn").prop('disabled', true);
				
				// Clear results
				$("#clsps-results").empty();
				$("#clsps-no-results").hide();
			});
			
			// Set the NRS WMS location
			app.plugins.CLSPSearch.clspsUrl = app.plugins.CLSPSearch.pcfg.clspsUrl;
			
			// Set the default search distance as per the application configuration
			$("#clsps-search-distance-input").val(app.plugins.CLSPSearch.pcfg.defaultSearchRadiusKm);
			
			// Enable/disable the search distance input as per the application configuration
			$("#clsps-search-distance-input").prop("disabled", !app.plugins.CLSPSearch.pcfg.searchRadiusEditable);
			
			// Constrain the search distance input to numbers within a range
			$("#clsps-search-distance-input").on("input", function() {
				this.value = this.value.replace(/[^0-9.]/g,'').replace(/(\..*)\./g, '$1');
				app.plugins.CLSPSearch.registerSearchRadius();
			});
			
			// Register search button
			$("#clsps-overlay-search-btn").click(function(){
				app.plugins.CLSPSearch.findFeatures();
			});
			
			// Log success
			logger("INFO", app.plugins.CLSPSearch.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}