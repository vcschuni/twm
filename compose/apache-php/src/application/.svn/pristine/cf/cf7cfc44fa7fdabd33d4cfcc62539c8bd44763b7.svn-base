/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: init.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Houses the globals & initialization functions of TWM.
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * GLOBALS
 * Variables/objects required in a global context.
 */
app.log = [];
app.StartIndexForBaseLayers = 400; // 400 to 499 reserved for base layers
app.StartIndexForOverlayLayers = 500; // 500 to 599 reserved for overlay layers
app.config = new Object(); // Defined by whatever application config was requested/loaded
app.plugins = new Object();
app.eventKeys = new Object(); // Used to store the keys of map events (so we can destroy them if required)
app.defaultMapCursor = "default";
app.defaultMapSingleClickFunction = function(){};
app.currentMapZoom = 0;

/**
 * Function: Document onReady
 * @param () none
 * @returns () nothing
 * Function that runs when the document is ready
 */
$(document).ready(function() {
	// Record statistic
	recordStatistic("session-start-time");
	
	// Add log entry
	logger("INFO", "-------------------------------------------------------------------------------------------------------------");
	logger("INFO", "Beginning TWM Session");
	
	// Check if Internet Explorer
	var ua = window.navigator.userAgent;
	if (/MSIE|Trident/.test(ua)) {
		// Set title/header to default
		document.title = "Transportation Web Map";
		if (isMobile()) { $("#appTitle").text("TWA"); } else { $("#appTitle").text("Transportation Web Map"); }
		
		// Display error/suggestion
		var errorNotice = bootbox.dialog({
			title: "Compatibility Issue",
			message: "<p class='text-center'>Your browser is not compatible with this application.<br><br>Please use a modern Browser.<br></p>",
			closeButton: false
		});
		
		// Bail
		return;
	}
	
	// Load the core application scripts
	var scripts = [
		"application/inc/projections.js",
		"application/inc/definitions.js",
		"application/inc/extensions.js",
		"application/inc/classes.js"
	];
	var loadedScriptCount = 0;
	$.each(scripts, function(index, script) {
		$.ajax({
			url: script,
			dataType: "script"
		})
		.done(function(response) {
			loadedScriptCount++;
			logger("INFO", "Successfully loaded " + script);
			
			// When all of the scripts are loaded, load the config
			if (loadedScriptCount >= scripts.length) {
				var configName = getUrlParameterByName("c");
				loadConfig(configName, 0);
			}
		})
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", "Error loading " + script);
			return;
		}); 
	});
});

/**
 * Function: loadConfig
 * @param (string) config name
 * @param (integer) attempt count
 * @returns () nothing
 * Function that loads the specified config, alternatively defaulting to the default TWM configuration
 */
function loadConfig(name, attemptCount) {
	if (name === null) {
		showAdvertisedApplications();
		return;
	}
	attemptCount++;
	$.getScript("configuration/" + name + "/app-config.js")
	.done(function(script, textStatus) {
		app.config.name = name;
		logger("INFO", "'" + app.config.name + "' TWM configuration loaded successfully");
		loadCustomCss();
	})
	.fail(function(jqxhr, settings, exception) {
		logger("WARN", "Attempt to load '" + name + "' TWM configuration failed.  Showing Advertised Applications");
		showAdvertisedApplications();
	}); 
}

/**
 * Function: loadCustomCss
 * @param () none
 * @returns () nothing
 * Function that loads config specific css
 */
function loadCustomCss() {
	showMapSpinner();
	if (app.config.overrideStyle) {
		var appCssUrl = "configuration/" + app.config.name + "/"+app.config.overrideStyle;
		$.ajax({
			url: appCssUrl
		})
		.done(function(response) {
			logger("INFO", "Successfully loaded " + appCssUrl);
			$("<link/>", {
				rel: "stylesheet",
				type: "text/css",
				href: appCssUrl
			}).appendTo("head");
			loadCustomAppLogo();
		})
		.fail(function(jqxhr, settings, exception) {
			loadCustomAppLogo();
		});
	} else {
		loadCustomAppLogo();
	}
}

