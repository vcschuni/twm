class AdvancedExporter {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "AdvancedExporter";
		this.version = 1.0;
		this.author = "";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Exporter";
		this.tabContentFile = "application/plugins/AdvancedExporter/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent; // jQuery element
		this.addPlugin(); // Initializes the plugin
		this.currentDownload; // the active download
		this.spinner; // let user know we're busy
		this.exportFileName; // to give export a human readable name.
		this.lastSA = 0; // keep last selected SA
	}

	/**
	 * Function: formatBytes
	 * @param (integer,integer) number of bytes, number of decimals to display
	 * @returns () string
	 * Function to prettify bytes into something folks will understand	
	 * courtesy of https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
	*/
	formatBytes(bytes, decimals = 2) {
		if (!+bytes) return '0 Bytes'	
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']	
		const i = Math.floor(Math.log(bytes) / Math.log(k))	
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
	}

	/**
	 * Function: populateExportableLayerSelect
	 * @param () none
	 * @returns () nothing
	 * Function that populates the exportable layers select
	 */
	populateExportableLayerSelect() {
		// Loop thru all of the layers
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			
			// To be included as an exportable layer, it must have an advancedExporter configuration on the layer
			if (layer.get("advancedExporter")) {
					
				// Get the layer id
				var layerId = ol.util.getUid(layer);
				
				// Loop through existing exportable layer select options
				var layerAlreadyAdded = false;
				$("#ae-layer2export-select > option").each(function() {
					// Determine if it has already been added
					if (this.value == layerId) layerAlreadyAdded = true;
				});
				
				// Add layer as exportable if it does not already exist
				if (layerAlreadyAdded == false) {
					$("#ae-layer2export-select").append(new Option(layer.get("title"), layerId));
					
					// If this is the first option, execute variuous other functions
					if ($("#ae-layer2export-select option").length == 1) {
						app.plugins.AdvancedExporter.populateExportTypesSelect(layerId);
						app.plugins.AdvancedExporter.buildFilterForm(layerId);
					}
				}
			}
		});
		
		// Repeat
		setTimeout(function(){
			app.plugins.AdvancedExporter.populateExportableLayerSelect();
		}, 1500);
	}
	
	
	/**
	 * Function: populateExportTypesSelect
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function that populates the export types select
	 */
	populateExportTypesSelect(layerId) {
		// Disable the export Button
		$("#ae-export-btn").prop("disabled", true);
		
		// Empty the select control
		$("#ae-export-type-select").empty();
		
		// Get the layer by it's id
		var layer = getLayerById(layerId);
		
		// Get the layer's advanced exporter config
		var advancedExporterConfig = layer.get("advancedExporter");
		var exportTypes = advancedExporterConfig.types;
		
		// Populate the export types select
		$.each(exportTypes, function(index, exportType) {
			$("#ae-export-type-select").append(new Option(exportType.name, exportType.url));
		});
		$("#ae-export-type-select").on("change",function(e) { // clear out any previous downloads
			$("a#ae-export-link").text("");
			$("#ae-export-status").text("");
		});
		
	}

	/**
	 * Function getCurrentBBOXinProjection
	 * @param (string) EPSG code
	 * @returns (string) a BBOX for the current map extent projected to the specified EPSG
	 * Function to get the current map extent (in bbox format for selected output projection)
	 */
	 getCurrentBBOXinProjection(epsg) {
		var outputProjection = "EPSG:"+epsg;
		var bbox = app.map.getView().calculateExtent(app.map.getSize());
		var outputBbox = ol.proj.transformExtent(bbox, app.map.getView().getProjection().getCode(), outputProjection);	
		return outputBbox.join(",") + "," + outputProjection;
	 }

	
	/** 
	 * Function: validInput
	 * @param (string) user entered text
	 * @returns (boolean) true if no ; found
	 * Function to test user input for suspicious input
	**/	
	validInput(text) {
		if (text.includes("%3B") || text.includes(";")) return false;
		if (text.includes("%3D") || text.includes("=")) return false;
		return true;
	}
	
	/**
	 * Function: buildFilterForm
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function build the filter form based on the layer ID
	 */
	buildFilterForm(layerId) {
		// Get the layer by it's id
		var layer = getLayerById(layerId);
		
		// Get the layer's advanced exporter config
		var advancedExporterConfig = layer.get("advancedExporter");
		var criteria = advancedExporterConfig.criteria;
		
		// Get and clear the filter criteria
		var divCriteria = $(".ae-fs-filter .ae-fs-content");
		divCriteria.empty();
		// Add filter criteria to form
		$.each(criteria, function(index, criterion) {
			switch(criterion.type) {
				case "select":
					var clone = $(".ae-criteria-select-template").clone(true);
					clone.removeClass("ae-criteria-select-template");
					
					clone.attr("id",criterion.label.replaceAll(" ","_"));
					clone.find("select").prop('required',true);
					
					clone.find(".ae-criteria-label").html(criterion.label);
					$.each(criterion.options, function(index, option) {
						clone.find("select").append(new Option(option.name, option.cql));
					});
					clone.find("select").val(app.plugins.AdvancedExporter.lastSA);
					clone.find("select").on("change", function(e) {
						var cql = $(this).find(":selected").val();
						$(this).parent().attr("cql", cql);
						$("a#ae-export-link").text("");
						$("#ae-export-status").text("");
						// They have chosen, so remove any red border
						$(this).css('border','1px solid rgb(206, 212, 218)');
					});
					divCriteria.append(clone);
					clone.show();
					clone.find("select").trigger("change");

					break;
				case "text":
					var clone = $(".ae-criteria-text-template").clone(true);
					clone.removeClass("ae-criteria-text-template");
					clone.find(".ae-criteria-label").html(criterion.label);
					clone.find("input").attr("cql", criterion.cql);
					clone.find("input").attr("placeholder",criterion.placeholder)
					clone.find("input").on("keyup change", function(e) {
						$("a#ae-export-link").text("");
						$("#ae-export-status").text("");
						if ($(this).val() == "") {
							$(this).parent().attr("cql", "");
						} else {
							var userInput = $(this).val(); 	
							if (app.plugins.AdvancedExporter.validInput(userInput)) {
								$(this).css('border-color', '');
								var cql = ($(this).attr("cql")).replace("{{value}}", $(this).val());
								$(this).parent().attr("cql", cql);
								
							} else {
								$(this).css('border-color', 'red');
								$(this).parent().attr("cql", "");
							}
						}
					});
					divCriteria.append(clone);
					clone.show();
					clone.find("input").trigger("change");
					break;
			}
		});
			
		// Enable the export Button
		$("#ae-export-btn").prop("disabled", false);
		$("#Service_Area").find(".custom-select").val(app.plugins.AdvancedExporter.lastSA); // keep last selected SA

	}
	
	/**
	* Function handleEvent
	* @param (event) e
	* @returns () nothing
	* Function to inform user of download progress
	*/
	handleEvent(e) {
		$("#ae-export-status").text($("#ae-export-status").text()+'.');
	}
	
	/**
	* Function downloadComplete
	* @param (event) e
	* @returns () nothing
	* Function to create link to download and inform user	
	*/
	downloadComplete(e) {
		$("#ae-export-status").text("");
		var contentType = app.plugins.AdvancedExporter.currentDownload.getResponseHeader("content-type");
		var contentLength = app.plugins.AdvancedExporter.currentDownload.getResponseHeader("content-length");
		//Create link to download
		try {
			var blob = new Blob([app.plugins.AdvancedExporter.currentDownload.responseText], {type: contentType});
			var objectUrl = URL.createObjectURL(blob);
			var downloadSize = app.plugins.AdvancedExporter.formatBytes(blob.size,2);
			if (contentType == "application/vnd.google-earth.kml+xml" || contentType == "text/csv;charset=UTF-8") { // it worked
				app.plugins.AdvancedExporter.exportFileName = $("#ae-layer2export-select option:selected" ).text();
				app.plugins.AdvancedExporter.exportFileName += contentType.includes("kml")?".kml":".csv"
				$("#ae-export-status").text("Download size: "+downloadSize);
				$("a#ae-export-link").text("Open");
				$("a#ae-export-link").attr("href",objectUrl);	
				$("a#ae-export-link").attr("download",app.plugins.AdvancedExporter.exportFileName);	
				
			} else { // didn't work, most likely because of KML export difficulties
				$("#ae-export-btn").effect( "bounce", { times: 3 }, "slow" );
				if (!$("#ae-intructions-panel").hasClass("show")) $("#ae-intructions-panel").addClass("show");
				$("#ae-export-status").text("Download Failed ☹️");
			}
		} catch (exc) {
			logger("ERROR", app.plugins.AdvancedExporter.name + "Save Blob method failed: " + exc);
		} finally {
			$("#ae-export-btn").prop("disabled", false); // ready for the next download
			app.plugins.AdvancedExporter.spinner.stop()
		}
	}

	
	/**
	 * Function addListeners
	 * @param (XMLHttpRequest) xhr
	 * @returns () nothing
	 * Function to listen for downloading events
	 */	
	addListeners(xhr) {
		xhr.addEventListener('loadstart', app.plugins.AdvancedExporter.handleEvent);
		xhr.addEventListener('load', app.plugins.AdvancedExporter.handleEvent);
		xhr.addEventListener('loadend', app.plugins.AdvancedExporter.downloadComplete);
		xhr.addEventListener('progress', app.plugins.AdvancedExporter.handleEvent);
		xhr.addEventListener('error', app.plugins.AdvancedExporter.handleEvent);
		xhr.addEventListener('abort', app.plugins.AdvancedExporter.handleEvent);
	}
	
	/**
	 * Function newDownloadFile
	 * @param (string) url
	 * @returns () nothing
	 *Function to download data from MoTT geoserver
	 */
	newDownloadFile(url) {	
		const xhr = new XMLHttpRequest();
		app.plugins.AdvancedExporter.addListeners(xhr);
		xhr.open("GET", url);
		xhr.send();
		return xhr;
	}

	/**
	 * Function: export
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function to export the data based on user input
	 */
	export() {
		// Clear any previous download info
		$("#ae-export-btn").prop("disabled", true);
		$("#ae-export-status").text("Downloading.");
		$("a#ae-export-link").text("");
		$("a#ae-export-link").attr("href","");

		var finalCql = "";
		app.plugins.AdvancedExporter.spinner = new Spinner(app.spinnerOptionsMedium).spin($("#ae-export-btn")[0]);
		
		// Loop thru the criteria
		$.each($(".ae-fs-filter .ae-fs-content").children(), function(index, criterionEl) {
			if ($(criterionEl).attr("cql") != "") {
				if ((finalCql != "") && ( $(criterionEl).attr("cql"))) {
					  finalCql += " AND ";
				}
				if ($(criterionEl).attr("cql")) finalCql += $(criterionEl).attr("cql");
			}
		});	
		
		// Get the url from the selected type
		var selectedExportUrl = $("#ae-export-type-select option:selected").val();
		
		// WMS KML is fraught with issues, warn the user that map zoomed to selected SA
		if (selectedExportUrl.includes("earth.kml")) {
			selectedExportUrl += app.plugins.AdvancedExporter.getCurrentBBOXinProjection("4326");
		}
		
		// Build the full export url
		var fullExportUrl = selectedExportUrl;
		if (finalCql != "") {
			fullExportUrl = updateUrlParameter(selectedExportUrl, "cql_filter", finalCql);
		}
		// Request the file
		app.plugins.AdvancedExporter.currentDownload = app.plugins.AdvancedExporter.newDownloadFile(fullExportUrl);
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
				logger("ERROR", app.plugins.AdvancedExporter.name + ": Plugin failed to initialize");
				return;
			}
			
			// Empty the exportable layers select control and populate it with exportable layers
			$("#ae-layer2export-select").empty();
			app.plugins.AdvancedExporter.populateExportableLayerSelect();
			
			// Register the exportable layers on change listener
			$("#ae-layer2export-select").on("change", function(){
				app.plugins.AdvancedExporter.lastSA = $("#Service_Area").find(".custom-select").val();
				var selectedLayerId = $("#ae-layer2export-select option:selected").val();
				app.plugins.AdvancedExporter.populateExportTypesSelect(selectedLayerId);
				app.plugins.AdvancedExporter.buildFilterForm(selectedLayerId);
				$("#Service_Area").find(".custom-select").val(app.plugins.AdvancedExporter.lastSA);	 // keep last selected SA
			});
			
			// Registed the export button click handler
			$("#ae-export-btn").click(function() {
				// Make Service Area selection Mandatory
				if ($("#Service_Area").attr("cql").length == 0) {
					//highlight
					$("#Service_Area").find(".custom-select").css("border","2px solid rgb(255,0,0)");
					$("#Service_Area").find(".custom-select").effect( "bounce", { times: 3 }, "slow" );
					return;
				} else {
					$("#Service_Area").find(".custom-select").css('border','1px solid rgb(206, 212, 218)');
				}
				app.plugins.AdvancedExporter.export();
			});
			
			// Log success
			logger("INFO", app.plugins.AdvancedExporter.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}