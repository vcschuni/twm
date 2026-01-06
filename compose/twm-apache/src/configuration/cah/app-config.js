app.config = {
	title: {
		desktop: "Controlled Access Highways",
		mobile: "CAH"
	},
	meta: {
		description: "Section 48 of the Transportation Act is used to designate some highways as 'controlled access highways'. These are usually numbered routes and are intended to carry higher volumes of inter-regional traffic. Highway names are as referenced in Orders in Council.",
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
			name: "LayerEditor",
			tabName: "Layer Editor",
			enabled: false
		},
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
			name: "FeatureProximity",
			tabName: "Proximity",
			enabled: true,
			visibleLayerSearchEnabled: true,
			visibleLayerSearchMaxResults: 5,
			geoCoderEnabled: true,
			geoCoderApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTT API Key for DataBC GeoCoder
			geoCoderMaxResults: 5,
			defaultSearchRadiusKm: 0.8,
			searchRadiusEditable: false,	
			showSearchRadiusOnMap: true,
			proximitySearchMaxResults: 100 // Per layer
		},
		{
			name: "Identify2Tab",
			tabName: "Features",
			enabled: true,
			maxResults: 10 // Per layer
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
			new ol.layer.Tile({
				title: "Controlled Access Highways",
				type: "overlay",
				visible: true,
				source: new ol.source.TileWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: 'hwy:V_NM_NIT_CACC_SDO_DT_V'
					},
					transition: 0
				}),
				fields: [
					{
						name: "IIT_PRIMARY_KEY",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "Primary Key:"; }
					},
					{
						name: "COMMENTS",
						searchable: true,
						nameTransform: function(name) { return false; }
					}
				]
			}),
			new ol.layer.Tile({
				title: "Digital Road Atlas",
				type: "overlay",
				visible: true,
				source: new ol.source.TileWMS({
					url: "https://openmaps.gov.bc.ca/geo/ows",
					params: {
						LAYERS: "pub:WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP"
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
					}
				]
			}),

			new ol.layer.Tile({
				title: "BC Parcel Fabric",
				type: "overlay",
				visible: false,
				opacity: 0.35,
				source: new ol.source.TileWMS({
					url: "https://openmaps.gov.bc.ca/geo/ows",
					params: {
						LAYERS: 'pub:WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW'
					},
					transition: 0,
					attributions: "<br/>Powered by <a target='_blank' href='https://ltsa.ca/products-services/parcelmap-bc/about-parcelmap-bc//'>ParcelMap BC</a>"
				}) ,
				fields: [
					{
						name: "PLAN_NUMBER",
						searchable: false,
						nameTransform: function(name) { return "Plan Number:"; }
					},
					{
						name: "PIN",
						searchable: false,
						nameTransform: function(name) { return "PIN:"; }
					},
					{
						name: "PID_NUMBER",
						searchable: true,
						searchType: "number",
						title: true,
						nameTransform: function(name) { return "PID:"; }
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
			}),
			new ol.layer.Tile({
				title: "DataBC",
				type: "base",
				visible: false,
				source: new ol.source.TileArcGISRest({
					url: "https://maps.gov.bc.ca/arcgis/rest/services/province/roads_wm/MapServer",
					attributions: "Tiles © <a target='_blank' href='https://maps.gov.bc.ca/arcgis/rest/services/province/roads_wm/MapServer'>DataBC</a>"
				}),
			})
		]
	}
}