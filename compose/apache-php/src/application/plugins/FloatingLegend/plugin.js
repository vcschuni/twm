class FloatingLegend {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "FloatingLegend";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.featureTemplateFile = "application/plugins/FloatingLegend/feature-template.html";
		this.featureTemplate = "";
		this.pcfg = getPluginConfig(this.name);
		this.intervalProcessId;
		this.addPlugin();
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		
		/**
		* Function: showLegendSpinner
 		* @param () none
 		* @returns () nothing
 		* Function that shows the legend spinner
 		*/
		 function showLegendSpinner() {
			
			// Don't show legend spinner if legend is not open
			if ($(".fl-legend-container").css("display") == "none") {return};

			if (app.mapSpinner) {
				app.mapSpinner.spin($("#fl-legend-body")[0]);
			} else {
				app.mapSpinner = new Spinner(app.spinnerOptionsMedium).spin($("#fl-legend-body")[0]);
			}
			
		}
		
		/**
 		* Function: hideLegendSpinner
 		* @param () none
 		* @returns () nothing
 		* Function that hides the Legend spinner
 		*/
		function hideLegendSpinner() {
			setTimeout(function(){ app.mapSpinner.stop(); }, 500);
		}

		/**
		 * Function: lockUnlock
		 * @param () none
		 * @returns () nothing
		 * Function to lock/unlock floating window from being respawned in it's default location and size
	 	*/
		function lockUnlock() {
			if ($("#fl-legend-container").data("window-state") == "unlocked") {
				$("#fl-legend-container .fl-lock-btn span").removeClass("oi-lock-unlocked").addClass("oi-lock-locked").addClass("fl-lock-btn-locked");
				$("#fl-legend-container").data("window-state", "locked");
			} else {
				$("#fl-legend-container .fl-lock-btn span").removeClass("oi-lock-locked").removeClass("fl-lock-btn-locked").addClass("oi-lock-unlocked");
				$("#fl-legend-container").data("window-state", "unlocked");
			}
		}

		/**
		 * Function: getLegendContent
		 * @param () array containing that may contain specific layers to display
		 * @returns () array containing the visible layers
		 * This function retrieves legend images from the legend URL and appends the content
		 * to the legend body container
		*/
		function getLegendContent(layerList) {
			
			// Check if the layers are to be filtered (as specificed in the config)
			const filterLayers = layerList.length != 0 ? true : false;
			
			// Empty the old child nodes that were displayed previously
			$("#fl-legend-body").empty();
			
			// Get a list of layers that are visible and are "overlays".
			const visibleLayers = [];
			app.map.getLayers().getArray().forEach(function(layer) {
				if (layer.get("type") == "overlay" && layer.get("visible")){
					if (filterLayers){
						if (layerList.indexOf(layer.get("title")) >= 0){
							visibleLayers.push(layer);
						}
					}else{
						visibleLayers.push(layer);
					}
				}
			});
			
			return visibleLayers;
			
		}

		/**
		 * Function: appendLegendContent
		 * @param () none
		 * @returns () nothing
		 * This function loads in the the legend images and appends the content
		 * to the legend body container
		*/
		async function appendLegendContent(visibleLayers){

			const promiseArray = []; 
			
			// Load in legend content
	 		for (var i = visibleLayers.length-1; i>=0; i--){
				promiseArray.push(new Promise(function(resolve){
					// Get legend URL info
					const layerStyle = "";
					var legendUrl;
					// Test for its existence before calling function
					var hasLegendUrl = true;
					try {
						visibleLayers[i].getSource().getLegendUrl();
					} catch (error) {
						hasLegendUrl = false;
					}				
					if (hasLegendUrl) {
						legendUrl = visibleLayers[i].getSource().getLegendUrl(
							app.map.getView().getResolution(),
							{ legend_options: "fontName:Arial;fontAntiAliasing:true;fontColor:0x000033;fontSize:7;dpi:140", style: layerStyle}
						);
					}
					// Create new div and image elements for the legend image.
					const containerElement = document.createElement("div");
					const imgElement = new Image()
					const textElement = document.createElement("h4");
					containerElement.className = "fl-legend-image-container";
					imgElement.className = "fl-legend-body-img";
					textElement.className = "fl-legend-body-text"
					textElement.innerHTML = visibleLayers[i].get("title");
					textElement.title = visibleLayers[i].get("title");

					// Append content only the size of the image is valid. 
					imgElement.onload = function(){
						if (this.width > 2 && this.height > 1){
							containerElement.appendChild(textElement);
							containerElement.appendChild(imgElement);
							resolve();
						}else{
							containerElement.remove();
							resolve();
						}
					}
					if (legendUrl) {
						imgElement.src = legendUrl;
					} else {
						imgElement.src = "application/img/no-legend-available.png";
					}				
					$("#fl-legend-body").append(containerElement);
				
				}));
			};
			await Promise.all(promiseArray);
		}

		/**
		 * Function: displayError
		 * @param () none
		 * @returns () none
		 * Display an error message if legend content does not load
		*/
		function displayError() {
			// Empty the child nodes that were displayed previously
			$("#fl-legend-body").empty();

			// Update the legend body classname and add the error message.
			$("#fl-legend-body").attr('class', 'fl-legend-body-error');
			var textElement = document.createElement("h4");
			textElement.className = "fl-legend-body-error";
			textElement.innerHTML = "No Legend To Display";
			$("#fl-legend-body").append(textElement);

		}

		/**
		 * Function: refreshLegend
		 * @param () array containing that may contain specific layers to display
		 * @returns () none
		 * This function refreshes the legend content
		*/
		function refreshLegend(filteredLayers) {
			
			// There has to be a small delay to let the map update before updating the legend.
			setTimeout(async function() {
				

				// Remove potential error class
				$("#fl-legend-body").attr('class', 'fl-legend-body');
				
				// Get a list of visibile layers
				const visibleLayers = getLegendContent(filteredLayers);
				
				// Show spinner while legend content loads.
				showLegendSpinner();
				await appendLegendContent(visibleLayers);
				hideLegendSpinner();
				
				// Show error message if there is no legend to display
				const bodyChildren = $("#fl-legend-body").children();
				const bodyChildrenCount = bodyChildren.length;
				
				// Show error message if the legend body is empty. But in some cases the spinner will be present in the legend body
				if (bodyChildrenCount == 0 || (bodyChildrenCount == 1 && bodyChildren[0].className == "spinner")){
					displayError();

				}
			}, 500);

		}
		
		// Define Callback
		var callback = function(success, content){

			// Set default legend properties
			var defaultLegendWidth = 200;
			var defaultLegendHeight = 291;

			// These variables will reflect the legend positioning as the user changes them
			var legendWidth = 200;
			var legendHeight = 291;
			var legendTop = -1;
			var legendLeft = -1;
			var isLocked = false;

			// Get the list of user requested layers.
			const filteredLayers = app.plugins.FloatingLegend.pcfg.filteredLayers;
			
			if (!success) {
				logger("ERROR", app.plugins.FloatingLegend.name + ": Plugin failed to initialize");
				return;
			}

			// Add content to the html body.
			$("body").append($(content));

			// Add legend icon to the legend button
			var iconSrc = '<img src="./application/plugins/FloatingLegend/img/icon.svg" width="20" height="20">';
			$("#fl-legend-btn").html(iconSrc);

			// Add legend control features to the map
			var legend = document.getElementById("fl-legend-container");
			var legendButton = document.getElementById("fl-legend-btn-div");
			
			var legendControl = new ol.control.Control({element: legend});
			var legendButtonControl = new ol.control.Control({element: legendButton});

			app.map.addControl(legendControl);
			app.map.addControl(legendButtonControl);
			
			// Legend button event click
			$("#fl-legend-btn-div").click(function(){
				
				// Check if legend is already open.
				let isOpen = $("#fl-legend-container").css("display") == "flex" ? true : false;
				
				if (isOpen)	{
					if ($("#fl-legend-container").data("window-state") == "locked") {
						isLocked = true;
						legendWidth = $("#fl-legend-container").css("width");
						legendHeight = $("#fl-legend-container").css("height");
						legendTop = $("#fl-legend-container").css("top");
						legendLeft = $("#fl-legend-container").css("left");
					}else{
						isLocked = false;
						legendWidth = 200;
						legendTop = -1;
						legendLeft = -1;
					}
					
					$("#fl-legend-btn").html(iconSrc);
					$("#fl-legend-container").fadeOut();
					return;
				} 
				
				// Calculations for the default legend position
				var leftPosition = parseInt($("#fl-legend-btn-div").css("left"),10) + parseInt($("#fl-legend-btn").width()) + 10;
				var topPosition = parseInt($("#fl-legend-btn-div").css("top"),10) - defaultLegendHeight + 28 ;
				
				// Adjust default top position value for mobile devices.
				if (isMobile()) topPosition += 6;

				// Display legend using default positioning.
				if (!isLocked || isMobile()){
		
					// Set up legend position and functionality
					$("#fl-legend-container").css("left", leftPosition);
					$("#fl-legend-container").css("top", topPosition);
					$("#fl-legend-container").css("width", defaultLegendWidth);
					$("#fl-legend-container").css("height", defaultLegendHeight);
					$("#fl-legend-container").fadeIn();
					$("#fl-legend-container").css("display", "flex");
					$("#fl-legend-container").draggable({
						containment: "#map",
					});
				
				// Display legend using previous "locked" properties.
				}else{
					
					// Set up legend position and functionality
					$("#fl-legend-container").css("left", legendLeft);
					$("#fl-legend-container").css("top", legendTop);
					$("#fl-legend-container").css("width", legendWidth);
					$("#fl-legend-container").css("height", legendHeight);
					$("#fl-legend-container").fadeIn();
					$("#fl-legend-container").css("display", "flex");
					$("#fl-legend-container").draggable({
						containment: "#map",
					});

				}
				
				// Add ability to resize legend if not on mobile.
				if (!isMobile()){
					$("#fl-legend-container").resizable();
				}
				
				// Change legend button icon when the legend is enabled
				$("#fl-legend-btn").html("«");

				refreshLegend(filteredLayers);
			});

			// Lock/Unlock event listener
			$(".fl-lock-btn").click(function(){
				lockUnlock();
			});

			// Close legend by clicking the "X" symbol on the legend.
			$("#fl-legend-exit-btn").click(function(){
				if ($("#fl-legend-container").data("window-state") == "locked") {
					isLocked = true;
					legendWidth = $("#fl-legend-container").css("width");
					legendHeight = $("#fl-legend-container").css("height");
					legendTop = $("#fl-legend-container").css("top");
					legendLeft = $("#fl-legend-container").css("left");
				}else{
					isLocked = false;
					legendWidth = 200;
					legendHeight = 200;
					legendTop = -1;
					legendLeft = -1;
				}
				$("#fl-legend-container").fadeOut();
				$("#fl-legend-btn").html(iconSrc);
			});

			// Update legend content when clicking the zoom buttons
			$(".ol-zoom").click(function(){
				refreshLegend(filteredLayers);
			});

			// Update legend content when scrolling on the map
			$(".ol-layer").on('wheel', function(){
				refreshLegend(filteredLayers);
			});

			// Update legend content on mobile pinch zoom
			$("#map").on('touchmove', function(e){
				if (e.targetTouches.length == 2) refreshLegend(filteredLayers);
			});

			// Update legend content when enabling layers
			$("#Layers-tab-content").on("change", function(){
				refreshLegend(filteredLayers);
				
			});

			// Update legend content when adding new layers by double clicking on them
			$("#lc-addable-layers-ig").on("dblclick", function(){
				refreshLegend(filteredLayers);
			});

			// Update legend when adding new layers
			$("#lc-add-layer-btn").on("click", function(){
				refreshLegend(filteredLayers);
			});

			// Hide the lock button on the legend if user is on a mobile device
			if (isMobile()) $("#fl-legend-container .fl-lock-btn").hide();
				
			logger("INFO", app.plugins.FloatingLegend.name + ": Plugin successfully loaded");
		};

		
		loadTemplate(this.featureTemplateFile, callback);
		
	}
} 