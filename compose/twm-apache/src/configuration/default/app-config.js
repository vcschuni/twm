app.config = {
	title: {
		desktop: "Transportation Web Map",
		mobile: "TWM"
	},
	meta: {
		description: "",
		author: ""
	},
	version: 2.1,
	contact: {
		name: "Application Administrator",
		email: "IMBSpatial@gov.bc.ca"
	},
	menuOptions: [
		{
			text: "MoTT Home",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/transportation-and-infrastructure"
		},
		{ divider: true },
		{
			text: "About",
			iconCls: "oi oi-info",
			action: "dialog",
			url: "configuration/default/about.html"
		}
	],
	rememberState: true,
	allowSessionManagement: false,
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
			name: "FeatureProximity",		
			tabName: "Proximity",				
			enabled: true,					
			visibleLayerSearchEnabled: true,
			visibleLayerSearchMaxResults: 5,
			geoCoderEnabled: true,			
			geoCoderApiKey: "6097f62f6a8144edae53c59fc7c12351", // PRD MoTT API Key for DataBC GeoCoder		
			geoCoderMaxResults: 5,
			defaultSearchRadiusKm: 20,
			searchRadiusEditable: true,			
			showSearchRadiusOnMap: true,	
			proximitySearchMaxResults: 25 	
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
			name: "Identify2Popup",
			tabName: "Features",
			enabled: true,
			maxResults: 50
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
				title: "MoTT Service Areas",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:DSA_CONTRACT_AREA"
					},
					transition: 0
				}),
				customIdentify2TabCall: "https://myurl/app?{{CONTRACT_AREA_NUMBER}}", // TODO!!!!!!!!!!!!!  Needs to be written in script
				fields: [
					{
						name: "CONTRACT_AREA_NUMBER",
						searchable: true,
						nameTransform: function(name) { return "Service Area No."; }
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
				title: "MoTT Districts",
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
						nameTransform: function(name) { return "District No."; }
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
			new ol.layer.VectorTile({
				title: "BC Basemap (vector)",
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
			})
		]
	}
}