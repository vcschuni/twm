class RestrictionDataManager {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "RestrictionDataManager";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Restriction Data Manager";
		this.tabContentFile = "application/plugins/RestrictionDataManager/content.html";
		this.tabNav;
		this.tabContent;
		this.saveInProgress = false;
		this.currentUser;
		this.focusSegment = null; // OpenLayers feature of ITN segment linked to focus location
		this.focusLocation = null; // OpenLayers feature of focus location
		this.focusLocationChanges = new Object();
		this.focusRestrictionChanges = new Object();
		this.focusFeatureChanges = new Object();
		this.focusUserChanges = new Object();
		this.focusUserGroupChanges = new Object();
		this.userManagerSearchTimer;
		this.featureManagerSearchTimer;
		this.codes = new Object();
		this.schemas = new Object();
		this.spinner;
		
		// Define the restriction direction layer (added to the map of each 
		// individual restriction when it's editor window is opened).
		this.restrictionDirectionLayer = new ol.layer.Vector({
			source: new ol.source.Vector({})
		});
		
		// Define and add dropped location layer
		this.droppedLocationLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 10,
					stroke: new ol.style.Stroke({
						color: "rgba(254, 192, 9, 1)",
						width: 4
					}),
					fill: new ol.style.Fill({
						color: "rgba(0, 0, 0, 0.7)"
					})
				})
			})
		});
		app.map.addLayer(this.droppedLocationLayer);
		this.droppedLocationLayer.setZIndex(655);
		
		// Get the RDM Location layers (by their titles)
		this.resolvedLocationsLayerIsLoading = false;
		this.resolvedLocationsLayer = getLayerByTitle("Resolved Locations");
		this.unresolvedLocationsLayerIsLoading = false;
		this.unresolvedLocationsLayer = getLayerByTitle("Unresolved Locations");
		this.problemLocationsLayerIsLoading = false;
		this.problemLocationsLayer = getLayerByTitle("Problem Locations");
		
		// Add event listeners to the RDM Location Layers
		this.resolvedLocationsLayer.getSource().getSource().on("featuresloadstart", function () {
			app.plugins.RestrictionDataManager.resolvedLocationsLayerIsLoading = true;				
		});
		this.resolvedLocationsLayer.getSource().getSource().on("featuresloadend", function () {
			app.plugins.RestrictionDataManager.resolvedLocationsLayerIsLoading = false;
			app.plugins.RestrictionDataManager.updateStatistics();
		});
		this.unresolvedLocationsLayer.getSource().getSource().on("featuresloadstart", function () {
			app.plugins.RestrictionDataManager.unresolvedLocationsLayerIsLoading = true;				
		});
		this.unresolvedLocationsLayer.getSource().getSource().on("featuresloadend", function () {
			app.plugins.RestrictionDataManager.unresolvedLocationsLayerIsLoading = false;
			app.plugins.RestrictionDataManager.updateStatistics();		
		});
		this.problemLocationsLayer.getSource().getSource().on("featuresloadstart", function () {
			app.plugins.RestrictionDataManager.problemLocationsLayerIsLoading = true;				
		});
		this.problemLocationsLayer.getSource().getSource().on("featuresloadend", function () {
			app.plugins.RestrictionDataManager.problemLocationsLayerIsLoading = false;
			app.plugins.RestrictionDataManager.updateStatistics();		
		});
		
		// Run the init
		this.addPlugin();
	}
	
	/**
	 * Function: showSpinner
	 * @param () none
	 * @returns () nothing
	 * Function that shows the tab spinner
	 */
	showSpinner() {
		if (this.spinner) {
			this.spinner.spin($(app.plugins.RestrictionDataManager.tabContent)[0]);
		} else {
			this.spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.RestrictionDataManager.tabContent)[0]);
		}
	}

	/**
	 * Function: hideSpinner
	 * @param () none
	 * @returns () nothing
	 * Function that hides the tab spinner
	 */
	hideSpinner() {
		setTimeout(function(){ app.plugins.RestrictionDataManager.spinner.stop(); }, 300);
	}
	
	/**
	 * Function: updateStatistics
	 * @param () none
	 * @returns () nothing
	 * Function that updates the statistics display
	 */
	updateStatistics() {
		$("#rdm-resolved-count").html(this.resolvedLocationsLayer.getSource().getSource().getFeatures().length);
		$("#rdm-unresolved-count").html(this.unresolvedLocationsLayer.getSource().getSource().getFeatures().length);
		$("#rdm-problem-count").html(this.problemLocationsLayer.getSource().getSource().getFeatures().length);
	}
	
	/**
	 * Function: refreshLocationLayers
	 * @param (function) callback
	 * @returns () nothing
	 * Function that refreshes the location layers
	 */
	refreshLocationLayers(callback) {
		this.resolvedLocationsLayer.getSource().getSource().refresh();
		this.unresolvedLocationsLayer.getSource().getSource().refresh();
		this.problemLocationsLayer.getSource().getSource().refresh();
		var watcher = function() {
			if (app.plugins.RestrictionDataManager.resolvedLocationsLayerIsLoading ||
				app.plugins.RestrictionDataManager.unresolvedLocationsLayerIsLoading ||
				app.plugins.RestrictionDataManager.problemLocationsLayerIsLoading) {
				setTimeout(watcher, 50);
			} else {
				callback();
			}
		}
		setTimeout(watcher, 50);
	}
	
	/**
	 * Function: userCanRead
	 * @param (integer) groupId
	 * @returns (boolean) canEdit
	 * Function that determines if the current user can read an entity based on the passed group id
	 */
	userCanRead(groupId) {
		return app.plugins.RestrictionDataManager.currentUser.read_groups.includes(groupId);
	}
	
	/**
	 * Function: userCanEdit
	 * @param (integer) groupId
	 * @returns (boolean) canEdit
	 * Function that determines if the current user can edit an entity based on the passed group id
	 */
	userCanEdit(groupId) {
		return app.plugins.RestrictionDataManager.currentUser.write_groups.includes(groupId);
	}
		
	/**
	 * Function: showLocationInGoogleStreetView
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that show the location in Google StreetView
	 */
	showLocationInGoogleStreetView(locationId) {
		// Find the location feature within the clustered layers (if it exists)
		var location = null;
		$.each(this.resolvedLocationsLayer.getSource().getFeatures(), function(index, clusterFeature) {
			$.each(clusterFeature.getProperties().features, function(index2, feature) {
				if (feature.getProperties().LOCATION_ID == locationId) {
					location = feature;
				}
			});
		});
		$.each(this.unresolvedLocationsLayer.getSource().getFeatures(), function(index, clusterFeature) {
			$.each(clusterFeature.getProperties().features, function(index2, feature) {
				if (feature.getProperties().LOCATION_ID == locationId) {
					location = feature;
				}
			});
		});
		
		// Open Streetview based on location
		if (location) {
			var centreLL = ol.proj.transform(location.getGeometry().getCoordinates(), app.map.getView().getProjection(), "EPSG:4326");
			var streetViewUrl = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint="+centreLL[1]+","+centreLL[0];
			window.open(streetViewUrl);
		}
	}							
	
	/**
	 * Function: closeLocation
	 * @param () none
	 * @returns () nothing
	 * Function that closes the location editor
	 */
	closeLocation() {
		app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().clear();
		$("#rdm-location-fieldset").hide();
		$("#rdm-welcome").show();
	}
	
	/**
	 * Function: showLocation
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that displays the location detail based on the passed location ID
	 */
	showLocation(locationId) {
		// Close the floating window
		app.plugins.MultiFloatingWindow.close("rdm-restriction");
		
		// Show the identify tab
		showSidebar();
		activateSidebarTab(app.plugins.RestrictionDataManager.tabNav);
		
		// Show the location/restriction fieldset and hide the welcome div
		$("#rdm-welcome").hide();
		$("#rdm-location-fieldset").show();
		
		// Show working
		this.showSpinner();

		// Reset a few other variables
		this.focusLocationChanges = new Object();
		this.focusLocationChanges.CONCURRENCY_CONTROL_NUMBER = 1;
		this.focusRestrictionChanges = new Object();
		
		// Find the location feature within the clustered layers (if it exists)
		var location = null;
		$.each(this.resolvedLocationsLayer.getSource().getFeatures(), function(index, clusterFeature) {
			$.each(clusterFeature.getProperties().features, function(index2, feature) {
				if (feature.getProperties().LOCATION_ID == locationId) {
					location = feature;
				}
			});
		});
		$.each(this.unresolvedLocationsLayer.getSource().getFeatures(), function(index, clusterFeature) {
			$.each(clusterFeature.getProperties().features, function(index2, feature) {
				if (feature.getProperties().LOCATION_ID == locationId) {
					location = feature;
				}
			});
		});
		$.each(this.problemLocationsLayer.getSource().getFeatures(), function(index, clusterFeature) {
			$.each(clusterFeature.getProperties().features, function(index2, feature) {
				if (feature.getProperties().LOCATION_ID == locationId) {
					location = feature;
				}
			});
		});
		
		// Set the focus location globally 
		this.focusLocation = location;
		
		// Determine if location is readonly
		var locationIsReadOnly = false;
		if (location && !this.userCanEdit(location.getProperties().GROUP_ID)) locationIsReadOnly = true;
				
		// Reset location title
		$("#rdm-location-title").html("New Location");
		
		// Unregister focus location event listeners
		$("#rdm-location-coordinates").off();
		$("#rdm-location-road-name").off();
		$("#rdm-location-group-id").off();
		$("#rdm-location-internal-comment").off();
		$("#rdm-location-delete-btn").off();
		$("#rdm-location-validate-btn").off();
		$("#rdm-location-save-btn").off();
		
		// Remove the "changed" css classes
		$("#rdm-location-coordinates").css("color", "black");
		$("#rdm-location-road-name").css("color", "black");
		$("#rdm-location-feature-id").css("color", "black");
		$("#rdm-location-group-id").css("color", "black");
		$("#rdm-location-internal-comment").css("color", "black");
		
		// Disable the buttons/controls
		$("#rdm-location-delete-btn").prop("disabled", true);
		$("#rdm-location-validate-btn").prop("disabled", true);
		$("#rdm-location-save-btn").prop("disabled", true);
		$("#rdm-location-coordinates").prop("disabled", true);
		$("#rdm-location-road-name").prop("disabled", true);
		$("#rdm-location-feature-id").prop("disabled", true);
		$("#rdm-location-group-id").prop("disabled", true);
		$("#rdm-location-internal-comment").prop("disabled", true);
		$("#dm-get-location-from-map-btn").prop("disabled", true);
		$("#rdm-location-clear-feature-btn").prop("disabled", true);
		
		// Reset/clear location details
		$("#rdm-location-coordinates").val("");
		$("#rdm-location-coordinates").data("original-value", "");
		$("#rdm-location-road-name").val("");
		$("#rdm-location-road-name").data("original-value", "");
		$("#rdm-location-feature-id").val("");
		$("#rdm-location-feature-id").data("original-value", "");
		$("#rdm-location-group-id").empty();
		$("#rdm-location-group-id").data("original-value", "");
		$("#rdm-location-internal-comment").empty();
		$("#rdm-location-internal-comment").data("original-value", "");
		$("#rdm-location-errors-select").empty();
		$("#rdm-location-errors").hide();
		$("#rdm-location-network-fk").html("-");
		$("#rdm-location-overall-match").html("-");
		$("#rdm-location-spatial-match").html("-");
		$("#rdm-location-name-match").html("-");
		$(".rdm-location-detail-table tbody").removeClass("rdm-red-text");
		$(".rdm-location-detail-table tbody").removeClass("rdm-green-text");
		
		// Populate the "linked to feature" input with a full feature title (THIS IS A SPECIAL CASE)
		if (location && location.getProperties().FEATURE_ID) {
			$.ajax({
				url: returnEnvironmentUrl("rdm-api") + "/feature/" + location.getProperties().FEATURE_ID,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			}).done(function(feature) {
				$("#rdm-location-feature-id").val(app.plugins.RestrictionDataManager.getFeatureTitle(feature));
				$("#rdm-location-feature-id").data("original-value", location.getProperties().FEATURE_ID);
				$("#rdm-location-feature-id").data("current-value", location.getProperties().FEATURE_ID);
			});
		}
		
		// Register the category autocomplete for "linked to feature"
		$("#rdm-location-feature-id").catcomplete({
			minLength: 3,
			source: app.plugins.RestrictionDataManager.searchFeatures,
			autoFocus: true,
			select: function(event, selection) {
				$(this).data("current-value", selection.item.data.FEATURE_ID);
				$(this).trigger("input");
			}
		});
		
		// Register clear "linked to feature" button
		if (!locationIsReadOnly) {
			$("#rdm-location-clear-feature-btn").click(function(){
				$("#rdm-location-feature-id").val("");
				$("#rdm-location-feature-id").data("current-value", null);
				app.plugins.RestrictionDataManager.trackLocationChange($("#rdm-location-feature-id"));
			});
		}
		
		// Populate the location owner select control
		$.each(app.plugins.RestrictionDataManager.codes["groups"], function(i, code) {
			// Add all of the groups that the user has write access to
			if (app.plugins.RestrictionDataManager.currentUser.write_groups.includes(code.GROUP_ID)) {
				$("#rdm-location-group-id").append("<option value=" + code.GROUP_ID + ">" + code.NAME + "</option>");
			
			// Add any groups that the user has read access to ONLY IF the current location is READONLY				
			} else if (location && locationIsReadOnly && app.plugins.RestrictionDataManager.currentUser.read_groups.includes(location.getProperties().GROUP_ID)) {
				$("#rdm-location-group-id").append("<option value=" + code.GROUP_ID + ">" + code.NAME + "</option>");
			}
		});

		// Clear the location restrictions results tree
		$("#rdm-location-restrictions").hide();
		$("#rdm-location-restrictions").empty();
		
		// Register input change listeners
		$("#rdm-location-coordinates").on("input", function(){
			var coord4326 = $(this).val().split(",");
			$(this).data("current-value", "-INVALID-"); // temporary value until coordinate is validated
			if (coord4326.length == 2) {
				if (coord4326[0] >= -180 && coord4326[0] <= 180 && coord4326[1] >= -90 && coord4326[1] <= 90) {
					var lon = parseFloat(coord4326[0].trim());
					var lat =parseFloat(coord4326[1].trim());
					if (lon && lat) {
						var coord3005 = ol.proj.transform([lon,lat], "EPSG:4326", "EPSG:3005");
						$(this).data("current-value", "geometry::STGeomFromText('POINT(" + coord3005[0] + " " + coord3005[1] + ")', 3005)");
					}
				}
			}
			app.plugins.RestrictionDataManager.trackLocationChange($(this));
		});
		$("#rdm-location-road-name").on("input", function(){
			app.plugins.RestrictionDataManager.trackLocationChange($(this));
		});
		$("#rdm-location-feature-id").on("input", function(){
			app.plugins.RestrictionDataManager.trackLocationChange($(this));
		});
		$("#rdm-location-group-id").on("input", function(){
			app.plugins.RestrictionDataManager.trackLocationChange($(this));
		});
		$("#rdm-location-internal-comment").on("input", function(){
			app.plugins.RestrictionDataManager.trackLocationChange($(this));
		});
		
		// Register buttons
		$("#rdm-location-delete-btn").on("click", function(){
			app.plugins.RestrictionDataManager.deleteLocation(app.plugins.RestrictionDataManager.focusLocation.getProperties().LOCATION_ID);
		});
		$("#rdm-location-validate-btn").on("click", function(){
			app.plugins.RestrictionDataManager.validateLocation(app.plugins.RestrictionDataManager.focusLocation.getProperties().LOCATION_ID);
		});
		$("#rdm-location-save-btn").on("click", function(){
			app.plugins.RestrictionDataManager.saveLocation(locationId);
		});
		
		// Hide/show the define location from map button base on existing vs new location
		if (location == null) {
			$("#rdm-get-location-from-map-btn").show();
		} else {
			$("#rdm-get-location-from-map-btn").hide();
		}

		// Enable the buttons/controls based on 'locationIsReadOnly'
		if (!locationIsReadOnly) {
			$("#rdm-location-delete-btn").prop("disabled", false);
			$("#rdm-location-validate-btn").prop("disabled", false);
			$("#rdm-location-coordinates").prop("disabled", false);
			$("#rdm-location-road-name").prop("disabled", false);
			$("#rdm-location-feature-id").prop("disabled", false);
			$("#rdm-location-group-id").prop("disabled", false);
			$("#rdm-location-internal-comment").prop("disabled", false);
			$("#dm-get-location-from-map-btn").prop("disabled", false);
			$("#rdm-location-clear-feature-btn").prop("disabled", false);
		}
		
		// If the location is null, assume it's a new location (i.e. locationId = -1) and bail here
		if (location == null) {
			app.plugins.RestrictionDataManager.trackLocationChange($("#rdm-location-group-id"));
			this.hideSpinner();
			return;
		}

		// Increment the CONCURRENCY_CONTROL_NUMBER in case there is an update
		this.focusLocationChanges.CONCURRENCY_CONTROL_NUMBER = location.getProperties().CONCURRENCY_CONTROL_NUMBER + 1;
		
		// Set the location title
		$("#rdm-location-title").html("Location #"+location.getProperties().LOCATION_ID);
		
		// Populate location form
		var location4326 = transformFeature(location, app.map.getView().getProjection().getCode(), "EPSG:4326"); // For display
		var location3005 = transformFeature(location, app.map.getView().getProjection().getCode(), "EPSG:4326"); // For writing (db stored in 3005)
		var coord4326 = location4326.getGeometry().getCoordinates();
		var coord3005 = location3005.getGeometry().getCoordinates();
		
		$("#rdm-location-coordinates").val(formatCoordinateAsString(coord4326, 4326));
		$("#rdm-location-coordinates").data("original-value", "geometry::STGeomFromText('POINT(" + coord3005[0] + " " + coord3005[1] + ")', 3005)");
		$("#rdm-location-coordinates").data("current-value", "geometry::STGeomFromText('POINT(" + coord3005[0] + " " + coord3005[1] + ")', 3005)");
		$("#rdm-location-road-name").val(location.getProperties().ROAD_NAME);
		$("#rdm-location-road-name").data("original-value", location.getProperties().ROAD_NAME);
		$("#rdm-location-group-id").val(location.getProperties().GROUP_ID);
		$("#rdm-location-group-id").data("original-value", location.getProperties().GROUP_ID);
		$("#rdm-location-internal-comment").val(location.getProperties().INTERNAL_COMMENT);
		$("#rdm-location-internal-comment").data("original-value", location.getProperties().INTERNAL_COMMENT);

		if (location.getProperties().ERROR_REPORT) {
			if (isJSON(location.getProperties().ERROR_REPORT)) {
				var json = JSON.parse(location.getProperties().ERROR_REPORT);
				$.each(json, function(index, error) {
					$("#rdm-location-errors-select").append("<option value=" + index + ">" + error.detail + "</option>");
				});
				$("#rdm-location-errors").show();
			}
		}
		
		// Populate location match details
		if (location.getProperties().NETWORK_SEGMENT_ID) {
			$("#rdm-location-network-fk").html(location.getProperties().NETWORK_SEGMENT_ID);
			$(".rdm-location-detail-table tbody").removeClass("rdm-red-text").addClass("rdm-green-text");
		} else {
			$("#rdm-location-network-fk").html("Not Linked");
			$(".rdm-location-detail-table tbody").removeClass("rdm-green-text").addClass("rdm-red-text");
		}
		if (location.getProperties().OVERALL_MATCH_SCORE) {
			$("#rdm-location-overall-match").html(location.getProperties().OVERALL_MATCH_SCORE + "%");
		} else {
			$("#rdm-location-overall-match").html("-");
		}
		if (location.getProperties().SPATIAL_MATCH_SCORE) {
			$("#rdm-location-spatial-match").html(location.getProperties().SPATIAL_MATCH_SCORE + "%");
		} else {
			$("#rdm-location-spatial-match").html("-");
		}
		if (location.getProperties().NAME_MATCH_SCORE) {
			$("#rdm-location-name-match").html(location.getProperties().NAME_MATCH_SCORE + "%");
		} else {
			$("#rdm-location-name-match").html("-");
		}

		// Show the linked road if it exists and then linked restrictions
		if (location.getProperties().NETWORK_SEGMENT_ID) {
			this.highlightRoadSegment(location.getProperties().NETWORK_SEGMENT_ID, this.showLocationRestrictions);
		// Show linked restrictions
		} else {
			this.showLocationRestrictions();
		}
	}
	
	/**
	 * Function: saveLocation
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that inserts or updates a location
	 */
	saveLocation(locationId) {
		// Bail if geometry is not valid
		if ($("#rdm-location-coordinates").data("current-value") == "-INVALID-") {
			showModalDialog("Location Error", "The specified coordinates are not valid.  They must be entered as:<br><br><center>longitude, latitude<br>-123.4567, 54.12345</center>", "sm");
			return;
		}
		
		// Prevent duplicate saves
		if (this.saveInProgress) return;
		this.saveInProgress = true;
		
		// Show spinner
		this.showSpinner();
		
		// Swap blanks to nulls
		$.each(app.plugins.RestrictionDataManager.focusLocationChanges, function(name, value) {
			if (value === "") app.plugins.RestrictionDataManager.focusLocationChanges[name] = null;
		});

		// Update existing location
		if (locationId > 0) {
			$.ajax({
				type: "PUT",
				url: returnEnvironmentUrl("rdm-api") + "/location/" + locationId,
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusLocationChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(response) {
				var callback = function() {
					app.plugins.RestrictionDataManager.saveInProgress = false;
					closePopup();
					app.plugins.RestrictionDataManager.hideSpinner();
					app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().clear();
					app.plugins.RestrictionDataManager.showLocation(locationId);
				}
				app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.saveInProgress = false;
				app.plugins.RestrictionDataManager.hideSpinner();
				var error = "Error updating location #" + locationId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		
		// Insert new location
		} else {
			$.ajax({
				type: "POST",
				url: returnEnvironmentUrl("rdm-api") + "/locations",
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusLocationChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				var locationId = data[0].LOCATION_ID;
				var callback = function() {
					app.plugins.RestrictionDataManager.saveInProgress = false;
					closePopup();
					app.plugins.RestrictionDataManager.hideSpinner();
					app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().clear();
					app.plugins.RestrictionDataManager.showLocation(locationId);
				}
				app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.saveInProgress = false;
				app.plugins.RestrictionDataManager.hideSpinner();
				var error = "Error creating location (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}
	}
	
	/**
	 * Function: deleteLocation
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that deletes a location
	 */
	deleteLocation(locationId) {
		bootbox.confirm({
			title: "Delete Location?",
			message: "Do you want to delete Location #"+locationId+"?",
			centerVertical: true,
			buttons: {
				cancel: {
					label: "Cancel"
				},
				confirm: {
					label: "Delete",
					className: "btn-danger"
				}
			},
			callback: function (result) {
				if (result === true) {
					app.plugins.RestrictionDataManager.showSpinner();
					$.ajax({
						type: "DELETE",
						url: returnEnvironmentUrl("rdm-api") + "/location/"+locationId,
						xhrFields: {
							withCredentials: true
						}
					})
					.done(function(data) {
						var callback = function() {
							closePopup();
							app.plugins.RestrictionDataManager.hideSpinner();
							app.plugins.RestrictionDataManager.closeLocation();
						}
						app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
					})
					.fail(function(jqxhr, settings, exception) {
						app.plugins.RestrictionDataManager.hideSpinner();
						logger("ERROR", jqxhr.responseText);
						showModalDialog("ERROR", jqxhr.responseText);
					});
				}
			}
		});
	}
	
	/**
	 * Function: validateLocation
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that validates a location
	 */
	validateLocation(locationId) {
		app.plugins.RestrictionDataManager.showSpinner();
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/location/"+locationId+"/validate",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(data) {
			var callback = function() {
				closePopup();
				app.plugins.RestrictionDataManager.hideSpinner();
				app.plugins.RestrictionDataManager.showLocation(locationId);
			}
			app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.hideSpinner();
			logger("ERROR", jqxhr.responseText);
			showModalDialog("ERROR", jqxhr.responseText);
		});
	}
	
	/**
	 * Function: showLocationRestrictions
	 * @param () none
	 * @returns () nothing
	 * Function the shows the restrictions for the focus location and displays result in a treeview
	 */
	showLocationRestrictions() {
		// Get location id and group id
		var locationId = app.plugins.RestrictionDataManager.focusLocation.getProperties().LOCATION_ID;
		var locationGroupId = app.plugins.RestrictionDataManager.focusLocation.getProperties().GROUP_ID;
		
		// Define the results tree data array
		var resultsTreeData = [];
		
		// Define the parent node
		var parentNode = new Object();
		parentNode.text = "<b>Restrictions</b>";
		parentNode.class = "rdm-treeview-restrictions-parent";
		parentNode.nodes = [];
		
		// Define the function that shows the results tree
		var showResultsTree = function(data) {
			// Register and build the treeview
			$("#rdm-location-restrictions").show();
			$("#rdm-location-restrictions").empty();
			$("#rdm-location-restrictions").append("<div id='rdm-treeview'></div>");
			var x = $("#rdm-treeview").bstreeview({
				data: data,
				expandIcon: 'oi oi-minus',
				collapseIcon: 'oi oi-plus',
				indent: 1.6,
				openNodeLinkOnNewTab: true
			});

			// Cheap way to expand the restrictions node
			$("#rdm-treeview").find(".rdm-treeview-restrictions-parent").first().click();
			$("#rdm-treeview").find("#rdm-treeview-restrictions-active-category").click();
			$("#rdm-treeview").find("#rdm-treeview-restrictions-inactive-category").click();
			
			// Add click event handler to all of the features
			$(".rdm-location-restriction").click(function(){
				// Open the restriction form
				if (this.id.includes("rdm-restriction-")) {
					if (app.plugins.MultiFloatingWindow.isOpen("rdm-restriction")) app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-restriction"); 
					var restrictionId = this.id.replace("rdm-restriction-", "");
					app.plugins.RestrictionDataManager.showRestriction(restrictionId);
				}
			});
			
			// Hide Spinner
			app.plugins.RestrictionDataManager.hideSpinner();	
		}
		
		// Query the API for associated restrictions
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/restrictions",
			data: {
				filter: "LOCATION_ID="+locationId
			},
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(restrictions) {

			// Add title and sort properties to each restriction
			$.each(restrictions, function(index, restriction) {
				restriction.title = app.plugins.RestrictionDataManager.restrictionTitle(restriction, true);
				restriction.sortField = app.plugins.RestrictionDataManager.restrictionSortString(restriction);
			});
			
			// Pre-sort the restrictions
			restrictions.sort(function(a, b){
				var a1 = a.sortField, b1 = b.sortField;
				if(a1 == b1) return 0;
				return a1 > b1 ? 1 : -1;
			});
			
			// Reset the parent node text with the results count
			parentNode.text = "<b>Restrictions ("+restrictions.length+")</b>";
			
			// Classify the restrictions into active/inactive categories and get counts
			var activeCount = 0;
			var inActiveCount = 0;
			$.each(restrictions, function(index, restriction) {
				var isActive = false;
				if (restriction.IS_ENABLED == 1) {
					var today = moment();
					if (moment(restriction.END_DATE.date, "YYYY-MM-DD") > today) {
						if (today >= moment(restriction.START_DATE.date, "YYYY-MM-DD")) {
							isActive = true;
						}
					}
				}
				if (isActive) activeCount++;
				if (!isActive) inActiveCount++;
				restriction.IS_ACTIVE = isActive;
			});

			// Add active & inactive categories
			var activeRestrictionsNode = new Object();
			activeRestrictionsNode.text = "<b>Active ("+activeCount+")</b>";
			activeRestrictionsNode.id = "rdm-treeview-restrictions-active-category";
			activeRestrictionsNode.nodes = [];
			if (activeCount > 0) parentNode.nodes.push(activeRestrictionsNode);
			var inActiveRestrictionsNode = new Object();
			inActiveRestrictionsNode.text = "<b>Inactive ("+inActiveCount+")</b>";
			inActiveRestrictionsNode.id = "rdm-treeview-restrictions-inactive-category";
			inActiveRestrictionsNode.nodes = [];
			if (inActiveCount > 0) parentNode.nodes.push(inActiveRestrictionsNode);
			
			// Loop thru the restrictions and add them to the appropriate category
			$.each(restrictions, function(index, restriction) {
				// Build the child (restriction) node
				var childNode = new Object();
				childNode.id = "rdm-restriction-" + restriction.RESTRICTION_ID;
				childNode.text = restriction.title;
				childNode.icon = "oi oi-ban";
				childNode.class = "rdm-location-restriction";
				
				// Add child node to the correct category
				if (restriction.IS_ACTIVE) {
					activeRestrictionsNode.nodes.push(childNode);
				} else {
					inActiveRestrictionsNode.nodes.push(childNode);
				}
			});
			
			// Add the "add new" child node (if current user has write access)
			if (app.plugins.RestrictionDataManager.userCanEdit(locationGroupId)) {
				var childNode = new Object();
				childNode.id = "rdm-restriction--1";
				childNode.text = "Add New Restriction";
				childNode.icon = "oi oi-plus";
				childNode.class = "rdm-location-restriction";
				parentNode.nodes.push(childNode);
			}

			// Add restriction results to the tree view
			resultsTreeData.push(parentNode);
			
			// Show the results
			showResultsTree(resultsTreeData);
		})
		.fail(function(jqxhr, settings, exception) {
			resultsTreeData.push(parentNode);
			showResultsTree(resultsTreeData);
			var error = "Error retrieving restrictions for location #" + locationId + " (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
		
	/**
	 * Function: showRestriction
	 * @param (integer) restrictionId
	 * @returns () nothing
	 * Function that shows the restriction
	 */
	showRestriction(restrictionId) {
		// Define the function that shows the restriction form
		var showRestrictionForm = function(restriction) {
			// Set some defaults
			app.plugins.RestrictionDataManager.focusRestrictionChanges = new Object();
			
			// Define restriction id
			var restrictionId = -1; // new restriction 
			if (restriction) {
				restrictionId = restriction.RESTRICTION_ID;
			}
			
			// Determine if restriction is readonly
			var restrictionIsReadOnly = false;
			if (restriction) {
				restrictionIsReadOnly = !app.plugins.RestrictionDataManager.currentUser.write_groups.includes(restriction.GROUP_ID);
			}
			
			// Define restriction title
			var restrictionTitle = "New Restriction";
			if (restriction) {
				restrictionTitle = "Restriction #" + restrictionId + " - " + app.plugins.RestrictionDataManager.restrictionTitle(restriction);
			}

			// Set LOCATION_ID, GROUP_ID, & CONCURRENCY_CONTROL_NUMBER
			if (restriction) {
				app.plugins.RestrictionDataManager.focusRestrictionChanges.CONCURRENCY_CONTROL_NUMBER = restriction.CONCURRENCY_CONTROL_NUMBER + 1;
			} else {
				app.plugins.RestrictionDataManager.focusRestrictionChanges.CONCURRENCY_CONTROL_NUMBER = 1;
				app.plugins.RestrictionDataManager.focusRestrictionChanges.LOCATION_ID = app.plugins.RestrictionDataManager.focusLocation.getProperties().LOCATION_ID;
				app.plugins.RestrictionDataManager.focusRestrictionChanges.GROUP_ID = app.plugins.RestrictionDataManager.focusLocation.getProperties().GROUP_ID;
			}
			
			// Create the restriction form by cloning the loaded template
			var clone = app.plugins.RestrictionDataManager.restrictionEditorContent.clone(true);
			clone.find(".rdm-restriction-form").attr("id", "rdm-restriction-form-" + restrictionId);
			clone.find(".rdm-restriction-form").show();
			
			// Populate select options for various elements
			clone.find(".rdm-restriction-field-IS_ENABLED").each(function(index) {
				$(this).append("<option value=0>False</option>");
				$(this).append("<option value=1>True</option>");
				$(this).val(null);
			});
			clone.find(".rdm-restriction-field-IS_TEMPORARY").each(function(index) {
				$(this).append("<option value=0>False</option>");
				$(this).append("<option value=1>True</option>");
				$(this).val(null);
			});
			clone.find(".rdm-restriction-field-RESTRICTION_TYPE_ID").each(function(index) {
				var select = $(this);
				$.each(app.plugins.RestrictionDataManager.codes["restriction_types"], function(i, code) {
					select.append("<option value=" + code.RESTRICTION_TYPE_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			clone.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID").each(function(index) {
				var select = $(this);
				$.each(app.plugins.RestrictionDataManager.codes["travel_directions"], function(i, code) {
					select.append("<option value=" + code.TRAVEL_DIRECTION_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			clone.find(".rdm-restriction-field-LANE_TYPE_ID").each(function(index) {
				var select = $(this);
				select.append("<option></option>");
				$.each(app.plugins.RestrictionDataManager.codes["lane_types"], function(i, code) {
					select.append("<option value=" + code.LANE_TYPE_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			clone.find(".rdm-restriction-field-LANE_SUB_TYPE_ID").each(function(index) {
				var select = $(this);
				select.append("<option></option>");
				$.each(app.plugins.RestrictionDataManager.codes["lane_sub_types"], function(i, code) {
					select.append("<option value=" + code.LANE_SUB_TYPE_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			
			// If this is a new restriction, set some default values and trigger their change detection
			if (restriction == null) {
				clone.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID").val(clone.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID option:first").val());
				clone.find(".rdm-restriction-field-START_DATE").val(formatDate(new Date()));
				clone.find(".rdm-restriction-field-END_DATE").val("2099-12-31");
				clone.find(".rdm-restriction-field-IS_ENABLED").val(0);
				clone.find(".rdm-restriction-field-IS_TEMPORARY").val(0);
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID"));
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-GROUP_ID"));
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-START_DATE"));
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-END_DATE"));
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-IS_ENABLED"));
				app.plugins.RestrictionDataManager.trackRestrictionChange(clone.find(".rdm-restriction-field-IS_TEMPORARY"));	
			}
			
			// Enable/disable controls based on current user's edit group(s)
			if (restriction) {
				if (restrictionIsReadOnly) {
					$.each(restriction, function(name, value) {
						if (clone.find(".rdm-restriction-field-"+name).length > 0) {
							clone.find(".rdm-restriction-field-"+name).prop("disabled", true);	
						}
					});
					restrictionTitle = restrictionTitle + " - READONLY";
				}
			}
			
			// Always these inputs readonly
			clone.find(".rdm-restriction-field-PERMITABLE_VALUE").prop("disabled", true);	
			clone.find(".rdm-restriction-field-APP_LAST_UPDATE_USERID").prop("disabled", true);
			clone.find(".rdm-restriction-field-APP_LAST_UPDATE_TIMESTAMP").prop("disabled", true);
					
			// Add change listener to each form control that is linked to a field
			$.each(clone.find("[class^='rdm-restriction-field-']"), function(index, element) {
				$(element).on("input", function(){
					app.plugins.RestrictionDataManager.trackRestrictionChange($(this));
					
					// Update restriction units
					app.plugins.RestrictionDataManager.updateRestrictionUnits(clone, $(this).val());
				});
			});
			
			// Add title (tooltip) to each form control that is linked to a field
			$.each(clone.find("[class^='rdm-restriction-field-']"), function(index, element) {
				var fieldName = $(element).data("field-name");
				var fieldMetaData = app.plugins.RestrictionDataManager.schemas.restriction.properties[fieldName];
				if (fieldMetaData && fieldMetaData.hasOwnProperty("description")) {
					var labelElement = $(element).parent().find(".rdm-restriction-field-label");
					var x = $(`<sup data-bs-toggle="tooltip" data-placement="right" title="${fieldMetaData.description}">&#9432;</sup>`).tooltip();
					labelElement.append(x);
				}
			});
			
			// Show, enable, & register (as needed) the correct buttons
			if (restriction) {
				clone.find(".btn-delete").show();
				if(restrictionIsReadOnly) clone.find(".btn-delete").prop("disabled", true);
				clone.find(".btn-save").show();
				clone.find(".btn-save").prop("disabled", true);
				clone.find(".btn-delete").click(function() {
					app.plugins.RestrictionDataManager.deleteRestriction(restrictionId);
				});
				clone.find(".btn-save").click(function() {
					app.plugins.RestrictionDataManager.saveRestriction(restrictionId);
				});
			} else {
				clone.find(".btn-create").show();
				clone.find(".btn-create").click(function() {
					app.plugins.RestrictionDataManager.saveRestriction(restrictionId);
				});
			}
			
			// Loop thru the restriction properties and set the values of corresponding form elements (if found)
			if (restriction) {
				$.each(restriction, function(name, value) {
					if (clone.find(".rdm-restriction-field-"+name).length > 0) {
						// Update the original value data attribute
						clone.find(".rdm-restriction-field-"+name).data("original-value", value);

						// Set the value of the form element
						switch (clone.find(".rdm-restriction-field-"+name).attr("type")) {
							case "date":
								clone.find(".rdm-restriction-field-"+name).val(formatDate(new Date(value.date)));
								break;
							case "timestamp":
								clone.find(".rdm-restriction-field-"+name).val(formatTimestamp(new Date(value.date)));
								break;
							default:
								clone.find(".rdm-restriction-field-"+name).val(value);
								break;
						}
		
						// Update restriction units (if current item is restriction_type_id)
						if (name == "RESTRICTION_TYPE_ID") {
							app.plugins.RestrictionDataManager.updateRestrictionUnits(clone, value);
						}
					}
				});
			}
			
			// Add the restriction map
			app.plugins.RestrictionDataManager.addRestrictionMapToForm(clone);

			// Show the restriction form in the MultiFloatingWindow
			app.plugins.MultiFloatingWindow.open("rdm-restriction", restrictionTitle, clone, 450);
		}
		
		// Get the restriction based on the passed restrictionId
		if (restrictionId > 0) {
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/restriction/" + restrictionId,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			}).done(function(restriction) {
				showRestrictionForm(restriction);
			}).fail(function(jqxhr, settings, exception) {
				var error = "Error getting restriction #" + restrictionId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		} else {
			showRestrictionForm(null);
		}
	}
	
	/**
	 * Function: updateRestrictionUnits
	 * @param (object) restriction form
	 * @param (integer) restrictionTypeId
	 * @returns () nothing
	 * Function that updates the restriction units on the form
	 */
	updateRestrictionUnits(form, restrictionTypeId) {
		var units = "";
		$.each(app.plugins.RestrictionDataManager.codes.restriction_types, function(index, restriction_type) {
			if (restriction_type.RESTRICTION_TYPE_ID == restrictionTypeId) units = restriction_type.UNIT;
		});
		form.find(".rdm-restriction-units").html(units);
	}
	
	/**
	 * Function: addRestrictionMapToForm
	 * @param (object) restriction form
	 * @returns () nothing
	 * Function that adds a restriction map to the passed form
	 */
	addRestrictionMapToForm(form) {
		
		// Define the function that orients the restriction direction (for display only)
		var orientRestrictionDirection = function() {
			// Get the calculated segment azimuth and segment edge azimuth (and their inverses)
			var segmentAzimuth = app.plugins.RestrictionDataManager.calculateSegmentAzimuth();
			var segmentEdgeAzimuth = app.plugins.RestrictionDataManager.calculateSegmentEdgeAzimuth();
			var segmentAzimuthInverse = (segmentAzimuth >= 180 ? segmentAzimuth - 180 : segmentAzimuth + 180);
			var segmentEdgeAzimuthInverse = (segmentEdgeAzimuth >= 180 ? segmentEdgeAzimuth - 180 : segmentEdgeAzimuth + 180);
			
			// Get the restriction azimuth (relates to segment azimuth and NEVER edge azimuth - edge azimuth is only for display purposes).
			var restrictionAzimuth = form.find(".rdm-restriction-field-RESTRICTION_AZIMUTH").val();
			
			// Set default restriction display azimuth (defaults to segmentEdgeAzimuth)
			var restrictionDisplayAzimuth = segmentEdgeAzimuth;
			
			// Set default style/label parameters
			var imgSrc = "application/plugins/RestrictionDataManager/img/direction-both.png";
			var label = "Both Directions";
			var cDirection = "Both";
			
			// Alter style/label if required (for one way restrictions)
			if (restrictionAzimuth) {
				// Make sure it's a number
				restrictionAzimuth = Number(restrictionAzimuth);
				
				// If the restriction azimuth aligns with the calculated segment azimuth (within 1 degree)
				if ((Math.abs(restrictionAzimuth - segmentAzimuth)) <= 1) { 
					restrictionDisplayAzimuth = segmentEdgeAzimuth;
					app.plugins.RestrictionDataManager.restrictionTravelDirectionState = "forward";
				} else if ((Math.abs(restrictionAzimuth - segmentAzimuthInverse)) <= 1) { 
					restrictionDisplayAzimuth = segmentEdgeAzimuthInverse;
					app.plugins.RestrictionDataManager.restrictionTravelDirectionState = "reverse";
				}
				
				// Reset the style/label parameters	
				imgSrc = "application/plugins/RestrictionDataManager/img/direction-oneway.png";
				if (restrictionDisplayAzimuth >= 0 && restrictionDisplayAzimuth < 45) {
					cDirection = "North";
				} else if (restrictionDisplayAzimuth >= 45 && restrictionDisplayAzimuth < 135) {
					cDirection = "East";
				} else if (restrictionDisplayAzimuth >= 135 && restrictionDisplayAzimuth < 225) {
					cDirection = "South";
				} else if (restrictionDisplayAzimuth >= 225 && restrictionDisplayAzimuth < 315) {
					cDirection = "West";
				} else if (restrictionDisplayAzimuth >= 315 && restrictionDisplayAzimuth <= 360) {
					cDirection = "North";
				}
				label = cDirection + " - Restriction: " + restrictionDisplayAzimuth.toFixed() + "° - Segment: " + restrictionAzimuth.toFixed() +"°";
			} else {
				app.plugins.RestrictionDataManager.restrictionTravelDirectionState = "both";
			}
			
			// Build the style and apply it
			var newStyle = new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [25, 25],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 1,
					rotation: (restrictionDisplayAzimuth * (Math.PI / 180)),
					src: imgSrc
				})
				/*
				// Used for debugging
				,text: new ol.style.Text({
					text: label,
					font: "bold 13px serif",
					offsetX: 0,
					offsetY: -35,
					fill: new ol.style.Fill({
						color: "#FF0000"
					})
				})
				*/
			});
			app.plugins.RestrictionDataManager.restrictionDirectionLayer.setStyle(newStyle);
		}
		
		// Define the function that toggles the restriction direction
		var changeRestrictionDirection = function() {
			// Get the restriction azimuth (relates to segment azimuth).
			var restrictionAzimuth = form.find(".rdm-restriction-field-RESTRICTION_AZIMUTH").val();
			
			// Get the calculated segment azimuth and segment edge azimuth (and their inverses)
			var segmentAzimuth = app.plugins.RestrictionDataManager.calculateSegmentAzimuth();
			var segmentAzimuthInverse = (segmentAzimuth >= 180 ? segmentAzimuth - 180 : segmentAzimuth + 180);

			// Iterate to the next direction ( [forward, both, reverse] )
			var newRestrictionAzimuth = null;
			if (app.plugins.RestrictionDataManager.restrictionTravelDirectionState == "forward") {
				newRestrictionAzimuth = null;
			} else if (app.plugins.RestrictionDataManager.restrictionTravelDirectionState == "both") {
				newRestrictionAzimuth = segmentAzimuthInverse;
			} else if (app.plugins.RestrictionDataManager.restrictionTravelDirectionState == "reverse") {
				newRestrictionAzimuth = segmentAzimuth;
			}
			
			
			// Alter style/label if required (for one way restrictions)
			var cDirection = "Both";
			if (newRestrictionAzimuth) {
				if (newRestrictionAzimuth >= 0 && newRestrictionAzimuth < 45) {
					cDirection = "North";
				} else if (newRestrictionAzimuth >= 45 && newRestrictionAzimuth < 135) {
					cDirection = "East";
				} else if (newRestrictionAzimuth >= 135 && newRestrictionAzimuth < 225) {
					cDirection = "South";
				} else if (newRestrictionAzimuth >= 225 && newRestrictionAzimuth < 315) {
					cDirection = "West";
				} else if (newRestrictionAzimuth >= 315 && newRestrictionAzimuth <= 360) {
					cDirection = "North";
				}
			} 

			// Change the underlying form elements
			form.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID option").each(function() { 
				this.selected = (this.text == cDirection); 
			});
			form.find(".rdm-restriction-field-TRAVEL_DIRECTION_ID").trigger("input");
			if (newRestrictionAzimuth) {
				form.find(".rdm-restriction-field-RESTRICTION_AZIMUTH").val(newRestrictionAzimuth.toFixed(2));
			} else {
				form.find(".rdm-restriction-field-RESTRICTION_AZIMUTH").val(null);
			}
			form.find(".rdm-restriction-field-RESTRICTION_AZIMUTH").trigger("input");
			
			// Orient the map display of the restrtcition
			orientRestrictionDirection();
		}
		
		// Build the map for this restriction
		var restrictionMap = new ol.Map({
			target: form.find(".rdm-re-map")[0],
			controls: [],
			interactions: ol.interaction.defaults.defaults({
				dragPan: false, 
				mouseWheelZoom: false 
			}),
			view: new ol.View({
				projection: "EPSG:3857",
				constrainResolution: true,
				center: app.plugins.RestrictionDataManager.focusLocation.getGeometry().getCoordinates(),
				zoom: app.config.map.zoom.max,
				minZoom: app.config.map.zoom.min,
				maxZoom: app.config.map.zoom.max,
				enableRotation: false
			})
		});
		
		// Add the switch direction control
		var clickCount = 1;
		var button = document.createElement('button');
		button.innerHTML = "<span class='oi oi-compass' style='margin-bottom:2px;'></span>";
		var element = document.createElement('div');
		element.title = "Change Direction";
		element.className = "ol-control";
		element.style.bottom = "0.5em";
		element.style.right = "0.5em";
		element.onclick = function() {
			changeRestrictionDirection();
		};
		element.appendChild(button);
		var switchDirectionControl = new ol.control.Control({
			element: element
		});
		restrictionMap.addControl(switchDirectionControl);
		
		// Define and add the base layer
		var baseLayer = new ol.layer.VectorTile({
			title: "BC Basemap",
			type: "base",
			visible: true,
			declutter: true,
			className: "ol-baselayer",
			source: new ol.source.VectorTile({
				format: new ol.format.MVT(),
				url: "https://tiles.arcgis.com/tiles/ubm4tcTYICKBpist/arcgis/rest/services/BC_BASEMAP/VectorTileServer/tile/{z}/{y}/{x}.pbf",
				attributions: "Tiles © <a target='_blank' href='https://catalogue.data.gov.bc.ca/dataset/78895ec6-c679-4837-a01a-8d65876a3da9'>ESRI & GeoBC</a>"
			}),
			style: function (feature, resolution) { return null; }, // Hide all vectors until styler function can render them
			styleUrl: "https://www.arcgis.com/sharing/rest/content/items/b1624fea73bd46c681fab55be53d96ae/resources/styles/root.json",
			styleKey: "esri"
		});
		restrictionMap.addLayer(baseLayer);
		
		// If the base layer is a VectorTile layer, apply the assoc style
		if (baseLayer instanceof ol.layer.VectorTile) {
			var styleUrl = baseLayer.get("styleUrl");
			var styleKey = baseLayer.get("styleKey");
			if (styleUrl && styleKey) {
				fetch(styleUrl).then(function(response) {
					response.json().then(function(glStyle) {
						olms.applyStyle(baseLayer, glStyle, styleKey);
					});
				});
			}
		}
		
		// Add current location to map
		app.plugins.RestrictionDataManager.restrictionDirectionLayer.getSource().clear();
		app.plugins.RestrictionDataManager.restrictionDirectionLayer.getSource().addFeature(app.plugins.RestrictionDataManager.focusLocation);
		
		// Add the restriction direction layer
		restrictionMap.addLayer(app.plugins.RestrictionDataManager.restrictionDirectionLayer);
						
		// Orient the map display of the restrtcition
		orientRestrictionDirection();
	}

	/**
	 * Function: calculateSegmentAzimuth
	 * @param () none
	 * @returns (number) azimuth
	 * Function that calculates the azimuth of the focus segment
	 */
	calculateSegmentAzimuth() {
		// Get the focus segment coords in 4326
		var focusFeature4326 = transformFeature(app.plugins.RestrictionDataManager.focusSegment, app.map.getView().getProjection().getCode(), "EPSG:4326");
		var focusSegmentCoords4326 = focusFeature4326.getGeometry().getCoordinates();
		
		// Create start and end node points from segment		
		var snPoint = turf.point(focusSegmentCoords4326[0]);
		var enPoint = turf.point(focusSegmentCoords4326[(focusSegmentCoords4326.length - 1)]);

		// Calculate the azimuth between the start and end nodes
		var bearing = turf.bearing(snPoint, enPoint);
		var azimuth = turf.bearingToAzimuth(bearing);
		
		// Return result
		return azimuth;
	}

	/**
	 * Function: calculateSegmentEdgeAzimuth
	 * @param () none
	 * @returns (number) azimuth
	 * Function that calculates the azimuth of the focus segment edge (nearest to the focus location)
	 */
	calculateSegmentEdgeAzimuth() {
		// Get the focus segment and focus location coords in 4326
		var focusFeature4326 = transformFeature(app.plugins.RestrictionDataManager.focusSegment, app.map.getView().getProjection().getCode(), "EPSG:4326");
		var focusSegmentCoords4326 = focusFeature4326.getGeometry().getCoordinates();
		var focusLocationCoords3857 = app.plugins.RestrictionDataManager.focusLocation.getGeometry().getCoordinates();
		var focusLocationCoords4326 = ol.proj.transform(focusLocationCoords3857, app.map.getView().getProjection(), "EPSG:4326");
		
		// Define the location point (turf)
		var locationPoint = turf.point(focusLocationCoords4326);
		
		// Build a feature collection of points based on the focus segment's verticies
		var focusSegmentVertices1 = [];
		$.each(focusSegmentCoords4326, function(index, vertex) {
			focusSegmentVertices1.push(turf.point(vertex));
		});
		var focusSegmentVerticesFC1 = turf.featureCollection(focusSegmentVertices1);
		
		// Find the closest vertex (vertex 1)
		var closestVertex1 = turf.nearestPoint(locationPoint, focusSegmentVerticesFC1);
		var closestVertexIndex1 = closestVertex1.properties.featureIndex;
		
		// Build a feature collection of points based on the focus segment's verticies (less the vertex that was already found)
		var focusSegmentVertices2 = [];
		$.each(focusSegmentCoords4326, function(index, vertex) {
			if (index != closestVertexIndex1) {
				focusSegmentVertices2.push(turf.point(vertex));
			}
		});
		var focusSegmentVerticesFC2 = turf.featureCollection(focusSegmentVertices2);

		// Find the closest vertex (vertex 2)
		var closestVertex2 = turf.nearestPoint(locationPoint, focusSegmentVerticesFC2);
		var closestVertexIndex2 = closestVertex2.properties.featureIndex;
		
		// Calculate the map display azimuth between the two found verticies (maintain geometry order)
		if (closestVertexIndex1 > closestVertexIndex2) {
			var bearing = turf.bearing(closestVertex2, closestVertex1);
		} else {
			var bearing = turf.bearing(closestVertex1, closestVertex2);
		}
		var azimuth = turf.bearingToAzimuth(bearing);
		
		// Return result
		return azimuth;
	}
		
	/**
	 * Function: saveRestriction
	 * @param (integer) restrictionId
	 * @returns () nothing
	 * Function that inserts or updates a restriction
	 */
	saveRestriction(restrictionId) {
		// Get the restriction form
		var restrictionForm = $("#rdm-restriction-form-" + restrictionId);
		
		// If the limit flag is set and has been exceeded, warn user and prevent save
		var limitFlagEl = restrictionForm.find(".rdm-restriction-field-LIMIT_FLAG");
		var permitableValueEl = restrictionForm.find(".rdm-restriction-field-PERMITABLE_VALUE");
		if (limitFlagEl.val()) {
			if (parseFloat(permitableValueEl.val()) > parseFloat(limitFlagEl.val())) {
				bootbox.dialog({
					title: "Error",
					message: "<br><center>A restriction's permittable value cannot exceed it's limit flag!</center><br>",
					buttons: {
						ok: {
							label: "OK"
						}
					}
				});
				return;
			}				
		}
		
		// Prevent duplicate saves
		if (this.saveInProgress) return;
		this.saveInProgress = true;
		
		// Show floating window spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-restriction");
		
		// Swap blanks to nulls
		$.each(app.plugins.RestrictionDataManager.focusRestrictionChanges, function(name, value) {
			if (value === "") app.plugins.RestrictionDataManager.focusRestrictionChanges[name] = null;
		});

		// Update existing restriction
		if (restrictionId > 0) {
			$.ajax({
				type: "PUT",
				url: returnEnvironmentUrl("rdm-api") + "/restriction/" + restrictionId,
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusRestrictionChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(response) {
				app.plugins.RestrictionDataManager.saveInProgress = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-restriction");
				app.plugins.RestrictionDataManager.showLocationRestrictions();
				app.plugins.RestrictionDataManager.showRestriction(restrictionId, app.plugins.RestrictionDataManager.showRestriction);
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.saveInProgress = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-restriction");
				var error = "Error updating restriction #" + restrictionId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		
		// Insert new restriction
		} else {
			$.ajax({
				type: "POST",
				url: returnEnvironmentUrl("rdm-api") + "/restrictions",
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusRestrictionChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				var newRestrictionId = data[0].RESTRICTION_ID;
				var locationId = data[0].LOCATION_ID;
				var callback = function() {
					app.plugins.RestrictionDataManager.saveInProgress = false;
					app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-restriction");
				}
				app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
				app.plugins.RestrictionDataManager.showLocationRestrictions();
				app.plugins.RestrictionDataManager.showRestriction(newRestrictionId, app.plugins.RestrictionDataManager.showRestriction);
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.saveInProgress = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-restriction");
				var error = "Error creating restriction (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}
	}
	
	/**
	 * Function: deleteRestriction
	 * @param (integer) restrictionId
	 * @returns () nothing
	 * Function that deletes a restriction
	 */
	deleteRestriction(restrictionId) {
		bootbox.confirm({
			title: "Delete Restriction?",
			message: "Do you want to delete Restriction #"+restrictionId+"?",
			buttons: {
				cancel: {
					label: "Cancel"
				},
				confirm: {
					label: "Delete",
					className: "btn-danger"
				}
			},
			callback: function (result) {
				if (result === true) {
					app.plugins.MultiFloatingWindow.close("rdm-restriction");
					app.plugins.RestrictionDataManager.showSpinner();
					$.ajax({
						type: "DELETE",
						url: returnEnvironmentUrl("rdm-api") + "/restriction/"+restrictionId,
						xhrFields: {
							withCredentials: true
						}
					})
					.done(function(data) {
						var callback = function() {
							app.plugins.RestrictionDataManager.hideSpinner();
							app.plugins.RestrictionDataManager.showLocationRestrictions();
						}
						app.plugins.RestrictionDataManager.refreshLocationLayers(callback);
					})
					.fail(function(jqxhr, settings, exception) {
						app.plugins.RestrictionDataManager.hideSpinner();
						var error = "Error deleting Restriction #"+restrictionId;
						logger("ERROR", error);
						showModalDialog("ERROR", error);
					});
				}
			}
		});
	}
	
	/**
	 * Function: getFeatureTitle
	 * @param (object) feature
	 * @returns (string) featureTitle
	 * Function that builds a feature title from the passed feature
	 */
	getFeatureTitle(feature) {
		var sourceSystemTitle = "";
		if (feature.SOURCE_SYSTEM_ID) {
			sourceSystemTitle = " (" + this.getCode("source_systems", feature.SOURCE_SYSTEM_ID).CODE + ":" + feature.SOURCE_SYSTEM_FK + ")";
		}
		return feature.FEATURE_NAME + sourceSystemTitle
	}
	
	/**
	 * Function: searchFeatures
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes a search for features
	 */
	searchFeatures(request, callback, options) {
		// Query the RDM API for features
		$.ajax({
			url: returnEnvironmentUrl("rdm-api") + "/features",
			data: {
				filter: "FEATURE_NAME LIKE '%" + request.term + "%' OR SOURCE_SYSTEM_FK LIKE '%" + request.term + "%'",
				limit: 10
			},
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		
		// Handle a successful result
		.done(function(data) {
			var list = [];
			if(data.length > 0) {
				list = data.map(function(item) {
					return {
						value: app.plugins.RestrictionDataManager.getFeatureTitle(item),
						category: "Features",
						data: item
					}
				});
			}
			callback(list);
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			var error = "Error retrieving features (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
			callback([]);
		}); 
	}
		
	/**
	 * Function: restrictionTitle
	 * @param (object) restriction
	 * @param (boolean) addFlags
	 * @returns (string) name
	 * Function that builds a restriction title for display
	 */
	restrictionTitle(restriction, addFlags) {
		var title = "";
		if (restriction.TRAVEL_DIRECTION_ID) title += this.getCode("travel_directions", restriction.TRAVEL_DIRECTION_ID).NAME;
		if (restriction.LANE_NUMBER) title += " (Lane " + restriction.LANE_NUMBER + ")";
		if (restriction.RESTRICTION_TYPE_ID) title += " - " + this.getCode("restriction_types", restriction.RESTRICTION_TYPE_ID).NAME;
		if (restriction.PERMITABLE_VALUE) title += " - <b>" + restriction.PERMITABLE_VALUE + " " + this.getCode("restriction_types", restriction.RESTRICTION_TYPE_ID).UNIT + "</b>";
		if (addFlags) {
			if (restriction.IS_TEMPORARY) title += " <span class='rdm-superscript-red'>** Temporary **</span>";
		}
		return title;
	}
	
	/**
	 * Function: restrictionSortString
	 * @param (object) restriction
	 * @returns (string) sortString
	 * Function that builds a restriction sort string so that restrictions can be sorted for display
	 */
	restrictionSortString(restriction) {
		var sortString = "";
		
		// By travel direction and lane number
		var laneNum = 0;
		if (restriction.TRAVEL_DIRECTION_ID) {
			switch(this.getCode("travel_directions", restriction.TRAVEL_DIRECTION_ID).NAME) {
				case "South":
					sortString += "1";
					laneNum = (restriction.LANE_NUMBER) ? 100 - restriction.LANE_NUMBER : 0;
					break;
				case "North":
					sortString += "2";
					laneNum = (restriction.LANE_NUMBER) ? restriction.LANE_NUMBER : 0;
					break;
				case "West":
					sortString += "3";
					laneNum = (restriction.LANE_NUMBER) ? 100 - restriction.LANE_NUMBER : 0;
					break;
				case "East":
					sortString += "4";
					laneNum = (restriction.LANE_NUMBER) ? restriction.LANE_NUMBER : 0;
					break;
				default:
					sortString += "0";
			}
		} else {
			sortString += "0";
		}
		sortString += String(laneNum).padStart(3, "0");
		
		return sortString;
	}
	
	/**
	 * Function: loadFeatureManager
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the feature manager
	 */
	loadFeatureManager(callback) {
		app.plugins.RestrictionDataManager.featureManagerIsWorking = false;
		loadTemplate("application/plugins/RestrictionDataManager/content-fm.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.featureManagerContent = $("<div></div>").append($(content));
			callback();
		});
	}
	
	/**
	 * Function: loadFeatureEditor
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the feature editor
	 */
	loadFeatureEditor(callback) {
		app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
		loadTemplate("application/plugins/RestrictionDataManager/content-fe.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.featureEditorContent = $("<div></div>").append($(content));
			callback();
		});
	}
	
	/**
	 * Function: loadUserManager
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the user manager
	 */
	loadUserManager(callback) {
		app.plugins.RestrictionDataManager.userManagerIsWorking = false;
		loadTemplate("application/plugins/RestrictionDataManager/content-um.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.userManagerContent = $("<div></div>").append($(content));
			callback();
		});
	}
	
	/**
	 * Function: loadUserEditor
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the user editor
	 */
	loadUserEditor(callback) {
		app.plugins.RestrictionDataManager.userEditorIsWorking = false;
		loadTemplate("application/plugins/RestrictionDataManager/content-ue.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.userEditorContent = $("<div></div>").append($(content));
			callback();
		});
	}
	
	/**
	 * Function: loadUserGroupEditor
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the user group editor
	 */
	loadUserGroupEditor(callback) {
		app.plugins.RestrictionDataManager.userGroupEditorIsWorking = false;
		loadTemplate("application/plugins/RestrictionDataManager/content-uge.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.userGroupEditorContent = $("<div></div>").append($(content));
			callback();
		});
	}
	
	/**
	 * Function: loadRestrictionEditor
	 * @param (function) callback
	 * @returns () nothing
	 * Function that loads the template file for the restriction editor
	 */
	loadRestrictionEditor(callback) {
		loadTemplate("application/plugins/RestrictionDataManager/content-re.html", function(success, content) {
			if (success) app.plugins.RestrictionDataManager.restrictionEditorContent = $("<div></div>").append($(content));
			callback();
		});
	}
		
	/**
	 * Function: getCodes
	 * @param (function) callback
	 * @returns () nothing
	 * Function that retrieves various codes (by category) from the RDM API for easy client side reference
	 */
	getCodes(callback) {
		var categories = [
			"feature_types",
			"groups",
			"lane_types",
			"lane_sub_types",
			"restriction_types",
			"source_systems",
			"travel_directions"
		];
		var categoryCompleteCount = 0;
		$.each(categories, function(index, category) {
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/" + category,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				app.plugins.RestrictionDataManager.codes[category] = data;
				categoryCompleteCount++;
				if (categoryCompleteCount >= categories.length) callback();
			})
			.fail(function(jqxhr, settings, exception) {
				categoryCompleteCount++;
				if (categoryCompleteCount >= categories.length) callback();
				var error = "Error retrieving codes for " + category + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		});
	}
	
	/**
	 * Function: getCode
	 * @param (string) category
	 * @param (integer) codeId
	 * @returns (object) code
	 * Function to retrieve code based on specified category and id
	 */
	getCode(category, codeId) {
		var categoryPKs = {
			feature_types: "FEATURE_TYPE_ID",
			groups: "GROUP_ID",
			lane_types: "LANE_TYPE_ID",
			lane_sub_types: "LANE_SUB_TYPE_ID",
			restriction_types: "RESTRICTION_TYPE_ID",
			source_systems: "SOURCE_SYSTEM_ID",
			travel_directions: "TRAVEL_DIRECTION_ID"
		};
		var pk = categoryPKs[category];
		var records = app.plugins.RestrictionDataManager.codes[category];
		var code = null;
		$.each(records, function(index, record) {
			if (record[pk] == codeId) code = record;
		});
		return code;
	}

	/**
	 * Function: getCodes
	 * @param (function) callback
	 * @returns () nothing
	 * Function that retrieves various schema definitions from the RDM API for easy client side reference
	 */
	getSchemas(callback) {
		var schemas = [
			"location",
			"restriction",
			"feature"
		];
		var schemaCompleteCount = 0;
		$.each(schemas, function(index, schemaName) {
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/schema/" + schemaName,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				app.plugins.RestrictionDataManager.schemas[schemaName] = data;
				schemaCompleteCount++;
				if (schemaCompleteCount >= schemas.length) callback();
			})
			.fail(function(jqxhr, settings, exception) {
				schemaCompleteCount++;
				if (schemaCompleteCount >= schemas.length) callback();
				var error = "Error retrieving schema for " + schemaName + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		});
	}
	
	/**
	 * Function: trackLocationChange
	 * @param (object) element
	 * @returns () nothing
	 * Function to track a change in a location
	 */
	trackLocationChange(element) {
		// Get the field name that the passed form element refers to
		var fieldName = element.data("field-name");
		
		// Get the current form element value (from it's actual value or "current-value" data attribute)
		var currentValue = element.val();

		// If a "current-value" data attribute exists, this is a SPECIAL CASE element (i.e. catcomplete) and
		// requires special handling
		if (element.data("current-value")) {
			if (element.val().trim() == "") element.data("current-value", null);
			currentValue = element.data("current-value");
		}

		// Get the form element's datatype and convert current value based on that datatype
		var dataType = element.attr("type");
		if (dataType) {
			switch (dataType.toLowerCase()) {
				case "number":
					currentValue = Number(currentValue);
					break;
			}
		}
			
		// Track and display change
		if (element.data("original-value") !== currentValue) {
			element.css("color", "red");
			this.focusLocationChanges[fieldName] = currentValue;
		} else {
			element.css("color", "black");
			delete this.focusLocationChanges[fieldName];
		}

		// Enable/disable form buttons
		if (Object.keys(this.focusLocationChanges).length > 1) {
			$("#rdm-location-save-btn").prop("disabled", false);
			$("#rdm-location-delete-btn").prop("disabled", true);
			$("#rdm-location-validate-btn").prop("disabled", true);
		} else {
			$("#rdm-location-save-btn").prop("disabled", true);
			$("#rdm-location-delete-btn").prop("disabled", false);
			$("#rdm-location-validate-btn").prop("disabled", false);
		}
	}
	
	/**
	 * Function: trackRestrictionChange
	 * @param (object) element
	 * @returns () nothing
	 * Function to track a chnage in a restriction
	 */
	trackRestrictionChange(element) {
		// Get the restriction form
		var restrictionForm = element.closest(".rdm-restriction-form");
		
		// Get the field name that the passed form element refers to
		var fieldName = element.data("field-name");
		
		// Get the current form element value
		var currentValue = element.val();
		
		// If a "current-value" data attribute exists, this is a SPECIAL CASE element (i.e. catcomplete) and
		// requires special handling
		if (element.data("current-value")) {
			if (element.val().trim() == "") element.data("current-value", null);
			currentValue = element.data("current-value");
		}

		// Get the form element's datatype and convert current value based on that datatype
		var dataType = element.attr("type");
		if (dataType) {
			switch (dataType.toLowerCase()) {
				case "number":
					if (currentValue) {
						currentValue = Number(currentValue);
					} else {
						currentValue = null;
					}
					break;
			}
		}
				
		// Cascade change to "PERMITABLE_VALUE" if required
		if (["RESTRICTION_TYPE_ID", "MEASURED_VALUE", "POLICY_VALUE", "LIMIT_FLAG"].includes(fieldName)) {
			// Get the restriction value inputs
			var restrictionTypeEl = restrictionForm.find(".rdm-restriction-field-RESTRICTION_TYPE_ID");
			var measuredValueEl = restrictionForm.find(".rdm-restriction-field-MEASURED_VALUE");
			var policyValueEl = restrictionForm.find(".rdm-restriction-field-POLICY_VALUE");
			var permitableValueEl = restrictionForm.find(".rdm-restriction-field-PERMITABLE_VALUE");
						
			// Calculate the permittable value
			if (policyValueEl.val() > 0) {
				permitableValueEl.val(policyValueEl.val());
			} else {
				var precision = ((measuredValueEl.val()).indexOf(".") != -1) ? (measuredValueEl.val()).split(".")[1].length : 1;
				switch(restrictionTypeEl.children(":selected").text()) {
					case "Horizontal":
						if (measuredValueEl.val() > 0) {
							permitableValueEl.val((measuredValueEl.val() - 0.6).toFixed(precision));
						} else {
							permitableValueEl.val(0);
						}
						break;
					case "Vertical":
						if (measuredValueEl.val() > 0) {
							permitableValueEl.val((measuredValueEl.val() - 0.1).toFixed(precision));
						} else {
							permitableValueEl.val(0);
						}
						break;
					default:
						permitableValueEl.val(measuredValueEl.val());
				}
			}
			
			// Flag as changed
			app.plugins.RestrictionDataManager.trackRestrictionChange(permitableValueEl);
		}		
		
		// Track and display change
		if (element.data("original-value") !== currentValue) {
			element.css("color", "red");
			this.focusRestrictionChanges[fieldName] = currentValue;
		} else {
			element.css("color", "black");
			delete this.focusRestrictionChanges[fieldName];
		}

		// Enable/disable form buttons
		if (Object.keys(this.focusRestrictionChanges).length > 1) {
			restrictionForm.find(".btn-save").prop("disabled", false);
			restrictionForm.find(".btn-delete").prop("disabled", true);	
		} else {
			restrictionForm.find(".btn-save").prop("disabled", true);
			restrictionForm.find(".btn-delete").prop("disabled", false);	
		}
	}
	
	/**
	 * Function: trackFeatureChange
	 * @param (object) element
	 * @returns () nothing
	 * Function to track a change in a feature
	 */
	trackFeatureChange(element) {
		// Get the feature form
		var featureForm = element.closest(".rdm-feature-editor-form");
		
		// Get the field name that the passed form element refers to
		var fieldName = element.data("field-name");
		
		// Get the current form element value (from it's actual value or "current-value" data attribute)
		var currentValue = element.val();

		// Get the form element's datatype and convert current value based on that datatype
		var dataType = element.attr("type");
		if (dataType) {
			switch (dataType.toLowerCase()) {
				case "number":
					currentValue = Number(currentValue);
					break;
			}
		}
			
		// Track and display change
		if (element.data("original-value") !== currentValue) {
			element.css("color", "red");
			this.focusFeatureChanges[fieldName] = currentValue;
		} else {
			element.css("color", "black");
			delete this.focusFeatureChanges[fieldName];
		}

		// Enable/disable form buttons
		if (Object.keys(this.focusFeatureChanges).length > 1) {
			featureForm.find(".btn-save").prop("disabled", false);	
		} else {
			featureForm.find(".btn-save").prop("disabled", true);
		}
	}
	
	/**
	 * Function: trackUserChange
	 * @param (object) element
	 * @returns () nothing
	 * Function to track a change in a user
	 */
	trackUserChange(element) {
		// Get the user form
		var userForm = element.closest(".rdm-user-form");
		
		// Get the field name that the passed form element refers to
		var fieldName = element.data("field-name");
		
		// Get the current form element value (from it's actual value or "current-value" data attribute)
		var currentValue = element.val();

		// Get the form element's datatype and convert current value based on that datatype
		var dataType = element.attr("type");
		if (dataType) {
			switch (dataType.toLowerCase()) {
				case "number":
					currentValue = Number(currentValue);
					break;
			}
		}
			
		// Track and display change
		if (element.data("original-value") !== currentValue) {
			element.css("color", "red");
			this.focusUserChanges[fieldName] = currentValue;
		} else {
			element.css("color", "black");
			delete this.focusUserChanges[fieldName];
		}

		// Enable/disable form buttons
		if (Object.keys(this.focusUserChanges).length > 1) {
			userForm.find(".btn-save").prop("disabled", false);	
		} else {
			userForm.find(".btn-save").prop("disabled", true);
		}
	}
	
	/**
	 * Function: trackUserGroupChange
	 * @param (object) element
	 * @returns () nothing
	 * Function to track a change in a user's group
	 */
	trackUserGroupChange(element) {
		// Get the user group form
		var userGroupForm = element.closest(".rdm-user-group-form");
		
		// Get a few things attached to the element
		var groupId = element.data("GROUP_ID");
		var originalValue = element.data("original-value");
		var currentValue = element.val();
		
		// Determine if the change is a INSERT, UPDATE, or DELETE
		var method = "PUT"; // assume PUT (update)
		if (originalValue == "none" && originalValue != currentValue) {
			method = "POST";
		} else if (originalValue != "none" && currentValue == "none") {
			method = "DELETE";
		}
		
		// Build the change object
		var change = new Object();
		switch(currentValue) {
			case "ro":
				change.CAN_EDIT = false;
				change.METHOD = method;
				break;
			case "rw":
				change.CAN_EDIT = true;
				change.METHOD = method;
				break;
			default:
				change.CAN_EDIT = null;
				change.METHOD = method;
				break;
		}

		// Track and display change
		if (originalValue !== currentValue) {
			element.css("color", "red");
			this.focusUserGroupChanges[groupId] = change;
		} else {
			element.css("color", "black");
			delete this.focusUserGroupChanges[groupId];
		}

		// Enable/disable save button
		if (Object.keys(this.focusUserGroupChanges).length > 0) {
			userGroupForm.find(".btn-save").prop("disabled", false);
		} else {
			userGroupForm.find(".btn-save").prop("disabled", true);
		}
	}
	
	/**
	 * Function: getCurrentUser
	 * @param (function) callback
	 * @returns () nothing
	 * Function retrieves the current user info from the RDM API
	 */
	getCurrentUser(callback) {
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/session",
			timeout: 7500,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(data) {
			callback(data);
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.currentUser = null;
			callback(null);
			var error = "Error getting user information (" + jqxhr.responseText + ")";
			logger("ERROR", error);
		});
	}
	
	/**
	 * Function: getConfiguration
	 * @param (function) callback
	 * @returns () nothing
	 * Function retrieves the application configuration from the RDM API
	 */
	getConfiguration(callback) {
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/configuration",
			timeout: 7500,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(data) {
			app.plugins.RestrictionDataManager.configuration = data;
			callback();
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.configuration = null;
			callback();
			var error = "Error getting application configuration (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
			
		});
	}
	
	/**
	 * Function: editLocationFromPopup
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that starts the location editing function from a map popup
	 */
	editLocationFromPopup(locationId) {
		this.showLocation(locationId);
		this.registerMapClickLocation();
	}
	
	/**
	 * Function: registerMapClickLocation
	 * @param () none
	 * @returns () nothing
	 * Function that gets and registers where the user clicked on the map
	 */
	registerMapClickLocation() {
		// Close any open popups
		closePopup();
		
		// Define function that handles the get map click location
		var mapClickFunction = function(e){
			// Get the click coordinate in EPSG:4326
			var clickLocation4326 = ol.proj.transform(e.coordinate, app.map.getView().getProjection(), "EPSG:4326");
			
			// Get the click coordinate in EPSG:3005
			var clickLocation3005 = ol.proj.transform(e.coordinate, app.map.getView().getProjection(), "EPSG:3005");
			
			// Add the click location to the map
			var clickLocationFeature = new ol.Feature({ geometry: new ol.geom.Point(e.coordinate) });
			app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().clear();
			app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().addFeature(clickLocationFeature);
			
			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();
							
			// If mobile, show sidebar
			if (isMobile()) showSidebar();
			
			// Show spinner
			app.plugins.RestrictionDataManager.showSpinner();
		
			// Query the API
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/nearby-roads/" + clickLocation3005[0] + "/" + clickLocation3005[1],
				timeout: 7500,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(roads) {
				app.plugins.RestrictionDataManager.openRoadNamePicker(roads, clickLocation4326);
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.hideSpinner();
				var error = "Error getting road information (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}
		
		// Redirect the map's single click function to this mapClickFunction (temporary)
		redirectMapSingleClickFunction("crosshair", mapClickFunction);
		
		// If mobile, hide sidebar
		if (isMobile()) hideSidebar();
	}
	
	/**
	 * Function: openRoadNamePicker
	 * @param (object) discovered nearby roads
	 * @param (array) clickLocation4326 (in lon/lat)
	 * @returns () nothing
	 * Function that opens the road name picker window
	 */
	openRoadNamePicker(nearbyRoads, clickLocation4326) {
		// Define the road options array
		var roadOptions = [];

		// Loop thru the discovered roads and add their road names
		var addCurrentRoadName = true;
		$.each(nearbyRoads, function(index, road) {
			// Loop thru the road name fields and add missing ones
			var nameFields = app.plugins.RestrictionDataManager.configuration.RESOLVER_SOURCE_NETWORK_LAYER_NAME_FIELDS; // Pulled from API at load
			$.each(nameFields, function(index, nameField) {
				var roadName = road.properties[nameField];
				if (roadName) {
					var alreadyAdded = false;
					$.each(roadOptions, function(index, roadOption) {
						if (roadOption.value == roadName) alreadyAdded = true;
					});
					if (!alreadyAdded) {
						if (roadName == $("#rdm-location-road-name").val()) {
							roadOptions.push({
								text: roadName + " [current setting]",
								value: roadName
							});
							addCurrentRoadName = false;
						} else {
							roadOptions.push({
								text: roadName,
								value: roadName
							});
						}
					}
				}
			});
		});
		
		// Add current road name if not already existing and not blank
		/*
		if (addCurrentRoadName && $("#rdm-location-road-name").val().trim() != "") {
			roadOptions.push({
				text: $("#rdm-location-road-name").val() + " [current setting]",
				value: $("#rdm-location-road-name").val()
			});
		}
		*/
		
		// Sort roadOptions
		roadOptions.sort(function(a, b){
			var a1 = a.text, b1 = b.text;
			if(a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});

		// If no road options were found, then skip name selection step
		if (roadOptions.length == 0) {
			app.plugins.RestrictionDataManager.hideSpinner();
			$("#rdm-location-coordinates").val(formatCoordinateAsString(clickLocation4326, 4326));
			$("#rdm-location-coordinates").trigger("input");
			showModalDialog("Notice", "No road segments were found at this location.", "sm");
			return;
		}

		// Prompt user to select a road name
		bootbox.prompt({
			title: "Select a road name",
			message: "",
			inputType: "radio",
			inputOptions: roadOptions,
			callback: function (selection) {
				app.plugins.RestrictionDataManager.hideSpinner();
				if (selection) {
					$("#rdm-location-coordinates").val(formatCoordinateAsString(clickLocation4326, 4326));
					$("#rdm-location-coordinates").trigger("input");
					$("#rdm-location-road-name").val(selection);
					$("#rdm-location-road-name").trigger("input");
				} else {
					app.plugins.RestrictionDataManager.droppedLocationLayer.getSource().clear();
				}
			}
		});
	}
	
	/**
	 * Function: highlightRoadSegment
	 * @param (integer) id
	 * @param (function) callback
	 * @returns () nothing
	 * Function to highlight a given road segment
	 */
	highlightRoadSegment(id, callback) {
		app.plugins.RestrictionDataManager.focusSegment = null;
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/road/" + id,
			timeout: 10000,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(result) {
			if (result.length > 0) {
				var road = result[0];
				var olFeature4326 = convertToOpenLayersFeature("GeoJSON", road);
				app.plugins.RestrictionDataManager.focusSegment = transformFeature(olFeature4326, "EPSG:4326", app.map.getView().getProjection().getCode());
				highlightFeature(app.plugins.RestrictionDataManager.focusSegment, true);
				callback();
			} 
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.hideSpinner();
			var error = "Error getting road segment #" + id + " (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
	
	/**
	 * Function: openFeatureManager
	 * @param () none
	 * @returns () nothing
	 * Function that opens the feature manager
	 */
	openFeatureManager() {
		// Define the callback (when the window has opened)
		var callback = function() {
			// Register reset filter button
			$("#rdm-reset-feature-filter-btn").off().on("click", function(){
				$("#rdm-feature-filter-input").val("");
				app.plugins.RestrictionDataManager.featureManagerFilterFeatures(null, app.plugins.RestrictionDataManager.showFeature);
			});
			
			// Register the filter input
			$("#rdm-feature-filter-input").prop("readonly", false);
			$("#rdm-feature-filter-input").off().on("input", function(){
				var term = $(this).val();
				if (app.plugins.RestrictionDataManager.featureManagerSearchTimer) {
					clearTimeout(app.plugins.RestrictionDataManager.featureManagerSearchTimer);
					app.plugins.RestrictionDataManager.featureManagerSearchTimer = null;
				}
				app.plugins.RestrictionDataManager.featureManagerSearchTimer = setTimeout(function() {
					$("#rdm-fm-edit-feature-button").prop("disabled", true);
					app.plugins.RestrictionDataManager.featureManagerFilterFeatures("FEATURE_NAME LIKE '%" + term + "%'");
				}, 250);
			});
			
			// Register the change selection on feature list
			$("#rdm-matching-features").off("change").on("change", function(){
				if (($(this).children(":selected")).length > 0) {
					$("#rdm-fm-edit-feature-button").prop("disabled", false);
				}
			});
			
			// Register the double click on feature handler
			$("#rdm-matching-features").off("dblclick").on("dblclick", function(){
				if (($(this).children(":selected")).length > 0) {
					app.plugins.RestrictionDataManager.showFeature($(this).children(":selected").val());
				}
			});
			
			// Register the edit/create buttons
			$("#rdm-fm-edit-feature-button").off().on("click", function(){
				app.plugins.RestrictionDataManager.showFeature($("#rdm-matching-features").children(":selected").val());
			});
			$("#rdm-fm-create-feature-button").off().on("click", function(){
				app.plugins.RestrictionDataManager.showFeature(-1);
			});
			
			// Show features
			app.plugins.RestrictionDataManager.featureManagerFilterFeatures();
		}
		
		// Open the feature manager in a floating window 
		app.plugins.MultiFloatingWindow.open("rdm-feature-manager", "RDM Feature Manager", this.featureManagerContent, 350, null, "right", callback);
	}
	
	/**
	 * Function: featureManagerFilterFeatures
	 * @param (string) filter
	 * @param (function) callback
	 * @returns () nothing
	 * Function that filters the feature list based on the passed filter
	 */
	featureManagerFilterFeatures(filter, callback) {
		// Optional parameters
		filter = filter || null;
		callback = callback || function(){};
		
		// Bail if already running
		if (this.featureManagerIsWorking) return;
		this.featureManagerIsWorking = true;
		
		// Show Spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-feature-manager");
		
		// Empty matching features selectbox
		$("#rdm-matching-features").empty();
		
		// Populate the features list
		var data = {};
		if (filter) data.filter = filter;
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/features",
			data: data,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(features) {
			$.each(features, function (index, feature) {
				$("#rdm-matching-features").append(new Option(feature.FEATURE_NAME, feature.FEATURE_ID));
			});
			
			// Sort the results (and add "name" tooltip to each option)
			var options = $("#rdm-matching-features option");
			options.detach().sort(function (a, b) {
				var at = $(a).text();
				var bt = $(b).text();
				return (at > bt) ? 1 : ((at < bt) ? -1 : 0);
			});
			options.each(function () {
				$(this).attr("title", $(this).text());
			});
			options.appendTo("#rdm-matching-features");
			
			// Hide the window spinner
			app.plugins.RestrictionDataManager.featureManagerIsWorking = false;
			app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-manager");
			callback();
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.featureManagerIsWorking = false;
			app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-manager");
			callback();
			var error = "Error retrieving features (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
	
	/**
	 * Function: showFeature
	 * @param (integer) featureId
	 * @returns () nothing
	 * Function that shows
	 */
	showFeature(featureId) {
		// Optional parameters
		featureId = featureId || -1;
		
		// Bail if already running
		if (app.plugins.RestrictionDataManager.featureEditorIsWorking) return;
		app.plugins.RestrictionDataManager.featureEditorIsWorking = true;
		
		// Define the function that shows the feature form
		var showFeatureForm = function(feature) {
			// Set some defaults
			app.plugins.RestrictionDataManager.focusFeatureChanges = new Object();
			
			// Define feature id
			var featureId = -1; // new feature 
			if (feature) {
				featureId = feature.FEATURE_ID;
			}
			
			// Determine if feature is readonly
			var featureIsReadOnly = false;
			if (feature) {
				featureIsReadOnly = !app.plugins.RestrictionDataManager.currentUser.write_groups.includes(feature.GROUP_ID);
			}
			
			// Set GROUP_ID & CONCURRENCY_CONTROL_NUMBER
			if (feature) {
				app.plugins.RestrictionDataManager.focusFeatureChanges.CONCURRENCY_CONTROL_NUMBER = feature.CONCURRENCY_CONTROL_NUMBER + 1;
			} else {
				app.plugins.RestrictionDataManager.focusFeatureChanges.CONCURRENCY_CONTROL_NUMBER = 1;
			}
			
			// Create the feature form by cloning the loaded template
			var clone = app.plugins.RestrictionDataManager.featureEditorContent.clone(true);
			clone.find(".rdm-feature-editor-form").first().attr("id", "rdm-feature-editor-form-" + featureId);
			clone.find(".rdm-feature-editor-form").show();
			
			// Populate select options for various elements
			clone.find(".rdm-feature-field-FEATURE_TYPE_ID").each(function(index) {
				var select = $(this);
				$.each(app.plugins.RestrictionDataManager.codes["feature_types"], function(i, code) {
					select.append("<option value=" + code.FEATURE_TYPE_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			clone.find(".rdm-feature-field-SOURCE_SYSTEM_ID").each(function(index) {
				var select = $(this);
				$.each(app.plugins.RestrictionDataManager.codes["source_systems"], function(i, code) {
					select.append("<option value=" + code.SOURCE_SYSTEM_ID + ">" + code.NAME + "</option>");
				});
				select.val(null);
			});
			
			// Populate the feature owner select control
			$.each(app.plugins.RestrictionDataManager.codes["groups"], function(i, code) {
				// Add all of the groups that the user has write access to
				if (app.plugins.RestrictionDataManager.currentUser.write_groups.includes(code.GROUP_ID)) {
					clone.find(".rdm-feature-field-GROUP_ID").append("<option value=" + code.GROUP_ID + ">" + code.NAME + "</option>");
				}
				
				// Add any groups that the user has read access to ONLY IF the current feature is READONLY				
				if (feature && featureIsReadOnly && app.plugins.RestrictionDataManager.currentUser.read_groups.includes(feature.GROUP_ID)) {
					clone.find(".rdm-feature-field-GROUP_ID").append("<option value=" + code.GROUP_ID + ">" + code.NAME + "</option>");
				}
			});
			
			// Loop thru the feature properties and set the values of corresponding form elements (if found)
			if (feature) {
				$.each(feature, function(name, value) {
					if (clone.find(".rdm-feature-field-"+name).length > 0) {
						// Update the original value data attribute
						clone.find(".rdm-feature-field-"+name).data("original-value", value);
						
						// Set the value of the form element
						clone.find(".rdm-feature-field-"+name).val(value);
					}
				});
			}
			
			// Enable/disable controls based on current user's edit group(s)
			if (feature) {
				if (featureIsReadOnly) {
					$.each(feature, function(name, value) {
						if (clone.find(".rdm-feature-field-"+name).length > 0) {
							clone.find(".rdm-feature-field-"+name).prop("disabled", true);	
						}
					});
				}
			}
			
			// Add change listener to each form control that is linked to a field
			$.each(clone.find("[class^='rdm-feature-field-']"), function(index, element) {
				$(element).on("input", function(){
					app.plugins.RestrictionDataManager.trackFeatureChange($(this));
				});
			});
			
			// Show, enable, & register (as needed) the correct buttons
			if (feature) {
				// Show/hide/enable/disable delete button
				clone.find(".btn-delete").show();
				clone.find(".btn-delete").prop("disabled", false);
				
				// Show/hide/enable/disable save button
				clone.find(".btn-save").show();
				clone.find(".btn-save").prop("disabled", true);
				
				// Register button handlers
				clone.find(".btn-delete").click(function() {
					app.plugins.RestrictionDataManager.deleteFeature(featureId);
				});
				clone.find(".btn-save").click(function() {
					app.plugins.RestrictionDataManager.saveFeature(featureId);
				});
			} else {
				clone.find(".btn-create").show();
				clone.find(".btn-create").click(function() {
					app.plugins.RestrictionDataManager.saveFeature(featureId);
				});
			}
			
			// Define Window Title
			if (feature) {
				var windowTitle = "Feature #" + feature.FEATURE_ID + " - " + feature.FEATURE_NAME;
			} else {
				var windowTitle = "Create New Feature";
			}
			
			// If this is a new feature, set some default values and trigger their change detection
			if (feature == null) {
				clone.find(".rdm-feature-field-GROUP_ID").val(clone.find(".rdm-feature-field-GROUP_ID option:first").val());
				app.plugins.RestrictionDataManager.trackFeatureChange(clone.find(".rdm-feature-field-GROUP_ID"));
			}
			
			// Open the feature editor floating window 
			app.plugins.MultiFloatingWindow.open("rdm-feature-editor", windowTitle, clone, 350, null, "middle", function() {
				app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
			});
		}
		
		// Get the feature based on the passed featureId
		if (featureId > 0) {
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/feature/" + featureId,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			}).done(function(feature) {
				showFeatureForm(feature);
			}).fail(function(jqxhr, settings, exception) {
				var error = "Error getting feature #" + featureId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		} else {
			showFeatureForm(null);
		}
	}
	
	/**
	 * Function: saveFeature
	 * @param (integer) featureId
	 * @returns () nothing
	 * Function that inserts or updates a feature
	 */
	saveFeature(featureId) {
		// Bail if already running
		if (app.plugins.RestrictionDataManager.featureEditorIsWorking) return;
		app.plugins.RestrictionDataManager.featureEditorIsWorking = true;
		
		// Show Spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-feature-editor");
		
		// Swap blanks to nulls
		$.each(app.plugins.RestrictionDataManager.focusFeatureChanges, function(name, value) {
			if (value === "") app.plugins.RestrictionDataManager.focusFeatureChanges[name] = null;
		});

		// Update existing feature
		if (featureId > 0) {
			$.ajax({
				type: "PUT",
				url: returnEnvironmentUrl("rdm-api") + "/feature/" + featureId,
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusFeatureChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(response) {
				app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
				app.plugins.RestrictionDataManager.featureManagerFilterFeatures("FEATURE_NAME LIKE '%" + $("#rdm-feature-filter-input").val() + "%'", function(){
					$("#rdm-matching-features").val(featureId);
					app.plugins.RestrictionDataManager.showFeature(featureId);
				});
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
				var error = "Error updating feature #" + locationId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		
		// Insert new feature
		} else {
			$.ajax({
				type: "POST",
				url: returnEnvironmentUrl("rdm-api") + "/features",
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusFeatureChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				var featureId = data[0].FEATURE_ID;
				app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
				app.plugins.RestrictionDataManager.showFeature(featureId);
				app.plugins.RestrictionDataManager.featureManagerFilterFeatures("FEATURE_NAME LIKE '%" + $("#rdm-feature-filter-input").val() + "%'", function(){
					$("#rdm-matching-features").val(featureId);
					app.plugins.RestrictionDataManager.showFeature(featureId);
				});
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.featureManagerIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
				var error = "Error creating feature (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}
	}
	
	/**
	 * Function: deleteFeature
	 * @param (integer) featureId
	 * @returns () nothing
	 * Function that deletes a feature
	 */
	deleteFeature(featureId) {
		bootbox.confirm({
			title: "Delete Feature?",
			message: "Do you want to delete Feature #"+featureId+"?",
			buttons: {
				cancel: {
					label: "Cancel"
				},
				confirm: {
					label: "Delete",
					className: "btn-danger"
				}
			},
			callback: function (result) {
				if (result === true) {
					// Bail if already running
					if (app.plugins.RestrictionDataManager.featureEditorIsWorking) return;
					app.plugins.RestrictionDataManager.featureEditorIsWorking = true;
					
					// Show spinner
					app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-feature-editor");
					
					// Request delete
					$.ajax({
						type: "DELETE",
						url: returnEnvironmentUrl("rdm-api") + "/feature/"+featureId,
						xhrFields: {
							withCredentials: true
						}
					})
					.done(function(data) {
						app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
						app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
						app.plugins.MultiFloatingWindow.close("rdm-feature-editor");
						app.plugins.RestrictionDataManager.featureManagerFilterFeatures("FEATURE_NAME LIKE '%" + $("#rdm-feature-filter-input").val() + "%'");
					})
					.fail(function(jqxhr, settings, exception) {
						app.plugins.RestrictionDataManager.featureEditorIsWorking = false;
						app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-feature-editor");
						logger("ERROR", jqxhr.responseText);
						showModalDialog("ERROR", jqxhr.responseText);
					});
				}
			}
		});
	}
	
	/**
	 * Function: openRdmUserManager
	 * @param () none
	 * @returns () nothing
	 * Function that opens the RDM User Manager
	 */
	openRdmUserManager() {
		// Close any already open windows
		app.plugins.MultiFloatingWindow.close("rdm-user-editor");
		app.plugins.MultiFloatingWindow.close("rdm-user-group-editor");
		
		// Define the callback (when the window has opened)
		var callback = function() {
			// Register reset filter button
			$("#rdm-reset-user-filter-btn").off().on("click", function(){
				$("#rdm-user-filter-input").val("");
				app.plugins.RestrictionDataManager.userManagerFilterUsers(null, app.plugins.RestrictionDataManager.showFeature);
			});
			
			// Register the filter input
			$("#rdm-user-filter-input").prop("readonly", false);
			$("#rdm-user-filter-input").off().on("input", function(){
				var term = $(this).val();
				if (app.plugins.RestrictionDataManager.userManagerSearchTimer) {
					clearTimeout(app.plugins.RestrictionDataManager.userManagerSearchTimer);
					app.plugins.RestrictionDataManager.userManagerSearchTimer = null;
				}
				app.plugins.RestrictionDataManager.userManagerSearchTimer = setTimeout(function() {
					$("#rdm-fm-edit-user-button").prop("disabled", true);
					app.plugins.RestrictionDataManager.userManagerFilterUsers("USERNAME LIKE '%" + term + "%' OR FNAME LIKE '%" + term + "%' OR LNAME LIKE '%" + term + "%'");
				}, 250);
			});
			
			// Register the change selection on user list
			$("#rdm-matching-users").off("change").on("change", function(){
				if (($(this).children(":selected")).length > 0) {
					$("#rdm-fm-edit-user-button").prop("disabled", false);
				}
			});
			
			// Register the double click on user handler
			$("#rdm-matching-users").off("dblclick").on("dblclick", function(){
				if (($(this).children(":selected")).length > 0) {
					app.plugins.RestrictionDataManager.showUserEditor($(this).children(":selected").val());
				}
			});
			
			// Register the edit/create buttons
			$("#rdm-fm-edit-user-button").off().on("click", function(){
				app.plugins.RestrictionDataManager.showUserEditor($("#rdm-matching-users").children(":selected").val());
			});
			$("#rdm-fm-create-user-button").off().on("click", function(){
				app.plugins.RestrictionDataManager.showUserEditor(-1);
			});
			
			// Show users
			app.plugins.RestrictionDataManager.userManagerFilterUsers();
		}
		
		// Open the user manager in a floating window 
		app.plugins.MultiFloatingWindow.open("rdm-user-manager", "RDM User Manager", this.userManagerContent, 350, null, "right", callback);
	}
	
	/**
	 * Function: userManagerFilterUsers
	 * @param (string) filter
	 * @param (function) callback
	 * @returns () nothing
	 * Function that filters the user list based on the passed filter
	 */
	userManagerFilterUsers(filter, callback) {
		// Optional parameters
		filter = filter || null;
		callback = callback || function(){};
		
		// Bail if already running
		if (this.userManagerIsWorking) return;
		this.userManagerIsWorking = true;
		
		// Show Spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-user-manager");
		
		// Empty matching users selectbox
		$("#rdm-matching-users").empty();
		
		// Populate the users list
		var data = {};
		if (filter) data.filter = filter;
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/users",
			data: data,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		})
		.done(function(users) {
			$.each(users, function (index, user) {
				$("#rdm-matching-users").append(new Option(user.FNAME + " " + user.LNAME + " (" + user.USERNAME + ")", user.USER_ID));
			});
			
			// Sort the results (and add "name" tooltip to each option)
			var options = $("#rdm-matching-users option");
			options.detach().sort(function (a, b) {
				var at = $(a).text();
				var bt = $(b).text();
				return (at > bt) ? 1 : ((at < bt) ? -1 : 0);
			});
			options.each(function () {
				$(this).attr("title", $(this).text());
			});
			options.appendTo("#rdm-matching-users");
			
			// Hide the window spinner
			app.plugins.RestrictionDataManager.userManagerIsWorking = false;
			app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-manager");
			callback();
		})
		.fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.userManagerIsWorking = false;
			app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-manager");
			callback();
			var error = "Error retrieving users (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
	
	/**
	 * Function: showUser
	 * @param (integer) userId
	 * @returns () nothing
	 * Function that shows the User Editor
	 */
	showUserEditor(userId) {
		// Optional parameters
		userId = userId || -1;
		
		// Bail if already running
		if (app.plugins.RestrictionDataManager.userEditorIsWorking) return;
		app.plugins.RestrictionDataManager.userEditorIsWorking = true;
		
		// Close user group editor window if open
		app.plugins.MultiFloatingWindow.close("rdm-user-group-editor");
		
		// Define the function that shows the user form
		var showUserForm = function(user) {
			// Set some defaults
			app.plugins.RestrictionDataManager.focusUserChanges = new Object();
			
			// Define user id
			var userId = -1; // new user 
			if (user) {
				userId = user.USER_ID;
			}
				
			// Set CONCURRENCY_CONTROL_NUMBER
			if (user) {
				app.plugins.RestrictionDataManager.focusUserChanges.CONCURRENCY_CONTROL_NUMBER = user.CONCURRENCY_CONTROL_NUMBER + 1;
			} else {
				app.plugins.RestrictionDataManager.focusUserChanges.CONCURRENCY_CONTROL_NUMBER = 1;
			}
			
			// Create the user form by cloning the loaded template
			var clone = app.plugins.RestrictionDataManager.userEditorContent.clone(true);
			clone.find(".rdm-user-form").attr("id", "rdm-user-form-" + userId);
			clone.find(".rdm-user-form").show();
			
			// Populate select options for various elements
			clone.find(".rdm-user-field-USER_DIRECTORY").each(function(index) {
				$(this).append("<option value='IDIR'>IDIR</option>");
				$(this).append("<option value='SYSTEM'>SYSTEM</option>");
				$(this).val('IDIR');
			});
			clone.find(".rdm-user-field-IS_ENABLED").each(function(index) {
				$(this).append("<option value=0>False</option>");
				$(this).append("<option value=1>True</option>");
				$(this).val(null);
			});
			clone.find(".rdm-user-field-IS_SUPERUSER").each(function(index) {
				$(this).append("<option value=0>False</option>");
				$(this).append("<option value=1>True</option>");
				$(this).val(null);
			});
			
			// Loop thru the user properties and set the values of corresponding form elements (if found)
			if (user) {
				$.each(user, function(name, value) {
					if (clone.find(".rdm-user-field-"+name).length > 0) {
						// Update the original value data attribute
						clone.find(".rdm-user-field-"+name).data("original-value", value);
						
						// Set the value of the form element
						clone.find(".rdm-user-field-"+name).val(value);
					}
				});
			}
			
			// Add change listener to each form control that is linked to a field
			$.each(clone.find("[class^='rdm-user-field-']"), function(index, element) {
				$(element).on("input", function(){
					app.plugins.RestrictionDataManager.trackUserChange($(this));
				});
			});
			
			// If this is a new user, set some default values and trigger their change detection
			if (user == null) {
				clone.find(".rdm-user-field-USER_DIRECTORY").val('IDIR');
				clone.find(".rdm-user-field-IS_ENABLED").val(0);
				clone.find(".rdm-user-field-IS_SUPERUSER").val(0);
				app.plugins.RestrictionDataManager.trackUserChange(clone.find(".rdm-user-field-USER_DIRECTORY"));
				app.plugins.RestrictionDataManager.trackUserChange(clone.find(".rdm-user-field-IS_ENABLED"));	
				app.plugins.RestrictionDataManager.trackUserChange(clone.find(".rdm-user-field-IS_SUPERUSER"));			
			}
			
			// Show, enable, & register (as needed) the correct buttons
			if (user) {
				// Show/hide/enable/disable mange user groups button
				clone.find(".btn-manage-user-groups").show();
				clone.find(".btn-manage-user-groups").prop("disabled", false);
				
				// Show/hide/enable/disable delete button
				clone.find(".btn-delete").show();
				clone.find(".btn-delete").prop("disabled", false);
				
				// Show/hide/enable/disable save button
				clone.find(".btn-save").show();
				clone.find(".btn-save").prop("disabled", true);
				
				// Register button handlers
				clone.find(".btn-manage-user-groups").on("click", function(){
					app.plugins.RestrictionDataManager.showUserGroupEditor(userId);
				});
				clone.find(".btn-delete").click(function() {
					app.plugins.RestrictionDataManager.deleteUser(userId);
				});
				clone.find(".btn-save").click(function() {
					app.plugins.RestrictionDataManager.saveUser(userId);
				});
			} else {
				clone.find(".btn-create").show();
				clone.find(".btn-create").click(function() {
					app.plugins.RestrictionDataManager.saveUser(userId);
				});
			}
			
			// Define Window Title
			if (user) {
				var windowTitle = "User Editor: " + user.FNAME + " " + user.LNAME + " (ID:" + user.USER_ID + ")";
			} else {
				var windowTitle = "Create New User";
			}
			
			// Open the user editor floating window 
			app.plugins.MultiFloatingWindow.open("rdm-user-editor", windowTitle, clone, 350, null, "middle", function() {
				app.plugins.RestrictionDataManager.userEditorIsWorking = false;
			});
		}
		
		// Get the user based on the passed userId
		if (userId > 0) {
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/user/" + userId,
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			}).done(function(user) {
				showUserForm(user);
			}).fail(function(jqxhr, settings, exception) {
				var error = "Error getting user #" + userId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		} else {
			showUserForm(null);
		}
	}
	
	/**
	 * Function: saveUser
	 * @param (integer) userId
	 * @returns () nothing
	 * Function that inserts or updates a user
	 */
	saveUser(userId) {
		// Bail if already running
		if (app.plugins.RestrictionDataManager.userEditorIsWorking) return;
		app.plugins.RestrictionDataManager.userEditorIsWorking = true;
		
		// Show Spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-user-editor");
		
		// Swap blanks to nulls
		$.each(app.plugins.RestrictionDataManager.focusUserChanges, function(name, value) {
			if (value === "") app.plugins.RestrictionDataManager.focusUserChanges[name] = null;
		});

		// Update existing user
		if (userId > 0) {
			$.ajax({
				type: "PUT",
				url: returnEnvironmentUrl("rdm-api") + "/user/" + userId,
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusUserChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(response) {
				app.plugins.RestrictionDataManager.userEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
				app.plugins.RestrictionDataManager.userManagerFilterUsers("USERNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR FNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR LNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%'", function(){
					$("#rdm-matching-users").val(userId);
					app.plugins.RestrictionDataManager.showUserEditor(userId);
				});
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.userEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
				var error = "Error updating user #" + userId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		
		// Insert new user
		} else {
			$.ajax({
				type: "POST",
				url: returnEnvironmentUrl("rdm-api") + "/users",
				data: JSON.stringify(app.plugins.RestrictionDataManager.focusUserChanges),
				xhrFields: {
					withCredentials: true
				}
			})
			.done(function(data) {
				var userId = data[0].USER_ID;
				app.plugins.RestrictionDataManager.userEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
				app.plugins.RestrictionDataManager.showUserEditor(userId);
				app.plugins.RestrictionDataManager.userManagerFilterUsers("USERNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR FNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR LNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%'", function(){
					$("#rdm-matching-users").val(userId);
					app.plugins.RestrictionDataManager.showUserEditor(userId);
				});
			})
			.fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.userEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
				var error = "Error creating user (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}
	}
	
	/**
	 * Function: deleteUser
	 * @param (integer) userId
	 * @returns () nothing
	 * Function that deletes a user
	 */
	deleteUser(userId) {
		bootbox.confirm({
			title: "Delete User?",
			message: "Do you want to delete User #"+userId+"?",
			buttons: {
				cancel: {
					label: "Cancel"
				},
				confirm: {
					label: "Delete",
					className: "btn-danger"
				}
			},
			callback: function (result) {
				if (result === true) {
					// Bail if already running
					if (app.plugins.RestrictionDataManager.userEditorIsWorking) return;
					app.plugins.RestrictionDataManager.userEditorIsWorking = true;
					
					// Close any dependant windows
					app.plugins.MultiFloatingWindow.close("rdm-user-group-editor");
					
					// Show spinner
					app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-user-editor");
					
					// Request delete
					$.ajax({
						type: "DELETE",
						url: returnEnvironmentUrl("rdm-api") + "/user/"+userId,
						xhrFields: {
							withCredentials: true
						}
					})
					.done(function(data) {
						app.plugins.RestrictionDataManager.userEditorIsWorking = false;
						app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
						app.plugins.MultiFloatingWindow.close("rdm-user-editor");
						app.plugins.RestrictionDataManager.userManagerFilterUsers("USERNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR FNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%' OR LNAME LIKE '%" + $("#rdm-user-filter-input").val() + "%'");
					})
					.fail(function(jqxhr, settings, exception) {
						app.plugins.RestrictionDataManager.userEditorIsWorking = false;
						app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-editor");
						logger("ERROR", jqxhr.responseText);
						showModalDialog("ERROR", jqxhr.responseText);
					});
				}
			}
		});
	}
	
	/**
	 * Function: showUserGroupEditor
	 * @param (integer) userId
	 * @returns () nothing
	 * Function that opens the user group editor
	 */
	showUserGroupEditor(userId) {
		// Bail if already running
		if (app.plugins.RestrictionDataManager.userGroupEditorIsWorking) return;
		app.plugins.RestrictionDataManager.userGroupEditorIsWorking = true;
		
		// Define the function that shows the user group form
		var showUserGroupForm = function(user, userGroups) {
			// Convert passed userGroups object into READ and WRITE groups (using their ID)
			var readGroupIds = [];
			var writeGroupIds = [];
			$.each(userGroups, function(index, group) {
				readGroupIds.push(group.GROUP_ID);
				if (group.CAN_EDIT == 1) writeGroupIds.push(group.GROUP_ID);
			});
			
			// Set some defaults
			app.plugins.RestrictionDataManager.focusUserGroupChanges = new Object();
		
			// Create the user group form by cloning the loaded template
			var clone = app.plugins.RestrictionDataManager.userGroupEditorContent.clone(true);
			clone.find(".rdm-user-group-form").attr("id", "rdm-user-group-form-" + userId);
			clone.find(".rdm-user-group-form").show();
			
			// Add all of the group elements to the form
			$.each(app.plugins.RestrictionDataManager.codes.groups, function(index, group) {
				// Determine user's permissions to current group
				var permission = "none";
				if (writeGroupIds.includes(group.GROUP_ID)) {
					permission = "rw";
				} else if (readGroupIds.includes(group.GROUP_ID)) {
					permission = "ro";
				}
				
				// Build the group element
				var groupClone = clone.find(".rdm-user-group-template").clone(true);
				groupClone.removeClass("rdm-user-group-template");
				groupClone.find(".rdm-user-group-label").html(group.NAME);
				groupClone.find(".rdm-user-group-select").data("USER_ID", userId);
				groupClone.find(".rdm-user-group-select").data("GROUP_ID", group.GROUP_ID);
				groupClone.find(".rdm-user-group-select").data("original-value", permission);
				groupClone.find(".rdm-user-group-select").val(permission);
				groupClone.find(".rdm-user-group-select").on("input", function(){
					app.plugins.RestrictionDataManager.trackUserGroupChange($(this));
				});
				groupClone.show();
				clone.find(".rdm-user-groups").append(groupClone);
			});

			// Register event handlers
			clone.find(".btn-save").click(function() {
				app.plugins.RestrictionDataManager.saveUserGroups(userId);
			});
			
			// Define the user groups window title
			var windowTitle = "User Group Editor: " + user.FNAME + " " + user.LNAME + " (ID:" + user.USER_ID + ")";
			
			// Show the user group editor window
			app.plugins.MultiFloatingWindow.open("rdm-user-group-editor", windowTitle, clone, 350, null, "left", function() {
				app.plugins.RestrictionDataManager.userGroupEditorIsWorking = false;
				app.plugins.MultiFloatingWindow.hideWindowSpinner("rdm-user-group-editor");
			});	
		}
		
		// Get the user based on the passed userId (only need this for the window title)
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("rdm-api") + "/user/" + userId,
			dataType: "json",
			xhrFields: {
				withCredentials: true
			}
		}).done(function(user) {
			// Get the user's groups
			$.ajax({
				type: "GET",
				url: returnEnvironmentUrl("rdm-api") + "/user/" + user.USER_ID + "/groups",
				dataType: "json",
				xhrFields: {
					withCredentials: true
				}
			}).done(function(userGroups) {
				showUserGroupForm(user, userGroups);
			}).fail(function(jqxhr, settings, exception) {
				app.plugins.RestrictionDataManager.userGroupEditorIsWorking = false;
				var error = "Error getting user groups for user #" + userId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				showModalDialog("ERROR", error);
			});
		}).fail(function(jqxhr, settings, exception) {
			app.plugins.RestrictionDataManager.userGroupEditorIsWorking = false;
			var error = "Error getting user #" + userId + " (" + jqxhr.responseText + ")";
			logger("ERROR", error);
			showModalDialog("ERROR", error);
		});
	}
	
	/**
	 * Function: saveUserGroups
	 * @param (integer) userId
	 * @returns () nothing
	 * Function that saves a user's group permissions
	 */
	saveUserGroups(userId) {
		// Bail if already running
		if (app.plugins.RestrictionDataManager.userGroupEditorIsWorking) return;
		app.plugins.RestrictionDataManager.userGroupEditorIsWorking = true;
		
		// Show Spinner
		app.plugins.MultiFloatingWindow.showWindowSpinner("rdm-user-group-editor");
		
		// Setup some misc variables
		var completedRequestCount = 0;
		var requestErrors = [];
		
		// Define the function that handles each API response and aggregates them
		var handleResponse = function(success, response) {
			// Increment the completed request count
			completedRequestCount++;
			
			// Aggregate failure messages
			if (!success) {
				requestErrors.push(response);
			}
	
			// Handle the completion of all requests
			if (completedRequestCount >= Object.keys(app.plugins.RestrictionDataManager.focusUserGroupChanges).length) {
				app.plugins.RestrictionDataManager.userGroupEditorIsWorking = false;
				app.plugins.RestrictionDataManager.showUserGroupEditor(userId);
				
				// If there were errors
				if (requestErrors.length > 0) {
					showModalDialog("ERROR", requestErrors.join("<br>"));
				}
			}
		}
		
		// Issue an API call for each change
		$.each(this.focusUserGroupChanges, function(groupId, change) {
			
			// Define the API URL to call and what method to use
			var method = change.METHOD
			switch (method) {
				case "POST":
					var url = returnEnvironmentUrl("rdm-api") + "/user/" + userId + "/groups";
					var data = [];
					data.push({
						"GROUP_ID": groupId,
						"CAN_EDIT": change.CAN_EDIT
					});
					break;
				case "PUT":
					var url = returnEnvironmentUrl("rdm-api") + "/user/" + userId + "/group/" + groupId;
					var data = {"CAN_EDIT": change.CAN_EDIT};
					break;
				case "DELETE":
					var url = returnEnvironmentUrl("rdm-api") + "/user/" + userId + "/group/" + groupId;
					var data = {};
					break;	
			}

			// Issue the request
			$.ajax({
				type: method,
				url: url,
				data: JSON.stringify(data),
				xhrFields: {
					withCredentials: true
				}
			}).done(function(response) {
				handleResponse(true, response);
			}).fail(function(jqxhr, settings, exception) {
				var error = "Error setting user groups for user #" + userId + " (" + jqxhr.responseText + ")";
				logger("ERROR", error);
				handleResponse(false, error);
			});
		});
	}
	
	/**
	 * Function: openRdmCodeManager
	 * @param () none
	 * @returns () nothing
	 * Function that opens the RDM Code Manager
	 */
	openRdmCodeManager() {
		
		
		// This function will manage all RDM codes in the future
		
		
		var content = "<div style='height:200px;text-align:center;'><img src='application/plugins/RestrictionDataManager/img/under-construction.gif'></div>";
		app.plugins.MultiFloatingWindow.open("rdm-code-manager", "RDM Code Manager", content, 350, 550, "right");
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define pluginSecondaryInit function
		var pluginSecondaryInit = function(){
			// Show buttons
			$("#rdm-location-create-btn").show();
			
			// Register buttons
			$("#rdm-get-location-from-map-btn").click(function(){ 
				app.plugins.RestrictionDataManager.registerMapClickLocation();
			});
			$("#rdm-location-close").click(function() {
				app.plugins.RestrictionDataManager.closeLocation();
			});
			$("#rdm-location-create-btn").click(function() {
				app.plugins.RestrictionDataManager.showLocation(-1);
			});
			
			// Show working
			app.plugins.RestrictionDataManager.showSpinner();
			
			// Get all the required content in an async format
			var functionsToRun = [
				app.plugins.RestrictionDataManager.getConfiguration,
				app.plugins.RestrictionDataManager.getCodes,
				app.plugins.RestrictionDataManager.getSchemas,
				app.plugins.RestrictionDataManager.loadRestrictionEditor,
				app.plugins.RestrictionDataManager.loadFeatureManager,
				app.plugins.RestrictionDataManager.loadFeatureEditor,
				app.plugins.RestrictionDataManager.loadUserManager,
				app.plugins.RestrictionDataManager.loadUserEditor,
				app.plugins.RestrictionDataManager.loadUserGroupEditor
			];
			var fmCompleteCount = 0;
			var functionMonitor = function() {
				fmCompleteCount++;
				if (fmCompleteCount >= functionsToRun.length) {
					// Enable RDM User Manager menu option if current user is a superuser
					if (app.plugins.RestrictionDataManager.currentUser.is_superuser === true) {
						$("#mainMenuOptions .dropdown-item").each(function() {
							if ($(this).data("option-name") == "RDM User Manager") $(this).show();
						});
					}
					
					// Enable RDM Code Manager menu option if current user is a superuser
					if (app.plugins.RestrictionDataManager.currentUser.is_superuser === true) {
						$("#mainMenuOptions .dropdown-item").each(function() {
							if ($(this).data("option-name") == "RDM Code Manager") $(this).show();
						});
					}
					
					// Enable the Feature Manager menu option
					$("#mainMenuOptions .dropdown-item").each(function() {
						if ($(this).data("option-name") == "RDM Feature Manager") $(this).show();
					});

					// Update stats and hide spinner
					app.plugins.RestrictionDataManager.updateStatistics();
					app.plugins.RestrictionDataManager.hideSpinner();
					logger("INFO", app.plugins.RestrictionDataManager.name + ": Plugin successfully loaded");
				}
			}
			$.each(functionsToRun, function (index, functionToRun) {
				functionToRun(functionMonitor);
			});

		}
		
		// Define pluginPrimaryInit function
		var pluginPrimaryInit = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.RestrictionDataManager.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set the tab nav & content variables
			app.plugins.RestrictionDataManager.tabNav = tabNav;
			app.plugins.RestrictionDataManager.tabContent = tabContent;
			
			// Get the current user and finish the initialization process based on returned user
			app.plugins.RestrictionDataManager.getCurrentUser(function(data) {
				// Bail if no API access
				if (data == null) {
					$("#rdm-welcome .rdm-user").html("Error");
					showModalDialog("ERROR", "An application error has occurred.  Please contact the application administrator.");
					return;
				}
				
				// Update class object
				app.plugins.RestrictionDataManager.currentUser = data;

				// If a valid user
				if (app.plugins.RestrictionDataManager.currentUser.user_id > 0) {
					$("#rdm-welcome .rdm-user").html("Welcome " + data.fname + " " + data.lname);
					pluginSecondaryInit();
				} else {
					$("#rdm-welcome .rdm-user").html("Not authorizied");
					showModalDialog("ERROR", "You are not authorizied to use this application.");
				}
			});
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, pluginPrimaryInit);
	}
}