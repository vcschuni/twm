app.config = {
	title: {
		desktop: "Commercial Vehicle Routing Tool ",
		mobile: "CVRT"
	},
	version: 1.0,
	contact: {
		name: "Application Administrator",
		email: "IMBSpatial@gov.bc.ca"
	},
	overrideStyle: "app-style.css",
	overrideLogo: "app-logo.png",
	menuOptions: [
		{
			text: "Copyright",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www.gov.bc.ca/com/copyright.html"
		},
		{
			text: "Disclaimer",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www.gov.bc.ca/com/disclaimer.html"
		},
		{
			text: "Privacy",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www.gov.bc.ca/com/privacy.html"
		},
		{
			text: "Accessibility",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www.gov.bc.ca/com/accessibility.html"
		}
	],
	rememberState: false,
	allowSessionManagement: false,
	rewriteUrl: false,
	sidebar: {
		width: 600,
		openOnDesktopStart: true,
		openOnMobileStart: true
	},
	plugins: [
		{
			name: "SessionMinder",
			enabled: false
		},
		{
			name: "Disclaimer",
			title: "Commercial Vehicle Routing Tool — Disclaimer and Limitation of Liabilities",
			acceptButtonText: "Accept &amp; Continue",
			enabled: true
		},
		{
			name: "CVRestrictionFinder",
			tabName: "Restriction Finder",
			enabled: true,
			allowWayPoints: true,
			visibleLayerSearchEnabled: true,
			visibleLayerSearchMaxResults: 30,
			geoCoderEnabled: true,
			geoCoderApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTI API Key for DataBC GeoCoder
			geoCoderMaxResults: 7,
			routerApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTI API Key for DataBC Router
			searchDistanceInMetres: 30,
			rdmApiEndPoint: "rdm-api-public", // Options: rdm-api or rdm-api-public
			showAlertModal:true,
			//Feature Toggle
			showRestrictionType:["VERTICAL","HORIZONTAL","LENGTH","INFO","NCV","WEIGHT-GVW"],
			showPermittableRoute:false,
			showAllRestrictions:true,
			showRouteOwnership:false,
			showOverrideRestrictions:false,

		},
		{
			name: "LayerController",
			tabName: "Reference Layers",
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
			name: "Identify2Popup",
			tabName: "Features",
			enabled: true,
			maxResults: 25
		},
		{
			name: "ShowClickCoordinates",
			enabled: true
		},
		{
			name: "UberSearchBCGeoCoderAddOn",
			enabled: true,
			maxResults: 5,
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			apiKey: "6097f62f6a8144edae53c59fc7c12351" // PRD MoTI API Key for DataBC GeoCoder
		},
		{
			name: "UberSearchLayerSearchAddOn",
			enabled: true,
			maxResults: 5
		},
		{
			name: "MultiFloatingWindow",				// Plugin Class Name - DO NOT MODIFY [required]
			enabled: true						// Whether plugin is enabled [required]
		},
		{
			name: "ChartPlugin",				// Plugin Class Name - DO NOT MODIFY [required]
			enabled: true					// Whether plugin is enabled [required]		
		},
		{
			name: "UberSearchCoordinateSearchAddOn",
			enabled: true
		},
		{
			name: "StreetView",
			enabled: true		
		},
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
				title: "Border Crossings", // Required for the RestrictionFinder plugin to list border crossings
				hideFromLayerController: true,
				type: "overlay",
				visible: true,
				source: new ol.source.Vector({
					url: "data/border-crossings.json",
					format: new ol.format.GeoJSON()
				}),
				style: new ol.style.Style({
					image: new ol.style.Circle({
						radius: 1,
						stroke: new ol.style.Stroke({
							color: "rgba(0, 0, 0, 0)", // Make's it non-visible and non-identifiable
							width: 1
						})
					})
				}),  
				fields: [
					{
						name: "search",
						searchable: true,
						title: true
					}
				]
			}),

			new ol.layer.Image({
				title: "MoTT Bridge Structures",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
					params: {
						LAYERS: "WHSE_IMAGERY_AND_BASE_MAPS.MOT_ROAD_STRUCTURE_SP"
					},
					transition: 0
				}),
				fields: [
					{
						name: "BMIS_STRUCTURE_NO",
						title: true,
						searchable: true,
						nameTransform: function(name) { return "BMIS No."; }
					},
					{
						name: "BMIS_STRUCTURE_NAME",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "BMIS Name"; }
					},
					{
						name: "BMIS_STRUCTURE_TYPE",
						nameTransform: function(name) { return "BMIS Type"; }
					},
					{
						name: "BMIS_STRUCT_STATUS_TYPE_DESC",
						nameTransform: function(name) { return "BMIS Status"; }
					}

				]
			}),
			new ol.layer.Image({
				title: "CHRIS RFI roads",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
					params: {
						LAYERS: "cwr:WHSE_IMAGERY_AND_BASE_MAPS.MOT_ROAD_FEATURES_INVNTRY_SP"
					},
					transition: 0
				}),
				fields: [
					{
						name: "ROAD_FEATURE_INVNTRY_ID",
						title: true,
						searchable: true,
						nameTransform: function(name) { return "ID"; }
					},
					{
						name: "RFI_HIGHWAY_DESCRIPTION",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Road Name"; }
					},
					{
						name: "RFI_HIGHWAY_LENGTH",
						nameTransform: function(name) { return "Length"; }
					}


				]
			}),
			
			new ol.layer.Image({
				title: "Digital Road Atlas",
				type: "overlay",
				visible: false,
				withCredentials: true,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
					
					params: {
						LAYERS: "WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP"
					},
					transition: 0
				}),
				fields: [
					{
						name: "DIGITAL_ROAD_ATLAS_LINE_ID",
						nameTransform: function(name) { return "Primary Key:"; }
					},
					{
						name: "ROAD_NAME_FULL",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Road Name:"; }
					},
					{
						name: "HIGHWAY_EXIT_NUMBER",
						nameTransform: function(name) { return "Highway Exit Number"; }
					},
					{
						name: "HIGHWAY_ROUTE_NUMBER",
						nameTransform: function(name) { return "Highway Route Number"; }
					},
					{
						name: "ROAD_SURFACE",
						nameTransform: function(name) { return "Road Surface"; }
					},
					{
						name: "ROAD_CLASS",
						nameTransform: function(name) { return "Road Class"; }
					},
					{
						name: "NUMBER_OF_LANES",
						nameTransform: function(name) { return "Number of lanes"; }
					},
					{
						name: "FEATURE_LENGTH_M",
						nameTransform: function(name) { return "Length in metres"; }
					}
				]
			}),

			new ol.layer.Image({
				title: "CVSE Policy Areas",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:ISS_CVSE_POLICY_AREA"
					},
					transition: 0
				}),
				fields: [
					{
						name: "CVSE_POLICY_AREA_NAME",
						searchable: true,
						nameTransform: function(name) { return "Area Name"; }
					},
					{
						name: "CVSE_AREA_DESCRIPTION",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Description"; }
					}
				]
			}),
			
			new ol.layer.Image({
				title: "MoTI Service Areas",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:DSA_CONTRACT_AREA"
					},
					transition: 0
				}),
				fields: [
					{
						name: "CONTRACT_AREA_NUMBER",
						searchable: true,
						nameTransform: function(name) { return "Service Area No"; }
					},
					{
						name: "CONTRACT_AREA_NAME",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Service Area Name"; }
					}
				]
			}),
			
			new ol.layer.Image({
				title: "MoTI Districts",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:DSA_DISTRICT_BOUNDARY"
					},
					transition: 0
				}),
				fields: [
					{
						name: "DISTRICT_NUMBER",
						searchable: true,
						nameTransform: function(name) { return "District No"; }
					},
					{
						name: "DISTRICT_NAME",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "District Name"; }
					}
				]
			}),

			new ol.layer.Image({
				title: "MoTI Regions",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:DSA_REGION_BOUNDARY"
					},
					transition: 0
				}),
				fields: [
					{
						name: "REGION_NUMBER",
						searchable: true,
						nameTransform: function(name) { return "Region No"; }
					},
					{
						name: "REGION_NAME",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Region Name"; }
					}
				]
			}),
			
			// Base Layers
			new ol.layer.VectorTile({
				title: "BC Basemap",
				type: "base",
				visible: true,
				declutter: true,
				className: "ol-baselayer",
				source: new ol.source.VectorTile({
					format: new ol.format.MVT(),
					url: "https://tiles.arcgis.com/tiles/ubm4tcTYICKBpist/arcgis/rest/services/BC_BASEMAP_20240307/VectorTileServer/tile/{z}/{y}/{x}.pbf",
					attributions: "Tiles © <a target='_blank' href='https://catalogue.data.gov.bc.ca/dataset/78895ec6-c679-4837-a01a-8d65876a3da9'>ESRI & GeoBC</a>"
				}),
				style: function (feature, resolution) { return null; }, // Hide all vectors until styler function can render them
				styleUrl: "https://www.arcgis.com/sharing/rest/content/items/b1624fea73bd46c681fab55be53d96ae/resources/styles/root.json",
				styleKey: "esri",
				layerStyleOverrideUrl: "data/styles/GeoBC-Basemap-Layer-Style-Overrides.json"
			}),
			new ol.layer.Tile({
				title: "ESRI Streets",
				type: "base",
				visible: false,
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
			}),
			
			
		]
	}
}