class ServerStatus {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ServerStatus";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "ServerStatus";
		this.tabContentFile = "application/plugins/ServerStatus/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.addPlugin();
	}
	
	init() {
		// Show the working spinners in all endpoints first
		$(".ss-td-endpoint").each(function(index, td) {
			$(td).html("<img src='application/plugins/ServerStatus/img/ajax-loader.gif'>");
		});
		
		// Define the end points
		var endPoints = {
			internal: {
				fortsteele: {
					dev: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:8081/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:8081/ogs-geoV06/"
					},
					tst: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:8082/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:8082/ogs-geoV06/"
					},
					prd: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:8083/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:8083/ogs-geoV06/"
					}
				},
				waldo: {
					dev: {
						imageUrl: "http://waldo.th.gov.bc.ca:8081/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:8081/ogs-geoV06/"
					},
					tst: {
						imageUrl: "http://waldo.th.gov.bc.ca:8082/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:8082/ogs-geoV06/"
					},
					prd: {
						imageUrl: "http://waldo.th.gov.bc.ca:8083/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:8083/ogs-geoV06/"
					}
				},
				loadbalancer: {
					dev: {
						imageUrl: "https://devoas4.apps.th.gov.bc.ca/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					},
					tst: {
						imageUrl: "https://tstoas5.apps.th.gov.bc.ca/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					},
					prd: {
						imageUrl: "https://prdoas5.apps.th.gov.bc.ca/ogs-geoV06/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					}
				}
			},
			public: {
				fortsteele: {
					dev: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:9081/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:9081/geoV05/"
					},
					tst: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:9082/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:9082/geoV05/"
					},
					prd: {
						imageUrl: "http://fortsteele.th.gov.bc.ca:9083/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://fortsteele.th.gov.bc.ca:9083/geoV05/"
					}
				},
				waldo: {
					dev: {
						imageUrl: "http://waldo.th.gov.bc.ca:9081/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:9081/geoV05/"
					},
					tst: {
						imageUrl: "http://waldo.th.gov.bc.ca:9082/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:9082/geoV05/"
					},
					prd: {
						imageUrl: "http://waldo.th.gov.bc.ca:9083/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: "http://waldo.th.gov.bc.ca:9083/geoV05/"
					}
				},
				loadbalancer: {
					dev: {
						imageUrl: "https://dev-maps.th.gov.bc.ca/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					},
					tst: {
						imageUrl: "https://tst-maps.th.gov.bc.ca/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					},
					prd: {
						imageUrl: "https://maps.th.gov.bc.ca/geoV05/wms?service=WMS&version=1.1.0&request=GetMap&layers=hwy%3ADSA_CONTRACT_AREA&bbox=200000.0%2C300000.0%2C1900000.0%2C1800000.0&width=50&height=50&srs=EPSG%3A3005&format=image/png&transparent=true",
						dashboardUrl: ""
					}
				}
			}			
		}
		
		// Validate each configured end point
		$(".ss-td-endpoint").each(function(index, td) {
			var realm = $(td).parent().attr("realm");
			var server = $(td).parent().attr("server");
			var environment = $(td).attr("environment");
			if (endPoints[realm]) {
				if (endPoints[realm][server]) {
					if (endPoints[realm][server][environment]) {
						var endPoint = endPoints[realm][server][environment];
						app.plugins.ServerStatus.validateEndPoint(endPoint.imageUrl, endPoint.dashboardUrl, $(td))
					}
				}
			}
		});
	}

	/**
	 * Function: validateEndPoint
	 * @param (string) imageUrl
	 * @param (string) dashboardUrl
	 * @param (object) element
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	validateEndPoint(imageUrl, dashboardUrl, element) {
		// Define empty image
		var img = new Image();
		
		// Get the start time
		var startTime = (new Date()).getTime();
		
		// Define the image source (add unique salt to the request to ensure no caching)
		if (imageUrl.indexOf("?") == -1) {
			var src = imageUrl+"?salt="+startTime;
		} else {
			var src = imageUrl+"&salt="+startTime;	
		}
		
		// Define the on load and on error handlers
		img.onload = function() {
			// Determine how long the request took
			var finishTime = (new Date()).getTime();
			var duration = finishTime - startTime;
			
			// Add the appropriate status image
			if (dashboardUrl != "") {
				element.html("<a href='"+dashboardUrl+"' target='_blank' title='Open Console...'><img src='application/plugins/ServerStatus/img/success-icon.png'></a><div>"+duration+"ms</div>");
				element.attr("title", "Open Console...");
				element.hover(
					function(){ element.addClass("ss-td-endpoint-hover"); },
					function(){ element.removeClass("ss-td-endpoint-hover"); }
				);
			} else {
				element.html("<img src='application/plugins/ServerStatus/img/success-icon.png'><div>"+duration+"ms</div>");
			}
		}
		img.onerror = function() {
			if (dashboardUrl != "") {
				element.html("<a href='"+dashboardUrl+"' target='_blank' title='Open Console...'><img src='application/plugins/ServerStatus/img/failure-icon.png'></a><div>offline</div>");
				element.attr("title", "Open Console...");
				element.hover(
					function(){ element.addClass("ss-td-endpoint-hover"); },
					function(){ element.removeClass("ss-td-endpoint-hover"); }
				);
			} else {
				element.html("<img src='application/plugins/ServerStatus/img/failure-icon.png'><div>offline</div>");
			}
		}
		
		console.log(src);
		
		// Set the image source
		img.src = src;
		
		// Set timeout to cancel request
		setTimeout(function(){
			if ( !img.complete || !img.naturalWidth ){
				img.src = "";
				img.onerror();
			}
		}, 15000);
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
				logger("ERROR", app.plugins.ServerStatus.name + ": Plugin failed to initialize");
				return;
			}
			
			// Init the plugin
			app.plugins.ServerStatus.init();
			
			// Log success
			logger("INFO", app.plugins.ServerStatus.name + ": Plugin successfully loaded");
		}
		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}