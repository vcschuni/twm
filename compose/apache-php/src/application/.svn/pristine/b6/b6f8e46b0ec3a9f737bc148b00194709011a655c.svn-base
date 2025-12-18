class DAGoffices {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "DAGoffices";
		this.version = 1.0;
		this.author = "Amanda Terfloth";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "About";
		this.tabContentFile = "application/plugins/DAGoffices/tab-content.html";		
		this.intervalProcessId;
		this.featureStore = [];
		this.addPlugin();
		this.data = [];
	}


/**
	 * Function: scroll2SelectedDS
	 * @param (object) event
	 * @returns () nothing
	 * Function that scrolls the sidebar to the clicked on DS Boundaries
	 */
	scroll2SelectedDS(event) {
		// Get all features close to click
		var pixel = app.map.getEventPixel(event.originalEvent);
		var featureLayer;
		var idList = []
		var feature = app.map.forEachFeatureAtPixel(pixel,
			function(feature, layer) {
				featureLayer = layer;
				var featureName = featureLayer.get('title');
				if(featureName =="MoTT Development Service Area"){
					idList.push(feature.get("AREA_ID"));
					}
			});
		if(idList.length>0){
			// If you can find a matching restriction div/table with the current group id, scroll to it
			// Define the executeScroll function
			var executeScroll = function() {
				var currentScrollPosition = $("#About-tab-content").scrollTop();
				var offset = Math.floor($("#"+idList[0]).offset().top - 130);
				var newScrollPosition = currentScrollPosition + offset;
				$("#"+idList[0]).effect("highlight", {}, 4000);
				$("#About-tab-content").animate({
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
	 * Function: DSContactView
	 * @param None
	 * @returns () nothing
	 * Function to get the attribution data from the DAG Offices Layer
	 */	 
	
	DSContactView(featureData){
		hideMapSpinner();
		var DScontactList = []
		this.data = DScontactList
		//Loop through feature data and extract contact object and sort by _ID
		$.each(featureData.features, function (index, data) {
			data.properties["GEOMETRY"]=data.geometry;
			DScontactList.push(data.properties)
		})
		// DScontactList.sort((a, b) => a.SERVICE_AREA_NUMBER - b.SERVICE_AREA_NUMBER);
		// DScontactList.sort(MOTI_DISTRICT);
		var DScontactListElement = $('#DS-contact-list');
		$.each(DScontactList, function (index, contact) {
			
			
		
		
			var DSCard = $(`<div class="card mb-3" style="border: 3px solid rgb(0 51 102);border-radius: 9px;"></div>`);
			
			// var DSCardHeadDistrict = $(`<h7 class="district-header">${contact.MOTI_DISTRICT}</h7>`).appendTo(DSCard);
			var DSCardHeader = $(`<h6 class="card-header">${contact.MOTI_DISTRICT}</h6>`).appendTo(DSCard);
			var DSCardBody = $(`<div id="${contact.AREA_ID}" class="card-body"></div>`).appendTo(DSCard);
			$(`<div class="pb-2" id="DS-district-area-input" style="font-weight: bold;">MoT Office: ${contact.AREA_NAME}</div>`).appendTo(DSCardBody);
			$(`<div class="" id="DS-region-area-input">Service Location:<br>${contact.OFFICE_ADDRESS}</div>`).appendTo(DSCardBody);
		
			var DSCardContacts = $(`<div class="DS-filter-group input-group input-group-sm mb-2 rf-waypoint ui-sortable-handle" id="DS-filter-group">`).appendTo(DSCardBody);
			
			var phone = $(`<button tabindex="-1" id="DS-phone-contact" title=${contact.OFFICE_PHONE_NUMBER} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/DAGoffices/img/mdi--phone.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"></button>`).appendTo(DSCardContacts);
			phone.click(function(){
				location.href = 'tel:'+contact.OFFICE_PHONE_NUMBER;
				});
		
			var email = $(`<button tabindex="-1" id="DS-email-contact" title=${contact.GENERAL_INQUIRIES_EMAIL} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/DAGoffices/img/mdi--email-plus-outline.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"> General Inquiries</button>`).appendTo(DSCardContacts);
			email.click(function(){
				location.href = 'mailto:'+contact.GENERAL_INQUIRIES_EMAIL;
			});

			if (contact.SPECIAL_EVENTS_EMAIL!="(none)") {
				var eventsEmail = $(`<button tabindex="-1" id="DS-Event-email-contact" title=${contact.SPECIAL_EVENTS_EMAIL} class="btn btn-sm btn-outline-secondary" type="button"><img src="application/plugins/DAGoffices/img/mdi--email-plus-outline.png" alt="Trulli"width="20" height="22" style="vertical-align: text-bottom;"> Special Events </button>`).appendTo(DSCardContacts);
				eventsEmail.click(function(){
				location.href = 'mailto:'+contact.SPECIAL_EVENTS_EMAIL;
				});
			}
			//Disable buttons if data is null
			// if(contact.CELL_NUMBER == null){
			// 	cell.prop("disabled", true);
			// }
			if(contact.OFFICE_PHONE_NUMBER == null){
				phone.prop("disabled", true);
			}
			if(contact.GENERAL_INQUIRIES_EMAIL == null){
				email.prop("disabled", true);
			}

			// if(contact.RADIO_CALL_SIGN == null){
			// 	radio.prop("disabled", true);
			// }
			DSCardBody.click(function(){
				app.map.getLayers().getArray().forEach(function(layer){
					if (layer.getSource().getFeatures) {
					  var features = layer.getSource().getFeatures();
					  $.each(features, function (index, feature) {
						var featureID = feature.get("OFFICE_LIST_NAME");
						if(featureID==contact.OFFICE_NAME){
							highlightFeature(feature);
							zoomToFeature(feature);
							}
						})
					}
				});	
			})
		
			// Add the clone to the results div in layer order
			var isAdded = false;
			$("#DS-contact-container").find(".card").each(function (index) {
				if (!isAdded) {
					if ($(this).find("h6.card-header").text()===contact.MOTI_DISTRICT){ // if the result titles are the same group them
						DSCardBody.appendTo($(this));
						isAdded = true;
					}
				}
			});
			if (!isAdded) {
				DSCard.appendTo(DScontactListElement);	
			}
		})

	}

// ORIGINAL CONTACT SIDEBAR START _______________________________
	/**
	 * Function: ListDSOffices
	 * @param () none
	 * @returns () none
	 * Function to list the Development Services Offices on the tab-content.html page
	 */	 
	ListDSOffices() {		
		showMapSpinner(); // Might take a minute	

		var options = {
			service: "WFS",
			version: "2.0.0",
			request: "GetFeature", 
			typeNames: "hwy:ISS_DEVELOPMENT_SERVCS_BNDRY_V",
			outputFormat: "application/json",
			count: 50,
			srsName: app.map.getView().getProjection().getCode()
		}			
		$.ajax({
			type: "GET",
			url: returnEnvironmentUrl("ogs-public") + "/ows",
			dataType: "json",
			data: options
		})
		
		// Handle the response
		.done(function(response) {
			app.plugins.DAGoffices.DSContactView(response);
		})
		
		// Handle a failure
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", app.plugins.DAGoffices.name + ": Error querying ISS_DEVELOPMENT_SERVICES_OFFICE");
			app.plugins.DAGoffices.DSContactView([]);
		}); 		

	}

	// Original CONTACT SIDEBAR END _______________________ 
	
	/**
	 * Function: GetDSOffice
	 * @param (string) Service Area Number
	 * @returns () string
	 * Function to fetch the Name of Development Services Office which serves this Service Area
	 */	 
	GetDSOffice(SAno) {
		var SAstr = SAno.toString();
		var office = '';
		office = '<h5>'+off.Name+'</h5><a href="tel:'+off.Phone+'">'+off.Phone+'</a>';
		app.plugins.DAGoffices.featureStore.forEach(function(off) {
			var SAarray = off.id.split(",");
			SAarray.forEach(function(num){
				var numStr = num.toString().trim()	
			});
		});
		return office;
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
				logger("ERROR", app.plugins.DAGoffices.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.DAGoffices.tabNav = tabNav;
			app.plugins.DAGoffices.tabContent = tabContent;

			// Register single click
			app.plugins.DAGoffices.singleClick = app.map.on("click", function(event) {
				app.plugins.DAGoffices.scroll2SelectedDS(event);
			});

			// Poplulate office list
			app.plugins.DAGoffices.ListDSOffices();
			
			
			// Log success
			logger("INFO", app.plugins.DAGoffices.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);


	}
}