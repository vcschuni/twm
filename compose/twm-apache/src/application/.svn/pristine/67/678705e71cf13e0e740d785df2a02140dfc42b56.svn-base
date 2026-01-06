
class SelectPlugin {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "SelectPlugin";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Select Plugin";
		this.tabContentFile =  "application/plugins/SelectPlugin/tab-content.html";
		this.layerDownloaderContentFile = "application/plugins/SelectPlugin/downloader.html"
		this.featureStore = [];
		this.selectionTreeData = [];
		this.selectionSetTreeData = [];
		this.resultsTreeData = [];
		this.waitingForMapClick = false;
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.addPlugin();
	}


	/**
	 * Function: clearData
	 * @param () none
	 * @returns () nothing
	 * Clears some data variables.
	*/
	clearData(){
		app.plugins.SelectPlugin.selectionTreeData = [];
	}


	/**
	 * Function: appendToSelectionData
	 * @param () (object) layer, (object) features
	 * @returns () nothing
	 * This function appends layer and feature data to the selection tree data structure.
	*/
	appendToSelectionData(layer, features) {
		
		// Build the parent (layer) node
		var parentNode = new Object();
		parentNode.text = layer.get("title") + " (" + features.length + ")";
		parentNode.icon = "oi oi-folder";
		parentNode.class = "sp-treeview-layer";
		parentNode.nodes = [];

		// Add each feature found as a child to the parent
		$.each(features, function(index, feature) {

			// Add parent layer layerId to feature (for later use)
			feature.layerId = ol.util.getUid(layer);

			// Add feature to feature store
			app.plugins.SelectPlugin.featureStore.push(feature);
			
			// Build the feature title (configured or not)
			var featureTitle = "";
			if (typeof layer.get("fields") !== "undefined") {
				$.each(layer.get("fields"), function(index, configField) {
					if (configField.name) {
						$.each(feature.properties, function(fieldName, fieldValue) {
							if (configField.name == fieldName) {
								if (configField.title) {
									if (featureTitle != "") featureTitle += " - ";
									featureTitle += "<i>"+fieldValue+"</i>";
								} 
							}
						});
					}
				});
			} else {
				featureTitle = "<i>" + layer.get("title") + " [" + (index + 1) + "]" + "</i>";
			}
			
			// Build the child (feature) node
			var childNode = new Object();
			childNode.id = "sp-feature-" + (app.plugins.SelectPlugin.featureStore.length - 1) + "-" + layer.get("title");
			childNode.text = featureTitle;
			childNode.icon = "oi oi-plus";
			childNode.class = "sp-selection-feature"; 
			
			// Add child node to parent (layer) node
			parentNode.nodes.push(childNode);
		});
		
		// Add the parent to the results tree data array
		app.plugins.SelectPlugin.selectionTreeData.push(parentNode);

	}



	/**
	 * Function: expandSelectionSetTree
	 * @param () none
	 * @returns () none
	 * This function will programmatically expand the selection set tree
	*/
	expandSelectionSetTree() {
		
		$("#sp-selection-set-tree > .sp-treeview-layer").removeClass("collpased");
		$("#sp-selection-set-tree > .sp-treeview-layer").attr("aria-expanded",true);
		$("#sp-selection-set-tree-item-0").attr("class","list-group collapse show");
		
		// Change to dropdown symbol to arrow top
		$('#sp-selection-set-tree > .sp-treeview-layer > .oi-chevron-bottom').each(function(){
			this.className = 'state-icon oi-chevron-top oi';
		});
		
	
	}

	/**
	 * Function: showError
	 * @param () none
	 * @returns () none
	 * Show an error message on the left panel
	*/
	showError(message){
		$(".sp-content-error").css("visibility", "visible");
		$(".sp-content-error").append(`<p class='sp-selection-error' id='sp-layer-selection-error'>${message}</p>`);			
	}

	/**
	 * Function: countNumLayers
	 * @param () none
	 * @returns () (int) the number of layers
	 * This function returns the number of layers on the map
	*/
	countNumLayers() {
		var count = 0;
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (layer.get("visible") === true && typeof layer.getSource().getFeatureInfoUrl == "function") {
				count++;
			}
		})	
		return count;
	}

	/**
	 * Function: removeEmptyNodes
	 * @param () none
	 * @returns () none
	 * This function removes all empty feature lists from the selection tree data 
	*/
	removeEmptyNodes() {
		app.plugins.SelectPlugin.selectionTreeData = app.plugins.SelectPlugin.selectionTreeData.filter(layer => layer.nodes.length > 0)
	}
	

	/**
	 * Function: appendResultFeatures
	 * @param (object) response, (object) parentNode
	 * @returns nothing
	 * This function appends the found WFS queried features to the result tree data
	*/
	appendResultFeatures(response, parentNode) {
		const span = document.createElement('span');
  		span.innerHTML = parentNode.text;
  		let parentNodeName = span.innerText.trim(); 
		
		response.features.forEach(feature => {
			
			app.plugins.SelectPlugin.featureStore.push(feature);
			
			// Get the name of the feature region
			let featureTextRegion = feature["properties"]["REGION_NAME"] || feature["properties"]["DISTRICT_NAME"] || feature["properties"]["CONTRACT_AREA_NAME"] || feature["properties"]["DESCRIPTION"] || feature["properties"]["SIGN_NAME"] || "NAME NOT FOUND";
			
			// Build the child (feature) node for the Selection Set
			var childNode = new Object();
			childNode.id = "sp-feature-" + (app.plugins.SelectPlugin.featureStore.length - 1) + "-results";
			childNode.text = featureTextRegion;
			childNode.icon = "oi oi-map";
			childNode.class = "sp-result-feature";
			
			parentNode.nodes.push(childNode);

		});

	}

	/**
	 * Function: showResults
	 * @param (object) Tree data
	 * @returns () none
	 * This function will display the results page.
	*/
	showResults(){
		
		// Stop spinner
		app.mapSpinner.stop();

		// Change the page visibility and create the tree div
		$(".sp-spinner-screen").css("display", "none");
		$(".sp-results-container").css("display", "block");
		$(".sp-results-tree-container").empty();
		$(".sp-results-tree-container").append("<div id='sp-results-tree'></div>");

		// Deploy the tree for the results page
		$("#sp-results-tree").bstreeview({
			data: app.plugins.SelectPlugin.resultsTreeData,
			expandIcon: 'oi oi-chevron-top',
			collapseIcon: 'oi oi-chevron-bottom',
			indent: 1.6,
			openNodeLinkOnNewTab: true
		});

		// Highlight feature on the map when the user hovers over it.
		$(".sp-result-feature").hover(
			function(){
				var idList = this.id.split("-");
				var featureID = idList[2];
				var feature = app.plugins.SelectPlugin.featureStore[featureID];
				var olFeature = convertToOpenLayersFeature("GeoJSON", feature);

				highlightFeature(olFeature);
				
			},
			function(){
				clearHighlightedFeatures();
			}
		);

	}

	/**
	 * Function: createResultsTreeData
	 * @param () none
	 * @returns () none
	 * This function creates a tree data array that will be shown in the results page
	*/
	createResultsTreeData() {
		var layerCounter = 0;
		const numLayers = app.plugins.SelectPlugin.countNumLayers() * app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.length;
		
		// Display Spinner
		$(".sp-selection-container").css("display", "none");
		$(".sp-spinner-screen").css("display", "flex");
		app.mapSpinner = new Spinner(app.spinnerOptionsMedium).spin($(".sp-spinner-screen")[0]);

		// Loop through all the user selected features
		app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.forEach(function(node){
			
			// Create parent object
			var nodeText = node.text
			var parentNode = new Object();
			parentNode.nodes = [];
			parentNode.id = "sp-parent-node-result"
			parentNode.text = nodeText;
			parentNode.icon = "oi oi-folder";
			parentNode.class = "sp-treeview-layer";

			var featureCount = 0;

			// Append parent node to tree data
			app.plugins.SelectPlugin.resultsTreeData.push(parentNode);
			
			const idNum = node.id.split("-")[2];
			const nodeFeatureObject = app.plugins.SelectPlugin.featureStore[idNum];
			var coordinateString = "";

			nodeFeatureObject.geometry.coordinates.forEach((array) => {
				array.forEach((coordinate, index) => {
					const longCord = coordinate[0];
					const latCord = coordinate[1];
					coordinateString += longCord + " " + latCord;
					if (index != array.length-1) coordinateString += " "

				});
			});

			// Loop through all the features on the map and find possible intersections with the feature object
			$.each(app.map.getLayers().getArray(), function(index, layer) {
				if (layer.get("visible") === true && typeof layer.getSource().getFeatureInfoUrl == "function") {
					const layerName = layer.getSource()["pu"]["LAYERS"];
					
					// Define the search url (modify to point to WFS if required)
					if (layer.getSource() instanceof ol.source.TileWMS) {
						var searchUrl = layer.getSource().getUrls()[0]; // TileWMS

					} else if (layer.getSource() instanceof ol.source.ImageWMS) {
						var searchUrl = layer.getSource().getUrl(); // ImageWMS
					} else {
						logger("WARN", "Could not determine search url for layer " + layer.get("title"));
						return;
					}
					
					var searchUrl = searchUrl.replace(new RegExp("/ows", "ig"), "/wfs");
					
					// Get the name of the geometry column
					var geometryField;
					$.each(layer.get("attributes"), function(index, attribute) {
						if (attribute.type.startsWith("gml:")) {
							geometryField = attribute.name;
						}
					});

					// Skip current layer if native projection is not defined
					if (layer.get("nativeProjection") == null) return;

					// Build the request options
					var options = 	"<?xml version='1.0' encoding='UTF-8' ?> "
									+"<wfs:GetFeature service='WFS' version='2.0.0' outputFormat='json' count='1000' "
										+"xmlns:wfs='http://www.opengis.net/wfs/2.0' "
										+"xmlns:fes='http://www.opengis.net/fes/2.0' "
										+"xmlns:gml='http://www.opengis.net/gml/3.2' "
										+"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' "
										+"xsi:schemaLocation='http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd'>"
										+"<wfs:Query typeNames='"+layerName+"' srsName='EPSG:3857'>"
											+"<fes:Filter xmlns:fes='http://www.opengis.net/fes/2.0' xmlns:gml='http://www.opengis.net/gml/3.2'>"
												+"<fes:Intersects>"
													+"<fes:ValueReference>"+geometryField+"</fes:ValueReference>"
													+"<gml:Polygon srsName='http://www.opengis.net/gml/srs/epsg.xml#3857'>"
														+"<gml:exterior>"
															+"<gml:LinearRing>"
																+"<gml:posList srsDimension='2'>"
																	+coordinateString
																+"</gml:posList>"
															+"</gml:LinearRing>"
														+"</gml:exterior>"
													+"</gml:Polygon>"
												+"</fes:Intersects>"
											+"</fes:Filter>"
										+"</wfs:Query>"
									+"</wfs:GetFeature>";
													
					// Issue the request
					$.ajax({
						type: "POST",
						url: searchUrl,
						contentType: "text/xml",
						dataType: "json",
						data: options,
						timeout: 15000
					})
				
					// Handle the response
					.done(function(response) {
						layerCounter++;
						
						// Update feature count on the parent
						featureCount += response.features.length;
						parentNode.text = nodeText + ` (${featureCount})`;
						
						app.plugins.SelectPlugin.appendResultFeatures(response, parentNode)

						// Show the results page if the final layer has finished the intersection query
						if (layerCounter == numLayers) app.plugins.SelectPlugin.showResults();
					})
					
					// Handle a failure
					.fail(function(jqxhr, settings, exception) {
						layerCounter++;

						// Feature count should be set to 0 on error
						parentNode.text = nodeText + ` (0)`;
						
						// Show the results page if the final layer has finished the intersection query
						if (layerCounter == numLayers) app.plugins.SelectPlugin.showResults();
						
						logger("ERROR", app.plugins.SelectPlugin.name + ": Error querying WMS intersection for layer:" + layer.get("title"));
					}); 		
				}
			});
			
			featureCount = 0
			

		});


	}

	/**
	 * Function: showSelectionTree
	 * @param () none
	 * @returns () nothing
	 * This function displays the tree diagram on the page.
	*/
	showSelectionTree() {	

		app.plugins.SelectPlugin.removeEmptyNodes()
		
		// Display the tree content
		$(".sp-content-container").css("visibility","visible");

		// Don't show the tree if the selection array is empty.
		if (app.plugins.SelectPlugin.selectionTreeData.length == 0){
			$(".sp-selection-tree-container").append("<p class='sp-selection-error'>No features found</p>");			
			return;
		}

		// Create a div for the selection tree
		$(".sp-selection-tree-container").append("<div id='sp-selection-tree'></div>");
		
		// Register and build the treeview
		$("#sp-selection-tree").bstreeview({
			data: app.plugins.SelectPlugin.selectionTreeData,
			expandIcon: 'oi oi-chevron-top',
			collapseIcon: 'oi oi-chevron-bottom',
			indent: 1.6,
			openNodeLinkOnNewTab: true
		});


		// Highlight feature on the map when the user hovers over it.
		$(".sp-selection-feature").hover(
			function(){
				var idList = this.id.split("-");
				var featureID = idList[2];
				var feature = app.plugins.SelectPlugin.featureStore[featureID];
				var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
				highlightFeature(olFeature);
			},
			function(){
				clearHighlightedFeatures();
			}
		);

		// Activate the click event for the feature.
		$(".sp-selection-feature").click(function(){

			var isSelectionSetOpen = ($("#sp-selection-set-tree > .sp-treeview-layer").children().first().attr("class") == "state-icon oi-chevron-top oi") ? true : false;
	
			// Get the layername of the clicked feature
			var splitFeatureID = $(this).attr("id").split('-');
			var layerName = splitFeatureID[splitFeatureID.length - 1];
			
			// Get selected feature name and setup duplication check
			const featureName = "<i>" + $(this).children("i").eq(1).html() + "</i>" + " - " + layerName ;
			var isDuplicate = false;
			
			// Exit if the selected feature is already in the selection set.
			app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.forEach(function(feature){ 
				if (feature.text == featureName) {
					isDuplicate = true;
				}
			});

			// If selected feature is a duplicate then exit.
			if (isDuplicate) return;

			// Get the layername of the clicked feature
			var splitFeatureID = $(this).attr("id").split('-');
			var layerName = splitFeatureID[splitFeatureID.length - 1];
			
			// Build the child (feature) node for the Selection Set
			var childNode = new Object();
			childNode.id = this.id + "-selection-set";
			childNode.text = featureName;
			childNode.icon = "oi oi-minus";
			childNode.class = "sp-selection-set-feature";
			
			app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.push(childNode);
			
			// Show the selection set tree
			app.plugins.SelectPlugin.showSelectionSetTree();
			
			// If the selection set is open, then keep it expanded
			if (isSelectionSetOpen) app.plugins.SelectPlugin.expandSelectionSetTree();
			
		});
	}

	/**
	 * Function: showSelectionSetTree
	 * @param () none
	 * @returns () nothing
	 * This function displays the tree diagram for the selection set..
	*/
	showSelectionSetTree() {	
		
		// Set a new title for the parent node.
		app.plugins.SelectPlugin.selectionSetTreeData[0].text = "Features " + "(" + app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.length + ")";

		// Empty the curent selection set tree.
		$(".sp-selection-set-tree-container").empty();

		// Don't show the tree if the selection set array is empty.
		if (app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.length == 0){
			$(".sp-selection-set-tree-container").append("<p class='sp-selection-error' id='sp-selection-set-error'>No features selected</p>");			
			return;
		}

		// Create a div for the selection set tree.
		$(".sp-selection-set-tree-container").append("<div id='sp-selection-set-tree'></div>");
		
		// Register and build the treeview
		$("#sp-selection-set-tree").bstreeview({
			data: app.plugins.SelectPlugin.selectionSetTreeData,
			expandIcon: 'oi oi-chevron-top',
			collapseIcon: 'oi oi-chevron-bottom',
			indent: 1.6,
			openNodeLinkOnNewTab: true
		});

		// Highlight feature on the map when the user hovers over it.
		$(".sp-selection-set-feature").hover(
			function(){
				var idList = this.id.split("-");
				var featureID = idList[2];
				var feature = app.plugins.SelectPlugin.featureStore[featureID];
				var olFeature = convertToOpenLayersFeature("GeoJSON", feature);
				highlightFeature(olFeature);

			},
			function(){
				// Clear highlighted feature when the cursor is moved away 
				clearHighlightedFeatures();
			}


		);
		
		// Activate the click event for the feature.
		$(".sp-selection-set-feature").click(function(){
			
			// Clear the highlighted feature when removing it.
			clearHighlightedFeatures();

			// Get selected feature name and setup duplication check
			const featureName = "<i>" + $(this).children("i").eq(1).html() + "</i>";

			// Remove the clicked feature from the tree data.
			app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.forEach(function(feature){ 
			
				app.plugins.SelectPlugin.selectionSetTreeData[0].nodes = app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.filter(function(e){
					
					// Strip the layer refrerence from the string
					var subString = e.text.substring(0, e.text.lastIndexOf('-')).trim();
					
					return (subString != featureName);
				});
			});

			app.plugins.SelectPlugin.showSelectionSetTree();

			// Keep the selection set tree expanded.
			app.plugins.SelectPlugin.expandSelectionSetTree();
			

		})

	}

	/**
	 * Function: registerMapClickLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that registers where the user clicked on the map
	 */
	
	registerMapClickLocation() {
		var numOfLayers = app.plugins.SelectPlugin.countNumLayers();

	
		// Define function that handles the get map click location
		const callback = function(layer, features){
			
			if (layer) app.plugins.SelectPlugin.appendToSelectionData(layer, features);
		
			if (app.plugins.SelectPlugin.selectionTreeData.length >= numOfLayers) {
				app.plugins.SelectPlugin.showSelectionTree();
				app.plugins.SelectPlugin.showSelectionSetTree();
				app.mapSpinner.stop();
				$(".sp-content-container").css("visibility","visible");
			}
		}

		const mapClickFunction = function(event){

			$(".sp-content-container").css("visibility","hidden");

			app.mapSpinner = new Spinner(app.spinnerOptionsMedium).spin($(".sp-tab-container")[0]);
			
			$.each(app.map.getLayers().getArray(), function(index, layer) {
				
				// Determine if layer has a "prevent identify" configured.  If so, skip layer.
				var preventIdentify = layer.get("preventIdentify") ? layer.get("preventIdentify") : false;
				if (preventIdentify) return;
				
				// WMS :: Perform a GetFeatureInfo
				if (layer.get("visible") === true && typeof layer.getSource().getFeatureInfoUrl == "function") {

					// Build the request url
					const gfiUrl = layer.getSource().getFeatureInfoUrl(
						event.coordinate,
						app.map.getView().getResolution(),
						app.map.getView().getProjection().getCode(),
						{
							"INFO_FORMAT": "application/json",
							"FEATURE_COUNT": app.plugins.SelectPlugin.pcfg.maxResults
						}
					);
							
					// Define request timeout
					var requestTimeout = (app.plugins.SelectPlugin.pcfg.requestTimeout) ? app.plugins.SelectPlugin.pcfg.requestTimeout : 5000;
							
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
						logger("ERROR", "SelectPlugin: Error querying " + layer.get("title") + " - " + exception);
					});
				}

			});
			
			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();

			// Toggle function as inactive
			app.plugins.SelectPlugin.waitingForMapClick = false;

			$(".sp-selection-tree-container").empty();

			// If mobile, show sidebar
			if (isMobile()) showSidebar();
			
		}
		
		// Toggle function as active
		app.plugins.SelectPlugin.waitingForMapClick = true;
		
		// Redirect the map's single click function to this mapClickFunction (temporary)
		redirectMapSingleClickFunction("crosshair", mapClickFunction);
		
		// If mobile, hide sidebar
		if (isMobile()) hideSidebar();
	};
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		
		// Define Callback
		const callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.SelectPlugin.name + ": Plugin failed to initialize");
				return;
			}
            
            // Set class variables
			app.plugins.SelectPlugin.tabNav = tabNav;
			app.plugins.SelectPlugin.tabContent = tabContent;

			// Create the parent node for the Selection Set Tree
			var parentNode = new Object();
			parentNode.text = "Features (0)";
			parentNode.icon = "oi oi-folder";
			parentNode.class = "sp-treeview-layer";
			parentNode.nodes = [];
			app.plugins.SelectPlugin.selectionSetTreeData.push(parentNode);

			// Register this plugin as the default map single click function
			$("#sp-select-layer-button").click(function(){

				// Hide sidebar if the user is on mobile
				if (isMobile()) hideSidebar();

				// If no layers are enabled then display error message and return
				if (app.plugins.SelectPlugin.countNumLayers() == 0){

					// Display error message if there is nothing to display
					const errorMessage = "Error: No layers selected";
					if ($(".sp-content-error").css("visibility") == "hidden") {
						// Hide the content container if there is nothing to display
						if (app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.length == 0) $(".sp-content-container").css("visibility", "hidden");
						app.plugins.SelectPlugin.showError(errorMessage);
					}else{
						// Animate the text when the user clicks on the button.
						$("#sp-layer-selection-error").css("color", "black");
						$("#sp-layer-selection-error").animate({
							color: "#808080"
						}, 500);
					}
					
					return;
				}

				// Hide container error message 
				$(".sp-content-error").css("visibility", "hidden");
				$(".sp-content-error").empty();

				// Clear any currentll selected features.
				clearHighlightedFeatures();
				
				// Clear old data
				app.plugins.SelectPlugin.clearData();
				
				// Start map click handler
				app.plugins.SelectPlugin.registerMapClickLocation();
			});

			// Search button event listener
			$("#sp-search-button").click(function(){
				// Text animation to indicate search array is empty
				if (app.plugins.SelectPlugin.selectionSetTreeData[0].nodes.length == 0){
					$("#sp-selection-set-error").css("color", "black");
					$("#sp-selection-set-error").animate({
						color: "#808080"

					}, 500);
					return;
				}
				
				// Show error if no layers are selected
				if (app.plugins.SelectPlugin.countNumLayers() == 0){
					const errorMessage = "Error: No layers selected";
					$(".sp-found-selections").css("visibility", "hidden");
					$(".sp-selection-set").css("visibility", "hidden");
					app.plugins.SelectPlugin.showError(errorMessage);
					return;
				}

				// Clear old tree data
				app.plugins.SelectPlugin.resultsTreeData = [];
				
				// Create tree data for the results page
				app.plugins.SelectPlugin.createResultsTreeData();

			});

			$(".sp-download-button").click(function(){

				// Load the form
				$.ajax({
					type: "GET",
					url: app.plugins.SelectPlugin.layerDownloaderContentFile
				}).done(function (response) {
					
					// Get the form from the response
					var lForm = $(response);
			
					// Populate the layer select box
					$.each(app.plugins.SelectPlugin.resultsTreeData, function (id, node) {
						lForm.find("#sp-output-layer").append("<option value='" + node.text + "'>" + node.text + "</option>");
					});
	
					// Populate the output format select box
					lForm.find("#sp-output-format").val("GeoJSON");
	
					// Define and option the downloader dialog
					bootbox.dialog({
						title: "Download Features",
						message: lForm,
						centerVertical: true,
						buttons: {
							download: {
								label: "Download",
								className: "btn-primary",
								callback: function (result) {

									// Get user selected collection name
									var collectionName = lForm.find("#sp-output-layer").val();

									// Collection name without the html tags
									var collectionNameNew = collectionName.replace("<i>", ""); 
									collectionNameNew = collectionNameNew.replace("</i>", "");

									// Array the contains the required features
									var myFeatures = [];

									// Loop through the tree nodes and find the one the user selected
									$.each(app.plugins.SelectPlugin.resultsTreeData, function(index, tree){
										
										// Only proceed if the tree name is the same as the user selected one
										if (tree.text != collectionName) return;
										
										// Loop through the features of the user selected tree node
										$.each(tree.nodes, function(index2, node){
											// Get the id value of the node and the corresponding feature
											const nodeID = node.id.split("-")[2]
											const feature = app.plugins.SelectPlugin.featureStore[nodeID];
											myFeatures.push(convertToOpenLayersFeature("GeoJSON", feature));
										});
										
									});

									// Create the GeoJSON object
									var gjFormat = new ol.format.GeoJSON();
									var gjObject = gjFormat.writeFeaturesObject(myFeatures, { dataProjection: "EPSG:4326", featureProjection: app.map.getView().getProjection()});

									// Create download URL
									var downloadData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gjObject));
									
									// Create download element and initiate the download
									var downloadElement = document.createElement("a");
									downloadElement.setAttribute("href", downloadData);
									downloadElement.setAttribute("download", `${collectionNameNew}.json`);
									downloadElement.click();

							
								}
							}
						}
					});
	
				})
			});

			// Back button event listener on the results page
			$("#sp-back-arrow").click(function(){
				$(".sp-selection-container").css("display", "block");
				$(".sp-results-container").css("display", "none");
			});

			// Log success
			logger("INFO", app.plugins.SelectPlugin.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}