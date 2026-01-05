app.config = {
	title: {
		desktop: "Vehicle Inspection Facilities",
		mobile: "VIP"
	},
	meta: {
		description: "The Vehicle Inspection Facilities map tool displays the location of facilities licensed to perform vehicle inspections as determined by British Columbia’s Vehicle Inspections and Standards program. The tool can be used to browse and search a map to find facilities in many towns and cities in BC, or to find facilities that are licenced to inspect specific classes of vehicles. The tool also provides facility contact information and calculates travel distance and directions from the user's current location to a chosen facility.",
		author: ""
	},
	version: 1.0,
	contact: {
		name: "Application Administrator",
		email: "IMBSpatial@gov.bc.ca"
	},
	rememberState: false,
	rewriteUrl: false,
	sidebar: {
		width: 475,
		openOnDesktopStart: true,
		openOnMobileStart: true
	},
	plugins: [
		{
			name: "LayerSearch",
			tabName: "Find an Inspection Facility",
			enabled: true,
			maxResults: 3000,
			limitSearchToMapExtent: false,
			sortResultsByClosest: true,
			minimumZoomWhenIdentifying: 14
		},
		{
			name: "Home",
			tabName: "About &amp; Useful Links",
			enabled: true
		},
		{
			name: "Identify2Popup",
			enabled: true,
			maxResults: 25,
			requestTimeout: 7500
		},
		{
			name: "UberSearchLayerSearchAddOn",
			enabled: true,
			maxResults: 5
		},
		{
			name: "UberSearchBCGeoCoderAddOn",
			enabled: true,
			maxResults: 5,
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			apiKey: "6097f62f6a8144edae53c59fc7c12351" // PRD MoTT API Key for DataBC GeoCoder
		}
	],
	init: function() {
		showGeoLocationOnMap();
		zoomToGeoLocation(12);
	},
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
				title: "Vehicle Inspection Facility",
				type: "overlay",
				visible: true,
				source: new ol.source.TileWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "vip:CVSE_FACILITY_MAP_VW"
					},
					transition: 0
				}),
				fields: [
					{
						name: "name",
						searchable: true,
						title: false,
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return "<span style='font-weight:bold;font-size:15px;'>" + value + "</span>"; }
					},
					{
						name: "facility_number",
						searchable: true,
						appendToField: "name",
						valueTransform: function(value) { if (value == null) return ""; else return " <span style='font-weight:bold;font-size:15px;'>(#" + value + ")</span>"; }
					},
					{
						name: "street_address",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { return value; }
					},
					{
						name: "street_address_2",
						appendToField: "street_address",
						valueTransform: function(value) { if (value == null) return false; else return "<br>" + value; }
					},
					{
						name: "street_address_3",
						appendToField: "street_address",
						valueTransform: function(value) { if (value == null) return false; else return "<br>" + value; }
					},
					{
						name: "city",
						appendToField: "street_address",
						valueTransform: function(value) { if (value == null) return false; else return "<br>" + value; },
						searchCriteria: [
							{
								name: "City",
								type: "string",
								cql: "{{field}} ILIKE '%{{value}}%'"
							}
						]
					},
					{
						name: "province",
						appendToField: "street_address",
						valueTransform: function(value) { if (value == null) return false; else return ", " + value; }
					},
					{
						name: "postal_code",
						appendToField: "street_address",
						valueTransform: function(value) { if (value == null) return false; else return ", " + value; }
					},
					{
						name: "phone",
						appendToField: "street_address",
						valueTransform: function(value) { 
							if (value == null) { 
								return false 
							} else {
								var pn = value.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'); 
								return "<br><a href='tel:" + pn + "'>" + pn + "</a>";
							}
						}
					},
					{
						// Calculated distance field
						// This is a extra field not found in the returned data.  Its calculated on the fly.
						nameTransform: function(name) { return false; },
						valueTransform: function(value, feature) {
							// Set default result
							var result = "Could not calculate distance to facility";
							
							// Function to handle a geolocation result
							var gotGeoLocation = function(geoLoc) {
								if (geoLoc.length == 2) {
									if (feature.geometry && feature.geometry.coordinates) {
										// Transform feature coords to 4326
										var featureLoc = ol.proj.transform(feature.geometry.coordinates, app.map.getView().getProjection().getCode(), "EPSG:4326");

										// Query the DataBC Router
										$.ajax({
											url: "https://router.api.gov.bc.ca/directions.json",
											data: {
												criteria: "fastest",
												points: geoLoc[0]+","+geoLoc[1]+","+featureLoc[0]+","+featureLoc[1],
												roundTrip: false,
												apikey: "6097f62f6a8144edae53c59fc7c12351"
											},
											timeout: 15000
										})
										
										// Handle a success
										.done(function(response) {
											if (response.distance && response.distance > 0) {
												result = "<button class='btn btn-sm btn-success' type='button' onclick='navigateToUsingDefaultApp("+geoLoc[1]+","+geoLoc[0]+","+featureLoc[1]+","+featureLoc[0]+");'>Navigate to ("+response.distance.toFixed()+" km away)</button>";
											}
											$("#"+md5(feature.id)).html(result);
										})
										
										// Handle a failure
										.fail(function(jqxhr, settings, exception) {
											$("#"+md5(feature.id)).html(result);
										});
									} else {
										$("#"+md5(feature.id)).html(result);
									}
								} else {
									$("#"+md5(feature.id)).html(result);
								}
							}
							
							// Try to get the users location
							getGeoLocation(gotGeoLocation);

							// Return and empty span (to be populated later)
							return "<span id='"+md5(feature.id)+"'><div style='height:31px;line-height:31px;'>Calculating distance <image src='data:image/gif;base64,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' /></div></span>";
						}
					},
					{
						name: "vehicle_class_1",
						nameTransform: function(name) { return false; },
						valueTransform: function(value) { 
							if (value === true) {
								return "<b>Licensed to Inspect:</b><br><div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 1 - Light Vehicles (cars & light trucks)</div>";
							} else {
								return "<b>Licensed to Inspect:</b><br>"; 
							}
						},
						searchCriteria: [
							{
								name: "Class 1 - Light Vehicles (cars & light trucks)",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "vehicle_class_2",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 2 - Heavy Vehicles (over 5500kg LGVW)</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Class 2 - Heavy Vehicles (over 5500kg LGVW)",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "vehicle_class_3",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 3 - Trailers & Semi-trailers</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Class 3 - Trailers & Semi-trailers",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "vehicle_class_4",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 4 - Buses (10 seats or more)</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Class 4 - Buses (10 seats or more)",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "vehicle_class_5",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 5 – School Buses</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Class 5 – School Buses",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "vehicle_class_6",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Class 6 - Motorcycles</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Class 6 - Motorcycles",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "endorsement_for_air_brakes",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Vehicles with Air Brakes</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Vehicles with Air Brakes",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "endorsement_for_pressure_fuel",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Vehicles with Pressure Fuel</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Vehicles with Pressure Fuel",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "endorsement_for_salvage_vehicle",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Salvage Vehicles</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Salvage Vehicles",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					},
					{
						name: "endorsement_for_new_to_bc",
						appendToField: "vehicle_class_1",
						valueTransform: function(value) { if (value === true) return "<div style='margin-left:8px;'><span style='color:green;' class='oi oi-circle-check'></span> Vehicles New to BC</div>"; else return ""; },
						searchCriteria: [
							{
								name: "Vehicles New to BC",
								type: "boolean",
								cql: "{{field}}=1"
							}
						]
					}
				]
			}),
			
			// Base Layers
			new ol.layer.VectorTile({
				title: "ESRI Navigation",
				type: "base",
				visible: true,
				declutter: true,
				className: "ol-baselayer",
				source: new ol.source.VectorTile({
					format: new ol.format.MVT(),
					url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf",
					attributions: "Tiles © <a target='_blank' href='https://services.arcgisonline.com/ArcGIS/rest/services/'>ESRI</a>"
				}),
				style: function (feature, resolution) { return null; }, // Hide all vectors until styler function can render them
				styleUrl: "data/styles/esri_world_base_map_v2.json",
				styleKey: "esri"
			})
			
		]
	}
}