/**
 * Function: loadCustomAppLogo
 * @param () none
 * @returns () nothing
 * Function that loads config specific css
 */
function loadCustomAppLogo() {
	if (app.config.overrideLogo) {
		var appLogoUrl = "configuration/" + app.config.name + "/"+app.config.overrideLogo;
		$.ajax({
			url: appLogoUrl
		})
		.done(function(response) {
			logger("INFO", "Successfully loaded " + appLogoUrl);
			$("#appImage").attr("src", appLogoUrl); // Point to new image
			$("#appImage").on("load", doLayout); // Redo app layout in case image is bigger than normal
			buildApplication();
		})
		.fail(function(jqxhr, settings, exception) {
			buildApplication();
		}); 
	} else {
		buildApplication();
	}
}

/**
 * Function: buildApplication
 * @param () none
 * @returns () nothing
 * Function that builds the application components
 */
function buildApplication() {
	// Check if TWM is being called from a valid domain
	if (isValidTwmDomain() === false) {
		// Set title/header to default
		document.title = "Transportation Web Map";
		if (isMobile()) { $("#appTitle").text(app.config.title.mobile); } else { $("#appTitle").text(app.config.title.desktop); }		
		
		// Display error/suggestion
		var msg = "<p class='text-center'><b>" + app.config.title.desktop + "</b><br><i>is not permitted to run on</i><br><b>"
				 + window.location.hostname + "</b><br><br>Please contact <a href='mailto:"
				 + app.config.contact.email + "?subject=" + app.config.title.desktop+" Inquiry'>" 
				 + app.config.contact.name + "</a> for assistance.</p>"
		var errorNotice = bootbox.dialog({
			title: "Forbidden Domain",
			message: msg,
			closeButton: false
		});
		
		// Bail
		hideMapSpinner();
		return;
	}
	
	// Set page meta tags
	if (app.config.meta) {
		if (app.config.meta.description) $('meta[name="description"]').attr('content', app.config.meta.description);
		if (app.config.meta.author) $('meta[name="author"]').attr('content', app.config.meta.author);
	}

	// Instantiate the Uber Search Class
	app.uberSearch = new UberSearch();
		
	// Get the map defaults from the config fileCreatedDate
	var mapInitialCentreLon = app.config.map.default.centre.longitude;
	var mapInitialCentreLat = app.config.map.default.centre.latitude;
	var mapInitialZoom = app.config.map.default.zoom;
	var mapMinZoom = app.config.map.zoom.min;
	var mapMaxZoom = app.config.map.zoom.max;
	var mapEnableRotation = app.config.map.enableRotation || false;
	
	// Use URL query parameters to override default variables (if specified)
	if (isNumeric(getUrlParameterByName("z"))) {
		mapInitialZoom = getUrlParameterByName("z");
		if (mapInitialZoom > mapMaxZoom) mapInitialZoom = mapMaxZoom;
		if (mapInitialZoom < mapMinZoom) mapInitialZoom = mapMinZoom;
	}
	if (isLongitude(getUrlParameterByName("lon"))) mapInitialCentreLon = getUrlParameterByName("lon");
	if (isLatitude(getUrlParameterByName("lat"))) mapInitialCentreLat = getUrlParameterByName("lat");
	
	// Define the controls
	var controls = [];
	
	// Define the scaleline control
	if (app.config.scaleline) {
		controls.push(
			new ol.control.ScaleLine({
				bar: app.config.scaleline.bar || false, 
				text: app.config.scaleline.text || true,
				units: app.config.scaleline.units || "metric",
				steps: app.config.scaleline.steps || 4,
				minWidth: app.config.scaleline.minWidth || 64
			})
		);
	} else if (app.config.scaleline === false) {
		app.scaleLine = null;
	} else {
		controls.push(
			new ol.control.ScaleLine({
				bar: false,
				text: true
			})
		);
	}
	
	// Build the map
	app.map = new ol.Map({
		target: "map",
		controls: ol.control.defaults.defaults({}).extend(controls),
		view: new ol.View({
			projection: "EPSG:3857",
			constrainResolution: false,
			center: ol.proj.fromLonLat([mapInitialCentreLon, mapInitialCentreLat]),
			zoom: mapInitialZoom,
			minZoom: mapMinZoom,
			maxZoom: mapMaxZoom,
			enableRotation: mapEnableRotation
		})
	});
	
	// Define the current map zoom level
	app.currentMapZoom = app.map.getView().getZoom();
	
	// Add all of the base layers (in reverse of config)
	// Baselayer zIndexes start what app.StartIndexForBaseLayers is defined at
	var zIndex = app.StartIndexForBaseLayers;
	$.each(app.config.map.layers.reverse(), function(index, layer) {
		if (layer.get("type") == "base") {
			// Add the layer to the map
			app.map.addLayer(layer);
			
			// Set the layer zIndex and increment
			layer.setZIndex(zIndex);
			zIndex++;
			
			// If current layer is a VectorTile layer, apply the assoc style
			if (layer instanceof ol.layer.VectorTile) {
				var styleUrl = layer.get("styleUrl");
				var styleKey = layer.get("styleKey");
				if (styleUrl && styleKey) {
					fetch(styleUrl).then(function(response) {
						response.json().then(function(glStyle) {
							// Apply ol font override for newer ESRI tilesets cuz mapbox-style can't use pbf embedded styles
							if (glStyle.hasOwnProperty("metadata")) {
								glStyle.metadata["ol:webfonts"] = "application/font/{font-family}/{fontweight}{-fontstyle}.css";
							}
							
							// If layer config contains a layer style override url, then fetch and apply the override
							if (layer.get("layerStyleOverrideUrl")) {
								fetch(layer.get("layerStyleOverrideUrl")).then(function(response) {
									response.json().then(function(overrides) {
										for (const layer of glStyle.layers) {
											mergeObjects(layer, overrides[layer.id] || {});
										}
										olms.applyStyle(layer, glStyle, styleKey);
									});
								});
								
							// No layer override configured, so apply the style
							} else {
								olms.applyStyle(layer, glStyle, styleKey);
							}
						});
					});
				} else {
					logger("ERROR", "Style could not be applied to Vector Tile layer named '"+layer.get("title")+"'");
				}
			}
			
			// Temporary statistic counter
			layer.getSource().on("tileloadend", function(e){
				recordStatistic("base-map-tile-load", [layer.get("title")]);
			});
			
		}
	});
	app.config.map.layers.reverse(); // Reset the array to original
	
	// Add all of the overlay layers (in reverse of config)
	// Overlay layer zIndexes start what app.StartIndexForOverlayLayers is defined at
	var zIndex = app.StartIndexForOverlayLayers;
	$.each(app.config.map.layers.reverse(), function(index, layer) {
		if (layer.get("type") == "overlay") {
			// Add the layer to the map
			app.map.addLayer(layer);
			
			// Set the layer zIndex and increment
			layer.setZIndex(zIndex);
			zIndex++;
			
			// Register the overlay layer with TWM after a short delay
			setTimeout(function(){ registerOverlayWithTWM(layer); }, 25);
		}
	});
	app.config.map.layers.reverse(); // Reset the array to original
	
	// Define and add an current location layer
	app.currentLocationLayer = new ol.layer.Vector({
		source: new ol.source.Vector({}),
		style: app.currentLocationStyle
	});
	app.map.addLayer(app.currentLocationLayer);
	app.currentLocationLayer.setZIndex(649);
	
	// Define and add an empty highlight layer
	app.highlightLayer = new ol.layer.Vector({
		source: new ol.source.Vector({}),
		style: getHighlightStyle
	});
	app.map.addLayer(app.highlightLayer);
	app.highlightLayer.setZIndex(650);
	
	// Define and add the popup overlay
	app.popupOverlay = new ol.Overlay({
		element: document.getElementById("popup"),
		autoPan: {
			animation: {
				duration: 750
			},
			margin: 10
		},
		offset: [0, -4]
	});
	app.map.addOverlay(app.popupOverlay);
	
	// Build the menu
	buildMenu();

	//Build Notification Centre
	buildNotificationCentre(app.config.name);

	// Load enabled plugins >>> runs init() when complete
	loadPlugins(init);
}

