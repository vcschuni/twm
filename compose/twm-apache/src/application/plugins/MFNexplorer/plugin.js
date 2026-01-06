class MFNexplorer {
// edit  "../ogs-internal/ows" instances
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "MFNexplorer";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
	    this.tabContentFile = "application/plugins/MFNexplorer/tab-content.html";
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Manage Fibre";
		this.tabNav; // jQuery element
		this.tabContent; // jQuery element
		this.editLayer = 'iss:ISS_MFN_CONNECTION_LOCATION_EDIT';
		this.viewLayerTitle = "MoTI Connection Location"; // Must match title of 'iss:ISS_MFN_CONNECTION_LOCATION' getLayerByTitle
		this.lastUsedName = "Connection Location Name";
		this.canEdit = false;
		this.busy = false;
		this.addInUse = false;
		this.manageInUse = false;
		this.thisLocation = {};
		this.report = [];
		this.connected = []; // list of strands that are or will be connected
		this.lastLinkId = 0;

		// Define and add the highlight layer
		// relies on class function to work
		var source = new ol.source.Vector({});
		this.HighlightLayer = new ol.layer.Vector({
			source: source
		});
		this.HighlightLayer.setZIndex(nextAvailableOverlayLayerZIndex());
		app.map.addLayer(this.HighlightLayer);	
		
		// Define style for connection point being added
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
		});
		// Define and add the new points layer
		var source = new ol.source.Vector({});
		this.PointsLayer = new ol.layer.Vector({
			source: source,
			style: this.PointStyle
		});
		this.PointsLayer.setZIndex(nextAvailableOverlayLayerZIndex());
		app.map.addLayer(this.PointsLayer);
	
		// Add popup to map as confirmation of point added
		var popup = $("#popup");
		$("#map").append(popup);	

		// be able to show existing points
		this.existingPoints = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: getHighlightStyle
		});
		app.map.addLayer(this.existingPoints);
		console.log("in constructor");

		this.addPlugin();
	
	}
	/**
	* Function to return css colour
	* @param(string)
	**/
	colour(code) {
		var colour='blue';
		switch(code){
					case "BL": colour='deepskyblue'; break;
					case "OR": colour='darkorange'; break;
					case "GR": colour='lightgreen'; break;
					case "BR": colour='saddlebrown'; break;
					case "SL": colour=[192, 192, 192]; break;
					case "WT": colour='white'; break;
					case "RD": colour='red'; break;
					case "BK": colour='black'; break;
					case "YL": colour='yellow'; break;
					case "VT": colour=[238, 130, 238]; break;
					case "RO": colour=[255, 228, 225]; break;
					case "AQ": colour=[0, 255, 255]; break;
					default: 
						console.log("whoops no colour here");
						colour='cyan';
				}
		return colour;
	}
	
	/**
	* Function to style fibre strands based on colour codes
	* @param(OL_layer,float)
	* @returns nothing
	*/
	strandStyle(feature, resolution){
			console.log("made it");
			var geom_name = feature.getGeometry().getType();
			if (geom_name == 'LineString') {
				var cCode = feature.get("CABLE_COLOUR_CODE");
				var sCode = feature.get("STRAND_COLOUR_CODE");
				var cColour, sColour;
	
				return [new ol.style.Style({
							stroke: new ol.style.Stroke({
							  color: app.plugins.MFNexplorer.colour(feature.get("CABLE_COLOUR_CODE")),
							  width: 8
							})
						  }),
						  new ol.style.Style({
							stroke: new ol.style.Stroke({
							  color: app.plugins.MFNexplorer.colour(feature.get("STRAND_COLOUR_CODE")),
							  width: 3
							})
						})
				]
			} else {
				return  new ol.style.Style({image: new ol.style.Circle({ radius: 8, fill: new ol.style.Fill({color: 'blue' }) }) })
			} 
		};

	/**
	* Function to toggle individual features on or off
	* @param(OL_layer,string)
	* @returns nothing
	* toggles off all features but featureId, or toggles all on if no featureId given
	*/
	
	setStrandStyle(features, featureId) {
		features.forEach(function(feat){
			if (feat.getId() === featureId) {
				feat.setStyle(app.plugins.MFNexplorer.strandStyle(feat,app.map.getView().getResolution()));
			} else {
				feat.setStyle(new ol.style.Style({stroke: new ol.style.Stroke({  color: "rgba(119, 136, 153,0.5)",  width: 6	})  }));
			}
		})
	}
	
	/**
	* Function: callBackClearReport
	* @param() none
	* @returns() none
	* Function clear the map of highlights created by report	
	*/

	callBackClearReport() {
		app.plugins.MFNexplorer.HighlightLayer.getSource().clear();
	}

	/**
	* Function: insertConnectionLocation
	* @param(string,string,string,string,string,string) Conduit_id, distance along conduit, Location Name, Location Type, Albers X, Albers Y,
	* @returns(geometry) 
	* Function to snap a given point to the nearest point on a Conduit	
	*/

	insertConnectionLocation(conduitId,dist,locName,locType,locAddress,locNotes,albers_x,albers_y) {
		// create XML insert
		var data = `
		<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" 
		service="WFS" version="1.2.0" 
		xmlns:iss="http://th.gov.bc.ca/iss" 
		xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
		xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<wfs:Insert typeName="${app.plugins.MFNexplorer.editLayer}">
			<iss:ISS_MFN_CONNECTION_LOCATION_EDIT xmlns:gml="http://www.opengis.net/gml">
				<gml:GEOMETRY>
					<gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#3005">
					<gml:coordinates xmlns:gml="http://www.opengis.net/gml" decimal="." cs="," ts=" ">${albers_x},${albers_y}</gml:coordinates>
					</gml:Point>
				</gml:GEOMETRY>
				<iss:CONDUIT_ID>${conduitId}</iss:CONDUIT_ID>
				<iss:CONDUIT_DISTANCE>${dist}</iss:CONDUIT_DISTANCE>
				<iss:LOCATION_TYPE>${locType}</iss:LOCATION_TYPE>
				<iss:LOCATION_NAME>${locName}</iss:LOCATION_NAME>
				<iss:LOCATION_ADDRESS>${locAddress}</iss:LOCATION_ADDRESS>
				<iss:LOCATION_NOTES>${locNotes}</iss:LOCATION_NOTES>
				</iss:ISS_MFN_CONNECTION_LOCATION_EDIT>
			</wfs:Insert>
		</wfs:Transaction>
		`;

		$.ajax({
			type: "POST",
			url:  "../ogs-internal/wfs",
			contentType: "text/xml",
			dataType: "xml",
			xhrFields: {
				withCredentials: true
			},
			data: data
		})		
		.done(function(xml) {
			var response = "";
			let asString = (new XMLSerializer()).serializeToString(xml);
			if (asString.indexOf("<wfs:totalInserted>1</wfs:totalInserted>") > 0) {
				response = "Success"
			} else {
				response = asString;
				logger("ERROR", "Adding Connection Location: Error "+response);
			}
			$("#popup-content").html(response);
			$("#map #popup").show().delay(4000).fadeOut();  
			let layer = getLayerByTitle(app.plugins.MFNexplorer.viewLayerTitle); 
			layer.getSource().refresh(); // show new point as WMS
		})
		.fail(function(jqxhr, settings, exception) {
			$("#popup-content").html(exception);
			$("#map #popup").show().delay(4000).fadeOut(); 
			logger("ERROR", "Adding Connection Location: Error "+exception);
			app.plugins.MFNexplorer.addPointCleanup();
		});
	
	}
	/**
	 * Function: addPointCleanup
	 * @param () nothing
	 * @returns () nothing
	 * Function to remove UI elements associated with adding a location
	 */	
	addPointCleanup() {
		resetDefaultMapSingleClickFunction();
		let thisPoint = app.plugins.MFNexplorer.PointsLayer.getSource().getFeatures()[0];
		app.plugins.MFNexplorer.PointsLayer.getSource().removeFeature(thisPoint);
		clearHighlightedFeatures();
		app.plugins.MFNexplorer.busy = false;
//		hideMapSpinner();
	}
	/**
	 * Function: reverseGeocode
	 * @param(float,float) longitude, latitude in decimal degrees 
	 * @returns (string) the address if found
	 * Function to find nearest location to a point
	 */
	reverseGeocode(coords,srs,element,type) {
		const geoXY = ol.proj.transform(coords, srs, "EPSG:4326");
		if (type=="latLong") {
			element.val(`${geoXY[1].toString().substr(0,9)},${geoXY[0].toString().substr(0,11)}`);
			return;
		} else {
			const url = `https://geocoder.api.gov.bc.ca/${type}/nearest.geojson?point=${geoXY[0]},${geoXY[1]}`
			var likelyAddress = "nothing found";
			$.ajax({
				type: "GET",
				async: true,
				url:  url
			})                            
			.done(function(response) {
				element.val(response.properties.fullAddress);	
			})
			.fail(function(jqxhr, settings, exception) {
				element.val("nothing found");
			});	
		}
	}	

	/**
	 * Function: confirmPoint
	 * @param (feature,feature) conduit in question, location to be added
	 * @returns () nothing
	 * Function to prompt user to add new connection location or not
	 */
	confirmPoint(conduitFeature,newPoint,cabinet) {
		const conduitID = conduitFeature.properties.CONDUIT_ID;
		const pointCoords = newPoint.geometry.coordinates;
		
		// Get info on existing cabinet if required
		if (typeof cabinet != "undefined") {
			$("#mfn-connection-location-form").find("[key='LOCATION_TYPE']").val("Cabinet");
			$("#mfn-connection-location-form").find("[key='LOCATION_NAME']").val(cabinet.properties.CABINET_NAME);
			$("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']").val(cabinet.properties.CABINET_LATITUDE+", "+cabinet.properties.CABINET_LONGITUDE);
			const comment = cabinet.properties.COMMENTS==null?"":"\n"+cabinet.properties.COMMENTS;
			const notes = "IP: "+cabinet.properties.IP + comment;
			cabinet.properties.COMMENTS==null?"":"\n"+cabinet.properties.COMMENTS
			$("#mfn-connection-location-form").find("[key='LOCATION_NOTES']").val(notes);
	} else { 
			$("#mfn-connection-location-form").find("[key='LOCATION_NAME']").val("");
			$("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']").val("");
			$("#mfn-connection-location-form").find("[key='LOCATION_NOTES']").val("");
		}		
		hideMapSpinner();
		
		$("#Manager-tab-content").find(".row").hide();
		$("#mfn-connection-location-form").show();	
		
		// Open the tab
		activateSidebarTab(app.plugins.MFNexplorer.tabNav);		
		// Show sidebar immediately if desktop
		if (!isMobile()) showSidebar();
		
		// set up form buttons
		$("#mfn-connection-location-form").find("[key='LOCATION_NAME']" ).on("change",function(){
			if ($(this).val().length > 0) $(this).removeClass("mfn-validation-error");
		});
		$("#mfn-reverse-geocode1").unbind().click(function(){
			app.plugins.MFNexplorer.reverseGeocode(pointCoords,"EPSG:3005",$("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']"),"sites");
		});
		$("#mfn-reverse-geocode2").unbind().click(function(){
			app.plugins.MFNexplorer.reverseGeocode(pointCoords,"EPSG:3005",$("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']"),"intersections");
		});
		$("#mfn-reverse-geocode3").unbind().click(function(){
			app.plugins.MFNexplorer.reverseGeocode(pointCoords,"EPSG:3005",$("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']"),"latLong");
		});
		$("#mfn-cancel-location").on("click",function(){
			$("#mfn-connection-location-form").find("[key='LOCATION_NAME']" ).removeClass("mfn-validation-error");
			$("#mfn-connection-location-form").hide();	
			app.plugins.MFNexplorer.addPointCleanup();
		});
		$("#mfn-save-location").on("click",function(){
			const locType = $("#mfn-connection-location-form").find("[key='LOCATION_TYPE']" ).val();
			const locName = $("#mfn-connection-location-form").find("[key='LOCATION_NAME']" ).val();
			const locAddress = $("#mfn-connection-location-form").find("[key='LOCATION_ADDRESS']" ).val();
			const locNotes = $("#mfn-connection-location-form").find("[key='LOCATION_NOTES']" ).val();
			if (locName.length > 1) { // name is mandatory
				$("#mfn-connection-location-form").find("[key='LOCATION_NAME']").removeClass("mfn-validation-error");
				const ptCoords = newPoint.geometry.coordinates;
				app.plugins.MFNexplorer.insertConnectionLocation(conduitID,newPoint.properties.DIST,locName,locType,locAddress,locNotes,ptCoords[0],ptCoords[1]);
				$("#mfn-connection-location-form").hide();	
				app.plugins.MFNexplorer.addPointCleanup();
			} else {
				$("#mfn-connection-location-form").find("[key='LOCATION_NAME']").addClass("mfn-validation-error");
				$("#popup-content").html("Location Name is required.");
				$("#map #popup").show().delay(5000).fadeOut();  
			}		
		});
	
	}

	
	/**
	 * Function: processAddPointClick
	 * @param (array[2]) coordinates of map click intended to add a Connection Location.
	 * @returns () nothing
	 * Function to add a Connection Location on the nearest conduit.
	 */
	processAddPointClick(coords,cabinet) {
		// Get info on the Conduit so as to snap to it.
		const albersXY = ol.proj.transform(coords, app.map.getView().getProjection(), "EPSG:3005");
		const albers_x = albersXY[0].toFixed();
		const albers_y = albersXY[1].toFixed();
		const factor = app.map.getView().getResolution() * 10;
		const x1 = Number(albers_x) - factor;
		const x2 = Number(albers_x) + factor;
		const y1 = Number(albers_y) - factor;
		const y2 = Number(albers_y) + factor;
		const poly = `${x1} ${y1},${x2} ${y1},${x2} ${y2},${x1} ${y2},${x1} ${y1}`;
		const cql_filter = "INTERSECTS(GEOMETRY,POLYGON(("+poly+")))";
		var conduitFeature = {};
		var snappedPoint = {};

		const callbackGotConduit = function(response,cabinetId) {
			if (response.features.length < 1) {
				conduitFeature = 0;
				$("#popup-content").html("No conduit here, try again. ");
				$("#map #popup").show().delay(3000).fadeOut();
				app.plugins.MFNexplorer.addPointCleanup();
			} else {
				conduitFeature = response.features[0];
				var olFeature = convertToOpenLayersFeature("GeoJSON", conduitFeature);
				highlightFeature(olFeature);
				const callbackGotSnappedPoint = function(conduitPoint) {
					if (conduitPoint.features.length < 1) {
						snappedPoint = 0;
						logger("WARN", "Adding Connection Location: Error "+exception);
						$("#popup-content").html("Encountered a problem "+exception);
						$("#map #popup").show().delay(3000).fadeOut();
						app.plugins.MFNexplorer.addPointCleanup();
					} else { // snap the map point
						snappedPoint = conduitPoint.features[0];
						const mapXY = ol.proj.transform(conduitPoint.features[0].geometry.coordinates, "EPSG:3005", app.map.getView().getProjection());
						const pointGeometry = new ol.geom.Point(mapXY);
						const pointFeature = new ol.Feature({geometry: pointGeometry});
						app.plugins.MFNexplorer.addPointCleanup();
						app.plugins.MFNexplorer.PointsLayer.getSource().addFeature(pointFeature);
						
						app.plugins.MFNexplorer.confirmPoint(conduitFeature,snappedPoint,cabinet);
					}										
				}
				var viewparams = "albers_x:"+albers_x+";albers_y:"+albers_y+";conduit_id:"+conduitFeature.properties.CONDUIT_ID;               
				var data = {service: "WFS",version: "1.1.0",request: "GetFeature",typename: "iss:MFN_POINT_ON_CONDUIT",viewparams: viewparams,outputFormat:"application/json"};
/*
iss:MFN_POINT_ON_CONDUIT returns the PROJECTED_PT on the specified ISS_MFN_CONDUIT and the DISTance from the beginning of that conduit.
takes three VIEWPARAMS::
albers_x
albers_y
conduit_id
*/
				$.ajax({
					type: "GET",
					async: true,
					url:  "../ogs-internal/ows",
					data: data
				})                            
				.done(function(response) {
					if (response.features) {
						callbackGotSnappedPoint(response,cabinetId);
					} else {
						logger("WARN", "Adding Connection Location: "+(new XMLSerializer()).serializeToString(response));
					}	
				})
				.fail(function(jqxhr, settings, exception) {
					logger("ERROR", "Adding Connection Location: Error "+exception);
					$("#popup-content").html("Encountered a problem "+exception);
					$("#map #popup").show().delay(3000).fadeOut();
					app.plugins.MFNexplorer.addPointCleanup();
				});					
			}
		}
		// Define the parameters
		var params = {
			service: "WFS",
			version: "2.0.0",
			request: "GetFeature",
			typeNames: "iss:ISS_MFN_CONDUIT_CABLE_V",
			outputFormat: "json",
			count: "1",
			srsName: app.map.getView().getProjection().getCode(),
			cql_filter: cql_filter
		};
		$.ajax({
			type: "GET",
			async: true,
			url: "../ogs-internal/ows",
			timeout: 7500,
			data: params,
			xhrFields: {
				withCredentials: true
			}
		})                            
		.done(function(response) {
			if (response.features) {
				callbackGotConduit(response);
			} else {
				logger("ERROR", "Error locating conduit "+(new XMLSerializer()).serializeToString(response));
			}			
		})                            
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", app.plugins.MFNexplorer.name+": Error "+exception);
			$("#popup-content").html("Error locating conduit here, try again. ");
			$("#map #popup").show().delay(3000).fadeOut();
			app.plugins.MFNexplorer.addPointCleanup();
		});  	
	}
    /**
	 * Function: addCabinet
	 * @param (number) CABINET_ID from iss:ISS_FIBRE_RING_CABINET
	 * @returns () nothing
	 * Function to look up this cabinet and convert its location to a map click point and send the feature to the Add a Connection Location dialogue.
	 */
	addCabinet(cabinetId){
		const cqlFilter = "CABINET_ID="+cabinetId;
		var data = {service: "WFS",version: "1.1.0",request: "GetFeature",typename: "iss:ISS_FIBRE_RING_CABINET",outputFormat:"application/json",cql_filter:cqlFilter};

		$.ajax({
			type: "GET",
			async: true,
			url:  "../ogs-internal/ows",
			data: data
		})                            
		.done(function(response) {
			if (response.features) {
				var mapPoint =(ol.proj.transform([response.features[0].geometry.coordinates[0], response.features[0].geometry.coordinates[1]], "EPSG:3005", app.map.getView().getProjection()));				
				app.plugins.MFNexplorer.processAddPointClick(mapPoint,response.features[0]);
			} else {
				logger("ERROR", "Adding Connection Location: Error "+(new XMLSerializer()).serializeToString(response));
			}	
		})
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "Adding Cabinet: Error "+exception);
			$("#popup-content").html("Encountered a problem "+exception);
			$("#map #popup").show().delay(3000).fadeOut();
		});			
	}
						
    /**
	 * Function: mapClickFunction
	 * @param () none
	 * @returns () nothing
	 * Function to convert map click point in to an Add a Connection Location dialogue.
	 */
	mapClickFunction(e){
		// Add the clicked point
		if (app.plugins.MFNexplorer.busy) {
			return;
		} else {				
			app.plugins.MFNexplorer.busy = true;
			showMapSpinner();
			var pointGeometry = new ol.geom.Point(e.coordinate);
			var pointFeature = new ol.Feature({geometry: pointGeometry});
			app.plugins.MFNexplorer.PointsLayer.getSource().addFeature(pointFeature);
			app.plugins.MFNexplorer.processAddPointClick(e.coordinate);
		}
	}
    /**
	 * Function: reportOnConnectivity()
	 * @param (integer) node id
	 * @param(object) list of fibre strand properties
	 * @returns () nothing
	 * Function to display existing all locations connected to this node.
	 */
	reportOnConnectivity(node_id,props) {
		const callbackGotPoints = function(strands) {
			var unsorted = [];
			var sorted = [];
			app.plugins.MFNexplorer.report = []; 
			app.plugins.MFNexplorer.HighlightLayer.getSource().clear();
			if (strands.features.length < 1) {
				logger("WARN", "Problem Querying connected fibre: Error ");
				$("#popup-content").html("Unable to find connected fibre");
				$("#map #popup").show().delay(3000).fadeOut();
			} else {
				var reportTemplate = $("#mfn-report-template");
				var report = $(reportTemplate).clone();
				$(report).attr("id",node_id);
				$(report).show();
				var reportLineTemplate = $("#mfn-report-line");
				var title = "Connectivity Report"; //`${props.CABLE_NAME} Strand: ${props.NUM} ${props.CB_C}${props.STR_C}`;
				var pointCoords = [];	
				var format = new ol.format.GeoJSON();
				strands.features.forEach(function(feat,i){
					var fStrand = format.readFeature(feat,{dataProjection:'EPSG:3005',featureProjection:app.map.getView().getProjection()});
					app.plugins.MFNexplorer.HighlightLayer.getSource().addFeature(fStrand);
					unsorted.push(fStrand);
				});
				// put result into sensible order showing linking locations
				sorted.push(unsorted[unsorted.length-1]);
				unsorted.pop();
				var i = 0;
				var cnt = 0; // prevent runaway loop from bad data
				while ((unsorted.length!=0) && cnt <2000){
					console.log(`2 unsorted length is ${unsorted.length}`);
					for (var j=0;j<unsorted.length;j++){
						var lastOne = sorted[sorted.length-1].getProperties();
						var thisOne = unsorted[j].getProperties();
						// check the end
						if ((thisOne.START_ID==lastOne.START_ID) || (thisOne.START_ID==lastOne.END_ID) || (thisOne.END_ID==lastOne.START_ID) || (thisOne.END_ID==lastOne.END_ID)) {
							sorted.push(unsorted[j]);
							unsorted.splice(j,1);
							i++;
						} else {
							// check the beginning
							lastOne = sorted[0].getProperties();
							if ((thisOne.START_ID==lastOne.START_ID) || (thisOne.START_ID==lastOne.END_ID) || (thisOne.END_ID==lastOne.START_ID) || (thisOne.END_ID==lastOne.END_ID)) {
								sorted.unshift(unsorted[j]);
								unsorted.splice(j,1);
							i++;
							}
						}
					}
					cnt++;
				};
				sorted.forEach(function(item,index){
					var feat = item.getProperties();
					var reportLine = $(reportLineTemplate).clone();
					$(reportLine).show();
					$(reportLine).find(".mfn-cable-name").html(`${feat.CABLE_NAME}`);
					$(reportLine).find(".mfn-strand-number").html(`${feat.STRAND_NUMBER}`);
					$(reportLine).find(".mfn-cable-code").html(`${feat.CABLE_COLOUR_CODE}`).addClass(feat.CABLE_COLOUR_CODE);
					$(reportLine).find(".mfn-strand-code").html(`${feat.STRAND_COLOUR_CODE}`).addClass(feat.STRAND_COLOUR_CODE);
					// TO DO report on the common link_id, device, and in and out ports as applicable
					$(reportLine).find(".mfn-link-zoom").data("link",item).hover(function() {
						var thisExtent = $(this).data("link").getGeometry().getExtent();
						app.plugins.MFNexplorer.setStrandStyle(app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures(),$(this).data("link").getId());
					}).on("click",function() {
						var thisExtent = $(this).data("link").getGeometry().getExtent();
						app.map.getView().fit(thisExtent);
						var currentZoom = app.map.getView().getZoom();
						app.map.getView().setZoom( currentZoom - 1 );
						app.plugins.MFNexplorer.setStrandStyle(app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures(),$(this).data("link").getId());
					});
					if (index>0) { 
						if (feat.DEVICE_START || feat.DEVICE_END) {
//							$(report).find(".mfn-report-top").append(reportLine);
							var reportLine4Device = $(reportLineTemplate).clone();
							$(reportLine4Device).show();
							if (sorted[index-1].get("START_ID")==feat.START_ID ) {
								$(reportLine4Device).find(".mfn-last-port-number").html(sorted[index-1].get("START_PORT_NUMBER"));
								$(reportLine4Device).find(".mfn-device-name").html(feat.DEVICE_START);
								$(reportLine4Device).find(".mfn-next-port-number").html(feat.START_PORT_NUMBER);
							}
							if (sorted[index-1].get("START_ID")==feat.END_ID ) {
								$(reportLine4Device).find(".mfn-last-port-number").html(sorted[index-1].get("START_PORT_NUMBER"));
								$(reportLine4Device).find(".mfn-device-name").html(feat.DEVICE_END);
								$(reportLine4Device).find(".mfn-next-port-number").html(feat.END_PORT_NUMBER);
							}
							if (sorted[index-1].get("END_ID")==feat.START_ID ) {
								$(reportLine4Device).find(".mfn-last-port-number").html(sorted[index-1].get("END_PORT_NUMBER"));
								$(reportLine4Device).find(".mfn-device-name").html(feat.DEVICE_START);
								$(reportLine4Device).find(".mfn-next-port-number").html(feat.START_PORT_NUMBER);
							}
							if (sorted[index-1].get("END_ID")==feat.END_ID ) {
								$(reportLine4Device).find(".mfn-last-port-number").html(sorted[index-1].get("END_PORT_NUMBER"));
								$(reportLine4Device).find(".mfn-device-name").html(feat.DEVICE_END);
								$(reportLine4Device).find(".mfn-next-port-number").html(feat.END_PORT_NUMBER);
							}
							console.log("device name: "+$(reportLine4Device).find(".mfn-device-name").text());
							$(reportLine4Device).find(".mfn-link-zoom").hide();
							if ($(reportLine4Device).find(".mfn-device-name").text().length>0) $(report).find(".mfn-report-top").append(reportLine4Device);
						}
					}

					$(report).find(".mfn-report-top").append(reportLine);
//					$("#"+node_id).find(".mfn-report-top").append(reportLine);
				});
				var reportFeatures = app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures();
				var reportOutline = app.plugins.MFNexplorer.HighlightLayer.getSource().getExtent();
				report.find(".mfn-report-outline").on("click",function(){
					app.map.getView().fit(reportOutline);
					var currentZoom = app.map.getView().getZoom();
					app.map.getView().setZoom( currentZoom - 1 );
					if (reportFeatures != app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures() ) {
						app.plugins.MFNexplorer.HighlightLayer.getSource().clear();
						
						app.plugins.MFNexplorer.HighlightLayer.getSource().addFeatures(reportFeatures);
						app.plugins.MFNexplorer.setStrandStyle(app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures());
					}
				});
				app.plugins.MFNexplorer.setStrandStyle(app.plugins.MFNexplorer.HighlightLayer.getSource().getFeatures());
				app.plugins.MultiFloatingWindow.open(node_id, title, report,null,null,null,null,app.plugins.MFNexplorer.callBackClearReport); //, initialWidth, initialHeight, location, openCallback, closeCallback);	
			}		
		}
			
		var viewparams = "node_id:"+node_id;               
		var data = {service: "WFS",version: "1.1.0",request: "GetFeature",typename: "iss:ISS_MFN_CONNECTED_FIBRE_V",viewparams: viewparams,outputFormat:"application/json"};
		$.ajax({
			type: "GET",
			async: true,
			url:  "../ogs-internal/ows",
			data: data
		})                            
		.done(function(response) {
			if (response.features) {
				callbackGotPoints(response);
			} else {
				let result = (new XMLSerializer()).serializeToString(response);
				logger("ERROR", "Querying connected fibre: Error "+result);
				$("#popup-content").html("Problem querying connected fibre: "+result);
				$("#map #popup").show().delay(3000).fadeOut();				
			}
		})
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "Querying connected fibre: Error "+exception);
			$("#popup-content").html("Encountered a problem "+exception);
			$("#map #popup").show().delay(3000).fadeOut();
		});
	}		
	
    /**
	 * Function: displayLhsConnections()
	 * @param (object,boolean) features, is the link's start_node at this location?
	 * @returns () nothing
	 * Function to display existing fibre connections at a Connection Location.
	 */	
	displayLhsConnection(feat) {
		console.log("displayLhsConnection begun");
		var location_id = app.plugins.MFNexplorer.thisLocation.location_id;
		var this_distance = app.plugins.MFNexplorer.thisLocation.conduit_distance;		
		// assume this link ends here
		var startsHere = false;
		feat.properties.method = "E"; 
		var connTemplate = $("#mfn-connected-template");
		var conn = $(connTemplate).clone();		
	// Check  strand to see where its nodes start and flip accordingly
		if  (feat.properties.ST_LOC_ID == location_id) {
			feat.properties.method = "S"; 
			startsHere = true;
			$(conn).find(".mfn-device-name").html(feat.properties.START_DEVICE_NAME);
		} else {
			$(conn).find(".mfn-device-name").html(feat.properties.END_DEVICE_NAME);
		}
		$(conn).find(".mfn-lhs-cable").attr({"title":feat.properties.CABLE_NAME});
		$(conn).find(".mfn-lhs-cable").data("strand",feat.properties);
		$(conn).find(".mfn-lhs-num").html(feat.properties.NUM);
		$(conn).find(".mfn-lhs-cbl_c").html(feat.properties.CB_C).addClass(feat.properties.CB_C);
		$(conn).find(".mfn-lhs-str_c").html(feat.properties.STR_C).addClass(feat.properties.STR_C);
		$(conn).attr("id",feat.properties.LINK_ID);		
		// Show end node on hover
		$(conn).find(".mfn-lhs-start").html('<i class="mfn-icon-start"></i>').attr('title', startsHere ? feat.properties.END_NAME : feat.properties.ST_NAME ).hover( 
			function() {
				var albersPoint = startsHere ? feat.properties.END_GEO : feat.properties.ST_GEO;
				let nodeB = new ol.geom.Point(ol.proj.transform([albersPoint.coordinates[0], albersPoint.coordinates[1]], "EPSG:3005", app.map.getView().getProjection()));
				let nodeBhighlight= new ol.Feature(nodeB);	
				highlightFeature(nodeBhighlight);
			},
			function() {
				clearHighlightedFeatures();
			}
		).on("click",function() {
			app.plugins.MFNexplorer.reportOnConnectivity(startsHere?feat.properties.START_NODE_ID:feat.properties.END_NODE_ID,feat.properties);
		});	

		$("#mfn-connected-top").append(conn);
		app.plugins.MFNexplorer.connected.push(feat.properties.LINK_ID);
		app.plugins.MFNexplorer.lastLinkId = "#"+feat.properties.LINK_ID;
	}
	
    /**
	 * Function: displayRhsConnections()
	 * @param (object,boolean,boolean,integer) features, is the link's start_node at this location?, is this to be added, location where connection is to be added
	 * @returns () nothing
	 * Function to display existing fibre connections at a Connection Location.
	 */		
	displayRhsConnection(feat,isNew) { 
		var location_id = app.plugins.MFNexplorer.thisLocation.location_id;
		var this_distance = app.plugins.MFNexplorer.thisLocation.conduit_distance;	
		// Assume this link starts hear
		var endsHere = false;
		feat.properties.method = "S"; 
		// Check  strand to see where its nodes end and flip accordingly
		if  (feat.properties.END_LOC_ID == location_id) {
			feat.properties.method = "E"; 
			endsHere = true;
		}	

		var conn = $("#mfn-connected-top").find(app.plugins.MFNexplorer.lastLinkId);
		$(conn).find(".mfn-rhs-cable").attr({"title":feat.properties.CABLE_NAME});
		$(conn).find(".mfn-rhs-cable").data("strand2",feat.properties); // attach rhs fibre info to this element	
		$(conn).find(".mfn-rhs-num").html(feat.properties.NUM);
		$(conn).find(".mfn-rhs-cbl_c").html(feat.properties.CB_C).addClass(feat.properties.CB_C);
		$(conn).find(".mfn-rhs-str_c").html(feat.properties.STR_C).addClass(feat.properties.STR_C);
//		$(conn).find(".mfn-device-name").html(feat.properties.DEVICE_NAME);
		// Show info button
		$(conn).find(".mfn-connection-info").attr("title","Highlight all nodes").html('<button type="button" class="btn btn-outline-primary btn-sm"><span class="oi oi-info"></span></button>').click(function(){

				clearHighlightedFeatures();
				app.plugins.MFNexplorer.reportOnConnectivity(feat.properties.START_NODE_ID,feat.properties);	
		});
		
		
		// Show end node
		$(conn).find(".mfn-rhs-end").html('<i class="mfn-icon-end"></i>').attr('title', endsHere ? feat.properties.ST_NAME : feat.properties.END_NAME ).hover( 
			function() {
				var albersPoint = endsHere ? feat.properties.ST_GEO : feat.properties.END_GEO;
				let nodeB = new ol.geom.Point(ol.proj.transform([albersPoint.coordinates[0], albersPoint.coordinates[1]], "EPSG:3005", app.map.getView().getProjection()));
				let nodeBhighlight= new ol.Feature(nodeB);	
				highlightFeature(nodeBhighlight);
			},
			function() {
				clearHighlightedFeatures();
			}
		).on("click",function() {
			app.plugins.MFNexplorer.reportOnConnectivity(endsHere?feat.properties.END_NODE_ID:feat.properties.START_NODE_ID,feat.properties);
		});	
		app.plugins.MFNexplorer.connected.push(feat.properties.LINK_ID);
		// disconnecting network link
		var warnOrDanger = 'warning';
		var buttonText = `<button type="button" class="btn btn-outline-${warnOrDanger} btn-sm"><span class="oi oi-x"></span></button>`;
		if (!isNew) {
			$(conn).find(".mfn-connection-nix").attr("title","Delete Connection");
			warnOrDanger = 'danger';
			buttonText = `<button type="button" class="btn btn-outline-danger btn-sm"><span class="mfn-connection-cut-icon"></span></button>`;
		}

		if (app.plugins.MFNexplorer.canEdit) {

			$(conn).find(".mfn-connection-nix").html(buttonText).click(function(){
				var thisRow = $(this).parents(".mfn-connection-row");
				if (isNew) {
					app.plugins.MFNexplorer.connected = app.plugins.MFNexplorer.connected.filter(item => item !== thisRow.find(".mfn-lhs-cable").data().strand.LINK_ID);
					app.plugins.MFNexplorer.connected = app.plugins.MFNexplorer.connected.filter(item => item !== thisRow.find(".mfn-rhs-cable").data().strand2.LINK_ID);
					thisRow.remove();
				} else { // cut this connection
					// discover previously made connection
					var connection_id;
					if (endsHere) { connection_id = thisRow.find(".mfn-rhs-cable").data().strand2.END_CONNECTION_ID; }
					else {connection_id = thisRow.find(".mfn-rhs-cable").data().strand2.START_CONNECTION_ID; }
					app.plugins.MFNexplorer.makeConnection(location_id, thisRow.find(".mfn-lhs-cable").data().strand, thisRow.find(".mfn-rhs-cable").data().strand2, null,this_distance ,thisRow,true,connection_id);					
					app.plugins.MFNexplorer.manageConnectionsAt( location_id );
				}
			});
			
			if (isNew) { // allowed to connect these two		
				$(conn).find(".mfn-connection-ok").html('<button type="button" class="btn btn-outline-success btn-sm"><span class="oi oi-check"></span></button>').click(function(){
					var thisRow = $(this).parents(".mfn-connection-row");
					// makeConnection(location_id,lhs,rhs,cType,this_distance,fieldSetRow,isCut,connection_id)
					app.plugins.MFNexplorer.makeConnection(location_id, thisRow.find(".mfn-lhs-cable").data().strand, thisRow.find(".mfn-rhs-cable").data().strand2, thisRow.find(".mfn-connection-type input[name='"+thisRow.find('.mfn-rhs-cable').data().strand2.LINK_ID+"']:checked").val(),this_distance ,thisRow,false,null);
					app.plugins.MFNexplorer.manageConnectionsAt( location_id );
				});
			} else {
				// read only
				if (endsHere) {
					// use end_node type
					$(conn).find(".mfn-connection-type").html("<b>("+feat.properties.END_CON_TYPE+")</b>");
				} else
					$(conn).find(".mfn-connection-type").html("<b>("+feat.properties.ST_CON_TYPE+")</b>");
			}
		} // end canEdit
	}
    /*
	 * Function: displayConnections()
	 * @param (object) features
	 * @returns () nothing
	 * Function to display existing fibre connections at a Connection Location.
	 */	
	 displayConnections(features,featuresCopy,locationId) {
		features.forEach(function(feat) {
			featuresCopy = featuresCopy.filter(item => item !== feat); // don't compare to self
				if ((app.plugins.MFNexplorer.connected.indexOf(feat.properties.LINK_ID) === -1) ) {
					featuresCopy.forEach(function(fCopy) {
						var found = false;
						if         ((feat.properties.END_NODE_ID == fCopy.properties.START_NODE_ID) && (feat.properties.END_LOC_ID == locationId)) {
							found = true;
							app.plugins.MFNexplorer.displayLhsConnection(feat);
							app.plugins.MFNexplorer.displayRhsConnection(fCopy,false);						
						} else if ((feat.properties.START_NODE_ID == fCopy.properties.END_NODE_ID)&& !found && (feat.properties.ST_LOC_ID == locationId)) {
							found = true;
							app.plugins.MFNexplorer.displayLhsConnection(fCopy);
							app.plugins.MFNexplorer.displayRhsConnection(feat,false);
						} else if ((feat.properties.START_NODE_ID == fCopy.properties.START_NODE_ID)&& !found&& (feat.properties.ST_LOC_ID == locationId)) {
							found = true;
							app.plugins.MFNexplorer.displayLhsConnection(feat);
							app.plugins.MFNexplorer.displayRhsConnection(fCopy,false);
						} else if ((feat.properties.END_NODE_ID == fCopy.properties.END_NODE_ID) && !found && (feat.properties.END_LOC_ID == locationId)) {
							found = true;
							app.plugins.MFNexplorer.displayLhsConnection(feat);
							app.plugins.MFNexplorer.displayRhsConnection(fCopy,false);
						}
						if (found) {
							app.plugins.MFNexplorer.connected.push(feat.properties.LINK_ID);
							app.plugins.MFNexplorer.connected.push(fCopy.properties.LINK_ID);	
							featuresCopy = featuresCopy.filter(item => item !== fCopy); 	
						}						
				});
			}
		});
		
	}

	/**
	* Function: recalculate
	 * @param () none
	 * @returns () nothing
	 * Function to exercise the oracle FIND_CONNECTED_COMPONENTS routine.
	*/
	recalculate() {
		if (app.plugins.MFNexplorer.canEdit) {
			var data = {service: "WFS",version: "1.1.0",request: "GetFeature",typename:"iss:ISS_MFN_REFRESH_CONNECTED_V",outputFormat:"application/json"};
			$.ajax({
				type: "GET",
				url:  "../ogs-internal/ows",
				data: data
			})                            
			.done(function(response) {
				var result = "arrgh!";
				if (response.features) {
					result = response.features[0].properties.MFN_RESULT;
					logger("INFO", "Successfully recalculated connected components: "+result);
				} else {
					result = (new XMLSerializer()).serializeToString(response);
					logger("ERROR", "Attempt to recalculate: Error "+result);
				}
				$("#popup-content").html(result);
				$("#map #popup").show().delay(5000).fadeOut();
			})
			.fail(function(jqxhr, settings, exception) {
				logger("ERROR", "Attempt to recalculate: Error "+exception);
				$("#popup-content").html("Encountered a problem "+exception);
				$("#map #popup").show().delay(3000).fadeOut();
			});	
		} else {
			$("#popup-content").html("You do not have permission to use this function");
			$("#map #popup").show().delay(3000).fadeOut();
		}
	}
		
	/**
	* Function: makeConnection (or break one :)
	 * @param (number,object,object,string,number,object,boolean,number) 
	 * @returns () nothing
	 * Function to create a new connection between fibres or disconnect and existing connection.
	*/
	makeConnection(location_id,lhs,rhs,cType,this_distance,fieldSetRow,isCut,connection_id) {
		console.log("Make Connection");
		showMapSpinner();
		if (connection_id == null) { 
			var connection_id = -1; // there was no previous connection here
		}
		var method = "X"; // default 
		var async = false;
		var lhsOldNodeId = lhs.END_NODE_ID;
		var rhsOldNodeId = rhs.START_NODE_ID;
		// determine if another method	

		if (isCut) { // cutting a link here
			 method = "X"; 
			 cType = "X";
		}		
		else { // joining links here
			async = true;
			if (lhs.END_LOC_ID == location_id && rhs.ST_LOC_ID == location_id)  {
				method = "ES";
				lhsOldNodeId = lhs.END_NODE_ID;
				rhsOldNodeId = rhs.START_NODE_ID;
			}	
			if (lhs.ST_LOC_ID == location_id && rhs.ST_LOC_ID == location_id) {
				 method = "SS";
				lhsOldNodeId = lhs.START_NODE_ID;
				rhsOldNodeId = rhs.START_NODE_ID;
			}	
			if (lhs.END_LOC_ID == location_id && rhs.END_LOC_ID == location_id) {
				 method = "EE";
				lhsOldNodeId = lhs.END_NODE_ID;
				rhsOldNodeId = rhs.END_NODE_ID;
			}	
			if (lhs.ST_LOC_ID == location_id && rhs.END_LOC_ID == location_id) {
				 method = "SE";
				lhsOldNodeId = lhs.START_NODE_ID;
				rhsOldNodeId = rhs.END_NODE_ID;
			}	
		}

		var data = `
		<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" 
		service="WFS" version="1.2.0" 
		xmlns:iss="http://th.gov.bc.ca/iss" 
		xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
		xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<wfs:Insert typeName="iss:ISS_MFN_CONNECTION">
				<iss:ISS_MFN_CONNECTION xmlns:gml="http://www.opengis.net/gml">
					<iss:OLD_CONNECTION_ID>${connection_id}</iss:OLD_CONNECTION_ID>
					<iss:CONNECTION_LOC_ID>${location_id}</iss:CONNECTION_LOC_ID>
					<iss:CONNECTION_TYPE>${cType}</iss:CONNECTION_TYPE>
					<iss:CONNECTION_METHOD>${method}</iss:CONNECTION_METHOD>
					<iss:LHS_LINK_ID>${lhs.LINK_ID}</iss:LHS_LINK_ID>
					<iss:LHS_OLD_CABLE_ID>${typeof lhs.CABLE_ID !== 'undefined'?lhs.CABLE_ID:0}</iss:LHS_OLD_CABLE_ID>
					<iss:LHS_OLD_NODE_ID>${lhs.END_NODE_ID}</iss:LHS_OLD_NODE_ID>
					<iss:LHS_OLD_CABLE_COLOUR_CODE>${lhs.CB_C}</iss:LHS_OLD_CABLE_COLOUR_CODE>
					<iss:LHS_OLD_STRAND_NUMBER>${lhs.NUM}</iss:LHS_OLD_STRAND_NUMBER>
					<iss:DEVICE_NAME>${fieldSetRow.find(".mfn-device-name").val()}</iss:DEVICE_NAME>
					<iss:RHS_LINK_ID>${rhs.LINK_ID}</iss:RHS_LINK_ID>
					<iss:RHS_OLD_CABLE_ID>${typeof rhs.CABLE_ID !== 'undefined'?rhs.CABLE_ID:0}</iss:RHS_OLD_CABLE_ID>
					<iss:RHS_OLD_NODE_ID>${rhs.START_NODE_ID}</iss:RHS_OLD_NODE_ID>
					<iss:RHS_OLD_CABLE_COLOUR_CODE>${rhs.CB_C}</iss:RHS_OLD_CABLE_COLOUR_CODE>
					<iss:RHS_OLD_STRAND_NUMBER>${rhs.NUM}</iss:RHS_OLD_STRAND_NUMBER>
				</iss:ISS_MFN_CONNECTION>
			</wfs:Insert>
		</wfs:Transaction>
		`;
		
		$.ajax({
			type: "POST",
			url:  "../ogs-internal/wfs",
			contentType: "text/xml",
			dataType: "xml",
			xhrFields: {
				withCredentials: true
			},
			async: async,
			data: data
		})		
		.done(function(xml) {
			var response = "";
			let asString = (new XMLSerializer()).serializeToString(xml);
			if (asString.indexOf("<wfs:totalInserted>1</wfs:totalInserted>") > 0) {
				response = "Success"
			} else {
				response = asString;
			}
			// UI update
			$(fieldSetRow).find(".mfn-connection-ok").remove();						
			$(fieldSetRow).find(".mfn-connection-nix").remove();						
			$("#popup-content").html(response);
			$("#map #popup").show().delay(4000).fadeOut();  
		})
		.fail(function(jqxhr, settings, exception) {
			$("#popup-content").html(exception);
			$("#map #popup").show().delay(4000).fadeOut(); 
			logger("ERROR", "Adding Connection Location: Error "+exception);
			app.plugins.MFNexplorer.addPointCleanup();
		})
		.always(function(foo) {hideMapSpinner()});

	}
	/**
	* Function: displayManageTab
	 * @param (object) {node and link info}
	 * @returns () nothing
	 * Function to display and manage fibre connections at a Connection Location.
	*/
	displayManageTab(features) {
		// Show the identify tab
		activateSidebarTab(app.plugins.MFNexplorer.tabNav);		
		// Show sidebar immediately if desktop
		if (!isMobile()) showSidebar();
		var linkList = []; // prevent duplicate entries
		// highlight this location on hover 
		let locHighlight = new ol.Feature(new ol.geom.Point(app.plugins.MFNexplorer.thisLocation.geometry.coordinates)); 			
		$("#mfn-connected-legend").hover(
			function() {
				highlightFeature(locHighlight);
			},
			function() {
				clearHighlightedFeatures();
			}
		);							
		// get templates for displaying information	
		var location_id = app.plugins.MFNexplorer.thisLocation.location_id;
		var this_distance = app.plugins.MFNexplorer.thisLocation.conduit_distance;
		var fieldSetFormTemplate = $("#mfn-lhs-form-template");
		var connTemplate = $("#mfn-connected-template");
		var template = $("#mfn-lhs-template");
		var currentCable = ""; // Results may include multiple cables		
		var fieldSet; 
		$(fieldSet).css({display: "block"});
		features.forEach( function(feat) {
			// only list links available for connection
			if ((!app.plugins.MFNexplorer.connected.includes(feat.properties.LINK_ID)) && !linkList.includes(feat.properties.LINK_ID)) { 
				linkList.push(feat.properties.LINK_ID);
				// group fibres by their cable
				if (currentCable != feat.properties.CABLE_NAME) {
					if ($(fieldSet).length > 0) {
						$("#mfn-lhs").append(fieldSet);		
						$(fieldSet).clone(true).appendTo("#mfn-rhs");	
					}	
					fieldSet = $(fieldSetFormTemplate).clone();
					// highlight cable on hover
//					var cableGeom = new ol.geom.LineString(feat.properties.CONDUIT_GEO.coordinates);
//					cableGeom.transform( "EPSG:3005", app.map.getView().getProjection());
//					let cableHighlight = new ol.Feature(cableGeom);					
					$(fieldSet).find("#mfn-lhs-legend").html(feat.properties.CABLE_NAME).hover( 
						function() { // show cable's conduit geometry
//							highlightFeature(cableHighlight);
						},
						function() {
//							clearHighlightedFeatures();
						}
					);
					
					currentCable = feat.properties.CABLE_NAME;
				}
				var strand = $(template).clone();
				$(strand).find(".mfn-lhs-num").html(feat.properties.NUM);					
				$(strand).find(".mfn-device-name").html(feat.properties.DEVICE_NAME);					
				$(strand).find(".mfn-lhs-cbl_c").html(feat.properties.CB_C).addClass(feat.properties.CB_C);
				$(strand).find(".mfn-lhs-str_c").html(feat.properties.STR_C).addClass(feat.properties.STR_C);
	
				// create highlights to show strand ends
				let nodeA = new ol.geom.Point(ol.proj.transform([feat.properties.ST_GEO.coordinates[0], feat.properties.ST_GEO.coordinates[1]], "EPSG:3005", app.map.getView().getProjection()));
				let nodeAhighlight = new ol.Feature(nodeA);	
				let nodeB = new ol.geom.Point(ol.proj.transform([feat.properties.END_GEO.coordinates[0], feat.properties.END_GEO.coordinates[1]], "EPSG:3005", app.map.getView().getProjection()));
				let nodeBhighlight= new ol.Feature(nodeB);	
				
				// Show strand start
				$(strand).find(".mfn-lhs-start").html('<button type="button" class="btn btn-outline-light btn-sm"><i class="mfn-icon-start"></i></button>').attr('title', feat.properties.ST_NAME ).hover( 
					function() { // show start node
						highlightFeature(nodeAhighlight);
					},
					function() {
						clearHighlightedFeatures();
					}
				);
				// show strand end
				$(strand).find(".mfn-lhs-end").html('<button type="button" class="btn btn-outline-light btn-sm"><i class="mfn-icon-end"></i></button>').attr('title', feat.properties.END_NAME).hover( 
					function() { // show end node
						highlightFeature(nodeBhighlight);
					},
					function() {
						clearHighlightedFeatures();
					}
				);	
				if (app.plugins.MFNexplorer.canEdit) {		
					// Add the Connection Button if connection is possible without cutting
					if ((feat.properties.ST_LOC_ID == location_id) || (feat.properties.END_LOC_ID == location_id)) {
						$(strand).find(".mfn-lhs-add").data("strand",feat.properties).html('<button type="button" class="btn btn-outline-primary btn-sm"><span class="oi oi-chevron-top"></span></button>').click(function(){
							if ( ((app.plugins.MFNexplorer.connected.length % 2) == 0) && (app.plugins.MFNexplorer.connected.indexOf(feat.properties.LINK_ID) === -1) ) { // add to lhs of connections unless it is already there	
								app.plugins.MFNexplorer.displayLhsConnection(feat);
							} else if  ( ((app.plugins.MFNexplorer.connected.length % 2) == 1) && (app.plugins.MFNexplorer.connected.indexOf(feat.properties.LINK_ID) === -1))  { // add to rhs of connections unless it is already there
								app.plugins.MFNexplorer.displayRhsConnection(feat,true);
							}														  
						} );
					}
					$(strand).find(".mfn-lhs-info").data("strand",feat.properties).html('<button type="button" class="btn btn-outline-primary btn-sm"><span class="oi oi-info"></span></button>').click(function(){
						app.plugins.MFNexplorer.reportOnConnectivity(feat.properties.START_NODE_ID,feat.properties);
					});
				}	
				if (app.plugins.MFNexplorer.canEdit) {		
					// Add the Cut Button if this strand has no local end node
					if ((feat.properties.ST_LOC_ID != location_id) && (feat.properties.END_LOC_ID != location_id)) {
						$(strand).find(".mfn-lhs-cut").data("strand",feat.properties).html('<button type="button" class="btn btn-outline-danger btn-sm"><span class="mfn-connection-cut-icon"></span></button>').click(function(){ // after 
							app.plugins.MFNexplorer.makeConnection(location_id, feat.properties, feat.properties, "X",this_distance ,$(strand),true);	  
							app.plugins.MFNexplorer.manageConnectionsAt(location_id);
						} );
					}
				}						
				$(fieldSet).find(".mfn-lhs-top").append(strand);
			}	
		});	

		$("#mfn-lhs").append(fieldSet);		
		$(fieldSet).clone(true).appendTo("#mfn-rhs");	
		
		// make divs responsive to window resizing
		$(window).resize(function() {
			 $("#Manager-tab-content").css({'overflow-y':'hidden'});
			var newHeight = $("#Manager-tab-content").height()-$(".mfn-fldset").height();
			$(".mfn-b-r").height(newHeight);
			$(".mfn-b-r").css({'max-height':newHeight+'px'});
		});

		let resizeObserver = new ResizeObserver(() => {
			window.dispatchEvent(new Event('resize'));
		});			
		resizeObserver.observe($(".mfn-b-r")[0]);			
		hideMapSpinner();	
	}

    /**
	 * Function: manageConnectionsAt
	 * @param (intger) connection location id
	 * @returns () nothing
	 * Function to display fibre strands at this location
	 */
	manageConnectionsAt(location_id) {
		// remove any previous results
		showMapSpinner();
		app.plugins.MFNexplorer.connected = [];
		$("#mfn-connection-location-form").hide();
		$("#Manager-tab-content").find(".row").show();
		$("#mfn-lhs").empty();
		$("#mfn-rhs").empty();
		$("#mfn-connected-top").empty();
		var viewparams, data;
		var midStrands = []; // aggregate results into these arrays
		var endStrands = [];
		var allStrands = [];

		app.plugins.MFNexplorer.thisLocation = {conduits:[]};
		// get info about this location
		var data = {service: "WFS",version: "2.0.0",request: "GetFeature",typenames: "iss:ISS_MFN_CONNECTION_LOCATION",featureID: location_id,outputFormat:"application/json",srsName:"EPSG:3857",exceptions:"application/json"};
		$.ajax({
			type: "GET",
			url:  "../ogs-internal/ows",
			data: data
		})
		.done(function(data) {
			// add conduit and distance if we are already on one
			app.plugins.MFNexplorer.thisLocation.conduits = [];
			data.features.forEach(function(feat){
				app.plugins.MFNexplorer.thisLocation.location_id = feat.properties.CONNECTION_LOCATION_ID;
				app.plugins.MFNexplorer.thisLocation.location_type = feat.properties.LOCATION_TYPE;
				app.plugins.MFNexplorer.thisLocation.location_name = feat.properties.LOCATION_NAME;
				$("#mfn-connected-legend").html(feat.properties.LOCATION_NAME+" "+location_id);			
				app.plugins.MFNexplorer.thisLocation.location_address = feat.properties.LOCATION_ADDRESS;
				app.plugins.MFNexplorer.thisLocation.location_notes = feat.properties.LOCATION_NOTES;
				app.plugins.MFNexplorer.thisLocation.conduit_id = feat.properties.CONDUIT_ID;
				app.plugins.MFNexplorer.thisLocation.conduit_distance = feat.properties.CONDUIT_DISTANCE;
				app.plugins.MFNexplorer.thisLocation.geometry = feat.geometry;
				if (feat.properties.CONDUIT_ID) {
					app.plugins.MFNexplorer.thisLocation.conduits.push({type: "feature", properties:{CONDUIT_ID: feat.properties.CONDUIT_ID, DIST: feat.properties.CONDUIT_DISTANCE}});
				}
			});

			// get fibres with start or end nodes at this location
			viewparams = "connection_location_id:"+location_id;               
			data = {service: "WFS",version: "2.0.0",request: "GetFeature",typenames: "iss:MFN_FIBRE_AT_A_POINT",viewparams: viewparams,outputFormat:"application/json",exceptions:"application/json"};
			$.ajax({
				type: "GET",
				url:  "../ogs-internal/ows",
				data: data
			})                            
			.done(function(conduitPoint) {
				if (conduitPoint.features) {
					// Save results
					endStrands = conduitPoint.features;
					Array.prototype.push.apply(allStrands,endStrands); 	
/*					
					// 	get the conduits which connect to this location
					viewparams = "location_id:"+location_id;               
					data = {service: "WFS",version: "2.0.0",request: "GetFeature",typename: "iss:MFN_CONDUIT_AT_LOCATION",viewparams: viewparams,outputFormat:"application/json",exceptions:"application/json"};
					$.ajax({
						type: "GET",
						url:  "../ogs-internal/ows",
						data: data
					})                            
					.done(function(conduit) {

						var conduitCount = 0 ; //app.plugins.MFNexplorer.thisLocation.conduits.length;
						conduit.features.forEach(function (feat) { //add any additional conduits
							if (feat.properties.CONDUIT_ID != app.plugins.MFNexplorer.thisLocation.conduits_id) {
								app.plugins.MFNexplorer.thisLocation.conduits.push(feat);
							}
						});
						console.log("Conduit count = "+app.plugins.MFNexplorer.thisLocation.conduits.length);
	/*					
						app.plugins.MFNexplorer.thisLocation.conduits.forEach( function(feat){ // get fibres in this conduit that pass through this point	

							viewparams = "conduit_id:"+feat.properties.CONDUIT_ID+";this_distance:"+feat.properties.DIST;  
							var data = {service: "WFS",version: "2.0.0",request: "GetFeature",typenames: "iss:MFN_AT_A_DISTANCE",VIEWPARAMS: viewparams,outputFormat:"application/json",exceptions:"application/json"};
							$.ajax({
								type: "GET",
								url:  "../ogs-internal/ows",
								data: data
							})
							.done(function(response) {
								if (response.features) {
									if (response.features.length > 0) {
										conduitCount += 1;
										midStrands = response.features;
										Array.prototype.push.apply(allStrands,midStrands); // add results 	
										if (conduitCount == app.plugins.MFNexplorer.thisLocation.conduits.length) { 
										// we are done
	*/									
											app.plugins.MFNexplorer.displayConnections(endStrands,endStrands,app.plugins.MFNexplorer.thisLocation.location_id);
											app.plugins.MFNexplorer.displayManageTab(allStrands);
	/*										
										}
									}
								} else {
									$("#popup-content").html("Nothing found");
									$("#map #popup").show().delay(3000).fadeOut();
									logger("ERROR", "Querying Fibres in Conduit: Error "+(new XMLSerializer()).serializeToString(response));
								}						
							})
							.fail(function(jqxhr, settings, exception) {
								logger("ERROR", "Querying Fibres in Conduit: Error "+exception);
								$("#popup-content").html("Encountered a problem "+exception);
								$("#map #popup").show().delay(3000).fadeOut();
							});			
						}) // end forEach conduit id							
					}) // nothing else here	
*/					
				} // end if MFN_FIBRE_AT_A_POINT returned no results
			});					

		});
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		console.log("in addPlugin");
	
		
		var callback = function (success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.MFNexplorer.name + ": Plugin failed to initialize");
				return;
			}
					

				// Set the tab nav & content variables
			app.plugins.MFNexplorer.tabNav = tabNav;
			app.plugins.MFNexplorer.tabContent = tabContent;
				
			logger("INFO", app.plugins.MFNexplorer.name  + ": Plugin successfully loaded");
				
			
		}
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
		
	}
}