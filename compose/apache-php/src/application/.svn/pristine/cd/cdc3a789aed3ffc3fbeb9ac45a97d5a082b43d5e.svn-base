/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: common.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Houses reusable functions.
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * Object: Base64
 * Functions: Base64.encode() & Base64.decode()
 * @params (string) string to encode or decode
 * @returns (string) encoded or decoded string
 * Function to encode or decode string to/from base64
 */
var Base64 = {
	_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},
	decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}
}

/**
 * Function: showMapSpinner
 * @param () none
 * @returns () nothing
 * Function that shows the map spinner
 */
function showMapSpinner() {
	if (isMobile() && $("#sidebar").is(":visible")) {
		// do nothing when mobile and sidebar is visible
	} else {
		if (app.mapSpinner) {
			app.mapSpinner.spin($("#map")[0]);
		} else {
			app.mapSpinner = new Spinner(app.spinnerOptionsMedium).spin($("#map")[0]);
		}
	}
}

/**
 * Function: hideMapSpinner
 * @param () none
 * @returns () nothing
 * Function that hides the map spinner
 */
function hideMapSpinner() {
	setTimeout(function(){ app.mapSpinner.stop(); }, 300);
}

/**
 * Function: logger
 * @param (string) type (one of ERROR, WARNING, INFO)
 * @param (string) message
 * @returns () nothing
 * Function that creates/appends to a simple runtime application log
 */
function logger(type, message) {
	var entry = {
		type: type,
		message: "[" + formatTimestamp(new Date()) + "] " + message
	}
	if (lsIsAvailable) {
		var log = lsRetrieveArray("log");
		if (log.length >= 500) log.shift(); // Never allow more than 500 log items in local storage
		log.push(entry);
		lsStoreItem("log", log);
	} else {
		app.log.push(entry);
	}
}

/**
 * Function: convertUTCToDeviceTime
 * @param (date) utc date string
 * @returns () nothing
 * Function converts UTC date to device time
 */
function convertUTCToDeviceTime(utcString) {
	const date = new Date(utcString);
	
	const options = {
	  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	  year: "numeric",
	  month: "2-digit",
	  day: "2-digit",
	  hour: "2-digit",
	  minute: "2-digit",
	  second: "2-digit",
	  hour12: false,
	};
   
	const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
	const lookup = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

	// Manually build an ISO 8601-like string in PDT (without "Z")
	return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;
  }


/**
 * Function: showLog
 * @param () none
 * @returns () nothing
 * Function that shows the application log
 */
function showLog() {
	// Get log from local storage or app array
	if (lsIsAvailable) {
		var log = lsRetrieveArray("log");
	} else {
		var log = app.log;
	}
	
	// Build the content
	var content = " ";
	$.each(log, function(index, entry) {
		switch (entry.type) {
			case "ERROR":
				content += "<span class='logger-error'>" + entry.type + ": " + entry.message + "</span><br>";
				break;
			case "WARN":
				content += "<span class='logger-warn'>" + entry.type + ": " + entry.message + "</span><br>";
				break;
			default:
				content += "<span class='logger-info'>" + entry.type + ": " + entry.message + "</span><br>";
		}
	});
	
	// If statistics are available, append them
	if (app.hasOwnProperty("statistics")) {
		var statistics = JSON.stringify(app.statistics, null, 2);
		content += "<span class='logger-info'>STATISTICS: " + statistics + "</span><br>";
	}
	
	// Show the log window
	var appLogDialog = bootbox.dialog({
		title: "Application Log",
		message: content,
		size: "extra-large",
		closeButton: true,
		centerVertical: true,
		buttons: {
			clearAppCache: {
				label: "Reset Application",
				className: 'btn-danger',
				callback: function(){
					if (lsIsAvailable) {
						lsClearLocalStorage();
						window.location = window.location.href.split("?")[0]+"?c="+app.config.name;
					} 
				}
			},
			downloadLog: {
				label: "Download Log",
				className: 'btn-info',
				callback: function(){
					downloadLog(log);
					return false;
				}
			}
		}
	});
	
	// Adjust window size and dialog styling behaviour
	$(appLogDialog).find(".bootbox-body").css("overflow-y", "auto"); 
	$(appLogDialog).find(".bootbox-body").css("overflow-x", "auto");
	$(appLogDialog).find(".bootbox-body").css("white-space", "nowrap");
	$(appLogDialog).find(".bootbox-body").height(($(window).height() - 250));
	
	// Hide session buttons if disabled in the config
	if (app.config.rememberState === false) {
		$(appLogDialog).find(".btn-load-session").hide();
		$(appLogDialog).find(".btn-download-session").hide();
	}
}

/**
 * Function: downloadLog
 * @param (object) log object
 * @returns () nothing
 * Function that downloads the application log
 */
function downloadLog(log) {
	// Convert the passed log into a content string
	var content = "";
	$.each(log, function(index, entry) {
		content += entry.type + " - " + entry.message + "\n";
	});
	
	// If statistics are available, append them
	if (app.hasOwnProperty("statistics")) {
		var statistics = JSON.stringify(app.statistics, null, 2);
		content += "SESSION STATISTICS:\n" + statistics + "\n";
	}
	
	// Create a hidden download link and click it
	var link = document.createElement("a");
	link.download = "TWM-" + window.location.hostname + ".log";
	link.href = "data:text/html;charset=utf-8," + encodeURIComponent(content);
	link.click();
}

/**
 * Function: downloadSession
 * @param () none
 * @returns () nothing
 * Function that downloads the session (state) file
 */
function downloadSession() {
	// Get the application state object from local storage
	var state = lsRetrieveObject("state-"+app.config.name);

	// Convert json state into a string
	var content = JSON.stringify(state, null, "\t");
		
	// Create a hidden download link and click it
	var link = document.createElement("a");
	link.download = "TWM-" + app.config.name + ".json";
	link.href = "data:application/json;charset=utf-8," + encodeURIComponent(content);
	link.click();
}

/**
 * Function: loadSessionFromFile
 * @param () none
 * @returns () nothing
 * Function that upload a session (state) file and applies it
 */
function loadSessionFromFile() {
	$("<input type='file' accept='application/json'>").on('change', function () {
		// If a file was selected, then engage the FileReader
		if (this.files && this.files[0]) {
			var fileReader = new FileReader();
			fileReader.onload = function(evt) {
				if (evt && evt.target && evt.target.result) {
					showMapSpinner();
					try {
						// Create a state object from the loaded file
						var state = JSON.parse(evt.target.result);
						
						// Write the newly created state object to the local storage state
						lsStoreItem("state-"+app.config.name, state);
					
						// Reload the page
						location.reload();
						
					} catch(err) {
						hideMapSpinner();
						logger("ERROR", "Cannot read session file - "+err);
						var errorNotice = bootbox.dialog({
							title: "Error",
							message: "<p class='text-center'>Cannot read session file<br></p>",
							closeButton: true,
							centerVertical: true
						});
					}
				}
			}
			fileReader.readAsText(this.files[0]);
		}
	}).click();
}

/**
 * Function: showAdvertisedApplications
 * @param () none
 * @returns () nothing
 * Function that shows the advertised applications based on config
 */
function showAdvertisedApplications() {
	// Get the advertised applications config
	$.ajax({
		type: "GET",
		url: "configuration/registered-applications.json",
		cache: false,
		dataType: "json"
	})
	
	// Handle success
	.done(function(response) {
		// Define the content element
		var content = $("<div>", {class: "content"});

		// Add some CSS
		content.css("overflow-y", "auto");
	
		// Get the advertised apps
		var registeredApplications = response.applications;
	
		// Loop thru each registered application and add it to the content
		$.each(registeredApplications, function(index, registeredApplication) {
			
			// Skip if not advertised
			if (!registeredApplication.advertised) return;
			
			// Define the cover image to use (will automatically be replaced with default if not found)
			var appCoverImage = "configuration/"+registeredApplication.config+"/app-cover-image.png";

			// Create the application card
			var appCard = $(`<div class="card m-3 float-start twm-app-card">
								<img class="card-img-top" src="${appCoverImage}" alt="${registeredApplication.name}" onerror="this.onerror=null;this.src='application/img/app-cover-image-default.png';">
								<div class="card-body font-weight-bold text-center p-1">
									${registeredApplication.name}
								</div>
							</div>`);
			appCard.data("config", registeredApplication.config);
							
			// Add the click event
			appCard.click(function(e){
				window.open(window.location.href.split("?")[0]+"?c="+$(this).data("config"), "_blank");
			});
			
			// Add the card
			content.append(appCard);
		})
		
		// Add the generated content to TWM (also set page title, etc.)
		$("#twm-content").html(content);
		document.title = "Transportation Web Map";
		$("#appTitle").text("Transportation Web Map");
		$("#appTitle").css("font-size", "1rem"); // hack to make it fit :-(
	})
	
	// Handle failure
	.fail(function(jqxhr, settings, exception) {
		logger("ERROR", "Error getting registered applications");
	}); 
}

/**
 * Function: recordStatistic
 * @param (string) type
 * @param (array) params
 * @returns () nothing
 * Function that records a application statistic based on type and an optional set of params (in an array)
 */
function recordStatistic(type, params) {
	// Optional params
	params = params || [];
	
	// Create statistic object if required
	if (!app.hasOwnProperty("statistics")) app.statistics = new Object();
	
	// Record statistic
	switch(type) {
		case "session-start-time":
			if (!app.statistics.hasOwnProperty("sessionStartTime")) app.statistics.sessionStartTime = Date.now();
			if (!app.statistics.hasOwnProperty("sessionDurationSeconds")) app.statistics.sessionDurationSeconds = 0;
			break;
		case "session-track-duration":
			app.statistics.sessionDurationSeconds = Math.floor((Date.now() - app.statistics.sessionStartTime) / 1000);
			break;
	
		case "base-map-tile-load":
			if (!app.statistics.hasOwnProperty("basemapTileLoads")) app.statistics.basemapTileLoads = new Object();
			if (!app.statistics.basemapTileLoads.hasOwnProperty(params[0])) app.statistics.basemapTileLoads[params[0]] = 0;
			app.statistics.basemapTileLoads[params[0]]++;
			break;
	}
}

/**
 * Function: buildMenu
 * @param () none
 * @returns () nothing
 * Function that adds items to the menu and displays it
 */
