app.config = {
	title: {
		desktop: "Traffic Data Program",
		mobile: "TDP"
	},
	meta: {
		description: "The Traffic Data Program GIS Application allows you to find data associated with traffic count sites along BC highways over multiple years. Once you have located a site along a highway of interest, you can view the data associated with that site.",
		author: ""
	},
	version: 1.0,
	contact: {
		name: "John Mazuruk",
		email: "john.mazuruk@gov.bc.ca"
	},
	rememberState: false,
	rewriteUrl: true,
	sidebar: {
		width: 600,
		openOnDesktopStart: true,
		openOnMobileStart: false
	},		
	plugins: [
		{
			name: "Home",
			tabName: "About",
			enabled: true
		},
		{
			name: "LayerController",
			tabName: "Layers",
			enabled: true,
			layerDownloads: {
				enabled: true,
				maxFeatures: 500
			},
			additionalSources: [
				{
					name: "MoTT",
					url: returnEnvironmentUrl("ogs-public") + "/ows"
				},
				{
					name: "BCGW",
					url: "https://openmaps.gov.bc.ca/geo/ows"
				}
			]
		},
		{
			name: "FeatureProximity",		
			tabName: "Proximity",				
			enabled: true,					
			visibleLayerSearchEnabled: true,
			visibleLayerSearchMaxResults: 5,
			geoCoderEnabled: true,			
			geoCoderApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTT API Key for DataBC GeoCoder		
			geoCoderMaxResults: 5,
			defaultSearchRadiusKm: 10,
			searchRadiusEditable: true,			
			showSearchRadiusOnMap: true,	
			proximitySearchMaxResults: 25 	
		},		
		{
			name: "Identify2Popup",
			enabled: true,
			maxResults: 500
		},
		{
			name: "UploadSpatial",
			tabName: "Upload",
			enabled: true,
			unsupportedTypeMessage:"Sorry, file type not supported",
			"application/vnd.google-earth.kml+xml": {
				dropMessage: "Drop file here",
				processingMessage: "Processing...",
				errorMessage: "File must be a valid KML"
			},
			"application/vnd.google-earth.kmz": {
				dropMessage: "Drop file here",
				processingMessage: "Processing...",
				errorMessage: "File must be a valid KMZ"
			},
			"application/x-zip-compressed": {
				dropMessage: "Drop file here",
				processingMessage: "Processing...",
				errorMessage: "File must be a zipped shapefle"
			},
			"application/json": {
				dropMessage: "Drop file here",
				processingMessage: "Processing...",
				errorMessage: "File must be valid GeoJSON"
			}
		},
		{
			name: "UberSearchBCGeoCoderAddOn",
			enabled: true,
			maxResults: 5,
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			apiKey: "6097f62f6a8144edae53c59fc7c12351" // PRD MoTT API Key for DataBC GeoCoder
		},
		{
			name: "UberSearchBCGeographicalNameSearchAddOn",
			enabled: true,
			maxResults: 5,
			url: "https://apps.gov.bc.ca/pub/bcgnws/names/search"
		},
		{
			name: "UberSearchLayerSearchAddOn",
			enabled: true,
			maxResults: 5
		},
		{
			name: "UberSearchCoordinateSearchAddOn",
			enabled: true
		}
	],
	map: {
		default: {
			centre: {
				latitude: 54.5,
				longitude: -123.0
			},
			zoom: 5
		},
		zoom: {
			min: 4,
			max: 17
		},
		layers: [
		
			// Overlay Layers
			new ol.layer.Vector({
				title: "Traffic Data (2004 to Present)",
				type: "overlay",
				visible: true,
				source: new ol.source.Cluster({
					distance: 45,
					source: new ol.source.Vector({
						url: returnEnvironmentUrl("ogs-public") + "/ows?outputFormat=JSON&typeName=tig:TIG_TMS_GEOMETRY_EXT_V&service=WFS&version=2.0.0&request=GetFeature&srsName=EPSG:3857&maxfeatures=10000",
						format: new ol.format.GeoJSON()
					})
				}),
				legendImageUrl: "configuration/tdp/img/legend-td-2004-present.png",
				style: function(cluster, resolution) {
					// Get a count of features in this cluster
					var featureCount = cluster.get("features").length;
										
					// Define the style size based on feature count
					var radius = 5;
					if (featureCount > 1) radius = 8 + (featureCount / 35);
					
					// Define the style colours based on feature count and TYPE_CODE
					var strokeColor = "rgba(49, 171, 48, 0.4)";
					var fillColor = "rgba(49, 171, 48, 1)";
					if (featureCount == 1) {
						switch(cluster.get("features")[0].getProperties()["TYPE_CODE"]) {
							case "P":
								strokeColor = "rgba(209, 34, 34, 0.4)";
								fillColor = "rgba(209, 34, 34, 1)";
								break;
						}
					}
					
					// Define the text label and position based on feature count
					var labelText = featureCount.toString();
					var labelColor = "#FFFFFF";
					var labelOffsetY = 1;
					var labelHaloColor = "rgba(255, 255, 255, 0)";
					if (featureCount == 1) {
						labelText = cluster.get("features")[0].getProperties()["SITE_CODE"];
						labelOffsetY = -15;
						labelHaloColor = "rgba(255, 255, 255, 1)";
						switch(cluster.get("features")[0].getProperties()["TYPE_CODE"]) {
							case "P":
								labelColor = "rgba(209, 34, 34, 1)";
								break;
							case "S":
								labelColor = "rgba(49, 171, 48, 1)";
								break;
						}
					}
					
					// Build and return the style
					return [new ol.style.Style({
						image: new ol.style.Circle({
							radius: radius,
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: 8
							}),
							fill: new ol.style.Fill({
								color: fillColor
							})
						}),
						text: new ol.style.Text({
							text: labelText,
							font: "bold 11px serif",
							offsetX: 0,
							offsetY: labelOffsetY,
							stroke: new ol.style.Stroke({
								color: labelHaloColor,
								width: 3
							}),
							fill: new ol.style.Fill({
								color: labelColor
							})
						})
					})];
				},
				fields: [
					{
						name: "SITE_CODE",
						title: true,
						searchable: true,
						nameTransform: function(name) { return false; },
						valueTransform: function(value, feature) {
							var color;
							switch (feature.properties.TYPE_CODE) {
								case "P":
									color = "rgba(209, 34, 34, 1)";
									break;
								case "S":
									color = "rgba(49, 171, 48, 1)";
									break;
								default:
									color = "black";
							}
							return "<span style='font-weight:bold;font-size:15px;color:" + color + ";'>" + value + "</span>";
						}
					},
					{
						name: "TMS_DESCRIPTION",
						appendToField: "SITE_CODE",
						nameTransform: function(name) { return false; },
						valueTransform: function(value, feature) { 
							if (value == null) return false;
							var color;
							switch (feature.properties.TYPE_CODE) {
								case "P":
									color = "rgba(209, 34, 34, 1)";
									break;
								case "S":
									color = "rgba(49, 171, 48, 1)";
									break;
								default:
									color = "black";
							}
							return " <span style='font-weight:bold;font-size:15px;color:" + color + ";'>(" + value + ")</span>";
						}
					},
					{
						name: "STATUS_DESCRIPTION",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return "<b><i>" + value + "</i></b>"; }
					},
					{
						name: "TYPE_DESCRIPTION",
						appendToField: "STATUS_DESCRIPTION",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { if (value == null) return false; else return "<span style='font-weight:bold;font-style:italic;'> - "+value+"</span>"; }
					},
					{
						name: "DESCRIPTION",
						appendToField: "STATUS_DESCRIPTION",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { if (value == null) return false; else return "<br>" + value; }
					},
					{
						name: "PDB_SITE_ID",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) {
							var url = returnEnvironmentUrl("pub-oas") + "/tig-public/Report.do?pdbSiteId=" + value;
							return "<a href='"+url+"' target='_blank'>Site Report</a>";
						}
					},
					{
						name: "SITE_CODE",
						appendToField: "PDB_SITE_ID",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) {
							var url = returnEnvironmentUrl("tradas") + "/tradas.asp?loc=" + value;
							if (value == null) {
								return false;
							} else {
								return " | <a href='"+url+"' target='_blank'>Traffic Reports</a>";
							}
						}
					}
				]
			}),
			
			new ol.layer.Vector({
				title: "Traffic Data (1994 to 2003)",
				type: "overlay",
				visible: false,
				source: new ol.source.Cluster({
					distance: 45,
					source: new ol.source.Vector({
						url: returnEnvironmentUrl("ogs-public") + "/ows?outputFormat=JSON&typeName=tig:TIG_TMP_GEOM_EXT_V&service=WFS&version=2.0.0&request=GetFeature&srsName=EPSG:3857&maxfeatures=10000",
						format: new ol.format.GeoJSON()
					})
				}),
				legendImageUrl: "configuration/tdp/img/legend-td-1994-2003.png",
				style: function(cluster, resolution) {
					// Get a count of features in this cluster
					var featureCount = cluster.get("features").length;
										
					// Define the style size based on feature count
					var radius = 5;
					if (featureCount > 1) radius = 8 + (featureCount / 35);
					
					// Define the style colour
					var strokeColor = "rgba(35, 78, 209, 0.4)";
					var fillColor = "rgba(35, 78, 209, 1)";
					
					// Define the text label and position based on feature count
					var labelText = featureCount.toString();
					var labelColor = "#FFFFFF";
					var labelOffsetY = 1;
					var labelHaloColor = "rgba(255, 255, 255, 0)";
					if (featureCount == 1) {
						labelText = cluster.get("features")[0].getProperties()["TMP_ID"];
						labelOffsetY = -15;
						labelColor = "rgba(35, 78, 209, 1)";
						labelHaloColor = "rgba(255, 255, 255, 1)";
					}
					
					// Build and return the style
					return [new ol.style.Style({
						image: new ol.style.Circle({
							radius: radius,
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: 8
							}),
							fill: new ol.style.Fill({
								color: fillColor
							})
						}),
						text: new ol.style.Text({
							text: labelText,
							font: "bold 11px serif",
							offsetX: 0,
							offsetY: labelOffsetY,
							stroke: new ol.style.Stroke({
								color: labelHaloColor,
								width: 3
							}),
							fill: new ol.style.Fill({
								color: labelColor
							})
						})
					})];
				},
				fields: [
					{
						name: "TMP_ID",
						title: true,
						searchable: true,
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return "<span style='font-weight:bold;font-size:15px;color:rgba(35, 78, 209, 1);'>" + value + "</span>"; }
					},
					{
						name: "ROAD_NAME",
						appendToField: "TMP_ID",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { if (value == null) return false; else return " <span style='font-weight:bold;font-size:15px;color:rgba(35, 78, 209, 1);'>(" + value + ")</span>"; }
					},
					{
						name: "LOCATION_DESCRIPTION",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return value; }
					},
					{
						name: "LAST_YEAR",
						appendToField: "LOCATION_DESCRIPTION",
						nameTransform: function(name) { return false },
						valueTransform: function(value) { if (value == null) return false; else return "<br>Last AADT Year was " + value; }
					},
					{
						name: "AADT",
						appendToField: "LOCATION_DESCRIPTION",
						nameTransform: function(name) { return false },
						valueTransform: function(value) { if (value == null) return false; else return "<br>Last AADT was " + value; }
					},
					{
						name: "TMP_ID",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) {
							var url = returnEnvironmentUrl("pub-oas") + "/tig-public/servlet/TIGReportGenerator?TMPIDS=" + value;
							if (value == null) {
								return false;
							} else {
								return "<a href='"+url+"' target='_blank'>Traffic Reports</a>";
							}
						}
					}
				]
			}),
			
			new ol.layer.Vector({
				title: "Turning Movement Counts",
				type: "overlay",
				visible: false,
				source: new ol.source.Cluster({
					distance: 55,
					source: new ol.source.Vector({
						url: returnEnvironmentUrl("ogs-public") + "/ows?outputFormat=JSON&typeName=tsg:TSG_ARCIMS_SURVEY_V_SQLVIEW&service=WFS&version=2.0.0&request=GetFeature&srsName=EPSG:3857&maxfeatures=10000",
						format: new ol.format.GeoJSON()
					})
				}),
				legendImageUrl: "configuration/tdp/img/legend-turning-movement-counts.png",
				style: function(cluster, resolution) {
					// Get a count of features in this cluster
					var featureCount = cluster.get("features").length;
										
					// Define the style size based on feature count
					var radius = 5;
					if (featureCount > 1) radius = 8 + (featureCount / 35);
					
					// Define the style colour
					var strokeColor = "rgba(253, 131, 48, 0.4)";
					var fillColor = "rgba(253, 131, 48, 1)";
					
					// Define the text label and position based on feature count
					var labelText = featureCount.toString();
					var labelColor = "#FFFFFF";
					var labelOffsetY = 1;
					var labelHaloColor = "rgba(255, 255, 255, 0)";
					if (featureCount == 1) {
						labelText = cluster.get("features")[0].getProperties()["SURVEY_NUMBER"].toString();
						labelOffsetY = -15;
						labelColor = "rgba(253, 131, 48, 1)";
						labelHaloColor = "rgba(255, 255, 255, 1)";
					}
					
					// Build and return the style
					return [new ol.style.Style({
						image: new ol.style.Circle({
							radius: radius,
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: 8
							}),
							fill: new ol.style.Fill({
								color: fillColor
							})
						}),
						text: new ol.style.Text({
							text: labelText,
							font: "bold 11px serif",
							offsetX: 0,
							offsetY: labelOffsetY,
							stroke: new ol.style.Stroke({
								color: labelHaloColor,
								width: 3
							}),
							fill: new ol.style.Fill({
								color: labelColor
							})
						})
					})];
				},
				fields: [
					{
						name: "SURVEY_NUMBER",
						title: true,
						searchable: true,
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return "<span style='font-weight:bold;font-size:15px;color:rgba(253, 131, 48, 1);'>" + value + "</span>"; }
					},
					{
						name: "NAME",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return value; }
					},
					{
						name: "SURVEY_TYPE_DESCRIPTION",
						appendToField: "NAME",
						nameTransform: function(name) { return false },
						valueTransform: function(value) { if (value == null) return false; else return "<br>" + value; }
					},
					{
						name: "START_DATE",
						appendToField: "NAME",
						nameTransform: function(name) { return false },
						valueTransform: function(value) { if (value == null) return false; else return " - " + value; }
					},
					{
						name: "SURVEY_ID",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) {
							var url = returnEnvironmentUrl("pub-oas") + "/tsg/jsp/main/DownloadData?submitbottom=Download&tsgCheckBox.1=" + value;
							if (value == null) {
								return false;
							} else {
								return "<a href='"+url+"' target='_blank'>Download Survey Site Data</a>";
							}
						}
					}
				]
			}),
			
			
			new ol.layer.Tile({
				title: "Uniform Traffic Volume Segments",
				type: "overlay",
				visible: false,
				source: new ol.source.TileWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "tig:TIG_UTV_SEGMENT_EXT"
					},
					transition: 0
				}),
				fields: [
					{
						name: "SEGMENT_NUMBER",
						title: true,
						searchable: true,
						nameTransform: function(name) { return false; },
						valueTransform: function(value) {
							var reportUrl = returnEnvironmentUrl("pub-oas") + "/tig-public/UTVSIdentify.do?SEGMENT_NUMBER=" + value;
							if (isMobile()) {
								return "<embed type='text/html' src='"+reportUrl+"'>";
							} else {
								return "<embed type='text/html' src='"+reportUrl+"' width='400' height='300'>";
							}
						}
					}
				]
			}),
			
			// Base Layers
			new ol.layer.Tile({
				title: "ESRI Streets",
				type: "base",
				visible: true,
				source: new ol.source.XYZ({
					url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
					attributions: "Tiles © <a target='_blank' href='https://services.arcgisonline.com/ArcGIS/rest/services/'>ESRI</a>"
				})
			}),
			new ol.layer.Tile({
				title: "ESRI Imagery",
				type: "base",
				visible: false,
				source: new ol.source.XYZ({
					url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
					attributions: "Tiles © <a target='_blank' href='https://services.arcgisonline.com/ArcGIS/rest/services/'>ESRI</a>"
				})
			})
		]
	}
}