/**
 * Function: init
 * @param () none
 * @returns () nothing
 * Function that initializes the application
 */
function init() {
	// Check if the TWM revision in the "saved state" matches the current TWM revision.
	// If not clear the state.
	if (lsRetrieveItem("twm-revision")) {
		if (lsRetrieveItem("twm-revision") != app.revision) lsClearLocalStorage();
	}
	
	// Restore Application State
	restoreState();

	// Register the collapse/expand sidebar buttons
	$(".sidebar-collapse-btn").click(function(){
		hideSidebar();
	});
	$(".sidebar-expand-btn").click(function(){
		showSidebar();
	});
	
	// Register the collapse/expand bottom bar buttons
	$(".bottom-bar-expand-btn").click(function(){
		showBottomBar();
	});

	$("#bottom-bar-close").click(function(){
		hideBottomBar();
	});
	
	// Register window resize listener
	$(window).resize(function() {
		doLayout();
	});
		
	// Register map events
	$(app.map).on("moveend", function(e) {
		// Handle move or zoom changes
		rewriteUrl();
		rememberState();
		
		// Handle zoom changes
		var newZoom = app.map.getView().getZoom();
		if (app.currentMapZoom != newZoom) {
			app.currentMapZoom = newZoom;
			
			// Custom funcs
			closePopup();
		}
	});
	
	// Register popup closer
	$("#popup-closer").click(closePopup);
	
	// Set up tabs for scrolling (& add override styling)
	$(".sidebar-tabs").scrollingTabs({
		bootstrapVersion: 5,
		cssClassLeftArrow: "oi oi-chevron-left",
		cssClassRightArrow: "oi oi-chevron-right",
		disableScrollArrowsOnFullyScrolled: true,
		scrollToTabEdge: true,
		enableSwiping: true,
		tabClickHandler: function (e) {
			setTimeout(function(){
				$(".sidebar-tabs").scrollingTabs("scrollToActiveTab");
			}, 150);	
		}
	});
	
		
	// Register hidden function to open log file
	$("#appImage").dblclick(function() {
		showLog();
	});
		
	// Report local storage size to logger
	if (lsIsAvailable) {
		var lsReport = lsSizeReport();
		logger("INFO", "Local Storage Total Size: " + lsReport.size.toFixed() + lsReport.units);
		$.each(lsReport.items, function(index, item) {
			logger("INFO", " - Local Storage Item '" + item.key + "' Size: " + item.size.toFixed(1) + lsReport.units);
		});
	}
	
	// Watch for sidebar width changes and make layout adjustments if required
	setInterval(function(){
		if (!isMobile() && $("#sidebar").is(":visible")) {
			if ($("#sidebar").outerWidth() != app.config.sidebar.width) {
				app.config.sidebar.width = $("#sidebar").outerWidth();
				doLayout();
			}
		}
	}, 20);
	
	// Track session
	setInterval(function(){
		recordStatistic("session-track-duration");
	}, 1000);
	
	// Execute config specific init (if it exists)
	if ("init" in app.config && isFunction(app.config.init)) {
		app.config.init();
	}
	
	// Register escape key
	$(document).on("keydown", function(event) {
		if (event.key == "Escape") resetDefaultMapSingleClickFunction();
	});
	
	// Redo the layout after a short delay
	setTimeout(function(){
		doLayout();
	}, 500);
	
	// Store the TWM revision
	lsStoreItem("twm-revision", app.revision);
	
	// Finish loading
	hideMapSpinner();
}