function buildMenu() {
	// Add session management buttons
	if (app.config.rememberState === true && app.config.allowSessionManagement === true) {
		var btnDownloadSession = $("<button class='dropdown-item' type='button'><span class='menu-icon oi oi-data-transfer-download'></span>Download Session</button>");
		btnDownloadSession.on("click", downloadSession);
		$("#mainMenuOptions").append(btnDownloadSession);
		var btnLoadSession = $("<button class='dropdown-item' type='button'><span class='menu-icon oi oi-data-transfer-upload'></span>Load Session</button>");
		btnLoadSession.on("click", loadSessionFromFile);
		$("#mainMenuOptions").append(btnLoadSession);
	}
	
	// Add item from config menuOptions
	if (app.config.menuOptions) {
		$.each(app.config.menuOptions, function(index, menuOption) {
			// Regular menu options
			if (menuOption.text && menuOption.iconCls && menuOption.action) {
				var menuItem = $("<button class='dropdown-item' type='button' data-option-name='"+menuOption.text+"'><span class='menu-icon "+menuOption.iconCls+"'></span>"+menuOption.text+"</button>");
				switch(menuOption.action) {
					case "link":
						menuItem.on("click", function(){
							var win = window.open(menuOption.url, "_blank");
							win.focus();
						});
						break;
					case "dialog":
						menuItem.on("click", function(){
							showModalDialogFromUrl(menuOption.text, menuOption.url, "lg");
						});
						break;
					case "function":
						menuItem.on("click", function(){
							menuOption.function()
						});
						break;
				}
				if (menuOption.hidden && menuOption.hidden === true) menuItem.hide();
				$("#mainMenuOptions").append(menuItem);
				
			// Menu divider
			} else if (menuOption.divider === true) {
				$("#mainMenuOptions").append($("<div class='dropdown-divider'></div>"));
			} 			
		});		
	}
}

/**
 * Function: buildNotificationCentre
 * @param () none
 * @returns () nothing
 * Function that adds notifications to Notification Centre
 */
function buildNotificationCentre(appName) {
  	const notificationMenuOptions = document.getElementById("notificationMenuOptions");
    const notificationToggle = document.getElementById("notificationToggle");

    // Define request options for WFS
    const options = {
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeNames: "hwy:ISS_NOTIFICATION",
        outputFormat: "application/json",
        maxFeatures: 5,
        srsName: app.map.getView().getProjection().getCode(),
        
    };

    $.ajax({
        type: "GET",
		url: returnEnvironmentUrl("ogs-public") + "/ows",
        dataType: "json",
        data: options,
        success: function(data) {
            const features = data.features || [];

            if (features.length === 0) {
                notificationMenuOptions.innerHTML = '<div class="dropdown-item text-muted">No notifications at this time</div>';
                return;
            }

            const now = new Date();
            const futureNotifications = features
                .map(f => f.properties)
                .filter(notification => {
                    const startDate = new Date(notification.START_TIME);
                    const endDate = new Date(notification.END_TIME);
                    return now < endDate;
                })
                .sort((a, b) => new Date(a.START_TIME) - new Date(b.START_TIME));

            let notificationCount = 0;
            notificationMenuOptions.innerHTML = "";

             futureNotifications.forEach(notification => {
                
                // Get the app instance using the helper function from environments.js
                var appInstance = getAppInstance();
                
                // Check if the notification is for the current instance
                if(notification.INSTANCE == appInstance){
                    // Check if the notification is for the current app
                    if(notification.APP === null || notification.APP === appName) {
						const title = notification.TITLE || "Untitled";
						const message = notification.DESCRIPTION || "";
						const startDate = notification.START_TIME ? new Date(notification.START_TIME) : null;

						const countdownContainer = document.createElement("em");
						countdownContainer.textContent = "Calculating...";

						const updateCountdown = () => {
							const now = new Date();
							let countdownText = "Unknown Date";
							if (startDate) {
								const timeDiff = startDate - now;
								if (timeDiff > 0) {
									const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
									const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
									const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
									const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

									countdownText = days > 0
										? `Starts in ${days} day(s)`
										: `Starts in ${hours} hour(s), ${minutes} minute(s), and ${seconds} second(s)`;
								} else {
									countdownText = "Ongoing";
								}
							}
							countdownContainer.textContent = countdownText;
						};
						
					

						updateCountdown();
						setInterval(updateCountdown, 1000);

						const notificationItem = document.createElement("div");
						notificationItem.className = "dropdown-item";
						notificationItem.innerHTML = `
							<strong>${title}</strong><br>
							<small>${startDate ? new Intl.DateTimeFormat('en-US', {
								dateStyle: 'long',
								timeStyle: 'short'
							}).format(startDate) : "Unknown Date"}</small><br>
							<span>${message}</span><br>
						`;
						notificationItem.appendChild(countdownContainer);

						notificationMenuOptions.appendChild(notificationItem);
						notificationCount++;
					}
				}
            });

            if (notificationCount > 0) {
				//show notification icon
				$("#notificationCenter").show();

                let badge = notificationToggle.querySelector(".badge");
                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "position-absolute badge rounded-pill bg-danger";
                    notificationToggle.appendChild(badge);
                }
                badge.textContent = notificationCount;
                badge.style.top = "10%";
                badge.style.right = "10%";
                badge.style.transform = "translate(50%, -50%)";

                notificationToggle.classList.add("tilt-shake");
                setTimeout(() => {
                    notificationToggle.classList.remove("tilt-shake");
                }, 500);
            } else {
                notificationMenuOptions.innerHTML = '<div class="dropdown-item text-muted">No upcoming notifications</div>';
            }
        },
        error: function(xhr, status, error) {
            console.error("Error loading notifications:", error);
            notificationMenuOptions.innerHTML = '<div class="dropdown-item text-muted">No notifications available</div>';
        }
    });
}


/**
 * Function: getLayerStyle
 * @param (string) sldUrl - The URL to fetch the SLD XML.
 * @param (string) propertyName - The property name to match styles.
 * @returns (function) A function that returns the style for a given feature.
 */
function getLayerStyle(sldUrl, propertyName) {
    var cachedStyles = {};
    // Fetch the SLD with the correct Accept header
    fetch(sldUrl, {
        headers: {
            "Accept": "application/vnd.ogc.sld+xml" // Explicitly request SLD XML
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch SLD: " + response.statusText);
            }
            return response.text();
        })
        .then(sldText => {
            // Parse the SLD XML manually
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(sldText, "text/xml");

            // Extract all rules
            var rules = xmlDoc.querySelectorAll("sld\\:Rule, Rule");
            rules.forEach(rule => {
                // Extract the filter property and literal value
                var rulePropertyName = rule.querySelector("ogc\\:PropertyName, PropertyName")?.textContent;
                var literalValue = rule.querySelector("ogc\\:Literal, Literal")?.textContent;

                // Extract stroke and fill styles
                var strokeColor = rule.querySelector("sld\\:CssParameter[name='stroke'], CssParameter[name='stroke']")?.textContent || '#000000';
                var strokeWidth = parseFloat(rule.querySelector("sld\\:CssParameter[name='stroke-width'], CssParameter[name='stroke-width']")?.textContent) || 1;
                var fillColor = rule.querySelector("sld\\:CssParameter[name='fill'], CssParameter[name='fill']")?.textContent || 'rgba(255, 255, 255, 0)';

                // Cache the style for the literal value
                if (rulePropertyName === propertyName && literalValue) {
                    cachedStyles[literalValue] = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: strokeColor,
                            width: strokeWidth
                        }),
                        fill: new ol.style.Fill({
                            color: fillColor
                        })
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error loading SLD:", error);
        });

    // Return a function that uses the cached styles
    return function (feature) {
        var featureValue = feature.get(propertyName);
        return cachedStyles[featureValue] || new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#000000', // Default stroke color
                width: 1 // Default stroke width
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.5)' // Default fill color
            })
        });
    };
}

/**
 * Function: getLayerStatus
 * @param (integer) layerId
 * @returns () nothing
 * Function that gets the layer status (error, loading, nothing)
 */
function getLayerStatus(layerId) {
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
	
	// Return State
	return state;
}

/**
 * Function: showModalDialog
 * @param (string) title
 * @param (string) content
 * @param (string) size (one of 'sm', 'lg', or 'xl')
 * @param (boolean) hideCloseBtn
 * @returns () nothing
 * Function that opens a modal dialog and displays the passed content
 */
function showModalDialog(title, content, size, hideCloseBtn) {
	size = size || null;
	hideCloseBtn = hideCloseBtn || false;
	bootbox.dialog({
		title: title,
		message: content,
		size: size,
		closeButton: !hideCloseBtn,
		centerVertical: true
	});
}

/**
 * Function: showModalDialogFromUrl
 * @param (string) title
 * @param (string) contentUrl
 * @param (string) size (one of 'sm', 'lg', or 'xl')
 * @param (boolean) hideCloseBtn
 * @returns () nothing
 * Function that opens a modal dialog and displays the content contained within the passed url
 */
function showModalDialogFromUrl(title, contentUrl, size, hideCloseBtn) {
	size = size || null;
	hideCloseBtn = hideCloseBtn || false;
	$.ajax({
		url: contentUrl,
		dataType: "html"
	})
	.done(function(content) {
		bootbox.dialog({
			title: title,
			message: content,
			size: size,
			closeButton: !hideCloseBtn,
			centerVertical: true
		});
	})
	.fail(function(jqxhr, settings, exception) {
		bootbox.dialog({
			title: title,
			message: exception,
			closeButton: true,
			centerVertical: true
		});
	}); 
}

/**
 * Function: showLoadingScreen
 * @param (object) options
 *    {
 *	     message: "hello world",    // OPTIONAL: string to display.
 *		 progress: 66,              // OPTIONAL: integer between 0 and 100 (use -1 to hide).
 *		 imageUrl: "path to image", // OPTIONAL: string path to background image.  Image size determines dialog size.
 *		 size: "sm"                 // OPTIONAL: one of 'sm', 'lg', or 'xl' - NOTE: this is overridden if imageUrl is specified.
 *    }
 * @returns () nothing
 * Function that shows a modal loading screen using the passed config object
 */
function showLoadingScreen(options) {
	size = (options.size) ? options.size : "sm";
	var showDialog = true;
	
	// Update image if not null.  Will preload image before showing loading screen if necessary.
	if (options.imageUrl) {
		size = "xl";
		showDialog = false;
		var img = new Image();
		img.onload = function() {
			// Calculate ideal loading screen height/width based on image size
			var maxWidth = $(window).width() - 10;
			var loadingScreenWidth = this.width;
			var loadingScreenHeight = this.height;
			if (loadingScreenWidth > maxWidth) {
				loadingScreenWidth = maxWidth;
				loadingScreenHeight = maxWidth * (this.height / this.width);
			}
			
			// Adjust bootbox dialog accordingly			
			$("#loadingScreenMessage").closest(".modal-dialog").width(loadingScreenWidth);
			$("#loadingScreenMessage").closest(".modal-content").css("background-repeat", "no-repeat");
			$("#loadingScreenMessage").closest(".modal-content").css("background-position", "center");
			$("#loadingScreenMessage").closest(".modal-content").css("background-size", "cover");
			$("#loadingScreenMessage").closest(".modal-content").css("background-image", "url('"+options.imageUrl+"')");
			$("#loadingScreenMessage").closest(".modal-content").width(loadingScreenWidth);
			$("#loadingScreenMessage").closest(".modal-content").height(loadingScreenHeight);
			
			// Show bootbox dialog
			showDialog = true;
			app.loadingScreen.modal("show");
		}
		img.src = options.imageUrl;
	}
	
	// Build and show loading screen if it does not already exist
	if (!app.loadingScreen) {
		var content = `
			<div id="loadingScreenMessage"></div>
			<div id="loadingScreenProgress" class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100">
				<div class="progress-bar"></div>
			</div>
		`;
		app.loadingScreen = bootbox.dialog({
			show: showDialog,
			message: content,
			size: size,
			closeButton: false,
			centerVertical: true
		});
	}
	
	// Update message if not null
	if (options.message) $("#loadingScreenMessage").html(options.message);
	
	// Update progress if not null
	if (options.progress) {
		if (options.progress > 100) options.progress = 100;
		if (options.progress >= 0 && options.progress <= 100) {
			$("#loadingScreenProgress").show();
			$("#loadingScreenProgress .progress-bar").width(options.progress + "%");
			$("#loadingScreenProgress .progress-bar").html(options.progress + "%");
		} else {
			$("#loadingScreenProgress").hide();
		}
	}
	
	// Update margins based on visibility of content and progress bar
	if ($("#loadingScreenProgress").is(":visible")) {
		if ($("#loadingScreenMessage").hasClass("mb-4") === false) {
			$("#loadingScreenMessage").addClass("mb-4");
		}
	} else {
		if ($("#loadingScreenMessage").hasClass("mb-4") === true) {
			$("#loadingScreenMessage").removeClass("mb-4");
		}
	}
}

