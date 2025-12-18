class Filter {
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "Filter";
		this.version = 1.0;
		this.author = "Stephen Schmuland";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = this.pcfg.tabName ? this.pcfg.tabName : "Reports";
		this.tabContentFile = "application/plugins/Filter/tab-content.html";
		this.intervalProcessId;
		this.featureStore = [];
		this.chartSummaryFields = [];
		this.selectedLayer;
		this.addPlugin();
	}

	generateFiltersForLayer(selectedLayerTitle) {
		this.chartSummaryFields = [];
		const filtersContainer = $("#lr-filters-container");
		filtersContainer.empty();

		 // Set the layer title in the legend
		$("#lr-filter-layer-title").text(selectedLayerTitle+" Filter");

		 // Assign selectedLayerTitle to the global variable
		this.selectedLayer = selectedLayerTitle;

		// Find the selected layer
		const selectedLayer = app.map.getLayers().getArray().find(layer => layer.get("title") === selectedLayerTitle);
		if (!selectedLayer) return;

		// Collect filterable fields for the selected layer
		const filterableFields = [];
		const layerFields = selectedLayer.get('fields');
		if (!layerFields) return;

		layerFields.forEach(field => {
			if (field.filterable) {
				filterableFields.push({
					layer: selectedLayer,
					field,
					filterOptions: field.filterOptions
				});
			}
			if (field.filterOptions && field.filterOptions.chartSummarize) {

				var chartSummaryObj = {
					"name": field.name,
					"nameTransform": field.nameTransform ? field.nameTransform() : field.name

				}
				this.chartSummaryFields.push(chartSummaryObj);

				
			}
		});

		// Sort filterable fields by order
		filterableFields.sort((a, b) => a.filterOptions.order - b.filterOptions.order);

		// Generate filter HTML for each filterable field
		filterableFields.forEach(({ field, filterOptions }) => {
			let filterHtml = "";
			const filterType = filterOptions.filterType;

			switch (filterType) {
				case "date-range":
					filterHtml = `
						<div class="mb-2">
							<label>${field.nameTransform ? field.nameTransform() : field.name}</label>
							<div class="d-flex align-items-center">
								<div class="me-2">
									<label for="filter-${field.name}-start" class="form-label">Start Date</label>
									<input type="date" class="form-control" id="filter-${field.name}-start" placeholder="Start Date">
								</div>
								<div>
									<label for="filter-${field.name}-end" class="form-label">End Date</label>
									<input type="date" class="form-control" id="filter-${field.name}-end" placeholder="End Date">
								</div>
							</div>
						</div>
					`;
					break;
				case "dropdown":
					let options = field.valueOptions || [];
					if (!options.length) {
						const uniqueValues = new Set();
						selectedLayer.getSource().getFeatures().forEach(feature => {
							const value = feature.get(field.name);
							if (value !== null && value !== undefined) {
								uniqueValues.add(value);
							}
						});
						options = Array.from(uniqueValues);
					}
					const optionsHtml = options.map(option => `<option value="${option}">${option}</option>`).join("");
					filterHtml = `
						<div class="mb-2">
							<label>${field.nameTransform ? field.nameTransform() : field.name}</label>
							<select class="form-select" id="filter-${field.name}">
								${optionsHtml}
							</select>
						</div>
					`;
					break;
				case "multiselect":
					let multiOptions = field.valueOptions || [];
					if (!multiOptions.length) {
						const uniqueValues = new Set();
						selectedLayer.getSource().getFeatures().forEach(feature => {
							const value = feature.get(field.name);
							if (value !== null && value !== undefined) {
								uniqueValues.add(value);
							}
						});
						multiOptions = Array.from(uniqueValues);
					}
					const multiOptionsHtml = multiOptions.map(option => `<option value="${option}">${option}</option>`).join("");
					filterHtml = `
						<div class="mb-2">
							<label>${field.nameTransform ? field.nameTransform() : field.name}</label>
							<select class="form-select" id="filter-${field.name}" multiple>
								${multiOptionsHtml}
							</select>
						</div>
					`;
					break;
				case "text":
					filterHtml = `
						<div class="mb-2">
							<label>${field.nameTransform ? field.nameTransform() : field.name}</label>
							<input type="text" class="form-control" id="filter-${field.name}" placeholder="${field.name}">
						</div>
					`;
					break;
			}

			filtersContainer.append(filterHtml);
		});

		$(".lr-fs-filters").show();
	}

	generateFilters() {
		const layerDropdown = $("#filter-options");
		layerDropdown.empty(); // Clear existing options
		const filterableLayers = app.map.getLayers().getArray().filter(layer => layer.get("filterable"));

		// Populate the dropdown with layer titles
		filterableLayers.forEach(layer => {
			const layerTitle = layer.get("title");
			layerDropdown.append(`<option value="${layerTitle}">${layerTitle}</option>`);
		});

		// Show dropdown only if more than one filterable layer exists
		if (filterableLayers.length > 1) {
			$("#filter-options").parent().show();
		} else {
			$("#filter-options").parent().hide();
		}

		// Generate filters for the first layer by default
		if (filterableLayers.length > 0) {
			this.generateFiltersForLayer(filterableLayers[0].get("title"));
		}

		// Handle dropdown change event
		layerDropdown.on("change", () => {
			const selectedLayerTitle = layerDropdown.val();
			this.generateFiltersForLayer(selectedLayerTitle);
		});
	}

	applyFilters() {
		const filters = {};
		const selectedLayerTitle = $("#filter-options").val();

		// Find the selected layer
		const selectedLayer = app.map.getLayers().getArray().find(layer => layer.get("title") === selectedLayerTitle);
		if (!selectedLayer) return;

		// Collect filters for the selected layer
		const layerFields = selectedLayer.get('fields');
		if (!layerFields) return;

		layerFields.forEach(field => {
			if (field.filterable) {
				switch (field.filterOptions.filterType) {
					case "date-range":
						const startDate = $(`#filter-${field.name}-start`).val();
						const endDate = $(`#filter-${field.name}-end`).val();
						if (startDate || endDate) {
							filters[field.name] = { start: startDate, end: endDate };
						}
						break;
					case "dropdown":
						const dropdownValue = $(`#filter-${field.name}`).val();
						if (dropdownValue) {
							filters[field.name] = dropdownValue;
						}
						break;
					case "multiselect":
						const multiSelectValues = $(`#filter-${field.name}`).val();
						if (multiSelectValues && multiSelectValues.length > 0) {
							filters[field.name] = multiSelectValues;
						}
						break;
					case "text":
						const textValue = $(`#filter-${field.name}`).val();
						if (textValue) {
							filters[field.name] = textValue;
						}
						break;
				}
			}
		});

		// Apply filters to the selected layer
		const source = selectedLayer.getSource();
		if (source instanceof ol.source.Vector) {
			source.getFeatures().forEach(feature => {
				let visible = true;
				for (const [field, filter] of Object.entries(filters)) {
					const value = feature.get(field);
					if (filter.start && filter.end) {
						const dateValue = new Date(value).getTime();
						const startDate = new Date(filter.start).getTime();
						const endDate = new Date(filter.end).getTime();
						if (dateValue < startDate || dateValue > endDate) {
							visible = false;
							break;
						}
					} else if (Array.isArray(filter)) {
						if (!filter.includes(value)) {
							visible = false;
							break;
						}
					} else if (typeof filter === 'string') {
						if (value != filter) {
							visible = false;
							break;
						}
					}
				}
				feature.setStyle(visible ? null : new ol.style.Style({}));
			});
		}
	}

	clearFilters() {
		// Clear all filter inputs
		$("#lr-filters-container input").val('');
		$("#lr-filters-container select").val('');

		// Reset all features to be visible
		app.map.getLayers().getArray().forEach(layer => {
			const source = layer.getSource();
			if (source instanceof ol.source.Vector) {
				source.getFeatures().forEach(feature => {
					feature.setStyle(null);
				});
			}
		});
	}
	
	/**
	 * Function: createChart
	 * @param () none
	 * @returns () nothing
	 * Function that creaters a chart based on the data being presented in the filter
	 */
	createChart() {
		var filteredData = [];
		 // Clear filteredData
		filteredData = [];

		var chartName = this.selectedLayer+" Chart"
		// Collect filtered data
		app.map.getLayers().getArray().forEach(layer => {
			if (layer.get("filterable")) {
				if(layer.get("title") ==this.selectedLayer){
					
				
					const source = layer.getSource();
					if (source instanceof ol.source.Vector) {
						source.getFeatures().forEach(feature => {
							// Include only visible features (filtered features)
							if (feature.getStyle() === null) {
								filteredData.push(feature.getProperties());
							}
						});
					}
				}
			}
		});

		 // Find the matching chart window
		const matchingChartWindow = $(".mfw-window").filter((_, element) => {
			const title = $(element).find(".mfw-title").text();
			return title === chartName;
		});

		// Get value for chart-summarize-select if visible within the matching chart window
		let summarizeOptionDefault = null;
		if (matchingChartWindow.length > 0) {
			const summarizeSelect = matchingChartWindow.find(".form-select.form-select-sm.chart-summarize-select");
			if (summarizeSelect.is(":visible")) {
				summarizeOptionDefault = summarizeSelect.val();
			}
		}

		// Pass the data to the chart plugin
		app.plugins.ChartPlugin.open(chartName, null, filteredData, null, 600, 600, "right", this.chartSummaryFields, summarizeOptionDefault);
	}
	
	getCanvasIdForSelectedLayer() {
		const matchingDiv = $(".mfw-window").filter((_, element) => {
			const title = $(element).find(".mfw-title").text();
			return title.includes(this.selectedLayer);
		});
		if (matchingDiv.length > 0) {
			return matchingDiv.find(".chart-canvas").attr("id");
		}
		return null;
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin
	 */
	addPlugin() {
		// Define Callback
		var callback = (success, tabNav, tabContent) => {
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.Filter.name + ": Plugin failed to initialize");
				return;
			}

			// Set class variables
			app.plugins.Filter.tabNav = tabNav;
			app.plugins.Filter.tabContent = tabContent;

			// Generate filters based on configuration
			this.generateFilters();

			// Register the apply filters button click event
			$("#lr-apply-filters-btn").on("click", () => {
				this.applyFilters();
				const canvasId = this.getCanvasIdForSelectedLayer();
				if (canvasId) {
					$(`#${canvasId}`).remove();
					app.plugins.Filter.createChart()
				}
			});

			// Register the clear filters button click event
			$("#lr-clear-filters-btn").on("click", () => {
				this.clearFilters();
				const canvasId = this.getCanvasIdForSelectedLayer();
				if (canvasId) {
					$(`#${canvasId}`).remove();
					app.plugins.Filter.createChart()
				}
			});

			// Register the create chart button click event
			$("#lr-create-chart-btn").on("click", () => {
				
				const canvasId = this.getCanvasIdForSelectedLayer();
				if (canvasId) {
					$(`#${canvasId}`).remove();
					app.plugins.Filter.createChart()
					
				}else{
					this.createChart();
				}
				
				
			});

			// Clear filters on app load
			this.clearFilters();

			// Log success
			logger("INFO", app.plugins.Filter.name + ": Plugin successfully loaded");
		};

		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}