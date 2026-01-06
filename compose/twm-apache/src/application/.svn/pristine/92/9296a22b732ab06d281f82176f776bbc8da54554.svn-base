class Identify2Popup {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "Identify2Popup";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.featureTemplateFile = "application/plugins/Identify2Popup/feature-template.html";
		this.featureTemplate = "";
		this.featureStore = [];
		this.popupContent = $("<div></div>");
		this.addPlugin();
		this.identifyInProgress = false;
		this.clickEventCoordinate;
	}
	
	/**
	 * Function: resultsAggregator
	 * @param (object) layer
	 * @param (object) features
	 * @returns () nothing
	 * Function that aggregates the results from each layer searched
	 */
	resultsAggregator(layer, features) {
		
		// Iterate through features
		$.each(features, function(index, feature) {
			
			// Get the geometry field name
			var geometryFieldName = (feature.hasOwnProperty("geometry_name")) ? feature.geometry_name : "";
			
			// Create and add the feature to the feature store
			var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
			app.plugins.Identify2Popup.featureStore.push(olFeature);
			var featureStoreId = app.plugins.Identify2Popup.featureStore.length - 1;
			
			// Build the feature title and append the keyField value if configured and it exists
			var featureTitle = layer.get("title");
			if (layer.get("fields")) {
				$.each(layer.get("fields"), function(index, configField) {
					if (configField.name) {
						$.each(feature.properties, function(fieldName, fieldValue) {
							if (configField.name == fieldName) {
								if (configField.title) {
									featureTitle += " - <i>"+fieldValue+"</i>";
								} 
							}
						});
					}
				});
			} else {
				featureTitle += " [" + (index + 1) + "]";
			}

			// Make a clone of the feature template
			var clone = app.plugins.Identify2Popup.featureTemplate.clone(true);
			
			// Link (attribute) the feature ID to the table
			clone.attr("featureStoreId", featureStoreId);
			
			// Insert feature title into the clone
			clone.find(".i2p-feature-title").append(featureTitle);
			
			// Hide feature table (clone) if its not the first one
			if (featureStoreId > 0 ) clone.hide();
			
			// Enable the navigate to button if the plugin exists
			if (app.plugins.DynamicRouter) clone.find(".Identify2PopupNavigateTo").show();
			if (app.plugins.SelectTool) clone.find(".Identify2PopupAddFeatureToSelect").show();


			// If the layer fields ARE NOT configured, add them in raw
			if (!layer.get("fields")) {
				$.each(feature.properties, function(fieldName, fieldValue) {
					if (!["BBOX", geometryFieldName.toUpperCase()].includes(fieldName.toUpperCase())) { 
						clone.find("tbody").first().append("<tr><td class='i2p-feature-field-name'>"+fieldName+":</td><td>"+urlify(fieldValue)+"</td></tr>");
					}
				});
			}
			
			// If the layer fields ARE configured, honour the settings
			if (layer.get("fields")) {
				$.each(layer.get("fields"), function(index, configField) {
					// Build the fieldIndex
					var fieldValueIndex = featureStoreId + "-" + configField.name + "-value";
					
					// Get the field name and field value
					var fieldName = configField.name;
					var fieldValue = feature.properties[configField.name];
									
					// Apply custom field name and field value transforms (if configured)
					if (configField.nameTransform) fieldName = configField.nameTransform(fieldName);
					if (configField.valueTransform) fieldValue = configField.valueTransform(fieldValue, feature);
		
					// If fieldValue is a boolean false, then don't show field record at all
					if (fieldValue === false) return;
					
					// If visible property is a boolean false, then don't show field record at all
					if(configField.visible === false) return;
					
					// Convert null field value to blank (visually better)
					if (fieldValue === null) fieldValue = "";
						
					// Append field value to existing field record (if configured)
					if (configField.appendToField) {
						var appendToFieldIndex = featureStoreId + "-" + configField.appendToField + "-value";
						var target = clone.find("[fieldIndex='"+appendToFieldIndex+"']")
						target.append(fieldValue);
					
					// Add field name and/or value as configured
					} else {
						// If fieldName is a boolean false, then don't show field name
						if (fieldName === false) {
							clone.find("tbody").first().append("<tr><td fieldIndex='"+fieldValueIndex+"' colspan='2'>"+fieldValue+"</td></tr>");
						} else {
							clone.find("tbody").first().append("<tr><td class='i2p-feature-field-name'>"+fieldName+"</td><td fieldIndex='"+fieldValueIndex+"'>"+fieldValue+"</td></tr>");
						}
					}
				
				});
			}
			
			// Append clone to the popup content
			app.plugins.Identify2Popup.popupContent.append(clone);
		});
	}

	/**
	 * Function: registerResultEventHandlers
	 * @param () none
	 * @returns () nothing
	 * Function that registers each result's event handlers
	 */
	registerResultEventHandlers() {
		
		// Register the click event to send the highlighed feature to the select tool
		$(".Identify2PopupAddFeatureToSelect").on("click", function(e) {
			$("#st-feature-container").empty();
			var featureData  = app.highlightLayer.getSource().getFeatures()[0]
			var featureID = featureData.ol_uid;
			var featureTitle = $(".i2p-feature-title:visible").text().trim();
			var geomType =featureData.getGeometry().getType();
			if(geomType == "Polygon"){
				app.plugins.SelectTool.drawPolygon.getSource().addFeature(featureData);
			}
			if(geomType == "LineString"){
				app.plugins.SelectTool.drawPolygon.getSource().addFeature(featureData);
			}
			if(geomType == "Point"){
				app.plugins.SelectTool.drawPoint.getSource().addFeature(featureData);
			}
			$("#st-byFeature-search-btn").prop('disabled', false);

			var featureButton = $(`
					<div class="st-route-item" id="st-feature-${featureID}">
						
						<div class="st-route-locations">
							<div><span class="st-feature-title"><strong>${featureTitle}</strong></span></div>
						</div>
					</div>
				`);
			
			//For select tool functionality, add the route to the select tool
			featureData.set('featureID', "st-feature-"+featureID);
			
			//Append the route data to the div
			featureButton.data("featureObject", featureData);

			//Add route id to route
			$("#st-feature-container").append(featureButton);
			
			//Enable By Feature Tab
			$("#st-byFeature-tab").prop('disabled', false);

			// Activate the Select Tool sidebar tab
			activateSidebarTab(app.plugins.SelectTool.tabNav);
			setTimeout(() => {
				const $byfeatureTab = $("#st-byFeature-tab");
				if ($byfeatureTab.length) {
					// Scroll the tab into view if needed
					$byfeatureTab[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
					// Click the tab
					$byfeatureTab.click();
				}
			}, 500);
			// ...existing code...
				
			
			

		})
		// Register all of the navigate to click event handlers
		$("#Identify2PopupNavigateTo").on("click", function(e) {
			// Remove all pre-existing way points
			$(".dr-way-point").remove();
			
			// Define the start and end elements
			var locationStartInput = $("#dr-start-point .dr-location-input");
			var locationEndInput = $("#dr-end-point .dr-location-input");
			
			// Clear both the start and end elements
			locationStartInput.val("");
			locationStartInput.attr("longitude", null);
			locationStartInput.attr("latitude", null);
			locationEndInput.val("");
			locationEndInput.attr("longitude", null);
			locationEndInput.attr("latitude", null);
			
			// Add device current location into the start location input
			app.plugins.DynamicRouter.registerDeviceLocation(locationStartInput);
			
			// Add current feature location into the end location input
			var featureStoreId = $(this).closest("table").attr("featureStoreId");
			app.plugins.DynamicRouter.registerFeatureLocation(locationEndInput, app.plugins.Identify2Popup.featureStore[featureStoreId]);
			
			// Close the popup
			closePopup();
			
			// Show the router tab
			activateSidebarTab(app.plugins.DynamicRouter.tabNav);

			// Show sidebar immediately if desktop
			if (!isMobile()) showSidebar();
		});

		
		
	}
	
	/**
	 * Function: showResult
	 * @param () none
	 * @returns () nothing
	 * Function that shows the result (in a paginated popup if required)
	 */
	showResult() {
		// Reset identify progress status
		app.plugins.Identify2Popup.identifyInProgress = false;
		
		// Bail if no results
		if (app.plugins.Identify2Popup.featureStore.length == 0) return;
				
		// Add paging div if required	
		if (app.plugins.Identify2Popup.featureStore.length > 1) {
			var pager = $("<div onselectstart='return false'></div>");
			pager.attr("id", "i2p-paging");
			pager.attr("currentFeatureStoreId", 0);
			pager.attr("maxFeatureStoreId", (app.plugins.Identify2Popup.featureStore.length - 1));
			pager.append("<span class='oi oi-chevron-left i2p-page-left' title='Previous' onclick='app.plugins.Identify2Popup.switchPage(-1)'></span>");
			pager.append("<span id='i2p-paging-text'>1 of " + app.plugins.Identify2Popup.featureStore.length + "</span>");
			pager.append("<span class='oi oi-chevron-right i2p-page-right' title='Next' onclick='app.plugins.Identify2Popup.switchPage(1)'></span>");
			app.plugins.Identify2Popup.popupContent.append(pager);
		}
		
		// Get the first feature (this is to base the highlight and popup location on)
		var feature = app.plugins.Identify2Popup.featureStore[0];
		
		// Define popup location on map
		var popupLocation = app.plugins.Identify2Popup.clickEventCoordinate;
		
		// Highlight the current feature
		highlightFeature(feature);
		
		// Adjust popup content dimensions
		app.plugins.Identify2Popup.adjustPopupContent();
			
		// Show the popup
		showPopup(popupLocation, app.plugins.Identify2Popup.popupContent);
		
		// Register button handlers
		app.plugins.Identify2Popup.registerResultEventHandlers();
	}
	
	/**
	 * Function: switchPage
	 * @param (integer) direction
	 * @returns () nothing
	 * Function that switches
	 */
	switchPage(direction) {
		// Determine which record to switch to
		var currentFeatureStoreId = parseInt($("#i2p-paging").attr("currentFeatureStoreId"));
		var maxFeatureStoreId = parseInt($("#i2p-paging").attr("maxFeatureStoreId"));
		var newCurrentFeatureStoreId = currentFeatureStoreId + direction;
		if (newCurrentFeatureStoreId > maxFeatureStoreId) newCurrentFeatureStoreId = 0;
		if (newCurrentFeatureStoreId < 0) newCurrentFeatureStoreId = (app.plugins.Identify2Popup.featureStore.length - 1);
		
		// Update the new current record
		$("#i2p-paging").attr("currentFeatureStoreId", newCurrentFeatureStoreId);
		
		// Update display
		$("#i2p-paging-text").html((newCurrentFeatureStoreId + 1) + " of " + app.plugins.Identify2Popup.featureStore.length);
		
		// Get the feature
		var feature = app.plugins.Identify2Popup.featureStore[newCurrentFeatureStoreId];
		
		// Define popup location on map
		var popupLocation = app.plugins.Identify2Popup.clickEventCoordinate;
		
		// Highlight the current feature
		highlightFeature(feature);
		
		// Reposition popup to feature center
		setTimeout(function(){
			app.popupOverlay.setPosition(undefined);
			app.popupOverlay.setPosition(popupLocation);
			doLayout();
		}, 50);
		
		// Loop through all of the feature tables.  Show the active one, hide the rest.
		$.each($('.i2p-feature-table'), function(index, element) { 
			if ($(element).attr("featureStoreId") == newCurrentFeatureStoreId) {
				$(element).show();
			} else {
				$(element).hide();
			}
		});
	}
	
	/**
	 * Function: clear
	 * @param () none
	 * @returns () nothing
	 * Function that clears any previous results
	 */
	clear() {
		// Reset the popup content
		app.plugins.Identify2Popup.popupContent = $("<div></div>");
		
		// Reset the feature store
		app.plugins.Identify2Popup.featureStore = [];
	}
	
	/**
	 * Function: identify
	 * @param (object) event
	 * @returns () nothing
	 * Function that searches for features under click location
	 */
	identify(event) {
		// Bail if another identify is in progress
		if (app.plugins.Identify2Popup.identifyInProgress) return;
		
		// Store the click event coordinate for later use
		app.plugins.Identify2Popup.clickEventCoordinate = event.coordinate;
		
		// Close existing popup if exists
		closePopup();
		
		// Clear any previous results
		app.plugins.Identify2Popup.clear();
		
		// Define misc variables
		var layersToSearchCount = 0;
		var layerSearchCompletedCount = 0;
		
		// Define the callback function that runs the aggregator after each layer returns a result
		var callback = function(layer, features){
			layerSearchCompletedCount++;
			if (features.length > 0) app.plugins.Identify2Popup.resultsAggregator(layer, features);
			if (layerSearchCompletedCount >= layersToSearchCount) app.plugins.Identify2Popup.showResult();
		}
		
		// Determine how many layers there are to search
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Determine if layer has a "prevent identify" configured
			var preventIdentify = layer.get("preventIdentify") ? layer.get("preventIdentify") : false;
			
			// Special case for identifying vector tile baselayer
			if (layer.get("allowVectorFeaturesToBeIdentified") === true) {
				layersToSearchCount++;
			}			
			
			// Vector layers
			if (layer.get("visible") === true && preventIdentify === false && layer.get("title") && layer instanceof ol.layer.Vector ) {
				layersToSearchCount++;
			}
			
			// WMS layers
			if (layer.get("visible") === true && preventIdentify === false && typeof layer.getSource().getFeatureInfoUrl == "function") {
				layersToSearchCount++;
			}
		});
		
		// If there are no layers to search, run the result compiler to show no results
		if (layersToSearchCount == 0) {
			callback({}, []);
			return;
		}
		
		// Toggle that identify is in progress
		app.plugins.Identify2Popup.identifyInProgress = true;

		// Loop through all of the map layers
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			
			// Determine if layer has a "prevent identify" configured.  If so, skip layer.
			var preventIdentify = layer.get("preventIdentify") ? layer.get("preventIdentify") : false;
			if (preventIdentify) return;
			
			// Special case for identifying vector tile baselayer
			if (layer.get("allowVectorFeaturesToBeIdentified") === true) {
				// Get all vector tile features close to click
				var pixel = app.map.getEventPixel(event.originalEvent);
				var foundFeatures = app.map.getFeaturesAtPixel(pixel,{
					hitTolerance: 10, 
					layerFilter: function(l) { 
						return (ol.util.getUid(l) == ol.util.getUid(layer));
					}
				});

				// Convert vector tile features into openlayers features
				var cf = [];
				$.each(foundFeatures, function(index, feature) {
					var f = {};
					f.type = "Feature";
					f.id = (feature.getId()) ? feature.getId() : index;
					f.geometry_name = "geometry";
					f.geometry = {};
					f.geometry.type = feature.type_;
					var x = null;
					var y = null;
					var pairComplete = false;
					var coordinates = [];
					$.each(feature.flatCoordinates_, function(index, coord) {
						if ((index & 1) === 0) {
							x = coord;
						} else {
							y = coord;
							pairComplete = true;
						}
						if (pairComplete) {
							coordinates.push([x,y]);
							pairComplete = false;
						}
					});
					f.geometry.coordinates = [coordinates];
					f.properties = feature.getProperties();
					cf.push(f);
				});
				callback(layer, cf);
			}
			 
			// Vector :: Perform a GetFeature
			if (layer.get("visible") === true && layer.get("title") && layer instanceof ol.layer.Vector) {
				// Get all vector features close to click
				var pixel = app.map.getEventPixel(event.originalEvent);
				var foundFeatures = app.map.getFeaturesAtPixel(pixel,{
					hitTolerance: 10, 
					layerFilter: function(l) { 
						if (ol.util.getUid(l) == ol.util.getUid(layer)) return true; else return false;
					}
				});

				// Convert returned features into a format similar to what GetFeatureInfo returns (so we can use the same aggregator function)
				var cf = [];
				$.each(foundFeatures, function(index, feature) {
					
					// Cluster vector layer
					if (feature.get("features")) {
						$.each(feature.get("features"), function(index2, clusterFeature) {
							var f = {};
							f.type = "Feature";
							f.id = clusterFeature.getId();
							f.geometry_name = clusterFeature.getGeometryName();
							f.geometry = {};
							f.geometry.type = clusterFeature.getGeometry().getType();
							f.geometry.coordinates = clusterFeature.getGeometry().getCoordinates();
							f.properties = clusterFeature.getProperties();
							cf.push(f);
						});
					
					// Non cluster vector layer
					} else {
						var f = {};
						f.type = "Feature";
						f.id = feature.getId();
						f.geometry_name = feature.getGeometryName();
						f.geometry = {};
						f.geometry.type = feature.getGeometry().getType();
						
						// Some KML/KMZ (especially those produced from GeoServer) have multi-geometry.  If this is the case, get the first feature (TODO: Improve)
						if (typeof feature.getGeometry().getGeometries === "function") {
							f.geometry.coordinates = feature.getGeometry().getGeometries()[0].getCoordinates();
						
						// Fallback to the generic
						} else {
							f.geometry.coordinates = feature.getGeometry().getCoordinates();
						}
						
						f.properties = feature.getProperties();
						cf.push(f);
					}

				});
				callback(layer, cf);
			}
			
			// WMS :: Perform a GetFeatureInfo
			if (layer.get("visible") === true && typeof layer.getSource().getFeatureInfoUrl == "function") {
				// Build the request url
				// some layers have overrides to deal with ESRI shortcomings
				var infoFormat = (layer.infoFormat) ? layer.infoFormat : "application/json";
				var xslTemplate = (layer.xslTemplate) ? layer.xslTemplate: "";
				var gfiUrl = layer.getSource().getFeatureInfoUrl(
					event.coordinate,
					app.map.getView().getResolution(),
					app.map.getView().getProjection().getCode(),
					{
						"INFO_FORMAT": infoFormat,
						"xsl_template": xslTemplate,
						"FEATURE_COUNT": app.plugins.Identify2Popup.pcfg.maxResults
					}
				);
						
				// Define request timeout
				var requestTimeout = (app.plugins.Identify2Popup.pcfg.requestTimeout) ? app.plugins.Identify2Popup.pcfg.requestTimeout : 5000;
						
				// Issue the request
				$.ajax({
					type: "GET",
					url: gfiUrl,
					dataType: "json",
					timeout: requestTimeout,
					xhrFields: {
						withCredentials: (layer.get("withCredentials")) ? layer.get("withCredentials") : false
					}
				})
				
				// Handle the response
				.done(function(response) {
					callback(layer, response.features);
				})
				
				// Handle a failure
				.fail(function(jqxhr, settings, exception) {
					callback(layer, []);
					logger("ERROR", "I2P: Error querying " + layer.get("title") + " - " + exception);
				});
			}
			
		});
	}

	/**
	 * Function: adjustPopupContent
	 * @param () none
	 * @returns () nothing
	 * Function to adjust popup content dimensions
	 */
	adjustPopupContent() {
		app.plugins.Identify2Popup.popupContent.find(".i2p-feature-table tbody").css("max-height", (app.popupMaxHeight - 95)+"px");
	}
		
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function(success, content){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.Identify2Popup.name + ": Plugin failed to initialize");
				return;
			}

			// Set the feature template variable to the returned html content
			app.plugins.Identify2Popup.featureTemplate = $(content);

			// Register window height listener that makes adjustments popup content dimensions
			$(window).resize(function() {
				app.plugins.Identify2Popup.adjustPopupContent();
			});
		
			// Register this plugin as the default map single click function
			registerDefaultMapSingleClickFunction("default", app.plugins.Identify2Popup.identify);

			// Log success
			logger("INFO", app.plugins.Identify2Popup.name + ": Plugin successfully loaded");
		}
		
		// Load the feature template
		loadTemplate(this.featureTemplateFile, callback);
	}
}