/**
 * Function: closeLoadingScreen
 * @param () none
 * @returns () nothing
 * Function that closes a modal loadingscreen
 */
function closeLoadingScreen() {
	setTimeout(function(){
		app.loadingScreen.modal("hide");
	}, 200);
}

/**
 * Function: convertFunctionToString
 * @param (function) function
 * @returns (string) string
 * Function that converts a JS function to a string - used for session export
 */
function convertFunctionToString(fn) {
	var string = JSON.stringify(fn, function(key, value) {
		if (typeof value === "function") {
			return "/Function(" + value.toString() + ")/";
		}
		return value;
	});
	return string;	
}

/**
 * Function: convertStringToFunction
 * @param {string} string
 * @returns {object} parsed object with functions restored
 * Converts specially-serialized functions of the form /Function(...)/ back into actual JS functions.
 */
function convertStringToFunction(string) {
    return JSON.parse(string, function(key, value) {
        if (typeof value === "string" && value.startsWith("/Function(") && value.endsWith(")/")) {
            const fnBody = value.slice(10, -2); // extract function body
            try {
                // Wrap in parentheses to allow function expressions
                // Only use Function constructor if you trust the source
                const fn = new Function("return " + fnBody)();
                if (typeof fn === "function") return fn;
                console.warn("convertStringToFunction: parsed value is not a function:", fnBody);
                return null;
            } catch (err) {
                console.error("convertStringToFunction: failed to parse function:", fnBody, err);
                return null;
            }
        }
        return value;
    });
}

/**
 * Function: isConvertedFunction
 * @param (variant) value
 * @returns (boolean) function
 * Function that determines if the passed value is a function converted 
 * to a string by the "convertStringToFunction" function.
 */
function isConvertedFunction(value) {			
	if (typeof value === "string") {
		if (value.startsWith("\"/Function(") && value.endsWith(")/\"")) {
			return true;
		}
	}
	return false;
}

/**
 * Function: formatCoordinateAsString
 * @param (array) coordinate
 * @param (integer) epsg
 * @returns (string) formatted coordinate
 * Function that converts a coordinate to a human readable string format based on EPSG
 */
function formatCoordinateAsString(coordinate, epsg) {
	switch(parseInt(epsg)) {
		case 4326:
			return coordinate[0].toString().slice(0,11) + ", " + coordinate[1].toString().slice(0,9);
		default:
			return "Unknown EPSG";
	}	
}

/**
 * Function: convertStringToCoordinate
 * @param (string) str
 * @param (integer) requestedEpsg
 * @returns (object) location
 * Function that converts a string (based on best guess) to a coordinate in the requested output EPSG
 */
function convertStringToCoordinate(str, requestedEpsg) {
	// Define the location object
	var location = new Object();
	
	// Try ESPG 4326 longitude/latitude seperated by a ', ' or a ','
	if (str.split(", ").length == 2 || str.split(",").length == 2) {
		var first, second;
		if (str.split(", ").length == 2) {
			first = str.split(", ")[0];
			second = str.split(", ")[1];
		}
		if (str.split(",").length == 2) {
			first = str.split(",")[0];
			second = str.split(",")[1];
		}
		if (isLongitude(first) && isLatitude(second)) {
			location.coordinate = [parseFloat(first), parseFloat(second)];
			location.epsg = 4326;
			location.category = "Longitude/Latitude Coordinate";
		} else if (isLongitude(second) && isLatitude(first)) {
			location.coordinate = [parseFloat(second), parseFloat(first)];
			location.epsg = 4326;
			location.category = "Latitude/Longitude Coordinate";
		}
	}

	// Return empty object if string could not be converted into a coordinate
	if (!location.hasOwnProperty("category")) return location;
	
	// Do location transformation if required
	if (parseInt(requestedEpsg) != location.epsg) {
		location.coordinate = ol.proj.transform(location.coordinate, "EPSG:"+location.epsg, "EPSG:"+requestedEpsg);
		location.epsg = parseInt(requestedEpsg);
	}
	
	// Return the location object
	return location;
}

/**
 * Function: convertDuration
 * @param (integer) milliseconds
 * @returns (string) human readable duration
 * Function that converts a duration to a human readable format
 */
function convertDuration(millisec) {
	var seconds = (millisec / 1000).toFixed(1);
	var minutes = (millisec / (1000 * 60)).toFixed(1);
	var hours = (millisec / (1000 * 60 * 60)).toFixed(1);
	var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);
	if (seconds < 60) {
		return seconds + " seconds";
	} else if (minutes < 60) {
		return minutes + " minutes";
	} else if (hours < 24) {
		return hours + " hours";
	} else {
		return days + " days"
	}
}

/**
 * Function: formatTimestamp
 * @param (object) date (timestamp)
 * @returns () formated timestamp string
 * Function that formats a timestamp to a TWM standard human readable timestamp (YYYY-MM-DD HH:MM:SS)
 */
function formatTimestamp(timestamp) {
	var year = timestamp.getFullYear();
	var month = ((timestamp.getMonth() + 1) < 10) ? "0" + (timestamp.getMonth() + 1) : (timestamp.getMonth() + 1);
	var dom = ((timestamp.getDate()) < 10) ? "0" + (timestamp.getDate()) : (timestamp.getDate());
	var hour = ((timestamp.getHours()) < 10) ? "0" + (timestamp.getHours()) : (timestamp.getHours());
	var minute = ((timestamp.getMinutes()) < 10) ? "0" + (timestamp.getMinutes()) : (timestamp.getMinutes());
	var second = ((timestamp.getSeconds()) < 10) ? "0" + (timestamp.getSeconds()) : (timestamp.getSeconds());
	return year + "-" + month + "-" + dom + " " + hour + ":" + minute + ":" + second;
}

/**
 * Function: formatDate
 * @param (object) date (timestamp)
 * @returns () formated date string
 * Function that formats a timestamp to a TWM standard human readable date (YYYY-MM-DD)
 */
function formatDate(timestamp) {
	var year = timestamp.getFullYear();
	var month = ((timestamp.getMonth() + 1) < 10) ? "0" + (timestamp.getMonth() + 1) : (timestamp.getMonth() + 1);
	var dom = ((timestamp.getDate()) < 10) ? "0" + (timestamp.getDate()) : (timestamp.getDate());
	return year + "-" + month + "-" + dom;
}

/**
 * Function: formatPhoneNumber
 * @param (string) phone number
 * @returns () formated phone number
 * Function that formats a number into a human readable phone number
 */
function formatPhoneNumber(string) {
	// Filter only numbers from the input
	let cleaned = ('' + string).replace(/\D/g, '');

	// Check if the input is of correct
	let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);

	if (match) {
	// Remove the matched extension code
	// Change this to format for any country code.
	let intlCode = (match[1] ? '+1 ' : '')
		return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
	}
	
	return null;
}

/**
 * Function: loadPlugins
 * @param (function) call back function
 * @returns () nothing
 * Function that loads and initializes enabled plugins in order
 */
function loadPlugins(callback) {
	// Define the list of plugins to load
	var pluginsToLoad = [];
	$.each(app.config.plugins, function(index, plugin) {
		if (plugin.enabled) pluginsToLoad.push(plugin.name);
	});
	
	// Define the function that registers the plugins (in order)
	var registerPlugins = function() {
		$.each(pluginsToLoad, function(index, name) {
			var PluginClass = (new Function("return " + name))();
			app.plugins[name] = new PluginClass();
		});
		callback(); // should be the init() function
	}
	
	// Load the plugin scripts
	var loadedPluginCount = 0;
	$.each(pluginsToLoad, function(index, name) {
		var file = "application/plugins/"+name+"/plugin.js";
		$.ajax({
			url: file,
			dataType: "script"
		})
		.done(function(response) {
			loadedPluginCount++;
			
			// When all of the plugins are loaded, register them in order
			if (loadedPluginCount >= pluginsToLoad.length) {
				registerPlugins();
			}
		})
		.fail(function(jqxhr, settings, exception) {
			logger("ERROR", name + ": Plugin failed to load");
		});
	});
}

/**
 * Function: getPluginConfig
 * @param (string) plugin name
 * @returns () plugin config
 * Function that retrieves the plugin config
 */
function getPluginConfig(name) {
	var pcfg;
	$.each(app.config.plugins, function(index, plugin) {
		if (plugin.name == name) {
			pcfg = plugin;
		}
	});
	return pcfg;
}

/**
 * Function: getUrlParameterByName
 * @param (string) name
 * @returns (string) value
 * Function that returns the value of a passed query parameter name
 */
function getUrlParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return null;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Function: updateUrlParameter
 * @param (string) url
 * @param (string) key
 * @param (string) value
 * @returns (string) modified url
 * Function that returns an updated url based on the query key/value passed
 */
