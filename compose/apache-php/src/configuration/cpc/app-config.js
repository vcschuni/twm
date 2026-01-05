app.config = {
	title: {
		desktop: "CVSE Policy Corridors",
		mobile: "CPC"
	},
	meta: {
		description: "",
		author: ""
	},
	version: 1.0,
	contact: {
		name: "Application Administrator",
		email: "IMBSpatial@gov.bc.ca"
	},
	rememberState: true,
	rewriteUrl: true,
	sidebar: {
		width: 450,
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
			name: "DynamicRouter",
			tabName: "Router",
			enabled: true,
			allowWayPoints: true,
			visibleLayerSearchEnabled: true,
			visibleLayerSearchMaxResults: 5,
			geoCoderEnabled: true,
			geoCoderApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTT API Key for DataBC GeoCoder
			geoCoderMaxResults: 5,
			routerApiKey: "6097f62f6a8144edae53c59fc7c12351" // PRD MoTT API Key for DataBC Router
		},
		{
			name: "Identify2Tab",
			tabName: "Features",
			enabled: true,
			maxResults: 10
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
			new ol.layer.Image({
				title: "Heavy Haul Routes",
				type: "overlay",
				visible: true,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:ISS_CVSE_POLICY_CORRIDOR",
						STYLES: "ISS_CVSE_POLICY_CORRIDOR_HH"
					},
					transition: 0
				}),
				fields: [
					{
						name: "HEAVY_HAUL_ROUTE_NAME",
						searchable: true,
						nameTransform: function(name) { return "Route Name"; }
					},
					{
						name: "APPROVED_TONNAGE",
						searchable: false,
						title: true,
						nameTransform: function(name) { return "Tonnage"; }
					},
					{
						name: "HIGHWAY_ROUTE_1",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "Highway Number"; }
					},
					{
						name: "STRUCTURED_NAME_1",
						searchable: false,
						title: true,
						nameTransform: function(name) { return "Road Name"; }
					}
				]
			}),
			
			new ol.layer.Image({
				title: "Wheeler Routes",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:ISS_CVSE_POLICY_CORRIDOR",
						STYLES: "ISS_CVSE_POLICY_CORRIDOR_WHEELER"
					},
					transition: 0
				}),
				fields: [
					{
						name: "HEAVY_HAUL_ROUTE_NAME",
						searchable: true,
						nameTransform: function(name) { return "Route Name"; }
					},
					{
						name: "HIGHWAY_ROUTE_1",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "Highway Number"; }
					},
					{
						name: "STRUCTURED_NAME_1",
						searchable: false,
						title: true,
						nameTransform: function(name) { return "Road Name"; }
					}
				]
			}),
			
			new ol.layer.Image({
				title: "Clearance Restrictions",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:CSR_RESTRICTION_V"
					},
					transition: 0
				}),
				fields: [
					{
						name: "STRUCTURE_NAME",
						searchable: true,
						nameTransform: function(name) { return "Structure Name"; }
					},
					{
						name: "ROUTE_NAME",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "Route Name"; }
					},
					{
						name: "DIRECTION_TYPE_CODE",
						searchable: false,
						title: false,
						nameTransform: function(name) { return "Direction"; }
					},
					{
						name: "RESTRICTION_GROUP",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "Type"; }
					},
					{
						name: "RESTRICTION_VALUE",
						searchable: false,
						title: false,
						nameTransform: function(name) { return "Restriction"; },
						valueTransform: function(value) { return  value + " m" ; }
					}

				]
			}),
			
			new ol.layer.Image({
				title: "Rest Stops",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "dbc:DBC_RIM_REST_AREA_V",
						CQL_FILTER: "ACCOM_COMMERCIAL_TRUCKS='Yes'"
					},
					transition: 0
				}),
				fields: [
					{
						name: "REST_AREA_NAME",
						searchable: true,
						nameTransform: function(name) { return "Structure Name"; }
					},
					{
						name: "DISTANCE_FROM_MUNICIPALITY",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "Location"; }
					},
					{
						name: "DIRECTION_OF_TRAFFIC",
						searchable: false,
						title: false,
						nameTransform: function(name) { return "Direction of traffic"; }
					},
					{
						name: "NUMBER_OF_TOILETS",
						searchable: true,
						title: false,
						nameTransform: function(name) { return "No. of Toilets"; }
					},
					{
						name: "OPEN_YEAR_ROUND",
						searchable: false,
						title: false,
						nameTransform: function(name) { return "Open Year-Round"; }
					}

				]

			}),
			
			new ol.layer.Image({
				title: "MoTT Regions",
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
						nameTransform: function(name) { return "Region No."; }
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