class DAGaddPoint {
// edit line 83 (baseUrl)	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "DAGaddPoint";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : false;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "11em";	
		this.launchImport = true;
		this.devTech = false;
		// Define style for added points
		this.AddedPointStyle = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 8,
					stroke: new ol.style.Stroke({
						color: "rgba(0, 255, 0, 1)",
						width: 3
					}),
					fill: new ol.style.Fill({
						color: "rgba(0, 255, 0, 0.5)"
					})
				})
			})
		
		// Define and add the new points layer
		var source = new ol.source.Vector({});
		this.AddedPointsLayer = new ol.layer.Vector({
			source: source,
			style: this.AddedPointStyle
		});
		this.AddedPointsLayer.setZIndex(nextAvailableOverlayLayerZIndex());
		app.map.addLayer(this.AddedPointsLayer);
		// Define style for point being added
		this.PointStyle = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 8,
					stroke: new ol.style.Stroke({
						color: "rgba(35, 119, 16, 1)",
						width: 3
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)"
					})
				})
			})
		
		// Define and add the new points layer
		var source = new ol.source.Vector({});
		this.PointsLayer = new ol.layer.Vector({
			source: source,
			style: this.PointStyle
		});
		this.PointsLayer.setZIndex(nextAvailableOverlayLayerZIndex());
		app.map.addLayer(this.PointsLayer);
		// Make points draggable
		var modify = new ol.interaction.Modify({
			source: source,
			deleteCondition: function () { return false },
			insertVertexCondition: function () { return false },
		});
		modify.on("modifyend",function(evt) { 
			app.plugins.DAGaddPoint.confirmPoint(app.plugins.DAGaddPoint.PointsLayer.getSource().getFeatures()[0].getGeometry().getCoordinates());
		});	
		app.map.addInteraction(modify);		
		// Add popup to map as confirmation of point added
		var popup = $("#popup");
		$("#map").append(popup);	

		// be able to show existing points
		this.existingPoints = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: getHighlightStyle
		});
		app.map.addLayer(this.existingPoints);
				
		function highlightAndZoom(cqlfilter) {
			// show points of interest
			var baseUrl = "../ogs-geoV06/ows";
			var gfUrl = baseUrl+"?service=WFS&request=GetFeature&version=2.0.0&typename=dag:DAP_APPLICATION_LOCATION&srsname=urn:ogc:def:crs:EPSG::3857&outputformat=application/json&"+cqlfilter; 

			$.ajax({
			  method: "GET",
			  url: gfUrl,
				xhrFields: {
				   withCredentials: true
				},
			})
			.done(function( response ) {
				var format = new ol.format.GeoJSON();
				response.features.forEach( function(feat) {
					app.highlightLayer.getSource().addFeature(format.readFeature(feat));
				});
				app.map.getView().fit(app.highlightLayer.getSource().getExtent(), {padding: [20,20,20,20]});
				app.plugins.DAGaddPoint.existingPoints.getSource().addFeatures(app.highlightLayer.getSource().getFeatures());
				app.plugins.DAGaddPoint.existingPoints.setZIndex(nextAvailableOverlayLayerZIndex());
			})	  
			.fail(function(err) {
				  logger("ERROR","DAGaddPoint: Error querying applications");
			});	
		}
		
		function hightlightAndZoomApplicant() {
			// be able to show existing points in this scope
			var eSource = new ol.source.Vector({});
			var existingPoints = new ol.layer.Vector({
				source: eSource,
				style: getHighlightStyle
			});
			app.map.addLayer(existingPoints);
			if (opendWithCurrentLocation()) {
				var bCAlbers = [];
				var xYpair = getCurrentLocation().split(",");
				bCAlbers.push(parseInt(xYpair[0]));
				bCAlbers.push(parseInt(xYpair[1]));
				var mapPoint = ol.proj.transform(bCAlbers,"EPSG:3005",app.map.getView().getProjection());
				var mapFeature = new ol.Feature(new ol.geom.Point(mapPoint));
				app.highlightLayer.getSource().addFeature(mapFeature);
				app.map.getView().fit(app.highlightLayer.getSource().getExtent(), {padding: [20,20,20,20]});
			}
			if (opendWithOtherLocations()) {
				var otherPairs = getOtherLocations().split(",");
				var pairCount = 0
				for (var pairCount = 0; pairCount <= otherPairs.length/2 + 2; pairCount += 2) {
					var bCAlbers = [];
					bCAlbers.push(parseInt(otherPairs[pairCount]));
					bCAlbers.push(parseInt(otherPairs[pairCount+1]));
					var mapPoint = ol.proj.transform(bCAlbers,"EPSG:3005",app.map.getView().getProjection());
					var mapFeature = new ol.Feature(new ol.geom.Point(mapPoint));
					app.highlightLayer.getSource().addFeature(mapFeature);
				}
			}
			if (!opendWithCurrentLocation()&&opendWithOtherLocations()) {
				app.map.getView().fit(app.highlightLayer.getSource().getExtent(), {padding: [20,20,20,20]});
			}
			existingPoints.getSource().addFeatures(app.highlightLayer.getSource().getFeatures());
			existingPoints.setZIndex(nextAvailableOverlayLayerZIndex());

		}

		this.addPlugin();
		
		// Determine how the map was called based on calling window parameters pulled from app-config.js
		try {
			// if this is a devtech, redirect to devtech map
			var thisUrl =  window.location.href;
			if ( (getSite()=='applicant') && thisUrl.slice(-6) == 'dagapp')  {
				hightlightAndZoomApplicant();
			} else {
				// Confirm that user is dev tech
				this.devTech = (getSite() == 'dev_tech') ? true : false;
				if ( this.devTech && thisUrl.slice(-6) == 'dagapp') {
					let redirect = thisUrl.slice(0,-6)+"dag";
					location.href = redirect;
				}
				// was it opened from a specific location link?
				if (openedWithLocObjId()) {
					// highlight the point of interest
					highlightAndZoom("CQL_FILTER=LOCATION_POSSE_OBJECTID%3D"+getLocObjId());
				} else if (openedWithAppObjId()) {
					// highlight all points for this application
					highlightAndZoom("CQL_FILTER=APPLICATION_POSSE_OBJECTID%3D"+getAppObjId());
				} else if (opendWithMultipleAppObjIds()) {
					// highlight all points for this application
					highlightAndZoom("CQL_FILTER=APPLICATION_POSSE_OBJECTID IN ("+getMultipleAppObjIds()+")");
				}
				// kludge for postMessage timing issue for This Location layer
				// specifically the message from the parent doesn't arrive in enough time for the parsing of app_config
				// but is there for the loading of the plugins
				app.config.map.layers.forEach(function(layer) {
					if (layer.get("name") == "thisOne") {
						var cqlfilter;
						if (openedWithLocObjId()) {
							// highlight the point of interest
							cqlfilter = "LOCATION_POSSE_OBJECTID="+getLocObjId();
						} else if (openedWithAppObjId()) {
							// highlight all points for this application
							cqlfilter = "APPLICATION_POSSE_OBJECTID="+getAppObjId();
						} else if (opendWithMultipleAppObjIds()) {
							// highlight all points for this application
							cqlfilter = "APPLICATION_POSSE_OBJECTID IN ("+getMultipleAppObjIds()+")";
						} else {
							// no locations, so remove "This Location" UNFORTUNATELY THE LAYERCONTROLLER PLUGIN ISN'T INTIALLIZED YET
							var layerId = layer.ol_uid;
		//					app.plugins.LayerController.removeLayer(layerId); 
						}						
						layer.getSource().updateParams({
							LAYERS: "dag:DAP_APPLICATION_LOCATION",
							CQL_FILTER: cqlfilter 
						});	
					}
				});		

			}
			
		} catch (err) {
			logger("ERROR","DAGaddPoint: Error getting calling parameters "+err);
		}
				
					