function updateUrlParameter(url, key, value) {
	if (!url) return "";
	var re = new RegExp("([?&])" + key + "=.*?(&|#|$)", "i");
	if (value === undefined) {
		if (url.match(re)) {
			return url.replace(re, '$1$2').replace(/[?&]$/, '').replaceAll(/([?&])&+/g, '$1').replace(/[?&]#/, '#');
		} else {
			return url;
		}
	} else {
		if (url.match(re)) {
			return url.replace(re, '$1' + key + "=" + value + '$2');
		} else {
			var hash =  '';
			if( url.indexOf('#') !== -1 ){
				hash = url.replace(/.*#/, '#');
				url = url.replace(/#.*/, '');
			}
			var separator = url.indexOf('?') !== -1 ? "&" : "?";    
			return url + separator + key + "=" + value + hash;
		}
	}
}

/**
 * Function: isFunction
 * @params (function) f
 * @returns (boolean) 
 * Function that returns the boolean state of whether a passed variable is a function
 */
function isFunction(f) {
	if (typeof f === "function") { return true; } else { return false; }
}

/**
 * Function: isInt
 * @params (string) value
 * @returns (boolean) 
 * Function that returns the boolean state of whether a passed variable is an integer
 */
function isInt(value) {
	return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

/**
 * Function: isNumeric
 * @params (string) value
 * @returns (boolean) 
 * Function that returns the boolean state of whether a passed variable is numeric
 */
function isNumeric(value) {
	return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Function: isLatitude
 * @params (string) value
 * @returns (boolean) 
 * Function that returns the boolean state of whether a passed variable is a valid latitude
 */
function isLatitude(value) {
	if(isNumeric(value)) if(parseFloat(value) >= -90 && parseFloat(value) <= 90) return true;
	return false;
}

/**
 * Function: isLongitude
 * @params (string) value
 * @returns (boolean) 
 * Function that returns the boolean state of whether a passed variable is a valid longitude
 */
function isLongitude(value) {
	if(isNumeric(value)) if(parseFloat(value) >= -180 && parseFloat(value) <= 180) return true;
	return false;
}

/**
 * Function: lsIsAvailable
 * @params () none
 * @returns (boolean) whether local storage is available
 * Function to test if local storage is available
 */
function lsIsAvailable() {
    try {
        localStorage.setItem("ls-test", "...");
        localStorage.removeItem("ls-test");
        return true;
    } catch(e) {
        return false;
    }
}

/**
 * Function: lsSizeReport
 * @params () none
 * @returns (object) report object
 * Function to return a size report of local storage items
 */
function lsSizeReport() {
	var report = {};
	report.size = 0;
	report.units = "KB";
	report.items = [];
	var lsItemSize;
	var lsKey;
	for (lsKey in localStorage) {
		if (!localStorage.hasOwnProperty(lsKey)) continue;
		lsItemSize = ((localStorage[lsKey].length + lsKey.length) * 2);
		report.size += lsItemSize / 1024;
		report.items.push({key: lsKey, size: lsItemSize / 1024});
	};
	return report;
}

/**
 * Function: lsStoreItem
 * @params (string) key
 * @params (string) value
 * @returns (boolean) success
 * Function that uses local storage to store an item
 */
function lsStoreItem(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch(e) {
		return false;
	}
}

/**
 * Function: lsRemoveItem
 * @params (string) key
 * @returns (boolean) success
 * Function that removes an item from local storage
 */
function lsRemoveItem(key) {
	try {
		localStorage.removeItem(key);
		return true;
	} catch(e) {
		return false;
	}
}

/**
 * Function: lsRetrieveItem
 * @params (string) key
 * @returns (string or null) item (based on key) or null if failed
 * Function that retrieves an item from local storage
 */
function lsRetrieveItem(key) {
	try {
		return JSON.parse(localStorage.getItem(key));
	} catch(e) {
		return null;
	}
}

/**
 * Function: lsRetrieveArray
 * @params (string) key
 * @returns (array) array based on key or empty array if not found
 * Function that retrieves an array from local storage
 */
function lsRetrieveArray(key) {
	if (lsRetrieveItem(key) != null) {
		return lsRetrieveItem(key);
	} else {
		return [];
	}
}

/**
 * Function: lsRetrieveObject
 * @params (string) key
 * @returns (object) object based on key or empty object if not found
 * Function that retrieves an object from local storage
 */
function lsRetrieveObject(key) {
	if (lsRetrieveItem(key) != null) {
		return lsRetrieveItem(key);
	} else {
		return {};
	}
}

/**
 * Function: lsClearLocalStorage
 * @params () none
 * @returns () nothing
 * Function to clear all local storage
 */
function lsClearLocalStorage() {
	localStorage.clear();
}

/**
 * Function: isMobile
 * @param (string) name
 * @returns (boolean) value
 * Function that determines whether the client is a mobile device
 */
function isMobile() {
	if($(window).width() > 768) {
		return false;
	} else {
		return true;
	}
}

/**
 * Function: isSafari
 * @param (string) name
 * @returns (boolean) value
 * Function that determines whether the client is the Safari browser
 */
function isSafari() {
	var safariTest = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
			   navigator.userAgent &&
			   navigator.userAgent.indexOf('CriOS') == -1 &&
			   navigator.userAgent.indexOf('FxiOS') == -1;
	return safariTest;
}

/**
 * Function: loadTemplate
 * @param (string) filename
 * @param (object) callback
 * @returns () nothing
 * Function that loads and returns an HTML template through a specified callback function
 */
function loadTemplate(filename, callback) {
	$.ajax({
		url: filename,
		cache: false,
		dataType: "html"
	})
	.done(function(response) {
		callback(true, response);
	})
	.fail(function(jqxhr, settings, exception) {
		callback(false, null);
	}); 
}

/**
 * Function: addSideBarTab
 * @param (string) name
 * @param (string) filename
 * @param (object) callback
 * @returns () nothing
 * Function that adds a tab to the sidebar
 */
function addSideBarTab(name, filename, callback) {
	// Normalize the name so it can be used for element IDs, etc.
	var nName = name.replace(/[ `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
	
	// Add nav tab
	var tabButton = $(`
		<li class="nav-item" role="presentation">
			<button id="${nName}-tab-nav" class="nav-link" data-bs-toggle="tab" data-bs-target="#${nName}-tab-content" type="button" role="tab">${name}</button>
		</li>
	`);
	var tabContent = $(`
		<div id="${nName}-tab-content" class="tab-pane fade" role="tabpanel"></div>
	`);
	$("#sidebar-tab-navs").append(tabButton);
	$("#sidebar-tab-content").append(tabContent);
	
	// Set active if its the first tab
	if ($("#sidebar-tab-navs > li").length == 1) {
		$("#"+nName+"-tab-nav").tab("show");
	}
	
	// Load content into the tab
	$.ajax({
		url: filename,
		cache: false,
		dataType: "html",
		success: function(data) {
			$("#"+nName+"-tab-content").html(data);
			callback(true, $("#"+nName+"-tab-nav"), $("#"+nName+"-tab-content"));
		}
	});
}

/**
 * Function: doLayout
 * @param () none
 * @returns () nothing
 * Function that adjusts the application appearance
 */
function doLayout() {
	// Set title and header
	document.title = app.config.title.desktop; // tab or window title
	if (isMobile()) {
		$("#appTitle").text(app.config.title.mobile);
	} else {
		$("#appTitle").text(app.config.title.desktop);
	}
	
	// Define popup min/max widths and height
	app.popupMaxHeight = $("#map").height() - 75;
	app.popupMinWidth = 325;
	app.popupMaxWidth = $("#map").width() - 25;
	if (isMobile()) {
		if (app.popupMinWidth > app.popupMaxWidth) app.popupMinWidth = app.popupMaxWidth;
	} else {
		if (app.popupMaxWidth < app.popupMinWidth) app.popupMinWidth = app.popupMaxWidth;
	}
	
	// Adjust popup's max height
	$("#popup").css("max-height", app.popupMaxHeight+"px");
	
	// Adjust popup's min & max width
	$("#popup").css("min-width", app.popupMinWidth+"px");
	$("#popup").css("max-width", app.popupMaxWidth+"px");
	
	// Adjust popup's content min width (so user cannot shrink it anymore)
	$(".ol-popup-content").css("min-width", app.popupMinWidth+"px");
	
	// Adjust sidebar based on visibility
	if ($("#sidebar").is(":visible")) {
		// If mobile
		if (isMobile()) {
			$("#sidebar").outerWidth($(window).width());
			$("#content").css("left", $(window).width());
		
		// If desktop
		} else {
			$("#sidebar").outerWidth(app.config.sidebar.width);
			$("#content").css("left", $("#sidebar").outerWidth());
		}
		
		// Refresh and reposition scrolling tabs (if required)
		$(".sidebar-tabs").scrollingTabs("refresh", {forceActiveTab: true});
		
		// Adjust tab content size
		var tabContainerHeight = $(".sidebar-tab-container").height();
		var tabNavsHeight = $("#sidebar-tab-navs").outerHeight();
		$("#sidebar-tab-content").outerHeight(tabContainerHeight - tabNavsHeight - 6);
	} else {
		// Show the content full width
		$("#content").css("left", $("#sidebar-expander").outerWidth());
	}
	
	// Update the map viewport
	app.map.updateSize();
	
	// Adjust location of UberSearch
	if (isMobile()) {
		$("#frmUberSearch").detach().prependTo("#mainMenuOptions");
		if ($("#mainMenuOptions").children().length > 1) {
			$("#frmUberSearch").addClass("mb-2");
		}
	} else {
		$("#frmUberSearch").detach().prependTo("#headerToolbox");
		$("#frmUberSearch").removeClass("mb-2");
	}
	
	// Hide/show menu button despending on whether menu has content
	if ($("#mainMenuOptions").children().length > 0) {
		$("#mainMenu").show();
	} else {
		$("#mainMenu").hide();
	}
	
	// Accomodate for a header height change
	var headerHeight = $(".twm-header").outerHeight(true);
	$("#twm-content").css("padding-top", headerHeight);
	$("#sidebar").css("top", headerHeight);
	$(".sidebar-expander").css("top", headerHeight);
	$(".content").css("top", headerHeight);
	
	// If a popup is open, reposition it after a tick
	if (app.popupOverlay.getPosition()) {
		setTimeout(function() {
			repositionPopup();
		}, 100);
	}
}

/**
 * Function: showSidebar
 * @param () none
 * @returns () nothing
 * Function that shows the sidebar
 */
function showSidebar() {
	$("#sidebar-expander").hide();
	$("#sidebar").show();
	doLayout();
	rewriteUrl();
	rememberState();
}


/**
 * Function: hideSidebar
 * @param () none
 * @returns () nothing
 * Function that hides the sidebar
 */
function hideSidebar() {
	$("#sidebar").hide();
	$("#sidebar-expander").show();
	doLayout();
	rewriteUrl();
	rememberState();
}

/**
 * Function: showBottomBar
 * @param () none
 * @returns () nothing
 * Function that shows the bottm bar
 */
function showBottomBar() {
	$("#bottom-bar-expander").hide();
	$("#bottom-bar").show();
	 // Change CSS of map to accommodate for bottom bar
    $("#map").css("height", "60%");
	$("#bottom-bar").css("height", "40%");

	
	doLayout();
	rewriteUrl();
	rememberState();
}

function hideBottomBar() {
	$("#bottom-bar-expander").show();
	$("#bottom-bar").hide();
	 // Change CSS of map to accommodate for bottom bar
    $("#map").css("height", "98%");
	$("#bottom-bar").css("height", "40%");

	
	doLayout();
	rewriteUrl();
	rememberState();
}

/**
 * Function: activateSidebarTab
 * @param (object) tab
 * @returns () nothing
 * Function that activates the passed sidebar tab
 */
function activateSidebarTab(tab) {
	var tabId = tab.attr("id");
	$("#"+tabId).click();
}

/**
 * Function: zoomToFeature
 * @param (object) feature (assumes feture is in the same SRID as map)
 * @returns () nothing
 * Function that zooms the map view to a slightly padded extent of the passed feature
 */
function zoomToFeature(feature) {
	//if feature has no geometry, exit function
	if (!feature.getGeometry()) return;
	// Ordinary OpenLayers features have proper extents. KML sourced features extents are weirdly buried, see ELSE statement below
	if (isFinite(feature.getGeometry().getExtent()[0])) {
		app.map.getView().fit(feature.getGeometry().getExtent(), {padding: [20,20,20,20]});
	} else {
		app.map.getView().fit(feature.getProperties("properties").properties.geometry.extent_, {padding: [20,20,20,20]});
	}	
	// If map is configured with very high max zoom back out to show more context 
	if (app.map.getView().getZoom()	> 17) app.map.getView().setZoom(17);
}

/**
 * Function: centreOnFeature
 * @param (object) feature (assumes feture is in the same SRID as map)
 * @returns () nothing
 * Function that centers the map view on the passed feature
 */
function centreOnFeature(feature) {
	var extent = feature.getGeometry().getExtent();
	var centre = ol.extent.getCenter(extent);
	app.map.getView().setCenter(centre);
}

/**
 * Function: showPopup
 * @param (array) coordinate
 * @param (string) html content
 * @returns () nothing
 * Function that shows a feature popup on the map when passed location and content
 */
function showPopup(coordinate, content) {
	// Update the popup content
	if (isMobile()) hideSidebar();
	$("#popup-content").html(content);
	
	// Wait a tick before repositioning/sizing the popup
	setTimeout(function(){
		$("#popup").show();
		app.popupOverlay.setPosition(coordinate);
		doLayout();
	}, 50);
}

/**
 * Function: repositionPopup
 * @param () none
 * @returns () nothing
 * Function that repositions popup based on it's size
 */
function repositionPopup() {
	app.popupOverlay.panIntoView({
		animation: {
			duration: 750
		}
	});
}

/**
 * Function: closePopup
 * @param () none
 * @returns () nothing
 * Function that shows a map popup when passed location and content
 */
function closePopup() {
	app.popupCoordinate = null;
	if ($('#popup').is(':visible')){
		$("#popup").hide();
		app.popupOverlay.setPosition(undefined);
		$("#popup-closer").blur();
		clearHighlightedFeatures();
		return false;
	}
}

/**
 * Function: highlightFeature
 * @param (object) feature (assumes feture is in the same SRID as map)
 * @param (boolean) If true do not clear the acetate layer before adding
 * @returns () nothing
 * Function that highlights the passed feature
 */
function highlightFeature(feature, noClear) {
	if (!noClear) app.highlightLayer.getSource().clear();
	app.highlightLayer.getSource().addFeature(feature);
}

/**
 * Function: clearHighlightedFeatures
 * @param () none
 * @returns () nothing
 * Function that highlights the passed feature
 */
function clearHighlightedFeatures(feature) {
	if (!feature) app.highlightLayer.getSource().clear();
	//remove the highlighted feature 
	app.highlightLayer.getSource().removeFeature(feature);

}

/**
 * Function: getHighlightStyle
 * @param (object) feature (assumes feture is in the same SRID as map)
 * @returns (object) style
 * Function that returns a style based on the passed feature's type.
 */
function getHighlightStyle(feature) {
	return app.highlightStyles[feature.getGeometry().getType()];
};



/**
 * Function: closeLinearRing
 * @param (object) ol coords
 * @returns (object) turn closed coords
 * Function: function that closes Linear Rings that are found open in Turf polygons and multiploygons
 */
function closeLinearRing(coords) {
		const first = coords[0];
		const last = coords[coords.length - 1];
		if (first[0] !== last[0] || first[1] !== last[1]) {
			coords.push([...first]);
		}
		return coords;
	}

/**
 * Function: convertOpenLayersFeatureToTurfFeature
 * @param (object) openlayers feature
 * @param (string) openlayers feature projection EPSG
 * @returns (object) turn feature (geojson & always 4326)
 * Function that returns converts an openlayers feature into a turf feature (always in 4326).
 */
function convertOpenLayersFeatureToTurfFeature(srcFeature, srcFeatureEPSG) {


	// Transform the source feature to EPSG:4326
	var srcFeature4326 = transformFeature(srcFeature, srcFeatureEPSG, "EPSG:4326");
	var geometry = srcFeature4326.getGeometry();
	var coords = geometry.getCoordinates();
	var turfFeature;

	switch (geometry.getType()) {
		case "Point":
			turfFeature = turf.point(coords);
			break;

		case "LineString":
			turfFeature = turf.lineString(coords);
			break;

		case "MultiLineString":
			turfFeature = turf.multiLineString(coords);
			break;

		case "Polygon":
			// Ensure each ring is closed
			const closedRings = coords.map(closeLinearRing);
			turfFeature = turf.polygon(closedRings);
			break;

		case "MultiPolygon":
		// Ensure each polygon and its rings are closed
			const closedMultiPoly = coords.map(polygon =>
				polygon.map(closeLinearRing)
			);
			turfFeature = turf.multiPolygon(closedMultiPoly);
			break;

		default:
		return null;
	}

	// Transfer attributes
	if (srcFeature.getId()) {
		turfFeature.id = srcFeature.getId();
	}
	if (srcFeature.getProperties()) {
		turfFeature.properties = srcFeature.getProperties();
	}

	return turfFeature;
}

/**
 * Function: convertToOpenLayersFeature
 * @param (string) source type
 * @param (object) source
 * @returns (object) openlayers feature
 * Function that returns an openlayers feature given a feature in another format
 */
function convertToOpenLayersFeature(sourceType, source) {
	// Basic error checking
	if (!source.geometry) return null;
	if (!source.geometry.type) return null;
	
	// Do conversion
	switch (sourceType) {
		// GeoJSON
		case "GeoJSON":
			switch (source.geometry.type.toUpperCase()) {
				case "POINT":
					var olGeometry = new ol.geom.Point(source.geometry.coordinates);
					break;
				case "MULTIPOINT":
					var olGeometry = new ol.geom.MultiPoint(source.geometry.coordinates);
					break;
				case "LINESTRING":
					var olGeometry = new ol.geom.LineString(source.geometry.coordinates);
					break;
				case "MULTILINESTRING":
					var olGeometry = new ol.geom.MultiLineString(source.geometry.coordinates);
					break;
				case "POLYGON":
					var olGeometry = new ol.geom.Polygon(source.geometry.coordinates);
					break;
				case "MULTIPOLYGON":
					var olGeometry = new ol.geom.MultiPolygon(source.geometry.coordinates);
					break;
				case "GEOMETRYCOLLECTION": // This could probably be handled more elegantly, but, KML sourced layers are of type GeometryCollection
					var foo = source.properties["geometry"].getExtent();
					var olGeometry = new ol.geom.Polygon(foo[0]+","+foo[1]+","+foo[0]+","+foo[3]+","+foo[2]+","+foo[3]+","+foo[2]+","+foo[1]+","+foo[0]+","+foo[1]);
					break;
				default:
					return null;
			}
			var olFeature = new ol.Feature({geometry: olGeometry});
			if (typeof source.getId === "function") {
				olFeature.setId(source.getId());
			} else {
				olFeature.setId(md5(Math.floor(Math.random() * Math.floor(Math.random() * Date.now())))); // Creates a random uuid
			}
			if (source.properties) olFeature.set("properties", source.properties);
			return olFeature;
			break;
		
		// Unhandled types
		default:
			return null;
	}
};

/**
 * Function: transformFeature
 * @param (object) feature
 * @param (string) sourceCRS
 * @param (string) targetCRS
 * @returns (object) transformed feature (clone)
 * Function that transforms an open layers feature from one CRS to another
 */
function transformFeature(feature, sourceCRS, targetCRS) {
	var clone = feature.clone();
	clone.getGeometry().transform(sourceCRS, targetCRS);
	return clone;
};

/**
 * Function: getFeatureCentre
 * @param (object) feature (of OpenLayers type)
 * @returns (object) openlayers feature
 * Function that returns an openlayers feature's centre
 */
function getFeatureCentre(feature) {
	var centreLocation;
	switch(feature.getGeometry().getType().toUpperCase()) {
		case "POINT":
			centreLocation = feature.getGeometry().getCoordinates();
			break;
		case "LINESTRING":
			var centreCoordIndex = Math.floor(feature.getGeometry().getCoordinates().length / 2);
			centreLocation = feature.getGeometry().getCoordinates()[centreCoordIndex];
			break;
		case "POLYGON":
			centreLocation = ol.extent.getCenter(feature.getGeometry().getExtent());
			break;
		default:
			logger("ERROR", "getFeatureCentre: Unhandled geometry type");
			return;
	}
	return centreLocation;
}

/**
 * Function: rememberState
 * @params () none
 * @returns () nothing
 * Function to remember application state.  Uses a copy of the app config
 * as a starting point template.
 */
function rememberState() {
	// Bail if not available and configured
	if (!lsIsAvailable() || !app.config.rememberState) return;
	// Define the application state object.  This will mimic the
	// app config layout, etc.
	var state = new Object();
	
	// Remember sidebar settings
	state.sidebar = new Object();
	if ($("#sidebar").is(":visible")) {
		state.sidebar.openOnDesktopStart = true;
		state.sidebar.openOnMobileStart = true;
	} else {
		state.sidebar.openOnDesktopStart = false;
		state.sidebar.openOnMobileStart = false;
	}
	state.sidebar.width = app.config.sidebar.width;
	
	// Remember map defaults (centre & zoom)
	state.map = new Object();
	state.map.default = new Object();
	var llCentre = ol.proj.toLonLat(app.map.getView().getCenter());
	state.map.default.centre = {
		longitude: llCentre[0],
		latitude: llCentre[1]
	}
	state.map.default.zoom = app.map.getView().getZoom();

	// Get zIndexes for all "managed" layers and sort them
	var zIndexes = [];
	$.each(app.map.getLayers().getArray(), function(index, layer) {
		if (layer.get("title")) zIndexes.push(layer.getZIndex());
	});
	zIndexes.sort();

	// Remember layer settings
	state.map.layers = [];
	$.each(zIndexes, function(index, zIndex) {
		$.each(app.map.getLayers().getArray(), function(index, layer) {
			if (zIndex == layer.getZIndex()) {
				var l = new Object();
				l.title = layer.get("title");
				l.type = layer.get("type");
				if (typeof layer.get("group") !== "undefined") l.group = layer.get("group");
				l.visible = layer.getVisible();
				l.opacity = layer.getOpacity();
				l.zIndex = layer.getZIndex();
				
				// Add Source info
				l.source = new Object();
				if (layer.getSource() instanceof ol.source.ImageWMS) {
					l.source.type = "ImageWMS";
					l.source.url = layer.getSource().getUrl();
					l.source.params = layer.getSource().getParams();
				}
				if (layer.getSource() instanceof ol.source.TileWMS) {
					l.source.type = "TileWMS";
					l.source.urls = layer.getSource().getUrls();
					l.source.params = layer.getSource().getParams();
				}
				if (layer.getSource() instanceof ol.source.XYZ) {
					l.source.type = "XYZ";
					l.source.urls = layer.getSource().getUrls();
					l.source.attributions = layer.getSource().getAttributions();
				}
				
				l.withCredentials = layer.get("withCredentials");
				
				// Add layer field configuration if it exists
				if (layer.get("fields")) {
					l.fields = [];
					$.each(layer.get("fields"), function(index, field) {
						var f = new Object();
						$.each(field, function(key, value) {
							if (typeof value === "function") {
								f[key] = convertFunctionToString(value);
							} else {
								f[key] = value;
							}						
						});
						l.fields.push(f);
					});
				}
				// Add layer object to state object
				if (typeof l.title !== "undefined") state.map.layers.push(l);

			}
		});
	});
		
	// Store the application state object
	lsStoreItem("state-"+app.config.name, state);
}

/**
 * Function: restoreState
 * @params () none
 * @returns () nothing
 * Function to restore application state
 */
function restoreState() {
	// Get the application state object from local storage (if available)
	var state = lsRetrieveObject("state-"+app.config.name);
	
	// If state is not available or configured, apply some defaults, then bail
	if (lsIsAvailable() === false || app.config.rememberState === false || Object.keys(state).length == 0) {

		// Set sidebar open state (based on url parameter or default app config)
		if (isNumeric(getUrlParameterByName("sb"))) {
			if (getUrlParameterByName("sb") == 1) {
				showSidebar();
			} else {
				hideSidebar();
			}
		} else {
			// Use app defaults (mobile of desktop)
			if (isMobile() && app.config.sidebar.openOnMobileStart) {
				showSidebar();
			} else if (!isMobile() && app.config.sidebar.openOnDesktopStart) {
				showSidebar();
			} else {
				hideSidebar();
			}
		}

		// Bail
		return;
	}
	// Encapsulate the state restoration in a try catch statement incase a loaded session
	// file or changed state definition no longer follows the new convention
	try {
		
		// Restore sidebar open state
		if (isMobile() && state.sidebar.openOnMobileStart === false) {
			hideSidebar();
		} else {
			showSidebar();
		}
		if (!isMobile() && state.sidebar.openOnDesktopStart === false) {
			hideSidebar();
		} else {
			showSidebar();
		}
		
		// Restore sidebar width
		app.config.sidebar.width = state.sidebar.width;
		doLayout();
		
		// Restore map defaults (centre & zoom)
		if (state.map.default.centre.longitude && state.map.default.centre.latitude) {
			app.map.getView().setCenter(ol.proj.fromLonLat([state.map.default.centre.longitude, state.map.default.centre.latitude]));
		}
		if (state.map.default.zoom) {
			app.map.getView().setZoom(state.map.default.zoom);
		}

		// Restore layer settings
		$.each(state.map.layers, function(i, l) {
			l.found = false;  // Assume layer is not present until it's found
			$.each(app.map.getLayers().getArray(), function(index, layer) {
				if (l.title == layer.get("title")) {
					// Restore visibility, opacity, and layer stacking
					if (typeof l.visible !== "undefined") layer.setVisible(l.visible);
					if (typeof l.opacity !== "undefined") layer.setOpacity(l.opacity);
					if (typeof l.zIndex !== "undefined") layer.setZIndex(l.zIndex);
					if (( typeof layer.get("title") !== "undefined") && (typeof l.group !== "undefined")) {
						 layer.set('group',l.group);
					}

					// Restore layer filter settings
					
							// TO DO
				
					// Mark layer as found
					l.found = true; 
				}
			});
		});
		
		// Add missing layers
		var basemapCount = 0;
		var basemapVisibleCount = 0;
		$.each(state.map.layers, function(i, l) {
			// Count Basemaps
			if (l.type == "base") {
				basemapCount++;
				if (l.visible === true) basemapVisibleCount++;
			}

			// Contruct new layer
			if (l.found === false) {
				var withCredentials = (l.withCredentials) ? l.withCredentials : false;
				switch (l.source.type) {
					case "ImageWMS":
						var newLayer = new ol.layer.Image({
							title: l.title,
							type: l.type,
							removable: true,
							visible: l.visible,
							withCredentials: withCredentials,
							source: new ol.source.ImageWMS({
								url: l.source.url,
								params: l.source.params,
								transition: 0
							})
						});
						if (typeof l.group !== "undefined") {
							newLayer.set('group',l.group);
						}
						break;
					case "TileWMS":
						var newLayer = new ol.layer.Tile({
							title: l.title,
							type: l.type,
							removable: true,
							visible: l.visible,
							withCredentials: withCredentials,
							source: new ol.source.TileWMS({
								url: l.source.urls[0],
								params: l.source.params,
								transition: 0
							})
						});
						break;
					case "XYZ":
						var newLayer = new ol.layer.Tile({
							title: l.title,
							type: l.type,
							removable: true,
							visible: l.visible,
							source: new ol.source.XYZ({
								url: l.source.urls[0],
								attributions: l.source.attributions
							})
						});
						break;
				}
				
				// Set additional layer properties
				if (typeof l.opacity !== "undefined") newLayer.setOpacity(l.opacity);
				
				// Add field configurations if present
				if (typeof l.fields !== "undefined") {
					var fieldsToAdd = [];
					$.each(l.fields, function(index, field) {
						var f = new Object();
						$.each(field, function(key, value) {
							if (isConvertedFunction(value)) {
								f[key] = convertStringToFunction(value);
							} else {
								f[key] = value;
							}
						});
						fieldsToAdd.push(f);
					});
					newLayer.set("fields", fieldsToAdd);
				}
				
				// Set the layer zIndex - this is tricky cuz their could be layers already holding that
				// particular zIndex, so we search for the next available one.
				if (Number.isInteger(l.zIndex) && isLayerZIndexAvailable(l.zIndex, l.type)) {
					newLayer.setZIndex(l.zIndex);
				} else {
					newLayer.setZIndex(getNextAvailableLayerZIndex(l.type));
				}
				
				// Register the overlay layer with TWM
				registerOverlayWithTWM(newLayer);
				
				// Add the layer to the map
				app.map.addLayer(newLayer);
			}
		});
		
		// If no base layer was turned on, turn the first one on.
		if (basemapVisibleCount == 0) {
			$.each(app.map.getLayers().getArray(), function(index, layer) {
				if (layer.get("type") == "base") {
					layer.setVisible(true);
					return false;
				}
			});
		}
	
	// Log errors
	} catch(e) {
		logger("ERROR", "State could not be restored - " + e);
	}
}

/**
 * Function: getNextAvailableLayerZIndex
 * @params (string) layerType (i.e. base, overlay)
 * @returns (integer) next zIndex
 * Function to get the next available unused layer zIndex (based on type)
 */
function getNextAvailableLayerZIndex(layerType) {
	// First get the start index based on layer type
	var nextZIndex = 0;
	switch(layerType) {
		case "overlay":
			nextZIndex = app.StartIndexForOverlayLayers;
			break;
		case "base":
			nextZIndex = app.StartIndexForBaseLayers;
			break;
		default:
			logger("ERROR", "Could not determine next available zIndex becasue layer type is unknown");
			return -1;
	}

	// Search for the next available one
	$.each(app.map.getLayers().getArray(), function(index, layer) {
		if (layer.get("title") && layer.get("type") == layerType) {
			if (layer.getZIndex() >= nextZIndex) {
				nextZIndex = layer.getZIndex() + 1;
			}
		}
	});
	return nextZIndex;
}

/**
 * Function: isLayerZIndexAvailable
 * @params (integer) zIndex
 * @params (string) layerType (i.e. base, overlay)
 * @returns (boolean) true if used, false if not
 * Function to determine if layer zIndex is available
 */
function isLayerZIndexAvailable(zIndex, layerType) {
	// First check if it's in the appropriate zIndex range
	switch(layerType) {
		case "overlay":
			if (zIndex < app.StartIndexForOverlayLayers) return false;
			break;
		case "base":
			if (zIndex < app.StartIndexForBaseLayers) return false;
			break;
		default:
			return false;
	}
	
	// Next check if its available	
	var isAvailable = true;
	$.each(app.map.getLayers().getArray(), function(index, layer) {
		if (layer.get("title") && layer.get("type") == layerType) {
			if (layer.getZIndex() == zIndex) {
				isAvailable = false;
			}
		}
	});
	return isAvailable;
}

/**
 * Function: getLayerByTitle
 * @params (string) title
 * @returns (object) layer
 * Function to get a layer by it's title
 */
function getLayerByTitle(title) {
	var l = null;
	$.each(app.map.getLayers().getArray(), function(index, layer) {
		if (layer.get("title") == title) l = layer;
	});
	return l;
}

/**
 * Function: getLayerById
 * @params (integer) layerId
 * @returns (object) layer
 * Function to get a layer by it's id
 */
function getLayerById(layerId) {
	var l = null;
	$.each(app.map.getLayers().getArray(), function(index, layer) {
		if (ol.util.getUid(layer) == layerId) l = layer;
	});
	return l;
}

/**
 * Function: rewriteUrl
 * @params () none
 * @returns () nothing
 * Function to rewrite the URL using numerous parameters
 */
function rewriteUrl() {
	// Bail if not available and configured
	if (!history.pushState || !app.config.rewriteUrl) return;
	
	// Define the base URL
	var url = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
	
	// Add the application config name
	url += "c=" + app.config.name + "&";
	
	// Add the lat and lon
	var llCentre = ol.proj.toLonLat(app.map.getView().getCenter());
	url += "lon=" + llCentre[0] + "&";
	url += "lat=" + llCentre[1] + "&";
	
	// Add the zoom level
	url += "z=" + app.map.getView().getZoom() + "&";
	
	// Add sidebar open state
	if ($("#sidebar").is(":visible")) {
		url += "sb=1&";
	} else {
		url += "sb=0&";
	}
	
	// Update the URL
	window.history.pushState({path:url}, "", url);
}

/**
 * Function: registerDefaultMapSingleClickFunction
 * @params (string) cursor (standard CSS cursor type)
 * @params (function) function
 * @returns () nothing
 * Function to register the map's default single click function
 */
function registerDefaultMapSingleClickFunction(cursor, fn) {
	// Set the global variables
	app.defaultMapCursor = cursor;
	app.defaultMapSingleClickFunction = fn;
	
	// Register the default by running the reset
	resetDefaultMapSingleClickFunction();
}

/**
 * Function: redirectMapSingleClickFunction
 * @params (string) cursor (standard CSS cursor type)
 * @params (function) function to execute upon click (optional)
 * @returns () nothing
 * Function to redirect the map's default single click function.  An empty function
 * can be passed to this if you simply want to disable the default singleClick
 * click function
 */
function redirectMapSingleClickFunction(cursor, fn) {
	// Handle optional parameters
	fn = fn || function(){};
	
	// Redirect single map click
	$("#map").css("cursor", cursor);
	if (app.eventKeys.singleClick) ol.Observable.unByKey(app.eventKeys.singleClick);
	app.eventKeys.singleClick = app.map.on("click", function(e) {
		fn(e);
	});
}

/**
 * Function: resetDefaultMapSingleClickFunction
 * @params () none
 * @returns () nothing
 * Function to reset the map's single click function to default
 */
function resetDefaultMapSingleClickFunction() {
	$("#map").css("cursor", app.defaultMapCursor);
	if (app.eventKeys.singleClick) ol.Observable.unByKey(app.eventKeys.singleClick);
	app.eventKeys.singleClick = app.map.on("click", function(e) {
		app.defaultMapSingleClickFunction(e);
	});
}


/**
 * Function: nextAvailableOverlayLayerZIndex
 * @param () none
 * @returns (integer) available zIndex
 * Function that gets the next available zIndex for an overlay layer
 */
function nextAvailableOverlayLayerZIndex() {
	var highestZIndex = app.StartIndexForOverlayLayers;
	$.each(app.map.getLayers().getArray(), function(i, l) {
		if (l.get("type") == "overlay") {
			if (l.getZIndex() > highestZIndex) highestZIndex = l.getZIndex();
		}
	});
	return (highestZIndex + 1);
}

/**
 * Function: registerOverlayWithTWM
 * @param (object) layer
 * @returns () nothing
 * Function that registers the overlay layer with TWM
 */
function registerOverlayWithTWM(layer) {
	// Add the layer statistics 
	resetLayerStatistics(layer);
	
	// Register the layer statistic event counters (ImageWMS)
	if (layer.getSource() instanceof ol.source.ImageWMS === true) {
		layer.getSource().on("imageloadstart", function(e){
			layer.set("loadingCount", layer.get("loadingCount") + 1);
		});
		layer.getSource().on("imageloadend", function(e){
			layer.set("loadedCount", layer.get("loadedCount") + 1);
		});
		layer.getSource().on("imageloaderror", function(e){
			layer.set("errorCount", layer.get("errorCount") + 1);
		});
	}
	
	// Register the layer statistic event counters (TileWMS)
	if (layer.getSource() instanceof ol.source.TileWMS === true) {
		layer.getSource().on("tileloadstart", function(e){
			layer.set("loadingCount", layer.get("loadingCount") + 1);
		});
		layer.getSource().on("tileloadend", function(e){
			layer.set("loadedCount", layer.get("loadedCount") + 1);
		});
		layer.getSource().on("tileloaderror", function(e){
			layer.set("errorCount", layer.get("errorCount") + 1);
		});
	}
	
	// Register the layer statistic event counters (Vector)
	if (layer.getSource() instanceof ol.source.Vector === true) {
		layer.getSource().on("featuresloadstart", function(e){
			layer.set("loadingCount", layer.get("loadingCount") + 1);
		});
		layer.getSource().on("featuresloadend", function(e){
			layer.set("loadedCount", layer.get("loadedCount") + 1);
		});
		layer.getSource().on("featuresloaderror", function(e){
			layer.set("errorCount", layer.get("errorCount") + 1);
		});
	}
	
	// Register the layer statistic event counters (Vector Cluster)
	if (layer.getSource() instanceof ol.source.Cluster === true) {
		layer.getSource().getSource().on("featuresloadstart", function(e){
			layer.set("loadingCount", layer.get("loadingCount") + 1);
		});
		layer.getSource().getSource().on("featuresloadend", function(e){
			layer.set("loadedCount", layer.get("loadedCount") + 1);
		});
		layer.getSource().getSource().on("featuresloaderror", function(e){
			layer.set("errorCount", layer.get("errorCount") + 1);
		});
	}
	
	// Attach layer metadata (if it does not already exist)
	if (!layer.get("attributes")) attachMetaDataToLayer(layer);
}
/**
 * Function: resetLayerStatistics
 * @param (object) layer
 * @returns () nothing
 * Function that resets a layer's statistics
 */
function resetLayerStatistics(layer) {
	layer.set("loadingCount", 0);
	layer.set("loadedCount", 0);
	layer.set("errorCount", 0);
}

/**
 * Function: attachMetaDataToLayer
 * @params (object) layer
 * @params (function) callback
 * @returns () nothing
 * Function to attach, if possible, the additional Metadata to the layer (i.e. attribute model, native projection, scales, etc.)
 */
function attachMetaDataToLayer(layer, callback) {
	// Handle optional parameters
	callback = callback || null;
	
	// Define misc variables
	var ajaxCallCount = 0;
	var completedAjaxCallCount = 0;
	var layerName = ""; // Usually only 1 and specific to WFS style calls (but some could have more than 1)
	
	// Define the function that completes the callback when everything is done
	var taskComplete = function() {
		completedAjaxCallCount++;
		if (completedAjaxCallCount == ajaxCallCount) {
			if (callback != null) callback();
		}
	}
	
	// Set default layer metadata to null
	layer.set("attributes", null);
	layer.set("nativeProjection", null);
	layer.set("minScaleDenominator", null);
	layer.set("maxScaleDenominator", null);
	layer.set("exportOutputFormats", []);
	layer.set("exportOutputProjections", []);
	layer.set("cqlFilterStack", new Object());
	if (!layer.get("metadataUrls")) layer.set("metadataUrls", []);
	
	// Determine if layer is configured to make cross-site Access-Control requests using credentials
	var withCredentials = (layer.get("withCredentials")) ? layer.get("withCredentials") : false;
	
	//
	// Process ImageWMS or TileWMS layers
	//
	if (layer.getSource() instanceof ol.source.ImageWMS === true || 
		layer.getSource() instanceof ol.source.TileWMS === true) {
			
		// Get the layer parameters
		var layerParams = layer.getSource().getParams();
		
		// Add CQL Filter from layer config to CQL Filters metadata (required to assemble complex CQL statements later on)
		$.each(layerParams, function(parameterName, parameterValue) {
			if (parameterName.toUpperCase() == "CQL_FILTER") {
				var cqlFilterStack = layer.get("cqlFilterStack");
				cqlFilterStack["config"] = parameterValue;
				layer.set("cqlFilterStack", cqlFilterStack);
			}
		});
		
		// Define the layer url
		if (layer.getSource() instanceof ol.source.TileWMS) {
			var layerUrl = layer.getSource().getUrls()[0]; // TileWMS
		} else if (layer.getSource() instanceof ol.source.ImageWMS) {
			var layerUrl = layer.getSource().getUrl(); // ImageWMS
		} else {
			logger("WARN", "Could not retrieve layer metadata for " + layer.get("title") + "! Layer will have limited functionality");
			return;
		}
		
		// Get layer namespace and layer name (assumes only one layer - will have to expand in the future)
		if (layerParams["LAYERS"]) {
			var layers = layerParams["LAYERS"];
			if (layers.search(":") == -1) {
				var layerNamespace = null;
				layerName = layers;
			} else {
				var layerNamespace = layers.split(":")[0];
				layerName = layers.split(":")[1];
			}
		}
		
		// Modify layer URL to be specific to layer (using both namespace and name).
		// Must be careful to ensure that the namespace is not already part of the url.
		var urlAddition
		if (layerNamespace) {
			if (layerUrl.search("/"+layerNamespace+"/") == -1) {
				urlAddition = layerNamespace+"/"+layerName;
			} else {
				urlAddition = layerName;
			}	
		} else {
			urlAddition = layerName;
		}
		layerUrl = layerUrl.replace(new RegExp("/ows", "ig"), "/"+urlAddition+"/ows");
		layerUrl = layerUrl.replace(new RegExp("/wms", "ig"), "/"+urlAddition+"/wms");
		layerUrl = layerUrl.replace(new RegExp("/wfs", "ig"), "/"+urlAddition+"/wfs");
		
		// Attach layer attributes
		attachLayerAttributes();
		
		// Attach WMS metadata
		attachWMSMetadata();
	
	//
	// Process Vector source
	//
	} else if (layer.getSource() instanceof ol.source.Vector === true) {
		
		// Process layers configured for the layer editor plugin (specialized)
		if (layer.getSource().layerUrl && layer.getSource().layerNamespace && layer.getSource().layerName) {
			layerName = layer.getSource().layerName;
			var layerUrl = layer.getSource().layerUrl.replace(new RegExp("/wfs", "ig"), "/"+layer.getSource().layerNamespace+"/"+layerName+"/wfs");
			attachLayerAttributes();
			
		// Process everything else
		} else {
			taskComplete();	
		}
	
	//
	// Process all other layer types (MORE TO BE DONE HERE)
	//
	} else {
		taskComplete();
	}
	
	/**
	 * Function: attachLayerAttributes
	 * @param () none
	 * @returns () nothing
	 * Function to get and attach layer attributes (name and type) to layer
	 */
	function attachLayerAttributes() {
		// Increment the ajax counter
		ajaxCallCount++;
		
		// Issue a DescribeFeatureType request for passed layer
		$.ajax({
			type: "GET",
			url: layerUrl,
			timeout: 7500,
			dataType: "json",
			data: {
				service: "WFS",
				version: "2.0.0",
				request: "DescribeFeatureType", 
				typeNames: layerName,
				outputFormat: "application/json"
			},
			xhrFields: {
				withCredentials: withCredentials
			}
		})
		
		// Handle the DescribeFeatureType response
		.done(function(response) {
			// Make sure the response has something
			if (response.featureTypes) {
				// If there are multiple layers that make up this layer, only use the attributes from the first one
				var featureType = response.featureTypes[0];
				layer.set("attributes", featureType.properties);
						
			} else {
				logger("WARN", "'DescribeFeatureType' failed for " + layer.get("title") + "! Layer will have limited functionality");
			}
			
			// Attach download options to layer (with or without attributes
			attachDownloadOptionsToLayer(layer);
			
			taskComplete();
		})
		
		// Handle the DescribeFeatureType failure
		.fail(function(jqxhr, settings, exception) {
			// Attach download options to layer (without attributes)
			attachDownloadOptionsToLayer(layer);
			
			taskComplete();
			logger("ERROR", "Error executing 'DescribeFeatureType' for " + layer.get("title"));
		}); 
	}
	
	/**
	 * Function: attachWMSMetadata
	 * @param () none
	 * @returns () nothing
	 * Function to get and attach WMS specific metadata to layer
	 */
	function attachWMSMetadata() {
		// Increment the ajax counter
		ajaxCallCount++;
		
		// Issue a GetCapabilities request for passed layer
		$.ajax({
			type: "GET",
			url: layerUrl,
			dataType: "xml",
			data: {
				service: "WMS",
				version: "1.3.0",
				request: "GetCapabilities"
			},
			xhrFields: {
				withCredentials: withCredentials
			}
		})
		
		// Handle the GetCapabilities response
		.done(function(response) {
			var parser = new ol.format.WMSCapabilities();
			var gcJson = parser.read(response);
			
			// Test if the first layer exists
			if (gcJson.Capability && gcJson.Capability.Layer && gcJson.Capability.Layer.Layer) {
				// Get the first layer
				var gcLayer = gcJson.Capability.Layer.Layer[0];

				// Get MetadataURLs
				if (gcLayer.MetadataURL && gcLayer.MetadataURL.length > 0) {
					var layerMetadataUrls = layer.get("metadataUrls");
					$.each(gcLayer.MetadataURL, function(i, mdUrl) {
						layerMetadataUrls.push(mdUrl);
					});
					layerMetadataUrls = removeDuplicates(layerMetadataUrls, "OnlineResource");
					layer.set("metadataUrls", layerMetadataUrls);
				}

				// Get native projection (!!!assume its the first one!!!)
				if (gcLayer.CRS[0]) {
					layer.set("nativeProjection", gcLayer.CRS[0]);
				} else {
					logger("WARN", "'GetCapabilities' [nativeProjection] failed for " + layer.get("title") + "! Layer will have limited functionality");
				}
				
				// Get MinScaleDenominator
				if (gcLayer.MinScaleDenominator) {
					layer.set("minScaleDenominator", gcLayer.MinScaleDenominator);
				} 
				
				// Get MaxScaleDenominator
				if (gcLayer.MaxScaleDenominator) {
					layer.set("maxScaleDenominator", gcLayer.MaxScaleDenominator);
				} 
			
			// Cannot get the first layer -> warn
			} else {
				logger("WARN", "'GetCapabilities' failed for " + layer.get("title") + "! Layer will have limited functionality");
			}
			taskComplete();
		})
		
		// Handle the GetCapabilities failure
		.fail(function(jqxhr, settings, exception) {
			taskComplete();
			logger("ERROR", "Error executing 'GetCapabilities' for " + layer.get("title"));
		}); 
	}
}

/**
 * Function: attachDownloadOptionsToLayer
 * @params (object) layer
 * @returns () nothing
 * Function to attach download options to an overlay layer
 */
function attachDownloadOptionsToLayer(layer) {
	// Build a list of attributes that does not contain geometry fields
	var nonGeometryFields = [];
	$.each(layer.get("attributes"), function(index, attribute) {
		if (attribute.type.startsWith("gml:") === false) {
			nonGeometryFields.push(attribute.name);
		}
	});
	var nonGeometryFieldsListString = nonGeometryFields.join(",");
	
	// Define the export output formats (in the future this should be
	// generated from the WFS/WMS GetCapabilities capability response)
	var exportOutputFormats = [];
	exportOutputFormats.push({name:"Google Earth KML", format: "application/vnd.google-earth.kml+xml", service: "WMS", version: "1.3.0", request: "GetMap", requiredSrs: "EPSG:4326"});
	exportOutputFormats.push({name:"Compressed Shapefile", format:"SHAPE-ZIP", service: "WFS", version: "2.0.0", request: "GetFeature"});
	exportOutputFormats.push({name:"Comma Delimited Text File", format:"csv", service: "WFS", version: "2.0.0", request: "GetFeature", propertyName: nonGeometryFieldsListString});
	exportOutputFormats.push({name:"GeoJSON", format:"application/json", service: "WFS", version: "2.0.0", request: "GetFeature"});
	layer.set("exportOutputFormats", exportOutputFormats);
	
	// Define the export output projections (in the future this should be
	// generated from the WFS/WMS GetCapabilities capability response)
	var exportOutputProjections = [];
	exportOutputProjections.push({name:"NAD83 / BC Albers", value:"EPSG:3005"});
	exportOutputProjections.push({name:"WGS 84", value:"EPSG:4326"});
	layer.set("exportOutputProjections", exportOutputProjections);
}

/**
 * Function: getCurrentMapScale
 * @params () none
 * @returns (integer) scale
 * Function to get the current map scale (THIS IS A BIT OF A HACK!  OL does not have this function)
 */
function getCurrentMapScale() {
	var SCALE_ADJUSTMENT_FACTOR = 1.26; // Volker invent to get it to work :-(
	var INCHES_PER_UNIT = {
		"m": 39.37,
		"dd": 4374754
	};
	var DOTS_PER_INCH = 72;
	var mapUnits = app.map.getView().getProjection().getUnits();
	var mapProjection = app.map.getView().getProjection();
	var mapResolution = app.map.getView().getResolution();
	var mapCentre = app.map.getView().getCenter();
	var mapCentreResolution = ol.proj.getPointResolution(mapProjection, mapResolution, mapCentre);
	var mapScale = mapCentreResolution * INCHES_PER_UNIT[mapUnits] * DOTS_PER_INCH * SCALE_ADJUSTMENT_FACTOR;
	return Math.round(mapScale);	
};

/**
 * Function: setCqlFilter
 * @params (object) layer
 * @params (string) type
 * @params (string) filter
 * @returns (string) CQL Filter
 * Function to set a layer's CQL filter AND honours pre-existing CQL filter
 */
function setCqlFilter(layer, type, filter) {
	// If filter is blank, convert to null
	if (filter == "") filter = null;

	// Add / update the filter (based on type) to the CQL Filter Stack (in metadata)
	var cqlFilterStack = layer.get("cqlFilterStack");
	cqlFilterStack[type] = filter;
	layer.set("cqlFilterStack", cqlFilterStack);

	// Loop through the filter stack to create a CQL statement
	cqlFilterArray = [];
	$.each(cqlFilterStack, function(i, f) {
		if (f) cqlFilterArray.push(f);
	});
	
	// Convert filter stack to a CQL Statement
	var cqlFilter = (cqlFilterArray.length > 0) ? cqlFilterArray.join(" AND ") : null;
	
	// Apply CQL filter to layer
	var layerParams = layer.getSource().getParams();
	layerParams["CQL_FILTER"] = cqlFilter;
	layer.getSource().updateParams(layerParams);

	// Remember application state if available and configured
	rememberState();
}

/**
 * Function: downloadFile
 * @params (string) filePath
 * @returns () nothing
 * Function to initiate the download of the file indicated by the passed file path
 */
function downloadFile(filePath){
	var link = document.createElement("a");
	link.href = filePath;
	link.download = filePath.substr(filePath.lastIndexOf("/") + 1);
	link.click();
}

/**
 * Function: getGeoLocation
 * @param (function) callback function
 * @returns () nothing
 * Function that gets and the user's device location and runs a callback with the resultant coordinates (lon/lat)
 */
function getGeoLocation(callback) {
	// Get current location if possible
	if (navigator.geolocation) {
		var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};
		var geoLocationSuccess = function(position) {
			callback([position.coords.longitude, position.coords.latitude]);
		}
		var geoLocationError = function(error) {
			callback([]);
		}
		navigator.geolocation.getCurrentPosition(geoLocationSuccess, geoLocationError, options);
	} else {
		callback([]);
	}
}

/**
 * Function: showGeoLocationOnMap
 * @param () none
 * @returns () nothing
 * Function that shows the current device's location on the map
 */
function showGeoLocationOnMap(zoomToZoomLevel) {
	getGeoLocation(function(geoLoc){
		var geoLocInMapCoords = ol.proj.transform(geoLoc, "EPSG:4326", app.map.getView().getProjection().getCode());
		var geoLocFeature = new ol.Feature({ geometry: new ol.geom.Point(geoLocInMapCoords) });
		app.currentLocationLayer.getSource().clear();
		app.currentLocationLayer.getSource().addFeature(geoLocFeature);
	});
}

/**
 * Function: removeGeoLocationFromMap
 * @param () none
 * @returns () nothing
 * Function that removes the current device's location from the map
 */
function removeGeoLocationFromMap() {
	app.currentLocationLayer.getSource().clear();
}

/**
 * Function: zoomToGeoLocation
 * @param (integer) zoom level
 * @returns () nothing
 * Function that zooms to the current devices location (to a zoom level specified)
 */
function zoomToGeoLocation(zoomLevel) {
	getGeoLocation(function(geoLoc){
		if (geoLoc.length != 0) {
			var geoLocInMapCoords = ol.proj.transform(geoLoc, "EPSG:4326", app.map.getView().getProjection().getCode());
			var geoLocFeature = new ol.Feature({ geometry: new ol.geom.Point(geoLocInMapCoords) });
			if (isInt(zoomLevel)) {
				centreOnFeature(geoLocFeature);
				app.map.getView().setZoom(zoomLevel);
			}
		}
	});
}

/**
 * Function: navigateToUsingDefaultApp
 * @param (number) sLatitude
 * @param (number) sLongitude
 * @param (number) dLatitude
 * @param (number) dLongitude
 * @returns () nothing
 * Function that uses the devices native app to navigate to a passed lat/lon
 * Notes: 
 * 			https://maps.google.com/?saddr=45.34802,-75.91903&daddr=45.424807,-75.699234
 */
function navigateToUsingDefaultApp(sLatitude, sLongitude, dLatitude, dLongitude) {
	// Get the navigator platform
	var np = navigator.platform;
	
	// If it's an Apple Product
	if ((np.indexOf("iPhone") != -1) || (np.indexOf("iPad") != -1) || (np.indexOf("iPod") != -1)) {
		window.open("maps://maps.google.com/maps?saddr="+sLatitude+","+sLongitude+"&daddr="+dLatitude+","+dLongitude+"&amp;ll=");
		
	// If its anything else
	} else {
		window.open("https://maps.google.com/maps?saddr="+sLatitude+","+sLongitude+"&daddr="+dLatitude+","+dLongitude+"&amp;ll=");
	}
}

/**
 * Function: urlify
 * @param (variable) text
 * @returns (string) text with links converted to links
 * Function convert urls to clickable links only if passed text is not HTML
 */
function urlify(text) {
	var urlRegex = /(https?:\/\/[^\s]+)/g;
	if (typeof text !== "string") return text; // if not a string, then do not urlify
	if (/<[a-z/][\s\S]*>/i.test(text)) return text; // if is html, then do not urlify
	text = text.toString().replace(urlRegex, (url) => {
		return "<a href='" + url + "' target='_blank'>" + url + "</a>";
	});
	return text;
}

/**
 * Function: isJSON
 * @param (variable) value
 * @returns () nothing
 * Function to test if variable contains a JSON object
 */
function isJSON(value) {
    if (typeof value != "string") value = JSON.stringify(value);
    try {
        JSON.parse(value);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Function: removeDuplicates
 * @param (array) array
 * @param (string) key
 * @returns (array) an array without duplicates 
 * Function to remove duplicate objects from an array based on a key
 */
function removeDuplicates(array, key) {
	return array.reduce((arr, item) => {
		const removed = arr.filter(i => i[key] !== item[key]);
		return [...removed, item];
	}, []);
};

/**
 * Function: mergeObjects
 * @param (object) obj1
 * @param (object) obj2
 * @returns (object) an object with obj2 merged into obj1 
 * Function to merge 2 objects
 */
function mergeObjects(obj1, obj2) {
	for (const key in obj2) {
		if (obj2.hasOwnProperty(key)) {
			if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
				obj1[key] = mergeObjects(obj1[key], obj2[key]);
			} else {
				obj1[key] = obj2[key];
			}
		}
	}
	return obj1;
}