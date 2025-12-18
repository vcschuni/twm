app.config = {
	title: {
		desktop: "Variable Speed Limit Signs",
		mobile: "VSLS"
	},
	meta: {
		description: "",
		author: ""
	},
	version: 2.1,
	contact: {
		name: "Brigid Canil",
		email: "brigid.canil@gov.bc.ca"
	},
	menuOptions: [
		{
			text: "MoTT Home",
			iconCls: "oi oi-globe",
			action: "link",
			url: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/transportation"
		},
		{ divider: true },
		{
			text: "About",
			iconCls: "oi oi-info",
			action: "dialog",
			url: "configuration/default/about.html"
		}
	],
	rememberState: false,
	allowSessionManagement: false,
	rewriteUrl: false,
	sidebar: {
		width: 450,
		openOnDesktopStart: false,
		openOnMobileStart: false
	},
	plugins: [
		{
			name: "Home",
			tabName: "About",
			enabled: true
		},
		{
			name: "ZoomToGeoLocation",
			enabled: true,
			showBlip: true
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

			new ol.layer.Vector({
				title: "Variable Speed Limit Signs",
				type: "overlay",
				visible: true,
				metadataUrls: [
					{Format: "text/plain", OnlineResource: "https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/road-safety-rules-and-consequences/variable-speed-limits", type: "TC211"}
				],
				source: new ol.source.Cluster({
					distance: 35,
					source: new ol.source.Vector({
						format: new ol.format.GeoJSON(),
						url: "https://vsls.drivebc.ca/heartbeat/geojson"
					})
				}),
				style: function(cluster, resolution) {
					// Define the icon text label
					var textLabel = "";
					var featureCount = cluster.get("features").length;
					if (featureCount > 1) {
						textLabel = "--";
					} else {
						textLabel = cluster.get("features")[0].getProperties()["postedSpeed"].toString();
					}
					
					// Define style
					var style = [new ol.style.Style({
						image: new ol.style.Icon({
							anchor: [24, 24],
							anchorXUnits: "pixels",
							anchorYUnits: "pixels",
							scale: 1,
							src: "configuration/vsls/img/vsls.png"
						}),
						text: new ol.style.Text({
							text: textLabel,
							font: "bold 15px serif",
							offsetX: 0,
							offsetY: 1,
							fill: new ol.style.Fill({
								color: "#000000"
							})
						})
					})];
					
					// Return style
					return style;
				},
				fields: [
					{
						name: "postedSpeed",
						nameTransform: function(name) { return false },
						valueTransform: function(value) {
							var content = $("<div></div>");
							content.css("float", "left");
							content.css("background-size", "contain");
							content.css("background-image", "url(configuration/vsls/img/speed-limit.png)");
							content.css("background-repeat", "no-repeat");
							content.css("background-position", "center center");
							content.css("width", "100px");
							content.css("height", "100px");
							content.css("text-align", "center");
							content.css("font-size", "35px");
							content.css("font-weight", "bold");
							content.css("padding", "30px 11px 0px 7px");
							content.append(value);
							return content.prop("outerHTML"); 
						}
					},
					{
						name: "corridorName",
						searchable: true,
						appendToField: "postedSpeed",
						valueTransform: function(value) { 
							var content = $("<div></div>");
							content.css("white-space", "nowrap");
							content.css("float", "right");
							content.css("clear", "right");
							content.css("font-size", "13px");
							content.css("font-weight", "bold");
							content.append(value);
							return content.prop("outerHTML");
						}
					},
					{
						name: "direction",
						appendToField: "postedSpeed",
						valueTransform: function(value) { 
							var content = $("<div></div>");
							content.css("white-space", "nowrap");
							content.css("float", "right");
							content.css("clear", "right");
							content.css("font-size", "13px");
							content.css("font-weight", "bold");
							content.append(value);
							return content.prop("outerHTML");
						}
					},
					{
						name: "postedDate",
						appendToField: "postedSpeed",
						valueTransform: function(value) {
							var timestamp = new Date(value);
							var content = $("<div></div>");
							content.css("white-space", "nowrap");
							content.css("float", "right");
							content.css("clear", "right");
							content.css("font-size", "13px");
							content.append("Changed: "+formatTimestamp(timestamp));
							return content.prop("outerHTML");
						}
					},
					{
						name: "maxSpeed",
						appendToField: "postedSpeed",
						valueTransform: function(value) {
							var content = $("<div></div>");
							content.css("white-space", "nowrap");
							content.css("float", "right");
							content.css("clear", "right");
							content.css("font-size", "13px");
							content.append("Regular Speed Limit: "+value+" km/h");
							return content.prop("outerHTML");
						}
					},
					{
						name: "segmentName",
						searchable: true,
						appendToField: "postedSpeed",
						valueTransform: function(value) {
							var content = $("<div></div>");
							content.css("white-space", "nowrap");
							content.css("float", "right");
							content.css("clear", "right");
							content.css("font-size", "13px");
							content.append("[<i>"+value+"</i>]");
							return content.prop("outerHTML");
						}
					}
				]
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