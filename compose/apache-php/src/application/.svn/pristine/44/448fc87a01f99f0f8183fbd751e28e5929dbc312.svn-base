class ILRRAPI {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ILRRAPI";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Query ILRR";
		this.tabContentFile = "application/plugins/ILRRAPI/tab-content.html";
		this.ilrrUrl = returnEnvironmentUrl("ilrr-rest"); 
		this.nrsGeoUrl = ""; // passed in from config
		this.GUID = "";
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
		if (app.plugins.ILRRAPI.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.ILRRAPI.searchBcGeoCoder(request, overallResultsAggregator, options);
		}
		
		// Search visible (and configured) layers if configured
		if (app.plugins.ILRRAPI.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.ILRRAPI.searchLayers(request, overallResultsAggregator, options);
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
			maxResults: app.plugins.ILRRAPI.pcfg.geoCoderMaxResults,
			echo: 'false',
			brief: true,
			autoComplete: true,
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.ILRRAPI.pcfg.geoCoderApiKey
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
					count: app.plugins.ILRRAPI.pcfg.visibleLayerSearchMaxResults,
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
		app.plugins.ILRRAPI.registerSearchRadius();
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
			app.plugins.ILRRAPI.registerSearchRadius();
			
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
				app.plugins.ILRRAPI.registerSearchRadius();
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
		app.plugins.ILRRAPI.registerSearchRadius();
	}
	
	/**
	 * Function: registerSearchRadius
	 * @param () none
	 * @returns () nothing
	 * Function that registers the search radius
	 */
	registerSearchRadius() {
		// Disable search button
		$("#fp-overlay-search-btn").prop('disabled', true);
		
		// Clear results
		$("#fp-results").empty();
		$("#fp-no-results").hide();
		
		// Clear existing search radius
		app.plugins.ILRRAPI.searchRadiusLayer.getSource().clear();
		
		// Get the search from "lat/lon".  Bail if empty.
		var sLongitude = $(".fp-search-point .fp-location-input").attr("longitude");
		var sLatitude = $(".fp-search-point .fp-location-input").attr("latitude");
		if (!sLongitude || !sLatitude) return;
		
		// Get the search distance in metres
		var sDistanceMetres = $("#fp-search-distance-input").val() * 1000;

		// Adjust radius for current projection (important especially for 3857)
		var radius = sDistanceMetres / ol.proj.getPointResolution(app.map.getView().getProjection(), 1, ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()));
		
		// Build a search radius feature using the search from location and the specified radius (in map projection)
		var searchCircle = new ol.geom.Circle(ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()), radius);
		var searchPolygon = ol.geom.Polygon.fromCircle(searchCircle, 24); // Use 24 sides to reduce the length of the search query string later on
		app.plugins.ILRRAPI.searchRadiusFeature = new ol.Feature(searchPolygon);
		
		// Show that search radius polygon (if configured for app)
		if (app.plugins.ILRRAPI.pcfg.showSearchRadiusOnMap) {
			app.plugins.ILRRAPI.searchRadiusLayer.getSource().addFeature(app.plugins.ILRRAPI.searchRadiusFeature);
		}
		
		// Zoom to that search radius feature
		zoomToFeature(app.plugins.ILRRAPI.searchRadiusFeature);
		
		// Enable search button
		$("#fp-overlay-search-btn").prop('disabled', false);
	}
	
	/**
	 * Function: findFeatures
	 * @param () none
	 * @returns () nothing
	 * Function finds features using the specified search parameters
	 */
	findFeatures() {
		// Get the search distance in metres and alert if <= 0
		var sDistanceMetres = $("#fp-search-distance-input").val() * 1000;
		if (sDistanceMetres <= 0) {
			var errorNotice = bootbox.dialog({
				title: "Error",
				message: "<p class='text-center'>Search Distance must be greater than 0<br></p>",
				closeButton: true
			});
			return;
		}
		
		// Clear the results tree and feature store
		app.plugins.ILRRAPI.featureStore = [];
		app.plugins.ILRRAPI.resultsTreeData = [];
		
		// Clear results
		$("#fp-results").empty();
		$("#fp-no-results").hide();
				
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.ILRRAPI.tabContent)[0]);
		
		// Define misc variables
		var layersToSearchCount = 0;
		var layerSearchCompletedCount = 0;
		
		// new for ILRR
		var searchPolygonInLayer3005 = transformFeature(app.plugins.ILRRAPI.searchRadiusFeature, app.map.getView().getProjection().getCode(), "EPSG:3005");
		var wktFormat = new ol.format.WKT();
		var searchPolygonWKT = wktFormat.writeGeometry(searchPolygonInLayer3005.getGeometry());						

		// Get the GUID
		$.ajax({
			type: "POST",
			url: app.plugins.ILRRAPI.ilrrUrl + "/reports/areaOfInterestAlbersWKT/",
			xhrFields: {
				withCredentials: true
			},
			contentType: "text/plain",
			crossDomain: true,
			data: searchPolygonWKT
		})
		
		// Handle the response
		.done(function(response) {
			app.plugins.ILRRAPI.GUID = response;
			
			// Now get the report
			$.ajax({
				type: "GET",
				url: app.plugins.ILRRAPI.ilrrUrl + "/reports/summaryReport/" + app.plugins.ILRRAPI.GUID,
				xhrFields: {
					withCredentials: true
				},
				headers: {'accept': 'application/json'}
			})
			
			// Handle the response
			.done(function(response) {
				app.plugins.ILRRAPI.addToResultsTreeData(response);
				app.plugins.ILRRAPI.showResults();
				spinner.stop();
		
			})
			
			// Handle a failure
			.fail(function(jqxhr, settings, exception) {
				logger("ERROR", app.plugins.ILRRAPI.name + ": Error retrieving data ");
				app.plugins.ILRRAPI.notifyUserOfFailure(jqxhr.responseText);
				spinner.stop();
				return;
			}); 
			
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", app.plugins.ILRRAPI.name + ": Error querying ILRR");
			app.plugins.ILRRAPI.notifyUserOfFailure("unable to retrieve GUID" );
			spinner.stop();
			return;
		}); 

	}
	
	/**
	 * Function: notifyUserOfFailure
	 * @param (errorText) String
	 * @returns () nothing
	 * Function that notifies user that the SM Session has expired
	 */
	notifyUserOfFailure(errorText) {
		console.log("hey");
			bootbox.dialog({
				title: "ILRR query error",
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
	addToResultsTreeData(features) {	
		// Build the Accordian view
		$("#fp-results").append("<div id='fp-tree'></div>");
		$("#fp-tree").accordion();	

		if (features.summaryRptInts.length > 0) {

			// The first accordian section gives the count and a link to a detailed report
			var reportTitle = "<h3>" + features.summaryRptInts.length + " Interests";
			reportTitle += features.notificationText.length > 0 ? " (read notice)</h3>" : "</h3>";
			$("#fp-tree").append(reportTitle);	
			var linkToDetailPDF = "<a class='ui-button ui-widget ui-corner-all'  href= '" + app.plugins.ILRRAPI.ilrrUrl + "/reports/download/detailPDF/"+ app.plugins.ILRRAPI.GUID + "' target='__blank'>Detail Report</a><br/>" ;
			if (features.notificationText.length > 0) {
				$("#fp-tree").append("<div><p>" + linkToDetailPDF + features.notificationText + "</p></div>");
			} else {
				$("#fp-tree").append("<div>" + linkToDetailPDF + "</div>");
			}
			$("#fp-tree").accordion( "refresh" );	
	
			// Get the feature and add it to feature store and to the accordian
			$.each(features.summaryRptInts, function(index, feature) {	
				app.plugins.ILRRAPI.pushInterestToFeatureStore(feature.interestType,feature.cwmLayer.layerName, feature.cwmLayer.identifierName, feature.ilrrInterestId, index);	
			});
			
		} else {
			$("#fp-tree").append("<h3>0 Interests</h3><div><p>No interests found</p></div>");
		}
			
	}
	
	/**
	 * Function: pushInterestToFeatureStore
	 * @param (string) layerName
	 * @param (string) idColumn
	 * @param (string) id
	 * Function to highlight selected interest on map
	 */
	 pushInterestToFeatureStore(title, layerName, idColumn, id, listId) {
		var wmsUrl = app.plugins.ILRRAPI.nrsGeoUrl;
		var filter='cql_filter='+idColumn+"="+id;//'<Filter><PropertyIsEqualTo><PropertyName>'+idColumn+'</PropertyName><Literal>'+id+'</Literal></PropertyIsEqualTo></Filter>';	
		var gfUrl = wmsUrl + "?service=WFS&version=1.1.0&request=GetFeature&srsName=EPSG:3857&typename="+layerName+"&outputformat=application/json&"+filter; //="+filter
		// Issue the request
		$.ajax({
			type: "GET",
			url: gfUrl,
			dataType: "json",
			timeout: 5000
		})
		
		// Handle the response
		.done(function(response) {
			var feature = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(response)
			});
			var singleFeature = feature.getFeatures()[0];
			// some responses have multiple features with identical attributes so I bundle them together
			var multiPoly = {};
			if (feature.getFeatures().length > 1) {
				multiPoly = new ol.geom.MultiPolygon(singleFeature.getGeometry().getCoordinates());			
				$.each(feature.getFeatures(),function(index,feat) {
					console.log("about to append a polygon from ");
					if (feat.getGeometry().getType()=='MultiPolygon') {
						$.each(feat.getGeometry().getPolygons(), function(i,poly){
							multiPoly.appendPolygon(poly);
						});
					} else { // it is a polygon
						multiPoly.appendPolygon(feat.getGeometry());
					}					
				});
				singleFeature.setGeometry(multiPoly);
			}				
			// Add report index as layerId to feature (for later use)
			singleFeature.layerId = listId;			
			// Add feature to feature store
			app.plugins.ILRRAPI.featureStore.push(singleFeature);

			// Build the feature entry
			$("#fp-tree").append("<h3 id=fp-feature-" + app.plugins.ILRRAPI.featureStore.length  + ">" + title + " [" + id + "] </h3>");
			var featureEntry = "<div id=fp-feature-detail-" + app.plugins.ILRRAPI.featureStore.length  + "><p>";
			$.each(singleFeature.getKeys(), function(key) {
				if (singleFeature.getKeys()[key] != 'geometry') {
					featureEntry +=  singleFeature.getKeys()[key] + ": " + singleFeature.get(singleFeature.getKeys()[key]) +"<br/>";
				}
			});
			var zoomTo = '<br/><button type="button" id=fp-feature-zoom-' + app.plugins.ILRRAPI.featureStore.length  + ' class="btn btn-secondary btn-sm Identify2TabZoomTo">' +
							'<span class="oi oi-zoom-in" title="Zoom to"></span>' +
						'</button>';
			featureEntry += zoomTo;
			featureEntry += "</p></div>"
			$("#fp-tree").append(featureEntry);
			$("#fp-tree").accordion( "refresh" );	

			// Add hover event handler to highlight feature
			$("#fp-feature-" + app.plugins.ILRRAPI.featureStore.length).hover(
				function(){
					// Get the feature
					var featureStoreId = parseInt(this.id.replace("fp-feature-", "")) - 1;
					var feature = app.plugins.ILRRAPI.featureStore[featureStoreId];		
					feature.ol_uid = 420;		
					highlightFeature(feature);
				},
				function(){
					clearHighlightedFeatures();
				}
			);
			$("#fp-feature-detail-" + app.plugins.ILRRAPI.featureStore.length).hover(
				function(){
					// Get the feature
					var featureStoreId = parseInt(this.id.replace("fp-feature-detail-", "")) - 1;
					var feature = app.plugins.ILRRAPI.featureStore[featureStoreId];		
					feature.ol_uid = 420;		
					highlightFeature(feature);
				},
				function(){
					clearHighlightedFeatures();
				}
			);
			// Register the zoom to extent click event handlers
			$("#fp-feature-zoom-" + app.plugins.ILRRAPI.featureStore.length).on("click", function(e) {
				var featureStoreId = parseInt(this.id.replace("fp-feature-zoom-", "")) - 1;
				var feature = app.plugins.ILRRAPI.featureStore[featureStoreId];		
				feature.ol_uid = 420;		
				if (isMobile()) hideSidebar();
				zoomToFeature(feature);
				highlightFeature(feature);
			});	
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "ILRRAPI: Error querying " + layerName);
		});		

	}
	
	/**
	 * Function: showResults
	 * @param () none
	 * @returns () nothing
	 * Function that show the results in a tree view
	 */
	showResults() {	
		// Open first accordian level
		$( "#fp-tree" ).accordion({active: 0, heightStyle: "content"});
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
				logger("ERROR", app.plugins.ILRRAPI.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.ILRRAPI.tabNav = tabNav;
			app.plugins.ILRRAPI.tabContent = tabContent;
			
			// Register the get location from map buttons
			$(".fp-search-point .fp-get-location-from-map-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".fp-location-input");
				app.plugins.ILRRAPI.registerMapClickLocation(associatedInput);
			});
			
			// Register the category autocompletes
			$(".fp-search-point .fp-location-input").catcomplete({
				minLength: 3,
				source: app.plugins.ILRRAPI.search,
				autoFocus: true,
				select: function(event, selection) {
					app.plugins.ILRRAPI.registerSearchSelectionLocation($(this), selection.item);
				}
			});
			
			// Register the geolocator buttons
			$(".fp-search-point .fp-get-geolocation-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".fp-location-input");
				app.plugins.ILRRAPI.registerDeviceLocation(associatedInput);
			});

			// Register the clear input buttons
			$(".fp-search-point .fp-clear-input-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".fp-location-input");
				associatedInput.val("");
				associatedInput.attr("longitude", null);
				associatedInput.attr("latitude", null);
				app.plugins.ILRRAPI.searchRadiusLayer.getSource().clear();
				$("#fp-overlay-search-btn").prop('disabled', true);
				
				// Clear results
				$("#fp-results").empty();
				$("#fp-no-results").hide();
			});
			
			// Set the NRS WMS location
			app.plugins.ILRRAPI.nrsGeoUrl = app.plugins.ILRRAPI.pcfg.nrsGeoUrl;
			
			// Set the default search distance as per the application configuration
			$("#fp-search-distance-input").val(app.plugins.ILRRAPI.pcfg.defaultSearchRadiusKm);
			
			// Enable/disable the search distance input as per the application configuration
			$("#fp-search-distance-input").prop("disabled", !app.plugins.ILRRAPI.pcfg.searchRadiusEditable);
			
			// Constrain the search distance input to numbers within a range
			$("#fp-search-distance-input").on("input", function() {
				this.value = this.value.replace(/[^0-9.]/g,'').replace(/(\..*)\./g, '$1');
				app.plugins.ILRRAPI.registerSearchRadius();
			});
			
			// Register search button
			$("#fp-overlay-search-btn").click(function(){
				app.plugins.ILRRAPI.findFeatures();
			});
			
			// Log success
			logger("INFO", app.plugins.ILRRAPI.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}