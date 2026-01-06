class DAGwui {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "DAGwui";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Adjacent Features";
		this.tabContentFile = "application/plugins/DAGwui/tab-content.html";
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
		this.identQueue = [
	{
		type: "wfs",
		name: "roadsRFI",
		desc: "RFI Roads",
		url: "../ogs-geoV06/ows",
		geometry: "GEOLOC",
		transmitter: "DAPNewRoad", // The posse function to accept values
		layer:"V_NM_NLT_RFI_GRFI_SDO_DT",
		fieldToExtract:["NE_DESCR"],
		maxFeatures: 50
	},{
		type: "wfs",
		name: "roadsDRA",
		desc: "Digital Road Atlas (DRA)",
		url: "https://openmaps.gov.bc.ca/geo/pub/ows",
		geometry: "pub:GEOMETRY",
		transmitter: "DAPNewRoad", // The posse function to accept values
		layer:"WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP",
		fieldToExtract:["ROAD_NAME_FULL"],
		maxFeatures: 10
	},{
		type: "wfs",
		name: "contractAreas",
		desc: "Contract Areas",
		url: "../ogs-geoV06/ows",
		transmitter: "DAPSetContractArea", // The posse function to accept values
		geometry: "SHAPE",
		layer:"DSA_CONTRACT_AREA",
		fieldToExtract:["CONTRACT_AREA_NAME"],
		maxFeatures: 5
	},{
		type: "wfs",
		name: "municipalities",
		desc: "Municipalities",
		url: "https://openmaps.gov.bc.ca/geo/pub/ows",
		transmitter: "DAPSetLocalGovernment", // The posse function to accept values
		geometry: "pub:SHAPE",
		layer:"WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP",
		fieldToExtract:["ADMIN_AREA_NAME"],
		maxFeatures: 5
	},{
		type: "wfs",
		name: "regionaldistricts",
		desc: "Regional Districts",
		url: "https://openmaps.gov.bc.ca/geo/pub/ows",
		transmitter: "DAPSetLocalGovernment", // The posse function to accept values
		geometry: "pub:SHAPE",
		layer:"WHSE_ADMIN_BOUNDARIES.EBC_REGIONAL_DISTRICTS_SP",
		fieldToExtract:["REGIONAL_DISTRICT_NAME"],
		maxFeatures: 5
	}
	// PIP layer implementation postoned
	,{
		type: "wfs",
		name: "indigenous",
		desc: "Indigenous Peoples Consultative Areas",
		url: "https://apps.gov.bc.ca/ext/sgw/geo.allgov",   
		transmitter: "DAPSetFNConsultativeArea", 
		geometry: "SHAPE",
		layer:"WHSE_ADMIN_BOUNDARIES.PIP_CONSULTATION_AREAS_SP", 
		fieldToExtract:["ORGANIZATION_GUID","CONTACT_ORGANIZATION_NAME","CONTACT_ADDITIONAL_INFORMATION","CONTACT_NAME","CONTACT_TITLE","CONTACT_ORGANIZATION_NAME","CONTACT_ADDRESS","CONTACT_CITY","CONTACT_PROVINCE","CONTACT_POSTAL_CODE","CONTACT_FAX_NUMBER","CONTACT_PHONE_NUMBER","CONTACT_EMAIL_ADDRESS"],
		maxFeatures: 5
	}

	]		
		// Add popup to map as confirmation of point added
		var popup = $("#popup");
		$("#map").append(popup);	
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
		if (app.plugins.DAGwui.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.DAGwui.searchBcGeoCoder(request, overallResultsAggregator, options);
		}
		
		// Search visible (and configured) layers if configured
		if (app.plugins.DAGwui.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.DAGwui.searchLayers(request, overallResultsAggregator, options);
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
			maxResults: app.plugins.DAGwui.pcfg.geoCoderMaxResults,
			echo: 'false',
			brief: true,
			autoComplete: true,
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.DAGwui.pcfg.geoCoderApiKey
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
					count: app.plugins.DAGwui.pcfg.visibleLayerSearchMaxResults,
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
		app.plugins.DAGwui.registerSearchRadius();
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
			app.plugins.DAGwui.registerSearchRadius();
			
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
				app.plugins.DAGwui.registerSearchRadius();
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
		app.plugins.DAGwui.registerSearchRadius();
	}
	
	/**
	 * Function: registerSearchRadius
	 * @param () none
	 * @returns () nothing
	 * Function that registers the search radius
	 */
	registerSearchRadius() {
		// Disable search button
		$("#dag-overlay-search-btn").prop('disabled', true);
		
		// Clear results
		$("#dag-results").empty();
		$("#dag-no-results").hide();
		
		// Clear existing search radius
		app.plugins.DAGwui.searchRadiusLayer.getSource().clear();
		
		// Get the search from "lat/lon".  Bail if empty.
		var sLongitude = $(".dag-search-point .dag-location-input").attr("longitude");
		var sLatitude = $(".dag-search-point .dag-location-input").attr("latitude");
		if (!sLongitude || !sLatitude) return;
		
		// Get the search distance in metres
		var sDistanceMetres = $("#dag-search-distance-input").val();

		// Adjust radius for current projection (important especially for 3857)
		var radius = sDistanceMetres / ol.proj.getPointResolution(app.map.getView().getProjection(), 1, ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()));
		
		// Build a search radius feature using the search from location and the specified radius (in map projection)
		var searchCircle = new ol.geom.Circle(ol.proj.transform([sLongitude, sLatitude], "EPSG:4326", app.map.getView().getProjection()), radius);
		var searchPolygon = ol.geom.Polygon.fromCircle(searchCircle, 24); // Use 24 sides to reduce the length of the search query string later on
		app.plugins.DAGwui.searchRadiusFeature = new ol.Feature(searchPolygon);
		
		// Show that search radius polygon (if configured for app)
		if (app.plugins.DAGwui.pcfg.showSearchRadiusOnMap) {
			app.plugins.DAGwui.searchRadiusLayer.getSource().addFeature(app.plugins.DAGwui.searchRadiusFeature);
		}
		
		// Zoom to that search radius feature
		zoomToFeature(app.plugins.DAGwui.searchRadiusFeature);
		
		// Enable search button
		$("#dag-overlay-search-btn").prop('disabled', false);
	}
	
	/**
	 * Function: findFeatures
	 * @param () none
	 * @returns () nothing
	 * Function finds features using the specified search parameters
	 */
	findFeatures() {
		// Get the search distance in metres and alert if <= 0
		var sDistanceMetres = $("#dag-search-distance-input").val();
		if (sDistanceMetres <= 0) {
			var errorNotice = bootbox.dialog({
				title: "Error",
				message: "<p class='text-center'>Search Distance must be greater than 0<br></p>",
				closeButton: true
			});
			return;
		}	
		
		// Clear the results tree and feature store
		app.plugins.DAGwui.featureStore = [];
		app.plugins.DAGwui.resultsTreeData = [];
		
		// Clear results
		$("#dag-results").empty();
		$("#dag-no-results").hide();
				
		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.DAGwui.tabContent)[0]);

		// Define misc variables
		var layersToSearchCount = app.plugins.DAGwui.identQueue.length;
		var layerSearchCompletedCount = 0;
		
		// Define the callback function that runs the aggregator after each layer returns a result
		var callback = function(features){
			// don't bother in nothing found
			if (features.length > 0) app.plugins.DAGwui.addToResultsTreeData(features);

			// Increment the counter
			layerSearchCompletedCount++;
			
			if (layerSearchCompletedCount >= layersToSearchCount) {
				// Show results
				app.plugins.DAGwui.showResults();
				
				// Hide the search radius if present
				app.plugins.DAGwui.searchRadiusLayer.getSource().clear();
				
				// Stop showing busy
				spinner.stop();
			}
		}
		
		// Transform the search polygon (circle) into the current layer's native projection and then convert into WKT
		var searchPolygonInLayerNativeProj = transformFeature(app.plugins.DAGwui.searchRadiusFeature, app.map.getView().getProjection().getCode(),"EPSG:3005"); 
		var wktFormat = new ol.format.WKT();
		var searchPolygonWKT = wktFormat.writeGeometry(searchPolygonInLayerNativeProj.getGeometry());
		
		app.plugins.DAGwui.identQueue.forEach(function(l,index){
			l.id = index;

			// Build the CQL_FILTER statement 
			var cqlFilter = "INTERSECTS("+l.geometry+", "+searchPolygonWKT+")";

			// Build the request options
			var options = {
				service: "WFS",
				version: "2.0.0",
				request: "GetFeature", 
				typeNames: l.layer,
				outputFormat: "application/json",
				count: app.plugins.DAGwui.pcfg.proximitySearchMaxResults,
				srsName: app.map.getView().getProjection().getCode(),
				cql_filter: cqlFilter
			}

			// Issue the request
			$.ajax({
				type: "GET",
				url: l.url,
				dataType: "json",
				data: options,
				xhrFields: {
					withCredentials: true
				}
			})		
			// Handle the response
			.done(function(response) {
				callback(response.features);
			})
			
			// Handle a failure
			.fail(function(jqxhr, settings, exception) {
				logger("ERROR", app.plugins.DAGwui.name + ": Error querying features");
				callback([]);
				return;
			}); 
			
		});
		
	}
	
	/**
	 * Function: notifyUserOfFailure
	 * @param (errorText) String
	 * @returns () nothing
	 * Function that notifies user that the SM Session has expired
	 */
	notifyUserOfFailure(errorText) {
			bootbox.dialog({
				title: "DAGwui query error",
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
		// figure out which layer object this is for
		var obj = {};
		app.plugins.DAGwui.identQueue.forEach(function(l,index){
			if (features[0].id.includes(l.layer)) {
				obj = l;
			}
		});
		
		var parentNode = new Object();
		parentNode.text = "Found "+obj.desc+" (" + features.length + ")";
		parentNode.icon = "oi oi-folder";
		parentNode.class = "dag-treeview-layer";
		parentNode.nodes = [];
		
		// Add each feature found as a child to the parent
		$.each(features, function(index,feature) {			
			var featureTitle = "";
			var fieldList = "";
			obj.fieldToExtract.forEach(function(field){
				//TO DO LOOP THROUGH fieldToExtract array and set up transmitter function
				featureTitle += feature.properties[field]+"<br/>";
				fieldList += feature.properties[field]+"[zzz]";
			});
			fieldList = fieldList.slice(0,-5);
			featureTitle +=  "<a class='pull-right import' title='Add to application'><i class='data-transfer-download'></i></a><br/>";
					
			// attach function to send data back to Posse
			feature.transmitter = obj.transmitter; 
			feature.fieldList = fieldList;

			// Add feature to feature store
			app.plugins.DAGwui.featureStore.push(feature);
			
			// Build the child (feature) node
			var childNode = new Object();
			childNode.id = "dag-feature-" + (app.plugins.DAGwui.featureStore.length - 1);
			childNode.text = featureTitle;
			childNode.icon = "oi oi-map"; // change to download icon
			childNode.class = "dag-treeview-feature";
			
			// Add child node to parent (layer) node
			parentNode.nodes.push(childNode);
		});
		
		// Add the parent to the results tree data array
		app.plugins.DAGwui.resultsTreeData.push(parentNode);
	}
	
	
	/**
	 * Function: showResults
	 * @param () none
	 * @returns () nothing
	 * Function that show the results in a tree view
	 */
	showResults() {	
		/* old
		$( "#dag-tree" ).accordion({active: 0, heightStyle: "content"});
		*/
		// Show tree if there are results
		if (app.plugins.DAGwui.resultsTreeData.length > 0) {
			// Add a tree view div
			$("#dag-results").append("<div id='dag-tree'></div>");
			
			// Register and build the treeview
			$("#dag-tree").bstreeview({
				data: app.plugins.DAGwui.resultsTreeData,
				expandIcon: 'oi oi-minus',
				collapseIcon: 'oi oi-plus',
				indent: 1.6,
				openNodeLinkOnNewTab: true
			});
			
			// Add click event handlers to all of the features
			$(".dag-treeview-feature").click(function(){
				var featureStoreId = this.id.replace("dag-feature-", "");
				var feat = app.plugins.DAGwui.featureStore[featureStoreId];
				var transmitter = feat.transmitter;
				var name = feat.fieldList;
				try {
					window.top[transmitter](name);
//					var message = [transmitter,name];
//					top.postMessage(message, "*");

				} catch (error) {
					logger("ERROR", app.plugins.DAGwui.name + ": "+transmitter+" not found");
				}
				$("#popup-content").html("Sending "+name+"... ");
				$("#map #popup").show().delay(3000).fadeOut();
				var sel = "#" + this.id;
				$(sel).css("color","red");
			});
			
			// Add hover event handlers to all of the features
			$(".dag-treeview-feature").hover(
				function(){
					// Get the feature
					var featureStoreId = this.id.replace("dag-feature-", "");
					var feature = app.plugins.DAGwui.featureStore[featureStoreId];
					var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
					
					// Highlight it
					highlightFeature(olFeature);
				},
				function(){
					clearHighlightedFeatures();
				}
			);
			
		// Show no results
		} else {
			$("#dag-no-results").show();
		}		
	}
		
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Demo of new POST capabilities
		console.log("allowUpdate: "+post.allowUpdate);
		console.log("applicationPOSSEObjectId: "+post.applicationPOSSEObjectId);
		console.log("applicationPOSSEObjectId: "+post.applicationPOSSEObjectId);
		console.log("counter: "+post.counter);
		console.log("currentLocation: "+post.currentLocation);
		console.log("locationPOSSEObjectId: "+post.locationPOSSEObjectId);
		console.log("otherLocations: "+post.otherLocations);
		console.log("sessionId: "+post.sessionId);
		console.log("site: "+post.site);
		
		// Bail if map not opened from an application page
		if (!openedWithAppObjId()){
			logger("INFO",  this.name +"Open Map called, exiting");
			return;
		}

		// Define Callback
		var callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.DAGwui.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.DAGwui.tabNav = tabNav;
			app.plugins.DAGwui.tabContent = tabContent;
			
			// Register the get location from map buttons
			$(".dag-search-point .dag-get-location-from-map-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".dag-location-input");
				app.plugins.DAGwui.registerMapClickLocation(associatedInput);
			});
			
			// Register the category autocompletes
			$(".dag-search-point .dag-location-input").catcomplete({
				minLength: 3,
				source: app.plugins.DAGwui.search,
				autoFocus: true,
				select: function(event, selection) {
					app.plugins.DAGwui.registerSearchSelectionLocation($(this), selection.item);
				}
			});
			
			// Register the geolocator buttons
			$(".dag-search-point .dag-get-geolocation-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".dag-location-input");
				app.plugins.DAGwui.registerDeviceLocation(associatedInput);
			});

			// Register the clear input buttons
			$(".dag-search-point .dag-clear-input-btn").click(function(){ 
				var associatedInput = $(this).parent().find(".dag-location-input");
				associatedInput.val("");
				associatedInput.attr("longitude", null);
				associatedInput.attr("latitude", null);
				app.plugins.DAGwui.searchRadiusLayer.getSource().clear();
				$("#dag-overlay-search-btn").prop('disabled', true);
				
				// Clear results
				$("#dag-results").empty();
				$("#dag-no-results").hide();
			});
			
			// Set the default search distance as per the application configuration
			$("#dag-search-distance-input").val(app.plugins.DAGwui.pcfg.defaultSearchRadiusM);
			
			// Enable/disable the search distance input as per the application configuration
			$("#dag-search-distance-input").prop("disabled", !app.plugins.DAGwui.pcfg.searchRadiusEditable);
			
			// Constrain the search distance input to numbers within a range
			$("#dag-search-distance-input").on("input", function() {
				this.value = this.value.replace(/[^0-9.]/g,'').replace(/(\..*)\./g, '$1');
				app.plugins.DAGwui.registerSearchRadius();
			});
			
			// Register search button
			$("#dag-overlay-search-btn").click(function(){
				app.plugins.DAGwui.findFeatures();
			});
			
			// Log success
			logger("INFO", app.plugins.DAGwui.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}