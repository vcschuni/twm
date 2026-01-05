class LayerFilter {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "LayerFilter";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Layer Filter";
		this.tabContentFile = "application/plugins/LayerFilter/tab-content.html";
		this.filterLayer;
		this.deferFilterApplications = true;
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.addPlugin();
	}
	
	/**
	 * Function: addFilterableLayersToSelectControl
	 * @param () none
	 * @returns () nothing
	 * Function to add layers configured to filterable to the layer filter select control
	 */
	addFilterableLayersToSelectControl() {
		// Empty the layer select control
		$("#lf-filter-layer-select").empty();
		
		// Loop through all of the map layers looking for ones that are configured for filtering
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			// Get the layer ID
			var layerId = ol.util.getUid(layer);
			
			// Determine if its configured for filtering
			var addAsFilterLayer = false;
			var fields = layer.get("fields");
			if (fields) {
				$.each(fields, function(index2, field) {
					if (field.filters) {
						if (field.filters.length > 0) addAsFilterLayer = true;
					}
				});
			}

			// Add as filter layer if configured
			if (addAsFilterLayer === true) {
				$("#lf-filter-layer-select").prepend(new Option(layer.get("title"), layerId));
			}
		});
		
		// Register select change handler
		$("#lf-filter-layer-select").on("change", function(e){
			// Defer filter applications
			app.plugins.LayerFilter.deferFilterApplications = true;
			
			// Build filter controls
			var selectedLayerId = $("#lf-filter-layer-select option:selected").val();
			app.plugins.LayerFilter.addFilterControls(selectedLayerId);
		});

		// Only show layer select control if more than one layer
		if ($("#lf-filter-layer-select option").length > 1) $("#lf-filter-layer-select-container").show();
		
		// Set selection to first option and trigger change
		$("#lf-filter-layer-select").val($("#lf-filter-layer-select option:first").val());
		$("#lf-filter-layer-select").trigger("change");
	}
	
	/**
	 * Function: addFilterControls
	 * @param (int) layerId
	 * @returns () nothing
	 * Function to filter controls specific to the layer
	 */
	addFilterControls(layerId) {
		// Remove existing filters and hide fieldset
		$("#lf-filter-controls").empty();
		$("#lf-fs-filter-controls").hide();
		
		// Get the filter layer
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				app.plugins.LayerFilter.filterLayer = layer;
			}
		});
		
		// Bail if not found
		if (!app.plugins.LayerFilter.filterLayer) return;
		
		// Loop through all of the configured layer fields
		var fields = app.plugins.LayerFilter.filterLayer.get("fields");
		$.each(fields, function(fieldIndex, field) {
			
			// If filters are present, build the filter controls
			if (field.filters) {

				// Loop through the filters defined for this field
				$.each(field.filters, function(index, filter) {
					
					// Only build the filter control if configured correctly
					if (filter.name && filter.type && filter.cql) {
					
						// Define the control
						var control;

						// Build the control specific to field filter type
						switch (filter.type) {
							
							// Checkbox Type
							case "boolean":
								// Get the control template, clone it, and set some basic properties
								control = $(".lf-checkbox-template").clone(true);
								control.removeClass("lf-checkbox-template");
								control.find(".title").html(filter.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").change(function(){
									if (this.checked === true) {
										var cql = filter.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", 1);
										control.attr("userFilter", cql);
									} else {
										control.attr("userFilter", null);
									}
									
									// Remember user input and apply filter
									filter.lastValue = $(this).is(':checked');
									app.plugins.LayerFilter.applyFilter();
								});
								
								// Apply remembered state (if any) and trigger change event
								if ("lastValue" in filter) control.find("input").prop("checked", filter.lastValue);
								control.find("input").trigger("change");
								break;
							
							// Textfield Type
							case "string":
								// Get the control template, clone it, and set some basic properties
								control = $(".lf-textfield-template").clone(true);
								control.removeClass("lf-textfield-template");
								control.find(".input-group-text").html(filter.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").keyup(function(){
									if ($(this).val() != "") {
										var cql = filter.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", $(this).val());
										control.attr("userFilter", cql);
									} else {
										control.attr("userFilter", null);
									}
									
									// Remember user input and apply filter
									filter.lastValue = $(this).val();
									app.plugins.LayerFilter.applyFilter();
								});
								
								// Apply remembered state (if any) and trigger keyup event
								if ("lastValue" in filter) control.find("input").val(filter.lastValue);
								control.find("input").trigger("keyup");
								break;
							
							// Numberfield Type
							case "number":
								// Get the control template, clone it, and set some basic properties
								control = $(".lf-numberfield-template").clone(true);
								control.removeClass("lf-numberfield-template");
								control.find(".input-group-text").html(filter.name);
								control.attr("fieldName", field.name);
								
								// Define the control's change function
								control.find("input").keyup(function(){
									if ($(this).val() != "") {
										var cql = filter.cql;
										cql = cql.replace("{{field}}", field.name);
										cql = cql.replace("{{value}}", $(this).val());
										control.attr("userFilter", cql);
									} else {
										control.attr("userFilter", null);
									}
									
									// Remember user input and apply filter
									filter.lastValue = $(this).val();
									app.plugins.LayerFilter.applyFilter();
								});
								
								// Apply remembered state (if any) and trigger keyup event
								if ("lastValue" in filter) control.find("input").val(filter.lastValue);
								control.find("input").trigger("keyup");
								break;
						}
						
						// If a control was built, add it to the UX
						if (control) {
							$("#lf-filter-controls").append(control);
							control.show();
						}
						
					}
				});
			}
		});
		
		// Resume filter applications
		app.plugins.LayerFilter.deferFilterApplications = false;
		
		// Apply filter
		app.plugins.LayerFilter.applyFilter();
				
		// Show the filter fieldset
		$("#lf-fs-filter-controls").show();	
	}
	
	/**
	 * Function: applyFilter
	 * @param () none
	 * @returns () nothing
	 * Function that applies a filter
	 */
	applyFilter() {
		// Bail if the application is set to defer filter (used so form can be built before calling the applyFilter function)
		if (app.plugins.LayerFilter.deferFilterApplications === true) return;
		
		// Define the search layer url (modify to point to WFS if required)
		if (app.plugins.LayerFilter.filterLayer.getSource() instanceof ol.source.TileWMS) {
			var searchUrl = app.plugins.LayerFilter.filterLayer.getSource().getUrls()[0]; // TileWMS
		} else if (app.plugins.LayerFilter.filterLayer.getSource() instanceof ol.source.ImageWMS) {
			var searchUrl = app.plugins.LayerFilter.filterLayer.getSource().getUrl(); // ImageWMS
		} else {
			logger("WARN", app.plugins.LayerFilter.name + ": Could not determine search url for layer " + app.plugins.LayerFilter.filterLayer.get("title"));
			return;
		}
		var searchUrl = searchUrl.replace(new RegExp("/ows", "ig"), "/wfs");
			
		// Define the search layer name
		var searchLayerName;
		$.each(app.plugins.LayerFilter.filterLayer.getSource().getParams(), function(parameterName, parameterValue) {
			if (parameterName.toUpperCase() == "LAYERS") searchLayerName = parameterValue;
		});
		
		// Define and build the CQL Filter object (grouped by field name)
		var cqlFilterObject = new Object();
		$("#lf-filter-controls").find(".lf-filter-control").each(function() {
			var fieldName = $(this).attr("fieldName");
			var userFilter = $(this).attr("userFilter");
			if (fieldName && userFilter) {
				if (!cqlFilterObject[fieldName]) cqlFilterObject[fieldName] = [];
				cqlFilterObject[fieldName].push(userFilter);
			}
		});
		
		// Convert CQL filter object (which is already grouped) into a CQL filter array
		var cqlFilterArray = [];
		$.each(cqlFilterObject, function(fieldName, userFilters) {
			cqlFilterArray.push("(" + userFilters.join(" OR ") + ")");
		});
		
		// Convert CQL filter array into a string
		var cqlFilter;
		if (cqlFilterArray.length > 0) {
			cqlFilter = cqlFilterArray.join(" AND ");
		} 

		// Apply the CQL filter to the layer
		setCqlFilter(app.plugins.LayerFilter.filterLayer, app.plugins.LayerFilter.name, cqlFilter);
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
				logger("ERROR", app.plugins.LayerFilter.name + ": Plugin failed to initialize");
				return;
			}
			
			// Set class variables
			app.plugins.LayerFilter.tabNav = tabNav;
			app.plugins.LayerFilter.tabContent = tabContent;
			
			// Add filterable layers to filter layer selector
			app.plugins.LayerFilter.addFilterableLayersToSelectControl();
				
			// Log success
			logger("INFO", app.plugins.LayerFilter.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}