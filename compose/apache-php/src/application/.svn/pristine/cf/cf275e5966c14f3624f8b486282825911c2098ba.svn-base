class LayerController {

	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "LayerController";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Layers";
		this.tabContentFile = "application/plugins/LayerController/tab-content.html";
		this.layerEditorContentFile = "application/plugins/LayerController/layer-editor.html"
		this.layerDownloaderContentFile = "application/plugins/LayerController/downloader.html"
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.searchTimer;
		this.getCapabilitiesCache = [];
		this.addableLayerStore = [];
		this.maxCacheAttempts = 2;
		this.searchForLayersIsWorking = false;
		this.groups = new Set(); // Used to store the groups and keep track of which groups have been added to the sidebar
		this.showLayerGrouping = false; // Used to determine if overlay layer grouping should be shown
		this.addPlugin();
	}

	/**
	 * Function getISOdateString
	 * @param (d) Date
	 * @returns (string) string version of date
	 * Function formats date into YYYY-MM-DD 2021-10-13T18:39:08Z
	 */
	 getISOdateString(d) {
		let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
		let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
		let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
		return `${ye}-${mo}-${da}`;
	}

	/**
	 * Function: cacheGetCapabilities
	 * @param () none
	 * @returns () nothing
	 * Function that caches the 
	 */
	cacheGetCapabilities() {
		// Show spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($("#lc-addable-layers-ig")[0]);

		// Setup misc variables
		var additionalSourceCompleteCounter = 0;

		// Define aggregator function
		var aggregator = function (source, gcJson) {
			// Increment the counter
			additionalSourceCompleteCounter++;

			// Add capabilites result to runtime array
			if (gcJson) app.plugins.LayerController.getCapabilitiesCache[source.url] = gcJson;

			// Add timestamped result to local storage (if available)
			if (gcJson && lsIsAvailable) lsStoreItem("lc-gc-cache-" + md5(source.url), { timestamp: Date.now(), data: gcJson });

			// Show all of the layers and kill spinner if done
			if (additionalSourceCompleteCounter >= app.plugins.LayerController.pcfg.additionalSources.length) {
				app.plugins.LayerController.searchForLayers(null);
				spinner.stop();
			}
		}

		// Loop through the configured sources
		$.each(app.plugins.LayerController.pcfg.additionalSources, function (index, source) {

			// Used recent cached local storage version (if available) to populate runtime array (i.e. less than 48 hours old
			if (lsIsAvailable) {
				var cachedCapability = lsRetrieveObject("lc-gc-cache-" + md5(source.url));
				if (cachedCapability) {
					var cacheAge = Date.now() - cachedCapability.timestamp;
					if (cacheAge < 1000 * 60 * 60 * 48) {
						logger("INFO", app.plugins.LayerController.name + ": Using cached GetCapabilities version of " + source.url + " (" + convertDuration(cacheAge) + " old)");
						aggregator(source, cachedCapability.data);
					}
				}
			}

			// Only perform the GetCapabilities request if it does not already exist
			if (typeof app.plugins.LayerController.getCapabilitiesCache[source.url] === "undefined") {
				// Issue GetCapabilities request
				$.ajax({
					type: "GET",
					data: {
						SERVICE: "WMS",
						VERSION: "1.3.0",
						REQUEST: "GetCapabilities"
					},
					dataType: "xml",
					url: source.url,
					timeout: 20000,
					xhrFields: {
						withCredentials: (source.withCredentials) ? source.withCredentials : false
					},
					beforeSend: function(jqXHR, settings) {
						//settings.url = "data/proxy.php?src=" + Base64.encode(settings.url);
					}
				})

				// Handle success
				.done(function (xml) {
					var parser = new ol.format.WMSCapabilities();
					var gcJson = parser.read(xml);
					if (gcJson.Capability) {
						logger("INFO", app.plugins.LayerController.name + ": Retrieved live GetCapabilities version of " + source.url);
						aggregator(source, gcJson);
					} else {
						aggregator(source, null);
					}
				})

				// Handle failure
				.fail(function (jqXHR, textStatus) {
					logger("ERROR", app.plugins.LayerController.name + ": Error getting GetCapabilities from " + source.url + " " + textStatus);
					aggregator(source, null);
				});
			}
		});
	}

	/**
	 * Function: toggleLayerVisibility
	 * @param (sting) visible (true/false)
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that toggles a layer's visibility
	 */
	toggleLayerVisibility(visible, layerId) {
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (layer.get("type") != "base") {
				if (ol.util.getUid(layer) == layerId) {
					layer.setVisible(visible);
					rememberState();
				}
			}
		});
		app.plugins.LayerController.showLayerStatus(layerId);
	}

	/**
	 * Function: switchBaseMap
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that switches which basemap is turned on
	 */
	switchBaseMap(layerId) {
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (layer.get("type") == "base") {
				if (ol.util.getUid(layer) == layerId) {
					layer.setVisible(true);
				} else {
					layer.setVisible(false);
				}
				rememberState();
			}
		});
	}

	/**
	 * Function: showOverlayLegend
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that shows/hides overlay legend
	 */
	showOverlayLegend(layerId) {
		if ($("#lc-legend-div-" + layerId).css("display") == "none") {
			app.plugins.LayerController.refreshOverlayLegend(layerId);
			$("#lc-legend-div-" + layerId).show();
		} else {
			$("#lc-legend-div-" + layerId).hide();
		}
	}

	/**
	 * Function: refreshOverlayLegend
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that refreshes the overlay legend
	 */
	refreshOverlayLegend(layerId) {
		// Get the referenced layer
		var subjectLayer;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				subjectLayer = layer;
			}
		});

		// If the layer config has a valid "legendImageUrl" property, use it.  Otherwise, default to a GetLegendGraphic request
		var legendUrl;
		if (subjectLayer.get("legendImageUrl")) {
			legendUrl = subjectLayer.get("legendImageUrl");
		} else {
			var layerStyle = "";
			if (typeof subjectLayer.getSource().getParams === "function") {
				if (subjectLayer.getSource().getParams().STYLES) layerStyle = subjectLayer.getSource().getParams().STYLES;
				legendUrl = subjectLayer.getSource().getLegendUrl(
					app.map.getView().getResolution(),
					{ legend_options: "fontName:Arial;fontAntiAliasing:true;fontColor:0x000033;fontSize:7;dpi:140", style: layerStyle }
				);
			}
		}

		// Set the image source
		if (legendUrl) {
			$("#lc-legend-div-" + layerId + " img").attr("src", legendUrl);
			// Refresh the layer
			subjectLayer.getSource().refresh();
		} else {
			var layer = app.map.getLayers().getArray().filter(function (layer) { return ol.util.getUid(layer) == layerId; })[0];
			if(layer.get("wmsLegend")){
				var layer = app.map.getLayers().getArray().filter(function (layer) { return ol.util.getUid(layer) == layerId; })[0];
				var layerName = layer.getSource().layerName;
				var layerNameSpace =  layer.getSource().layerNamespace;
				// Construct the GeoServer WMS call for the layer on line 223
				var environment = returnEnvironment();
				var legendUrl = "https://"+environment+"-motigeo.th.gov.bc.ca/ogs-internal/ows";
				var params = {
					service: "WMS",
					request: "GetLegendGraphic",
					scale: app.map.getView().getResolution(), // Dynamically get the scale
					FORMAT: "image/png",
					layer: layerNameSpace+":"+layerName // Replace with the appropriate layer name
				};

				// Build the full URL with query parameters
				var fullLegendUrl = legendUrl + "?" + $.param(params);
				
				$.ajax({
					url: fullLegendUrl,
					type: 'HEAD',
					success: function () {
						// If the URL is valid, set the legend image
						$("#lc-legend-div-" + layerId + " img").attr("src", fullLegendUrl);
					},
					error: function () {
						// Log the error and set the fallback image
						console.error("Error accessing legend URL. Falling back to default image.");
						$("#lc-legend-div-" + layerId + " img").attr("src", "application/img/no-legend-available.png");
					}
				});
			}else{
				$("#lc-legend-div-" + layerId + " img").attr("src", "application/img/no-legend-available.png");

			}





		
			
		}

		// Reset layer statistics
		resetLayerStatistics(subjectLayer);
	}
	
	/**
	 * Function: refreshLayer
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that refreshes the layer
	 */
	refreshLayer(layerId) {
		// Get the referenced layer
		var subjectLayer;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				subjectLayer = layer;
			}
		});

		// Bail if preventRefresh is on
		if (subjectLayer.get("preventRefresh")) return;

		// Refresh the layer
		if (subjectLayer.getSource() instanceof ol.source.Cluster) {
			subjectLayer.getSource().getSource().refresh();
		} else {
			subjectLayer.getSource().refresh();
		}
	}

	/**
	 * Function: viewLayerMetadata
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that opens the layer metadata in a new browser tab
	 */
	viewLayerMetadata(layerId) {
		// Get the referenced layer
		var subjectLayer;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				subjectLayer = layer;
			}
		});

		// Open each metadata record in a new browser tab
		var content = "";
		if (subjectLayer && subjectLayer.get("metadataUrls")) {
			$.each(subjectLayer.get("metadataUrls"), function (i, mdUrl) {
				content += "<a href='" + mdUrl.OnlineResource + "' target='_blank'>" + mdUrl.OnlineResource + "</a><br>";
			});
		}

		// Report results
		if (content == "") {
			content = "<p class='text-center'>There is no metadata available for this layer<br></p>";
		}
		bootbox.dialog({
			title: "MetaData Links",
			message: content,
			closeButton: true,
			centerVertical: true
		});
	}

	/**
	 * Function: openModifyOverlayDialog
	 * @param (integer) layerId (ol_uid)
	 * @returns () nothing
	 * Function that opens a dialog to allow user to make modifications to the layer
	 */
	openModifyOverlayDialog(layerId) {
		// Get the referenced layer
		var subjectLayer;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				subjectLayer = layer;
			}
		});

		// Get layer details
		var title = subjectLayer.get("title");
		var opacity = subjectLayer.get("opacity");

		// Load the form
		$.ajax({
			type: "GET",
			url: app.plugins.LayerController.layerEditorContentFile
		}).done(function (response) {
			// Get the form from the response
			var lForm = $(response);

			// Setup the layer opacity control
			lForm.find("#lc-overlay-transparency").val((1 - opacity));

			// Setup the layer filter control (WMS only)
			if (subjectLayer.get("attributes")) {
				$.each(subjectLayer.get("attributes"), function (index, attribute) {
					// Define default field display name and whether to show it
					var fieldName = attribute.name;
					var showField = false;

					// If this layer has configured fields, respect their field name transforms and visibility
					if (subjectLayer.get("fields")) {
						$.each(subjectLayer.get("fields"), function (index2, configuredField) {
							if (configuredField.name == attribute.name) {
								if (typeof configuredField.nameTransform === "function") {
									if (configuredField.nameTransform() !== false) fieldName = configuredField.nameTransform();
									showField = true;
								}
								if (configuredField.appendToField) {
									fieldName = attribute.name;
									showField = true;
								}
								// Setup the layer time filter if configured
								if ((typeof configuredField.timeFilterStart != "undefined") && (typeof configuredField.timeFilterEnd != "undefined"))  {
									subjectLayer.set("dateColumn",configuredField.name);
									lForm.find("#lc-overlay-time-filter").slider({
											range: true,
											min: new Date(configuredField.timeFilterStart).getTime()/1000,
											max: new Date(configuredField.timeFilterEnd).getTime()/1000,
											values: [ subjectLayer.get("minDate") ? new Date(subjectLayer.get("minDate")).getTime()/1000 :  new Date(configuredField.timeFilterStart).getTime()/1000, subjectLayer.get("maxDate") ? new Date(subjectLayer.get("maxDate")).getTime()/1000 :  new Date(configuredField.timeFilterEnd).getTime()/1000, ],
											slide: function( event, ui ) {
												lForm.find("#lc-overlay-time-filter-column").text(fieldName + ": " + (new Date(ui.values[ 0 ] *1000).toDateString().substr(4, 15) ) + " to " + (new Date(ui.values[ 1 ] *1000)).toDateString().substr(4, 15) );
												subjectLayer.set( "minDate",app.plugins.LayerController.getISOdateString(new Date(ui.values[ 0 ] *1000)) );
												subjectLayer.set( "maxDate",app.plugins.LayerController.getISOdateString(new Date(ui.values[ 1 ] *1000)) );
											}
									});
									var startDate = (subjectLayer.get("minDate")) ? new Date(subjectLayer.get("minDate")).toDateString().substr(4, 15) : new Date(configuredField.timeFilterStart).toDateString().substr(4, 15);
									var endDate = (subjectLayer.get("maxDate")) ? new Date(subjectLayer.get("maxDate")).toDateString().substr(4, 15) : new Date(configuredField.timeFilterEnd).toDateString().substr(4, 15);
									
									lForm.find("#lc-overlay-time-filter-column").text(fieldName + ": " + startDate  + " to " + endDate );
									lForm.find("#lc-overlay-time-filter").parent().show();
								}								
							}
						});

						// Layer has no field configuration, show field by default
					} else {
						showField = true;
					}

					// Hide field if its of type geometry
					if (attribute.type.startsWith("gml:")) showField = false;

					// Add the field as an option
					if (showField) {
						lForm.find("#lc-overlay-filter-field").append("<option value='" + attribute.name + "'>" + fieldName + "</option>");
					}

				});
				lForm.find("#lc-overlay-filter-field").val(subjectLayer.get("filterField"));
				lForm.find("#lc-overlay-filter-operator").val(subjectLayer.get("filterOperator"));
				lForm.find("#lc-overlay-filter-value").val(subjectLayer.get("filterValue"));
				lForm.find("#lc-overlay-filter-clear").click(function () {
					$("#lc-overlay-filter-field").val("");
					$("#lc-overlay-filter-operator").val("");
					$("#lc-overlay-filter-value").val("");
				});
				lForm.find("#lc-overlay-filter").show();
			}

			// The Vector Style object needs to be in this scope
			// This needs to get cloned
			let vectorStyle = $.extend(true,{},subjectLayer.get('featureStyle'));

			/**
			 * Function: prepStylers
			 * This gets called when the styling modal has been rendered,
			 * but not shown... which is the perfect time to have jQuery connect
			 * all our events.
			 */
			const prepStylers = () => {
				$("#lc-overlay-styler input[type='number']").inputSpinner()

				/**
				 * Only show the styler form for vector layers and
				 * if it is configured
				 */
				const styler = app.plugins.LayerController.pcfg.styler;
				if (subjectLayer instanceof ol.layer.Vector && styler) {
					$("#lc-overlay-styler").css('display', 'flex'); // Show styler

					/**
					 * Get all our styles for the layer from the layer object
					 */

					/* Point Logic */
					const pointColor = subjectLayer.get('featureStyle').Point.getFill();
					const pointSize = subjectLayer.get('featureStyle').pointSize;
					const pointIcon = subjectLayer.get('featureStyle').pointSymbol;

					// Renew the correct icon font for the point symbol
					$('#lc-overlay-styler .widget.point-font .font-btn')
						.removeClass('oi-media-record')
						.addClass(`oi-${pointIcon}`);

					/* Line Logic */
					const line = subjectLayer.get('featureStyle').LineString
					const lineColor = line.getStroke().getColor();
					const lineWidth = line.getStroke().getWidth();

					/* Polygon Logic */
					const poly = subjectLayer.get('featureStyle').Polygon;
					const polyColor = poly.getFill().getColor();
					const polyStrokeColor = poly.getStroke().getColor();
					const polyStrokeWidth = poly.getStroke().getWidth();

					// Define the menu button behaviour
					$("#lc-overlay-menu div").on('click', (e) => {
						// Toggle buttons
						$('#lc-overlay-menu div').removeClass('active');
						$(e.target).addClass('active');

						// Fade in content
						const featureType = $(e.target).data('feature')
						$('#lc-overlay-content .styler').hide();
						$(`#lc-overlay-content .${featureType}`)
							.css('display', 'flex')
							.hide()
							.fadeIn();
					})

					// Define the point colour behaviour
					$("#lc-overlay-styler .point .point-fill").colorPick({
						initialColor: pointColor,
						onColorSelected: function () {
							this.element.css({ backgroundColor: this.color }); // Style button

							vectorStyle.Point.setFill(this.color); // Style object
							vectorStyle.MultiPoint.setFill(this.color); // Style object
						}
					});

					// Define the line colour behaviour
					$("#lc-overlay-styler .line .line-fill").colorPick({
						initialColor: lineColor,
						onColorSelected: function () {
							this.element.css({ backgroundColor: this.color }); // Style button

							vectorStyle.LineString.getStroke().setColor(this.color); // Style object
						}
					});

					// Define the fill colour behaviour
					$("#lc-overlay-styler .polygon .poly-fill").colorPick({
						initialColor: polyColor,
						onColorSelected: function () {
							this.element.css({ backgroundColor: this.color }); // Style button
							vectorStyle.Polygon.getFill().setColor(this.color); // Style object
						}
					});

					// Define the colour behaviour
					$("#lc-overlay-styler .polygon .poly-stroke").colorPick({
						initialColor: polyStrokeColor,
						onColorSelected: function () {
							this.element.css({ borderColor: this.color });

							vectorStyle.Polygon.getStroke().setColor(this.color);
						}
					});

					// The line width
					// $("#lc-overlay-styler .weight-widget input").val(weight);

					// $("#lc-overlay-styler .font-btn").attr('class', `font-btn oi oi-${icon}`);

					// Point Size
					$('#lc-overlay-styler .widget.point-size input')
						.val(pointSize)
						.on('change', (e) => {
							const r = $(e.target).val();
							vectorStyle.pointSize = r;
						});

					// Line Width
					$('#lc-overlay-styler .widget.line-size input')
						.val(lineWidth)
						.on('change', (e) => {
							const r = $(e.target).val();
							vectorStyle.LineString.getStroke().setWidth(r);
							vectorStyle.MultiLineString.getStroke().setWidth(r);
						});

					// Polygon Border Width
					$('#lc-overlay-styler .widget.poly-size input')
						.val(polyStrokeWidth)
						.on('change', (e) => {
							const r = $(e.target).val();
							vectorStyle.Polygon.getStroke().setWidth(r);
							vectorStyle.MultiPolygon.getStroke().setWidth(r);
						});

					// The symbol button in the styling modal.
					$("#lc-overlay-styler .symbol-widget").on("click", (e) => {
						e.preventDefault();

						// Stop event if clicking the mother button or pallet
						const a = $(e.target).hasClass("pallet-btn");
						const b = $(e.target).hasClass("font-pallet");
						if (a || b) return;

						// Display the symbol picker
						$("#lc-overlay-styler .font-pallet").fadeIn(200);

						// Register a listener for clicking outside the symbol picker
						$("body").on("mouseup", (e) => {
							const fontClass = $(e.target).hasClass("font-btn");
							if (!fontClass) { // Didn't click the button
								// Fade out the pallet
								$("#lc-overlay-styler .font-pallet").fadeOut(200);
								// Remove click listener
								$("body").off("mouseup");
							}
						})
					});

					// The symbol buttons on the pallet
					$("#lc-overlay-styler .pallet-btn").on("click", (e) => {
						const palletBtn = e.target.className;
						const newFont = /oi\-(.*)\s/.exec(palletBtn)[1];
						const widgetBtn = $("#lc-overlay-styler .font-btn").attr("class");
						const oldFont = /oi\-(.*)/.exec(widgetBtn)[1];
						const src = `application/lib/open-iconic-1.1.0/svg/${newFont}.svg`;
						const icon = new ol.style.Icon({
							src: src,
							scale: [1, 1]
						});
						vectorStyle.Point.setImage(icon);
						vectorStyle.pointSymbol = newFont;

						// Change the button icon on the styler modal.
						$("#lc-overlay-styler .font-btn")
							.removeClass(`oi-${oldFont}`)
							.addClass(`oi-${newFont}`);
					});

				} else { // Not a vector layer
					$("#lc-overlay-styler").css('display', 'none'); // Hide styler
				}
			};

			// Show stylizer dialog (CAN DO MORE HERE IN THE FUTURE.....)
			bootbox.dialog({
				title: title,
				message: lForm,
				onShow: prepStylers, // Connect all the styling events and such
				centerVertical: true,
				buttons: {
					cancel: {
						label: "Cancel",
						className: "btn-secondary",
						callback: () => {
							vectorStyle = $.extend(true,{},subjectLayer.get('featureStyle'));
						}
					},
					ok: {
						label: "OK",
						className: "btn-primary",
						callback: function (result) {

							// Get and set opacity
							var newTransparency = $("#lc-overlay-transparency").val();

							subjectLayer.setOpacity((1 - newTransparency));

							// Get and set CQL filter
							if (subjectLayer.get("attributes")) {
								var filterField = $("#lc-overlay-filter-field").val();
								var filterOperator = $("#lc-overlay-filter-operator").val();
								var filterValue = $("#lc-overlay-filter-value").val();
								var userFilter = null;
								if (filterField && filterOperator && filterValue) {
									var valuePrefix = "";
									var valuePostfix = "";
									$.each(subjectLayer.get("attributes"), function (index, attribute) {
										if (attribute.name == filterField) {
											switch (attribute.localType) {
												case "string":
													if (filterOperator == "LIKE") {
														valuePrefix = "'%";
														valuePostfix = "%'";
													} else {
														valuePrefix = "'";
														valuePostfix = "'";
													}
													break;
												case "date-time":
													valuePrefix = "'";
													valuePostfix = "'";
													break;
											}
										}
									});
									userFilter = filterField + " " + filterOperator + " " + valuePrefix + filterValue + valuePostfix;
								}
								// add new time filter if it exists
								if (subjectLayer.get("dateColumn")) {
									var timeFilter = subjectLayer.get("dateColumn") + " BETWEEN " + subjectLayer.get("minDate") + " AND " + subjectLayer.get("maxDate");
									userFilter = (userFilter) ? userFilter + " AND " + timeFilter : timeFilter ;
								}

								setCqlFilter(subjectLayer, app.plugins.LayerController.name, userFilter);

								// Remember filter details by setting them to the layer
								subjectLayer.set("filterField", filterField);
								subjectLayer.set("filterOperator", filterOperator);
								subjectLayer.set("filterValue", filterValue);
							}

							/**
							 * If a vector layer harvest the styling options and
							 * apply them to the layer.
							 */
							/*
							if (subjectLayer instanceof ol.layer.Vector) {

								const fill = vectorStyle.Point.getFill();
								const icon = vectorStyle.Point.getImage().getSrc();
								const rgb = fill.replace(/RGBA/, 'rgb')

								$.get(icon)
									.done((dom) => {
										const svg = $(dom).find('svg');

										// Style the svg icons
										const r = vectorStyle.pointSize;
										svg.attr('width', r);
										svg.attr('height', r);

										// The # symbols needs to be escaped in svg
										svg.find('path').attr('fill', rgb.replace(/#/, '%23'));

										const svgString = svg.prop('outerHTML');

										// Insert the new icon string into the image part of the vectorStyle
										const src = `data:image/svg+xml;utf8,${svgString}`;

										vectorStyle.Point.setImage(
											new ol.style.Icon({
												src: src,
												color: rgb,
												scale: [1, 1]
											})
										);
									})
									.fail(() => console.error(`Could not fetch icon ${subjectLayer.myIconStyle}`));


								subjectLayer.set('featureStyle', $.extend(true,{},vectorStyle));
							}
							*/

							/**
							 * Refreshing layer is different depending on type
							 */
							if (subjectLayer instanceof ol.layer.Vector) {
								subjectLayer.changed();
							} else {
								subjectLayer.getSource().refresh(); // Refresh the layer
							}

							// Remember application state if available and configured
							rememberState();
						}
					}
				}
			});
		});
	}

	/**
	 * Function: searchForLayers
	 * @param (string) search term
	 * @returns () nothing
	 * Function that searches the configured additional sources using a keyword
	 */
	searchForLayers(searchTerm) {
		// Bail if already running
		if (this.searchForLayersIsWorking) return;
		this.searchForLayersIsWorking = true;
		
		// Start the spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($("#lc-addable-layers-ig")[0]);

		// Hide the details
		$("#lc-layer-details").hide();

		// Disable add layer button
		$("#lc-add-layer-btn").prop("disabled", true);

		// Empty matching layers selectbox
		$("#lc-matching-layers").empty();
		
		// Shim for Safari on mobile 
		if (isMobile() && isSafari()) {
			$("#lc-matching-layers").attr('size','1');
			$("#lc-matching-layers").css('height','42px');
		}

		// Lock the search input
		$("#lc-filter-input").prop("readonly", true);

		// Clear addable layer store
		app.plugins.LayerController.addableLayerStore = [];

		// For each additional source configured, get it's list of available layers
		$.each(app.plugins.LayerController.pcfg.additionalSources, function (index, source) {
			if (app.plugins.LayerController.getCapabilitiesCache[source.url]) {
				// Get the cached result
				var gcJson = app.plugins.LayerController.getCapabilitiesCache[source.url];

				// Build the available layers array (filter if configured)
				var allLayers = [];
				var availableLayers = [];
				if (gcJson.Capability.Layer.Layer && gcJson.Capability.Layer.Layer.length > 0) allLayers = gcJson.Capability.Layer.Layer;
				if (source.filter) {
					$.each(allLayers, function (index, layer) {
						if (layer.Name.indexOf(source.filter) != -1) availableLayers.push(layer);
					});
				} else {
					availableLayers = allLayers;
				}

				// Use passed search term to find matching layers
				var matchedLayers = [];
				$.each(availableLayers, function (index, layer) {
					// Assume no search term... ...add all layers as matched layers
					var match = true;

					// If a search term was passed, try to find a match for it in all of the fields
					if (searchTerm) {
						match = false;
						if (layer.Name.toUpperCase().indexOf(searchTerm.toUpperCase()) != -1) match = true;
						if (layer.Title.toUpperCase().indexOf(searchTerm.toUpperCase()) != -1) match = true;
						if (layer.Abstract.toUpperCase().indexOf(searchTerm.toUpperCase()) != -1) match = true;
						if (layer.KeywordList) {
							if (layer.KeywordList.length > 0) {
								$.each(layer.KeywordList, function (i, keyword) {
									if (keyword.toUpperCase().indexOf(searchTerm.toUpperCase()) != -1) match = true;
								});
							}
						}
					}

					// Add as a matched layer if a match was found
					if (match === true) {
						layer.sourceUrl = source.url;
						layer.sourceName = source.name;
						layer.withCredentials = (source.withCredentials) ? source.withCredentials : false;
						matchedLayers.push(layer);
					}
				});

				// Merge matchedLayers from this source with all matched layers list
				$.merge(app.plugins.LayerController.addableLayerStore, matchedLayers);
			}
		});

		// Add results to select control
		$.each(app.plugins.LayerController.addableLayerStore, function (index, layer) {
			$("#lc-matching-layers").append(new Option(layer.Title, index));
		});

		// Sort the results (and add "name" tooltip to each option)
		var options = $("#lc-matching-layers option");
		options.detach().sort(function (a, b) {
			var at = $(a).text();
			var bt = $(b).text();
			return (at > bt) ? 1 : ((at < bt) ? -1 : 0);
		});
		options.each(function () {
			$(this).attr("title", $(this).text());
		});
		options.appendTo("#lc-matching-layers");

		// Stop the spinner and unlock the search input after a tick
		this.searchForLayersIsWorking = false;
		setTimeout(function () {
			$("#lc-filter-input").prop("readonly", false);
			spinner.stop();
		}, 100);
	}

	/**
	 * Function: addBaseLayerControl
	 * @param (object) layer
	 * @param (boolean) allowLayerRemoval
	 * @returns () nothing
	 * Function that adds a base layer control to the layer control tab
	 */
	addBaseLayerControl(layer, allowLayerRemoval) {
		// Get the template and clone it
		var clone = $(".lc-baselayer-template").clone(true);

		// Remove template class
		clone.removeClass("lc-baselayer-template");

		// Tag the layerId to this layer control element (functions downstream will make reference to this)
		clone.attr("layerId", ol.util.getUid(layer));

		// Configure and show baselayer control
		if (layer.get("visible")) clone.find("input").prop("checked", true);
		clone.find(".lc-baselayer-radio").attr("id", "lc-baselayer-radio-" + ol.util.getUid(layer));
		clone.find(".form-check-label").html(layer.get("title"));
		clone.find(".form-check-label").attr("for", "lc-baselayer-radio-" + ol.util.getUid(layer)); // associate label with radio button (so clicking on label also changes state)
		clone.show();

		// Show layer remove button if requested
		if (allowLayerRemoval) clone.find(".lc-remove-baselayer-btn").show();

		// Add baselayer control event handlers
		clone.find(".lc-baselayer-radio").change(function () {
			var layerId = $(this).closest(".lc-baselayer-control").attr("layerId");
			app.plugins.LayerController.switchBaseMap(layerId);
		});
		
		/*
		// Register layer spy listener
		clone.find(".lc-baselayer-radio").on("contextmenu", function () {
			var layerId = $(this).closest(".lc-baselayer-control").attr("layerId");
			startLayerSpy(layerId);
		});
		*/

		// Register layer remove event handler if requested
		if (allowLayerRemoval) {
			clone.find(".lc-remove-baselayer-btn").click(function () {
				var layerId = $(this).closest(".lc-baselayer-control").attr("layerId");
				app.plugins.LayerController.removeLayer(layerId);
			});
		}

		// Show overlays fieldset
		app.plugins.LayerController.tabContent.find(".lc-fs-baselayers").show();

		// Add (prepend) control to fieldset
		app.plugins.LayerController.tabContent.find(".lc-fs-baselayers .lc-fs-content").prepend(clone);
	}

	/**
	 * Function: updateOverlayGroupCounter
	 * @param (object) header
	 * @returns () nothing
	 * Function that updates the number of layers in the overlay group
	 */
	updateOverlayGroupCounter(header) {
		// Get the number of elements in the list corresponding to the given header
		const count = $(header).next(".ui-accordion-content").find(".lc-overlay-group-list").children().length;
		// Update header text
		$(header).find(".counter").text(" (" + count + ")");
	}

	/**
	 * Function: addOverlayLayerControl
	 * @param (object) layer
	 * @param (boolean) allowLayerRemoval
	 * @returns () nothing
	 * Function that adds a overlay layer control to the layer control tab
	 */
	addOverlayLayerControl(layer, allowLayerRemoval) {
		// Get the template and clone it
		var clone = $(".lc-overlay-template").clone(true);

		// Remove template class
		clone.removeClass("lc-overlay-template");

		// Tag the layerId to this layer control element (functions downstream will make reference to this)
		clone.attr("layerId", ol.util.getUid(layer));
		clone.attr("id", "lc-overlay-control-" + ol.util.getUid(layer));

		// Configure and show overlay control
		if (layer.get("visible")) clone.find("input").prop("checked", true);
		clone.find(".lc-overlay-chkbox").attr("id", "lc-overlay-chkbox-" + ol.util.getUid(layer));
		clone.find(".form-check-label").html(layer.get("title"));
		clone.find(".form-check-label").attr("id", "lc-ol-title-" + ol.util.getUid(layer));
		clone.find(".form-check-label").attr("for", "lc-overlay-chkbox-" + ol.util.getUid(layer)); // associate label with checkbox (so clicking on label also changes state)
		clone.find(".lc-layer-toolbox").attr("id", "lc-layer-toolbox-" + ol.util.getUid(layer));
		clone.find(".lc-legend").attr("id", "lc-legend-div-" + ol.util.getUid(layer));
		$(clone).show();

		// Register toggle visibility checkbox 
		clone.find(".lc-overlay-chkbox").change(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.toggleLayerVisibility(this.checked, layerId);
		});

		// Register show legend button
		clone.find(".lc-overlay-legend-btn").click(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.showOverlayLegend(layerId);
		});

		// Register layer modify button
		clone.find(".lc-modify-overlay-btn").click(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.openModifyOverlayDialog(layerId);
		});

		// Register layer error button (a click should refresh the layer)
		clone.find(".lc-overlay-error-btn").click(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.refreshLayer(layerId);
		});

		// Show and register layer remove button requested
		if (allowLayerRemoval) {
			clone.find(".lc-overlay-remove-menu-btn").show();
			clone.find(".lc-overlay-remove-menu-btn").click(function () {
				var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
				app.plugins.LayerController.removeLayer(layerId);
			});
		}

		// Show & register layer download button if configured (and if available)
		if (app.plugins.LayerController.pcfg.layerDownloads && app.plugins.LayerController.pcfg.layerDownloads.enabled) {
			clone.find(".lc-overlay-download-menu-btn").show();
			if (layer.getSource() instanceof ol.source.ImageWMS 
			|| layer.getSource() instanceof ol.source.TileWMS
			|| layer.getSource() instanceof ol.source.Vector) {
				clone.find(".lc-overlay-download-menu-btn").click(function () {
					var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
					app.plugins.LayerController.downloadOverlayLayer(layerId);
				});
			} else {
				clone.find(".lc-overlay-download-menu-btn").addClass("lc-overlay-btn-disabled");
				clone.find(".lc-overlay-download-menu-btn").attr("title", "");
			}
		}

		// Register layer status handler (ImageWMS)
		if (layer.getSource() instanceof ol.source.ImageWMS === true) {
			layer.getSource().on("imageloadstart", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("imageloadend", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("imageloaderror", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
		}

		// Register layer status handler (TileWMS)
		if (layer.getSource() instanceof ol.source.TileWMS === true) {
			layer.getSource().on("tileloadstart", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("tileloadend", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("tileloaderror", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
		}
		
		// Register layer status handler (Vector)
		if (layer.getSource() instanceof ol.source.Vector === true) {
			layer.getSource().on("featuresloadstart", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("featuresloadend", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().on("featuresloaderror", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
		}
		
		// Register layer status handler (Vector Cluster)
		if (layer.getSource() instanceof ol.source.Cluster === true) {
			layer.getSource().getSource().on("featuresloadstart", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().getSource().on("featuresloadend", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
			layer.getSource().getSource().on("featuresloaderror", function (e) {
				var layerId = ol.util.getUid(layer);
				app.plugins.LayerController.showLayerStatus(layerId);
			});
		}
		
		// Register the layer refresh menu button
		clone.find(".lc-overlay-refresh-menu-btn").click(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.refreshLayer(layerId);
		});

		// Register the layer view metadata menu button
		clone.find(".lc-overlay-metadata-menu-btn").click(function () {
			var layerId = $(this).closest(".lc-overlay-control").attr("layerId");
			app.plugins.LayerController.viewLayerMetadata(layerId);
		});

		// If layer grouping should be displayed
		if (!app.plugins.LayerController.showLayerGrouping){
			
			// Add (prepend) control to overlays fieldset (default behaviour if layer grouping is disabled)
			app.plugins.LayerController.tabContent.find(".lc-fs-overlays .lc-fs-content").prepend(clone);
		
		// If layer grouping should not be displayed
		} else {
			
			// Define th group name
			var groupName;
			if (typeof layer.get('group')!== "undefined") {
				 groupName = layer.get("group");
			}

			// The case where the user has defined a group name for some layer's but not all in app-config.js
			if ((typeof layer.get('title')!== "undefined") && app.plugins.LayerController.showLayerGrouping) {
				if (!groupName) {
					groupName = "Additional Layers";
				}
			}
			// Check if the groupName is already present in the groups map
			if (this.groups.has(groupName)) {
				// Find the HTML div for the group
				const groupDiv = app.plugins.LayerController.tabContent.find(`.lc-overlay-group:contains(${groupName})`);
				
				// Append the clone to this the list corresponding to the above group
				groupDiv.find("ul").prepend(clone);

				// Update the counter for the corresponding group
				const header = groupDiv.find(".ui-accordion-header");
				app.plugins.LayerController.updateOverlayGroupCounter(header);
				app.plugins.LayerController.reorderOverlayLayers();
				
			// Otherwise, create a new group
			} else {
				if (typeof layer.get("title") !== "undefined") {					
					// Add the new group to the groups map
					this.groups.add(groupName);
				
					// Create a div element for the group
					const groupDiv = $("<div class='lc-overlay-group'></div>");
					
					// Append a header to the group
					groupDiv.append(`<h3 class='lc-overlay-group-header-text'>${groupName}</h3>`);
					
					// Append a body div to the group
					const groupBody = $("<div class='lc-overlay-group-body'></div>");
				
					// Append a list element to the body
					const groupUl = $("<ul class='lc-overlay-group-list'></ul>");
					groupBody.append(groupUl);
	
					// Append the clone as a list element to the ul
					groupUl.prepend(clone);
	
					// Append the group body to the group div
					groupDiv.append(groupBody);
					
					// Append the group div to the layer controller tab
					if (groupName == "Additional Layers"){
						// Append to the bottom of the list if the group is Additional Layers
						app.plugins.LayerController.tabContent.find("#lc-fs-overlay-content").append(groupDiv)
					}else{
						app.plugins.LayerController.tabContent.find("#lc-fs-overlay-content").prepend(groupDiv)
					}
					
					app.plugins.LayerController.reorderOverlayLayers();
	
					// Initialize the dropdown accordions
					$(".lc-overlay-group").accordion({
						collapsible: true,
						active: false,
						create: function(event, ui) {
							// Initialize the counters when the accordions are created
							$(this).find(".ui-accordion-header").each(function() {
								$(this).append('<span class="counter"></span>');
								app.plugins.LayerController.updateOverlayGroupCounter($(this));
							});
						},
						heightStyle: "content",
					});
	
					// Make the overlay layers within each group sortable (so user can change stack order)
					$(".lc-overlay-group-list").sortable({
						connectWith: ".lc-overlay-group-list",
						containment: "#lc-fs-overlay-content",
						update: function(event, ui) {
							// When an item is dropped, update the sort order
							$(".lc-overlay-group").each(function(){
								$(this).find(".ui-accordion-header").each(function() {
									app.plugins.LayerController.updateOverlayGroupCounter($(this));
								});
						
							});
							app.plugins.LayerController.reorderOverlayLayers();
							rememberState();
						},
					});
				}
			}
		}
		
		// Show overlays fieldset
		app.plugins.LayerController.tabContent.find(".lc-fs-overlays").show();

		// Update the layer status
		app.plugins.LayerController.showLayerStatus(ol.util.getUid(layer));
	}

	/**
	 * Function: showOverlayLayerDetails
	 * @param () none
	 * @returns () nothing
	 * Function that shows the selected layer's details
	 */
	showOverlayLayerDetails() {
		// Get the selected layer detail
		var selectedLayerIndex = $("#lc-matching-layers option:selected").val();
		var selectedLayer = app.plugins.LayerController.addableLayerStore[selectedLayerIndex];

		// Start the details table
		var details = "<table><tbody>";

		// Add the title and source if they exist
		if (selectedLayer.Title) details += "<tr><td class='lc-layer-details-content-td-label'>Title:</td><td>" + selectedLayer.Title + "</td></tr>";
		if (selectedLayer.sourceName) details += "<tr><td class='lc-layer-details-content-td-label'>Source:</td><td>" + selectedLayer.sourceName + "</td></tr>";

		// Add keywords if they exist
		if (selectedLayer.KeywordList) {
			if (selectedLayer.KeywordList.length > 0) {
				details += "<tr><td class='lc-layer-details-content-td-label'>Keywords:</td><td>";
				details += selectedLayer.KeywordList.join(", ");
				details += "</td></tr>";
			}
		}

		// Add the abstract if it exists
		if (selectedLayer.Abstract) details += "<tr><td class='lc-layer-details-content-td-label'>Abstract:</td><td>" + selectedLayer.Abstract + "</td></tr>";

		// Add details URLs if they exist
		if (selectedLayer.MetadataURL) {
			if (selectedLayer.MetadataURL.length > 0) {
				details += "<tr><td class='lc-layer-details-content-td-label'>Links:</td><td>";
				$.each(selectedLayer.MetadataURL, function (i, mdUrl) {
					if (mdUrl.OnlineResource) {
						details += "<a href='" + mdUrl.OnlineResource + "' target='_blank'>" + mdUrl.OnlineResource + "</a>";
					}
				});
				details += "</td></tr>";
			}
		}

		//Complete the details table
		details += "</tbody></table>";

		// Add the generated table to the display and show it
		$("#lc-layer-details-content").html(details);
		$("#lc-layer-details").show();
	}

	/**
	 * Function: addOverlayLayer
	 * @param (integer) #lc-matching-layers select INDEX
	 * @returns () nothing
	 * Function that adds a layer to the map (based on the passed select index)
	 */
	addOverlayLayer(index) {
		// Get the selected layer detail
		var selectedLayer = app.plugins.LayerController.addableLayerStore[index];
		// Contruct the layer
		var layer = new ol.layer.Image({
			title: selectedLayer.Title,
			type: "overlay",
			visible: true,
			withCredentials: selectedLayer.withCredentials,
			source: new ol.source.ImageWMS({
				url: selectedLayer.sourceUrl,
				params: {
					LAYERS: selectedLayer.Name
				},
				transition: 0
			})
		});
		if (app.plugins.LayerController.showLayerGrouping) layer.set("group","Additional Layers");


		// Register the overlay layer with TWM
		registerOverlayWithTWM(layer);

		// Add the layer to the map
		app.map.addLayer(layer);

		// Set the layer zIndex (by getting the next available zIndex)
		layer.setZIndex(nextAvailableOverlayLayerZIndex());

		// Add layer as control to layer switcher
		app.plugins.LayerController.addOverlayLayerControl(layer, true);

		// Remove the selected option from the select box
		$("#lc-matching-layers option:selected").prop("selected", false);

		// Hide the details
		$("#lc-layer-details").hide();

		// Remember application state if available and configured
		rememberState();
	}

	/**
	 * Function: removeLayer
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function that removes a layer from the map
	 */
	removeLayer(layerId) {
		// Find the layer to remove (by it's ID)
		var layerToRemove;

		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				layerToRemove = layer;
			}
		});

		// Loop through the div's that have the layerId attribute and remove them
		$(".lc-fs-overlays .lc-fs-contentg").children("div").each(function () {
			if ($(this).attr("layerId") == layerId) {
				$(this).remove();
			}
		});
	
		// Remove the layer from the overlay fieldset (if exists)
		if (!app.plugins.LayerController.showLayerGrouping) {
			$(".lc-fs-overlays .lc-fs-content").children("div").each(function () {
				if ($(this).attr("layerId") == layerId) {
					$(this).remove();
				}
			});
		} else {
			const overlayId = "#lc-overlay-control-" + layerId;
			const header = $(overlayId).closest(".lc-overlay-group-body").siblings("h3");
			$(overlayId).remove(); 
			app.plugins.LayerController.updateOverlayGroupCounter(header);
		}

		// Remove the layer from the baselayer fieldset (if exists)
		$(".lc-fs-baselayers .lc-fs-content").children("div").each(function () {
			if ($(this).attr("layerId") == layerId) {
				$(this).remove();
			}
		});

		// If layer is a base layer and is turned on when its removed, try to turn on some other base layer
		if (layerToRemove.get("type") == "base" && layerToRemove.getVisible() === true) {
			if ($(".lc-fs-baselayers .lc-fs-content").children("div").length > 0) {
				$(".lc-fs-baselayers .lc-fs-content").children("div").first().find("input").prop("checked", true);
				$(".lc-fs-baselayers .lc-fs-content").children("div").first().find("input").change()
			}
		}

		// Hide overlays fieldset if empty
		if ($(".lc-fs-overlays .lc-fs-content").children("div").length == 0) {
			app.plugins.LayerController.tabContent.find(".lc-fs-overlays").hide();
		}

		// Remove the layer from the map
		if (layerToRemove) app.map.removeLayer(layerToRemove);

		// Remember application state if available and configured
		rememberState();
	}

	/**
	 * Function: downloadOverlayLayer
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function that issues a request to download an overlay layer
	 */
	downloadOverlayLayer(layerId) {
		// Find the layer to remove
		var layerToDownload;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (layer.get("type") != "base") {
				if (ol.util.getUid(layer) == layerId) {
					layerToDownload = layer;
				}
			}
		});

		// Define the max features that can be downloaded (defaults to 500)
		var maxFeatures = 500;
		if (app.plugins.LayerController.pcfg.layerDownloads && app.plugins.LayerController.pcfg.layerDownloads.maxFeatures) {
			maxFeatures = app.plugins.LayerController.pcfg.layerDownloads.maxFeatures;
		}

		// Continue if a valid layer was found
		if (layerToDownload) {

			// ImageWMS layers have a single url in their source, TileWMS have multiple
			var layerUrl = "";
			if (layerToDownload.get("source").urls) {
				layerUrl = layerToDownload.getSource().getUrls()[0];
			} else {
				layerUrl = layerToDownload.getSource().getUrl();
			}
			
			// If no layer url is defined, then try getting the vector Source
			if (!layerUrl && layerToDownload.getSource().layerUrl) {
				layerUrl = layerToDownload.getSource().layerUrl;
			}
			
			// Finally, if no layer url is defined here, bail
			if (!layerUrl) {
				bootbox.dialog({
					title: "Error",
					message: "<p class='text-center'>Cannot download layer.  Please contact your administrator.<br></p>",
					closeButton: true,
					centerVertical: true
				});
				logger("ERROR", "LayerController: Misconfigured layer (no defined layerUrl in layer source)");
				return;
			}

			// Get layer name (Image/Tile vs Vector)
			var layerName;
			if (layerToDownload.getSource() instanceof ol.source.ImageWMS || layerToDownload.getSource() instanceof ol.source.TileWMS) {
				$.each(layerToDownload.getSource().getParams(), function (parameterName, parameterValue) {
					if (parameterName.toUpperCase() == "LAYERS") layerName = parameterValue;
				});
			} else {
				layerName = layerToDownload.getSource().layerName;
			}
				
			// Finally, if no layer name is defined, bail
			if (!layerName) {
				bootbox.dialog({
					title: "Error",
					message: "<p class='text-center'>Cannot download layer.  Please contact your administrator.<br></p>",
					closeButton: true,
					centerVertical: true
				});
				logger("ERROR", "LayerController: Misconfigured layer (no defined layerName in layer source)");
				return;
			}
			
			// Get the WFS output formats and output projections for this layer
			var exportOutputFormats = layerToDownload.get("exportOutputFormats");
			var exportOutputProjections = layerToDownload.get("exportOutputProjections");
			// Load the form
			$.ajax({
				type: "GET",
				url: app.plugins.LayerController.layerDownloaderContentFile
			}).done(function (response) {
				// Get the form from the response
				var lForm = $(response);

				// Populate the export layer input (readonly)
				lForm.find("#lc-output-layer").val(layerToDownload.get("title"));

				// Populate the export output formats select box
				$.each(exportOutputFormats, function (exportOutputFormatId, exportOutputFormat) {
					lForm.find("#lc-output-format").append("<option value='" + exportOutputFormatId + "'>" + exportOutputFormat.name + "</option>");
				});

				// Populate the export output projections select box
				$.each(exportOutputProjections, function (index, exportOutputProjection) {
					lForm.find("#lc-output-projection").append("<option value='" + exportOutputProjection.value + "'>" + exportOutputProjection.name + "</option>");
				});

				// Register the output format change listener
				lForm.find("#lc-output-format").on("change", function (e) {
					lForm.find("#lc-output-projection").prop("disabled", false);
					var outputFormatId = $(this).val();
					var outputFormat = exportOutputFormats[outputFormatId];
					if (outputFormat.requiredSrs) {
						lForm.find("#lc-output-projection").val(outputFormat.requiredSrs)
						lForm.find("#lc-output-projection").prop("disabled", true);
					}
				});
				lForm.find("#lc-output-format").change();

				// Define and option the downloader dialog
				bootbox.dialog({
					title: "Download Layer",
					message: lForm,
					centerVertical: true,
					buttons: {
						download: {
							label: "Download",
							className: "btn-primary",
							callback: function (result) {
								// Get the selected output format
								var outputFormatId = $("#lc-output-format").val();
								var outputFormat = exportOutputFormats[outputFormatId];

								// Formulate the request parameters (WFS)
								if (outputFormat.service.toUpperCase() == "WFS") {
									// Get selected output projection
									var outputProjection = $("#lc-output-projection").val();
	
									// Get the current map extent (in bbox format for selected output projection)
									var bbox = app.map.getView().calculateExtent(app.map.getSize());
									var outputBbox = ol.proj.transformExtent(bbox, app.map.getView().getProjection().getCode(), outputProjection);
	
									// Get geometry column
									var geometryColumn = "GEOMETRY";
									layerToDownload.getProperties().attributes.forEach(function(attr){
										if (attr.type == "gml:Geometry") {
											geometryColumn = attr.name;
										}
									})			
									
									// Use current map extent as BBOX
									var cqlFilter = "BBOX("+geometryColumn+","+outputBbox.join(",")+",'"+outputProjection+"')";
									
									// Add any existing CQL_FILTERs
									var cqlFilterStack = layerToDownload.get("cqlFilterStack");
									var cqlFilterObject = cqlFilterStack;//.CRTreporter;
									
									Object.values(cqlFilterObject).forEach((val) => {
										 cqlFilter += " AND " + val;
									});

									// Define URL query parameters
									var urlParameters = {
										service: "WFS",
										version: outputFormat.version,
										request: outputFormat.request,
										typeNames: layerName,
										outputFormat: outputFormat.format,
										srsName: outputProjection,
										count: maxFeatures, // may be over-ridden by server
										cql_filter: cqlFilter
									}

									// Formulate the request parameters (WMS)
								} else if (outputFormat.service.toUpperCase() == "WMS") {
									// Get selected output projection
									var outputProjection = "EPSG:4326";
	
									// Get the current map extent (in bbox format for selected output projection)
									var bbox = app.map.getView().calculateExtent(app.map.getSize());
									var outputBbox = ol.proj.transformExtent(bbox, app.map.getView().getProjection().getCode(), outputProjection);		
									// Define URL query parameters
									var urlParameters = {
										service: "WMS",
										version: outputFormat.version,
										request: outputFormat.request,
										layers: layerName,
										format: outputFormat.format,
										width: 1024,
										height: 1024,
										maxFeatures: maxFeatures, // may be over-ridden by server
										bbox: outputBbox.join(",") + "," + outputProjection	
									}
										
									// Add any existing CQL_FILTERs
									var cqlFilterStack = layerToDownload.get("cqlFilterStack");
									if (cqlFilterStack) {
										var cqlFilterObject = cqlFilterStack;
										var cqlFilter = "";
										Object.values(cqlFilterObject).forEach((val) => {
											 cqlFilter += val + " AND ";
										});
										cqlFilter = cqlFilter.slice(0,-5);
										if (cqlFilter.length > 0) {
											urlParameters.cql_Filter = cqlFilter;
										}
									}
								} else {
									logger("ERROR", "LayerController: Unknown Export Type");
									return;
								}

								// Add propertyNames option if it exists
								if (outputFormat.propertyName) {
									urlParameters.propertyName = outputFormat.propertyName;
								}

								// Build the request URL (append parameters)
								var downloadUrl = layerUrl.replace(/\?.*$/, "") + "?" + $.param(urlParameters);

								// Download the file
								downloadFile(downloadUrl);
							}
						}
					}
				});

			});

		}
	}

	/**
	 * Function: showLayerStatus
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function that shows the layer status (error, loading, nothing)
	 */
	showLayerStatus(layerId) {
		// Get the referenced layer
		var subjectLayer;
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				subjectLayer = layer;
			}
		});

		// Get the layer stat counts
		var loadingCount = subjectLayer.get("loadingCount");
		var loadedCount = subjectLayer.get("loadedCount");
		var errorCount = subjectLayer.get("errorCount");

		// Determine the layer state
		var state;
		if (subjectLayer.getVisible() === true) {
			if (errorCount > 0) {
				state = "ERROR";
			}  else if (subjectLayer.dropped && (loadingCount>0)) {
				state= "GOOD_ENOUGH";
			} else if (loadedCount < loadingCount) {
				state = "LOADING";
			}
		}


		// Set status accordingly based on state
		switch (state) {
			case "ERROR":
				// Show error icon and hide loading animation
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-error-btn").show();
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-working").hide();
				logger("ERROR", $("#lc-ol-title-" + layerId).html() + " - Layer load error");
				break;

			case "LOADING":
				// Hide error icon and show loading animation
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-error-btn").hide();
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-working").show();
				break;

			default:
				// Hide error icon and loading animation
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-error-btn").hide();
				$("#lc-overlay-control-"+layerId).find(".lc-overlay-working").hide();
				break;
		}
	}

	/**
	 * Function: reorderOverlayLayers
	 * @param () none
	 * @returns () nothing
	 * Function that stacks the overlay layers in the map in accordance to the layer controller order
	 */
	reorderOverlayLayers() {
		// Get the number of managed overlay layers
		var managedOverlayLayerCount = 0;
		
		// Get the list of overlay layers divs
		var overlayIdList = [];

		// Get the number of managed overlay layers if layer grouping is enabled
		if (app.plugins.LayerController.showLayerGrouping) {
			$(".lc-overlay-group-list").each(function(){
				$(this).children("div").each(function() {
					overlayIdList.push($(this).attr("layerid"));
					let thisLayerid = $(this).attr("layerid");
					// Find that layer in the map and update its group
					$.each(app.map.getLayers().getArray(), function (index, layer) {
						if (ol.util.getUid(layer) == thisLayerid) {
							let elementId = "#lc-ol-title-"+thisLayerid;			
							let thisGroup = $(elementId).parent().parent().parent().parent().find(".ui-accordion-header").text().replace($(elementId).parent().parent().parent().parent().find(".ui-accordion-header").find(".counter").text(),'');
							if (typeof layer.get('title') !== "undefined") {
								layer.set('group', thisGroup);
							}

						}
					});		
				});
			})
			
			$(".lc-overlay-group").each(function(){
				$(this).find(".ui-accordion-header").each(function() {
					managedOverlayLayerCount += $(this).next(".ui-accordion-content").find(".lc-overlay-group-list").children().length;
				});
			});
		// Otherwise just get the number of overlay layers when layer grouping is disabled
		} else {
			managedOverlayLayerCount += $(".lc-fs-overlays .lc-fs-content").children("div").length;
			$(".lc-fs-overlays .lc-fs-content").children("div").each(function() {
				overlayIdList.push($(this).attr("layerid"));
			});
		}

		// Calculate the starting point for the zIndex
		var zIndex = app.StartIndexForOverlayLayers + managedOverlayLayerCount;

		// Loop through the list of overlay layer controls to determine new order
		overlayIdList.forEach(function (layerId) {
			
			// Find that layer in the map and set it's new zIndex
			$.each(app.map.getLayers().getArray(), function (index, layer) {
				if (ol.util.getUid(layer) == layerId) {
					layer.setZIndex(zIndex);
				}
			});
		
			// Deincrement the zIndex
			zIndex--;
		});
	
		// Remember application state if available and configured
		rememberState();
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function (success, tabNav, tabContent) {
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.LayerController.name + ": Plugin failed to initialize");
				return;
			}

			// Default style on layer load
			app.defaultStyle = {
				Point: new ol.style.Style({
					color: 'black',
					fill: 'black',
					image: new ol.style.Icon({
						src: 'application/lib/open-iconic-1.1.0/svg/media-record.svg'
					})
				}),
				pointSize: 8,
				pointSymbol: 'media-record',
				MultiPoint: new ol.style.Style({
					color: 'black',
					fill: 'black',
					image: new ol.style.Icon({
						src: 'application/lib/open-iconic-1.1.0/svg/media-record.svg'
					})
				}),
				LineString: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "black",
						width: 2
					})
				}),
				MultiLineString: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "black",
						width: 2
					})
				}),
				Polygon: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "black",
						width: 4
					}),
					fill: new ol.style.Fill({
						color: "#94d2eb"
					})
				}),
				MultiPolygon: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "black",
						width: 4
					}),
					fill: new ol.style.Fill({
						color: "#94d2eb"
					})
				})
			};

			// Set class variables
			app.plugins.LayerController.tabNav = tabNav;
			app.plugins.LayerController.tabContent = tabContent;

			// Add the base layers in the map to the layer switcher (by zIndex order)
			var zIndexes = [];
			$.each(app.map.getLayers().getArray(), function (index, layer) {
				if (layer.get("title") && layer.get("type") == "base") {
					var hideFromLayerController = layer.get("hideFromLayerController") ? layer.get("hideFromLayerController") : false;
					if (hideFromLayerController === false) zIndexes.push(layer.getZIndex());
				}
			});
			zIndexes.sort();
			$.each(zIndexes, function (index, zIndex) {
				$.each(app.map.getLayers().getArray(), function (index, layer) {
					if (zIndex == layer.getZIndex()) {
						if (layer.get("removable") === true) {
							app.plugins.LayerController.addBaseLayerControl(layer, true);
						} else {
							app.plugins.LayerController.addBaseLayerControl(layer, false);
						}
					}
				});
			});

			// Add the overlay layers in the map to the layer switcher (by zIndex order)
			var zIndexes = [];
			$.each(app.map.getLayers().getArray(), function (index, layer) {
				if (typeof (layer.get("title") !== "undefined") && layer.get("type") == "overlay") {
					if (typeof layer.get("group") !== "undefined") {
						if (layer.get("group").length > 0) {
							  app.plugins.LayerController.showLayerGrouping = true; // If any layer has a group, show layer grouping
						}
					}
					var hideFromLayerController = layer.get("hideFromLayerController") ? layer.get("hideFromLayerController") : false;
					if (hideFromLayerController === false) zIndexes.push(layer.getZIndex());
				}
			});
			zIndexes.sort();
			const visitedLayers = new Set(); // Used to ensure there are no duplicate layers
			$.each(zIndexes, function (index, zIndex) {
				$.each(app.map.getLayers().getArray(), function (index, layer) {
					if (zIndex == layer.getZIndex() && !visitedLayers.has(layer)) {
						visitedLayers.add(layer);
						if (layer.get("removable") === true) {
							app.plugins.LayerController.addOverlayLayerControl(layer, true);
						} else {
							app.plugins.LayerController.addOverlayLayerControl(layer, false);
						}
					}
				});
			});

			if (!app.plugins.LayerController.showLayerGrouping) {

				// Make the overlay layers sortable (so user can change stack order)
				$(".lc-fs-overlays .lc-fs-content").sortable({
					update: function (event, ui) {
						app.plugins.LayerController.reorderOverlayLayers();
					}
				});
			} else{
				// Change the font size of the dropdown-item if layer
				// grouping is enabled
				//$(".dropdown-item").css("font-size", "0.9em");
			}

			// Register the legend updater for the zoom end event
			$(app.map).on("moveend", function (e) {
				$(".lc-fs-overlays .lc-fs-content").children("div").each(function () {
					var layerId = $(this).attr("layerId");
					if (layerId) {
						if ($("#lc-legend-div-" + layerId).css("display") != "none") {
							app.plugins.LayerController.refreshOverlayLegend(layerId);
						}
					}
				});
			});

			// If "additionalSources" is configured, show and register the dynamic layer adder fieldset
			if (app.plugins.LayerController.pcfg.additionalSources) {

				// Show the fieldset
				app.plugins.LayerController.tabContent.find(".lc-fs-layer-adder").show();

				// Register the filter input
				$("#lc-filter-input").keyup(function () {
					// Clear pending search/filter if another is issued soon after
					if (app.plugins.LayerController.searchTimer) {
						clearTimeout(app.plugins.LayerController.searchTimer);
						app.plugins.LayerController.searchTimer = null;
					}

					// Wait a tick before executing search/filter
					app.plugins.LayerController.searchTimer = setTimeout(function () {
						app.plugins.LayerController.searchForLayers($("#lc-filter-input").val());
					}, 650);
				});

				// Register the selection change
				$("#lc-matching-layers").on("change", function () {
					app.plugins.LayerController.showOverlayLayerDetails();
					$("#lc-add-layer-btn").prop("disabled", false);
				});

				// Register the clear filter button
				$("#lc-clear-filter-btn").on("click", function () {
					$("#lc-filter-input").val("");
					app.plugins.LayerController.searchForLayers(null);
				});

				// Register the add layer button
				$("#lc-add-layer-btn").on("click", function () {
					var selectedLayerIndex = $("#lc-matching-layers option:selected").val();
					app.plugins.LayerController.addOverlayLayer(selectedLayerIndex);
				});

				// Register the double click on layer
				$("#lc-matching-layers").on("dblclick", function () {
					var selectedLayerIndex = $("#lc-matching-layers option:selected").val();
					app.plugins.LayerController.addOverlayLayer(selectedLayerIndex);
				});

				// Register the right-click on layer list function
				$("#lc-matching-layers").on("contextmenu", function (e) {
					e.preventDefault();

					// Allow adding all filtered layers (if count is 75 or less)
					if ($("#lc-filter-input").val() != "" && $("#lc-matching-layers option").length <= 75) {
						$("#lc-filter-input-context-menu").css({
							display: "block",
							position: "absolute",
							top: (e.pageY - 125),
							left: (e.pageX - 0)
						}).show();
					}
					return;

				});
				
				// Hide context menu if anything is clicked
				$(document).bind("click", function (event) {
					$("#lc-filter-input-context-menu").hide();
				});

				// Register the add filtered layers button click
				$("#lc-add-all-filtered-layers").click(function () {
					$("#lc-matching-layers option").each(function (index, element) {
						app.plugins.LayerController.addOverlayLayer(index);
					});
				});

				// Pre-cache all of the GetCapabilities 
				app.plugins.LayerController.cacheGetCapabilities();

				// Log success
				logger("INFO", app.plugins.LayerController.name + ": Plugin successfully loaded");
			}
		}

		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);

	}
}