//		this.addPlugin();
	
	}
	
	
	/**
	 * Function: confirmPoint
	 * @param () none
	 * @returns () nothing
	 * Function to prompt to keep point, delete it or dismiss so point can be dragged
	 */
	confirmPoint(coords) {
		let displayXY = ol.proj.transform(coords, app.map.getView().getProjection(), "EPSG:4326");
		let thisPoint = app.plugins.DAGaddPoint.PointsLayer.getSource().getFeatures()[0];
		let friendlyPoint = displayXY[1].toFixed(5) + "&deg;, " + displayXY[0].toFixed(5) + "&deg;"
		var message = "<br>Choose Yes to confirm. ";
		message += app.plugins.DAGaddPoint.devTech? "<input type='checkbox' "+(app.plugins.DAGaddPoint.launchImport?"checked":"")+" id='dag-add-pt-launchImport' value='Y'> Launch Import Features.":"";
		message += "<br/>Choose Continue to adjust the location. <br/>Choose Quit to abandon adding a point.";
		bootbox.dialog({
			title: "Confirm Location "+ friendlyPoint,
			message: message, 
			centerVertical: true,
			buttons: {
				confirm: {
					label: "Yes",
					className: "btn-success",
					callback: function() {
						var albersXY = ol.proj.transform(coords, app.map.getView().getProjection(), "EPSG:3005");
						var lonA = albersXY[0].toFixed();
						var latA = albersXY[1].toFixed();
						try {
							var message = ["DAPNewLocation",lonA,latA];
							window.parent.postMessage(message, "*");
						} catch (err) {
							logger("ERROR","DAGaddPoint: Error communicating with Posse");
						}
						
						$("#popup-content").html("Sending "+friendlyPoint+"... ");
						$("#map #popup").show().delay(3000).fadeOut();
						
						// only ask if this is a DEV TECH
						if (app.plugins.DAGaddPoint.devTech) {
							// launch Import Features by default, but also allow for opting out
							if ( $("#dag-add-pt-launchImport")[0].checked )  {
								app.plugins.DAGaddPoint.launchImport = true;
								let clickPt = ol.proj.transform(coords, app.map.getView().getProjection(), "EPSG:4326");
								if (app.plugins.DAGaddPoint.launchImport) {
									$(".dag-search-point .dag-location-input").attr("longitude",clickPt[0]);
									$(".dag-search-point .dag-location-input").attr("latitude",clickPt[1]);
									// open the Import Features tab with the default radius
									app.plugins.DAG.registerSearchRadius();
									$(".nav-link").removeClass("active");
									$(".tab-pane").removeClass("active");
									$(".tab-pane").removeClass("show");
									$("#ImportFeatures-tab-nav").addClass("active");
									$("#ImportFeatures-tab-content").addClass("active");
									$("#ImportFeatures-tab-content").addClass("show");
									$(".dag-location-input").prop("value",friendlyPoint.replaceAll("&deg;",""));
								}						
							} else { // opting out, useful for adding numerous points
								app.plugins.DAGaddPoint.launchImport = false;
							}
						}
						// Reset the map's single click function to default "move" point to added layer
						resetDefaultMapSingleClickFunction();
						app.plugins.DAGaddPoint.AddedPointsLayer.getSource().addFeature(app.plugins.DAGaddPoint.PointsLayer.getSource().getFeatures()[0]);
						app.plugins.DAGaddPoint.PointsLayer.getSource().removeFeature(thisPoint);

					}
				},
				foo: {
					label: "Continue",
					className: "btn-info",
					callback: function() {
					}
				},

				cancel: {
					label: "Quit",
					className: "btn-danger",
					callback: function() {
						// Reset the map's single click function to default and remove point
						resetDefaultMapSingleClickFunction();
						app.plugins.DAGaddPoint.PointsLayer.getSource().removeFeature(thisPoint);
					}
				}
			}
		});
	}
	
    /**
	 * Function: mapClickFunction
	 * @param () none
	 * @returns () nothing
	 * Function that registers the map click and opens google maps street view
	 */
	mapClickFunction(e){
		// mark the map with a point
		var pointGeometry = new ol.geom.Point(e.coordinate);
		var pointFeature = new ol.Feature({geometry: pointGeometry});
		app.plugins.DAGaddPoint.PointsLayer.getSource().addFeature(pointFeature);
		
        // Ask user if this is where they want it
        // app.plugins.DAGaddPoint.PointsLayer.getSource().getFeatures()[0].getGeometry().getCoordinates()
		app.plugins.DAGaddPoint.confirmPoint(e.coordinate);
		
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
				
        // Load in the button icon
		var iconSrc = '<img src="./application/plugins/DAGaddPoint/img/map-marker-8x.png" width="20" height="20">';
		
        // Create the addPoint button
        var button = document.createElement('button');
        button.id = "dag-addPoint-btn";
		button.innerHTML = iconSrc; // locate point icon

		let basemapEnabled = false;

		// Loop through the list of plugins and check if the basemap plugin is enabled
		for (var i = 0; i < app.config.plugins.length; i++) {
			if (app.config.plugins[i].name == "BasemapSwitcher") {
				basemapEnabled = true;
			}
		}
		
		// Bail if map not allowed to update
		if (!allowUpdate()) {
			logger("INFO", this.name + ": no updates allowed");
		} else {
		
			// Create the addPoint location div
			var element = document.createElement('div');
			element.title = "Add a Point";
			element.id = "dag-location-btn";
			element.className = 'addPoint-location-btn ol-control';
			if (this.buttonLocatedTop) {
				element.style.top = this.buttonLocationOffset;
			} else {
				element.style.bottom = this.buttonLocationOffset;
			}
			if (this.buttonLocatedRight) {
				element.style.right = '.5em';
			} else {
				element.style.left = '.5em';
			}	
			element.appendChild(button);
			
			// Create a new open layers control for the addPoint location button
			var addPoint = new ol.control.Control({
				element: element    
			});
			
			// Add the new control to the map
			app.map.addControl(addPoint);
	
			// Add the click event to the addPoint location button
			$("#dag-location-btn").click(function() {
				clearHighlightedFeatures(); 
				// Redirect the map's single click function to this mapClickFunction\
				redirectMapSingleClickFunction("crosshair", app.plugins.DAGaddPoint.mapClickFunction);
			});
		}
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}