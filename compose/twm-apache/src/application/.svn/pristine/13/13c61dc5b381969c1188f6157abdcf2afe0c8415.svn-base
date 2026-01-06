class AMA {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "AMA";
		this.version = 1.0;
		this.author = "Stephen Schmuland";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "About";
		this.tabContentFile = "application/plugins/AMA/tab-content.html";		
		this.intervalProcessId;
		this.featureStore = [];
		this.addPlugin();
		this.data = [];
		this.featureData = []
		this.RFIFeatures = {}






		// Define and add the route path points hover layer
		this.roadLocation = new ol.layer.Vector({
			fields: [
				{
					name: "NE_DESCR",
					title: true,
					searchable: true,
					nameTransform: function (name) { return "NE_DESCR"; }
				},
			],
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 4,
					stroke: new ol.style.Stroke({
						color: "rgba(255, 255, 255)",
						width: 2
					}),
					fill: new ol.style.Fill({color: "rgba(255, 0, 0)"}),
				}),
				text: new ol.style.Text({
					text: "Test Label",
					align:"Left",
					size:"12px",
					
					//stroke: new Stroke({color: "#ffffff", width:3}),
				}),
				
			}),
		});
		this.roadLocation.setZIndex(606);
		app.map.addLayer(this.roadLocation);
	}

	/**
	 * Function: scroll2SelectedAMA
	 * @param (object) event
	 * @returns () nothing
	 * Function that scrolls the sidebar to the clicked on AMA Boundaries
	 */
	scroll2SelectedAMA(event) {
		// Get all features close to click
		var pixel = app.map.getEventPixel(event.originalEvent);
		var featureLayer;
		var idList = []
		var feature = app.map.forEachFeatureAtPixel(pixel,
			function(feature, layer) {
				featureLayer = layer;
				var featureName = featureLayer.get('title');
				if(featureName =="Area Manager Areas"){
					idList.push(feature.get("AMA_ID"))
					}
			});
		if(idList.length>0){
			// If you can find a matching restriction div/table with the current group id, scroll to it
			// Define the executeScroll function
			var executeScroll = function() {
				var currentScrollPosition = $("#AreaManagerAreas-tab-content").scrollTop();
				var offset = Math.floor($("#"+idList[0]).offset().top - 130);
				var newScrollPosition = currentScrollPosition + offset;
				$("#"+idList[0]).effect("highlight", {}, 4000);
				$("#AreaManagerAreas-tab-content").animate({
					scrollTop: newScrollPosition,
					scrollLeft: 0
				}, 1500);
				}
				// Scoll to restriction after short pause
			setTimeout(function(){
				executeScroll();
		}, 500);		
		}
	}
	/**
	 * Function: getAMAContactInfo
	 * @param None
	 * @returns () nothing
	 * Function to get the attribution data from the AMA WFS Layer
	 */	 

	getAMAContactInfo(){
		
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.AMA.tabContent)[0]);
		var featureData = []
		// Build the request url
		var options = {
			service: "WFS",
			version: "2.0.0",
			request: "GetFeature", 
			typeNames: "hwy:DSA_AREA_MANAGER_AREA",
			outputFormat: "application/json",
			srsName: app.map.getView().getProjection().getCode(),
		}
		// Issue the request
		$.ajax({
			type: "GET",
			url: "../ogs-internal/ows",
			dataType: "json",
			data: options
		})		
		// Handle the response
		.done(function(response) {
			featureData.push(response)
			app.plugins.AMA.featureData.push(response)
			app.plugins.AMA.generateAMAContactView(featureData) 
			spinner.stop();

		})
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "AMA: Error getting service areas for office");
		});

	}

	/**
	 * Function: filterByRoadName
	 * @param None
	 * @returns () nothing
	 * Function to get the attribution data from the AMA WFS Layer
	 */	 
	filterByRoadName(value){
		app.plugins.AMA.roadLocation.getSource().clear()
		$('#AMA-message').empty();
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.AMA.tabContent)[0]);
		
		//set all AMA contact cards to hidden
		$.each(app.plugins.AMA.featureData[0].features, function (index, feature) {
			var AMA_ID = feature.properties.AMA_ID
			$("#"+AMA_ID).hide();
		})

		var roadList = []
		var cqlFilter = "NE_DESCR ilike '%"+value+"%'";
		var options = {
			service: "WFS",
			version: "2.0.0",
			request: "GetFeature", 
			typeNames: "cwr:V_NM_NLT_RFI_GRFI_SDO_DT",
			outputFormat: "application/json",
			maxFeatures: 5,
			//count: 4, // as of 2023 a single office covers no more than 3 service areas
			srsName: app.map.getView().getProjection().getCode(),
			cql_filter: cqlFilter
		}
	
		// Issue the request
		$.ajax({
			type: "GET",
			url: "../ogs-internal/ows",
			dataType: "json",
			data: options
		})		
		// Handle the response
		.done(function(response) {

			app.plugins.AMA.RFIFeatures = response;
			app.plugins.AMA.findRoadWithinPolygon();
			//$.each(response.features, function (index, roadFeature) {
				//push(roadFeature)
			//	findRoadWithinPolygon(roadFeature)
			if(response.features.length == 0) {
				$('<p>Route Cannot Be Found</p>').appendTo("#AMA-message");
			}
			spinner.stop();
			//})		
		})
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "AMA: Error getting service areas for office");
			spinner.stop();
		});
	}

	/**
	 * Function: getAMAContactInfo
	 * @param None
	 * @returns () nothing
	 * Function to get the attribution data from the AMA WFS Layer
	 */	 
	generateAMAContactView(featureData){
		var contactList = []
		this.data = contactList
		//Loop throguh featuredata and extract contact object and sort by AMA_ID
		$.each(featureData[0].features, function (index, data) {
			data.properties["GEOMETRY"]=data.geometry;
			contactList.push(data.properties)
		})
		contactList.sort((a, b) => a.SERVICE_AREA_NUMBER - b.SERVICE_AREA_NUMBER);
		var contactListElement = $('#AMA-contact-list');
		$.each(contactList, function (index, contact) {
			var AMACard = $(`<div id="${contact.AMA_ID}" class="card mb-3" style="border: 3px solid rgb(0 51 102);border-radius: 9px;"></div>`).appendTo(contactListElement)
			var AMACardHeader = $(`<h6 class="card-header">${contact.COMMON_NAME}</h6>`).appendTo(AMACard)
			var AMACardBody = $(`<div class="card-body"></div>`).appendTo(AMACard)
			$(`<div class="" id="AMA-area-manager-input" style="font-weight: bold;">${contact.AREA_MANAGER+" - "+contact.AREA_MANAGER_TITLE}</div>`).appendTo(AMACardBody);
			$(`<div class="" id="AMA-region-area-input">Region: ${contact.REGION_NAME}</div>`).appendTo(AMACardBody);
			$(`<div class="" id="AMA-district-area-input">District: ${contact.DISTRICT_NAME}</div>`).appendTo(AMACardBody);
			$(`<div class="" id="AMA-service-area-input">Service Area: ${contact.SERVICE_AREA_NAME}</div>`).appendTo(AMACardBody);
			var AMACardContacts = $(`<div class="AMA-filter-group input-group input-group-sm mb-2 rf-waypoint ui-sortable-handle" id="AMA-filter-group">`).appendTo(AMACardBody)
			var cell = $(`<button tabindex="-1" id="AMA-cell-contact" title=${contact.CELL_NUMBER} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/AMA/img/mdi--cellphone.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"></button>`).appendTo(AMACardContacts);
			cell.click(function(){
				location.href = 'tel:'+contact.CELL_NUMBER;
				})
			var phone = $(`<button tabindex="-1" id="AMA-phone-contact" title=${contact.PHONE_NUMBER} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/AMA/img/mdi--phone.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"></button>`).appendTo(AMACardContacts);
			phone.click(function(){
				location.href = 'tel:'+contact.PHONE_NUMBER;
				})
			var radio = $(`<button tabindex="-1" id="AMA-radio-contact" title=${contact.RADIO_CALL_SIGN} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/AMA/img/mdi--radio-handheld.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"></button>`).appendTo(AMACardContacts);
			radio.click(function(){
				showModalDialog("Radio Call Sign", contact.RADIO_CALL_SIGN, "sm", false)
			})
			var email = $(`<button tabindex="-1" id="AMA-email-contact" title=${contact.EMAIL} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/AMA/img/mdi--email-plus-outline.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"></button>`).appendTo(AMACardContacts);
			email.click(function(){
				location.href = 'mailto:'+contact.EMAIL;
			})
			//Disable buttons if data is null
			if(contact.CELL_NUMBER == null){
				cell.prop("disabled", true);
			}
			if(contact.PHONE_NUMBER == null){
				phone.prop("disabled", true);
			}
			if(contact.EMAIL == null){
				email.prop("disabled", true);
			}
			if(contact.RADIO_CALL_SIGN == null){
				radio.prop("disabled", true);
			}
			AMACardHeader.click(function(){
				app.map.getLayers().getArray().forEach(function(layer){
					if (layer.getSource().getFeatures) {
					  var features = layer.getSource().getFeatures();
					  $.each(features, function (index, feature) {
						var featureID = feature.get("AMA_ID");
						if(featureID==contact.AMA_ID){
							highlightFeature(feature);
							zoomToFeature(feature);
							}
						})
					}
				});	
			})
		})
	}
	

	findRoadWithinPolygon(){
		//Loops over each road feature, grabs first coordinate pair and does a point within to the ama polygons, those with positive hits the contact card is shown
		$.each(app.plugins.AMA.RFIFeatures.features, function (index, roadFeature) {
			var RouteName = roadFeature.properties.NE_DESCR
			var line;
			//Switch OL geometry type based on linetype
			switch (roadFeature.geometry.type) {
			case "LineString":
				var RFIFeature = new ol.Feature({ geometry: new ol.geom.LineString(roadFeature.geometry.coordinates) });
				var RFIFeature4326 = transformFeature(RFIFeature, app.map.getView().getProjection(), "EPSG:4326");
				line = turf.lineString(RFIFeature4326.getGeometry().getCoordinates());
				break;
			case "MultiLineString":
				var RFIFeature = new ol.Feature({ geometry: new ol.geom.MultiLineString(roadFeature.geometry.coordinates) });
				var RFIFeature4326 = transformFeature(RFIFeature, app.map.getView().getProjection(), "EPSG:4326");
				line = turf.multiLineString(RFIFeature4326.getGeometry().getCoordinates());
				break;
			}
			//Calculates length and the midpoint of a line
			var length = turf.length(line, { units: "kilometers" });
			var midLength = length/2
			var options = { units: "kilometers" };
			//IF multistring, rebuild to lineString using first array
			if(line.geometry.type =="MultiLineString"){
				line = turf.lineString(line.geometry.coordinates[0]);
			}
			var along = turf.along(line, midLength, options);
			var pointFeature = new ol.Feature({
				geometry: new ol.geom.Point(along.geometry.coordinates) // Set the point coordinates
				
			})

			// Build the style and apply it
			var newStyle = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 4,
					stroke: new ol.style.Stroke({
						color: "rgba(255, 255, 255)",
						width: 2
					}),
					fill: new ol.style.Fill({color: "rgba(255, 0, 0)"}),
				})
				
				// Used for debugging
				,text: new ol.style.Text({
					text: RouteName,
					font: "bold 13px serif",
					offsetX: 50,
					offsetY: -10,
					fill: new ol.style.Fill({color: "#FF0000"}),
					stroke: new ol.style.Stroke({color: "#ffffff"}),
				})
			});

			//Transfer the properties
			var properties = {};
			properties["NE_DESCR"] = RouteName;
			pointFeature.setProperties(properties);
			
			var pointFeature3857 = transformFeature(pointFeature, "EPSG:4326", app.map.getView().getProjection());
			pointFeature3857.setStyle(newStyle);
			app.plugins.AMA.roadLocation.getSource().addFeature(pointFeature3857);
			
			








			$.each(app.plugins.AMA.featureData[0].features, function (index, AMAFeature) {
				var routePathPointFeature = new ol.Feature({ geometry: new ol.geom.Polygon(AMAFeature.geometry.coordinates) });
				if(AMAFeature.geometry.coordinates.length>1){
					routePathPointFeature = new ol.Feature({ geometry: new ol.geom.MultiPolygon(AMAFeature.geometry.coordinates) });
				}
				var featurePoly = convertOpenLayersFeatureToTurfFeature(routePathPointFeature, 'EPSG:3857')
				var intersect =turf.booleanIntersects(line, featurePoly)
				if(intersect ==true){
					$("#"+AMAFeature.properties.AMA_ID).show();
				}
			})
		})
	}


	//app.plugins.RestrictionFinder_v2.routeRestrictionInfoLayer.getSource().addFeature(restrictionFeature3857);





	/**
	 * Function: toggleContactList
	 * @param () none
	 * @returns () nothing
	 * Function that shows and hides contacts based on filter value
	 */
	toggleContactList(value) {
		//Searches through each attribute listed below and looks for value based on value entered
		$.each(app.plugins.AMA.data, function (index, contact) {
			var contactName = contact.AREA_MANAGER.toLowerCase();
			var SA = contact.SERVICE_AREA_NAME.toLowerCase();
			var District = contact.DISTRICT_NAME.toLowerCase();
			var Region = contact.REGION_NAME.toLowerCase();
			if(contactName.includes(value) == false && SA.includes(value) == false && District.includes(value) == false && Region.includes(value) == false) {
				$("#"+contact.AMA_ID).hide();
			}else{
				$("#"+contact.AMA_ID).show();
			}
		})
	}
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin 
	 */
	addPlugin() {
	
		// Define Callback
		var callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.AMA.name + ": Plugin failed to initialize");
				return;
			}

			// Set class variables
			app.plugins.AMA.tabNav = tabNav;
			app.plugins.AMA.tabContent = tabContent;


			// Register single click
			app.plugins.AMA.singleClick = app.map.on("click", function(event) {
				app.plugins.AMA.scroll2SelectedAMA(event);
			});


			//Contacts filter, searches for key words on the variables listed
			let timeout;
			$("#myInput").on("keyup",function() {
				clearTimeout(timeout);
				timeout = setTimeout(function() {
					var value = $("#myInput").val().toLowerCase();
					if(value.length >0){
						if($("#AMA-RFI-Button").hasClass('active')){
							app.plugins.AMA.filterByRoadName(value)
						}else{
							app.plugins.AMA.toggleContactList(value);
						}
					}else{
						$.each(app.plugins.AMA.featureData[0].features, function (index, feature) {
							var AMA_ID = feature.properties.AMA_ID
							$("#"+AMA_ID).show();
						})

					}
				},800);
				
				

			});

			//Get current location and filter data by only showing the boundary that user is inside
			$(".AMA-get-geolocation-btn").click(function () {
				$('#AMA-message').empty();
				$("#AMA-RFI-Button").removeClass('active')
				var myfunction  = function(coords){
					$("#myInput").val(coords[0]+", "+coords[1]);
					//convert point to turf points
					var points = turf.points([coords])
					app.map.getLayers().getArray().forEach(function(layer){
						if (layer.getSource().getFeatures) {
						  var features = layer.getSource().getFeatures();
						  $.each(features, function (index, feature) {
							//convert feature to turf feature
							var featurePoly = convertOpenLayersFeatureToTurfFeature(feature, 'EPSG:3857')
							//Run turf function to find if point falls within a polygon
							var ptsWithin = turf.pointsWithinPolygon(points, featurePoly);
							if(ptsWithin.features.length==0){
								$("#"+featurePoly.properties.AMA_ID).hide();
							}else{
								$("#"+featurePoly.properties.AMA_ID).show();
								highlightFeature(feature);
							}

							})
						}
					  });	
				}
				getGeoLocation(myfunction)

			})

			const contextMenu = document.getElementById('customMenu');
        let rightClickCoordinate = null;

        // Right-click event to show custom menu
        app.map.getViewport().addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent default browser menu
            
            // Get map coordinates
            const pixel = app.map.getEventPixel(event);
            rightClickCoordinate = app.map.getCoordinateFromPixel(pixel);
			alert(rightClickCoordinate);

            // Position the menu at the pointer's location
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.display = 'block';
        });

        // Hide menu on left-click
        app.map.getViewport().addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Show Coordinates
        function showCoordinates() {
            if (rightClickCoordinate) {
                const lonLat = ol.proj.toLonLat(rightClickCoordinate);
                alert(`Coordinates: ${lonLat[0].toFixed(6)}, ${lonLat[1].toFixed(6)}`);
            }
        }

        // Add a marker at clicked location
        function addMarker() {
            if (!rightClickCoordinate) return;

            const marker = new ol.Feature({
                geometry: new ol.geom.Point(rightClickCoordinate),
            });

            const vectorSource = new ol.source.Vector({
                features: [marker],
            });

            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({ color: 'red' }),
                        stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
                    }),
                }),
            });

            app.map.addLayer(vectorLayer);
        }

			//Clear filter and rerun toggleContactList
			$(".AMA-clear-filter").click(function () {
				$('#myInput').val("");
				app.plugins.AMA.roadLocation.getSource().clear()
				$('#AMA-message').empty();
				$.each(app.plugins.AMA.featureData[0].features, function (index, feature) {
					var AMA_ID = feature.properties.AMA_ID
					$("#"+AMA_ID).show();
				})

			})

			//Turn on RFI Filter Option
			$("#AMA-RFI-Button").click(function () {
				$('#AMA-message').empty();
				if ($(this).hasClass('active')) {
					$(this).removeClass('active')
				}else{
					$(this).addClass('active')
					$('#myInput').val("");
				}
				
			})

			//get AMA data 
			app.plugins.AMA.getAMAContactInfo();
			
			
			// Log success
			logger("INFO", app.plugins.AMA.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);


	}
}