// cwmc
function getBBOX() {
	return ol.proj.transformExtent(app.map.getView().calculateExtent(app.map.getSize()), app.map.getView().getProjection().getCode(), outputProjection).join(",") + ",EPSG:4326";
}

app.config = {
	title: {
		desktop: "CHRIS Web Map for Contractors",
		mobile: "CWMC"
	},
	meta: {
		description: "",
		author: ""
	},
	version: 1.0,
	contact: {
		name: "CHRIS Administrator",
		email: "Maintenance.Programs@gov.bc.ca"
	},
	rememberState: true,
	rewriteUrl: true,
	sidebar: {
		width: 500,
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
				enabled: false,
				maxFeatures: 50000
			},
			additionalSources: [
				{
					name: "BCGW",
					url: "https://openmaps.gov.bc.ca/geo/ows"
				}
			]
		},	
		{
			name: "AdvancedExporter",
			tabName: "Exporter",
			enabled: true
		},	
		{
			name: "Identify2Popup",
			enabled: true,
			maxResults: 500
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
		},
		{
			name: "ZoomToInitialExtent",
			enabled: true
		},
		{
			name: "ShowClickCoordinates",
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
			min: 5,
			max: 24
		},
		layers: [
			// Overlay Layers
			new ol.layer.Image({
				title: "Bridge Structure Roads",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_BSR"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_BSR&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_BSR&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}
					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "BMIS_STRUCTURE_TYPE",
							label: "Structure Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Bridge", cql: "BMIS_STRUCTURE_TYPE='BRIDGE'" },
								{ name: "Culvert", cql: "BMIS_STRUCTURE_TYPE='CULVERT'" },
								{ name: "Marine", cql: "BMIS_STRUCTURE_TYPE='MARINE'" },
								{ name: "Retaining Wall", cql: "BMIS_STRUCTURE_TYPE='RWALL'" },
								{ name: "Sign Bridge", cql: "BMIS_STRUCTURE_TYPE='SIGN'" },
								{ name: "Tunnel", cql: "BMIS_STRUCTURE_TYPE='TUNNEL'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Cattle Guards",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:V_NM_NIT_CG_SDO_DT"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CG_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CG_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_CG_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "CATTLE_GUARD_TYPE",
							label: "Cattle Guard Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Concrete", cql: "CATTLE_GUARD_TYPE='C'" },
								{ name: "Metal", cql: "CATTLE_GUARD_TYPE='M'" },
								{ name: "Metal Rail", cql: "CATTLE_GUARD_TYPE='MR'" },
								{ name: "Ungulate", cql: "CATTLE_GUARD_TYPE='U'" },
								{ name: "Wood", cql: "CATTLE_GUARD_TYPE='W'" },
								{ name: "Other", cql: "CATTLE_GUARD_TYPE='N'" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Culverts",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:CWR_CULV_EXPORT"
					},
					transition: 0
				}),

				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CULV_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CULV_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_CULV_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "CULVERT_TYPE",
							label: "Culvert Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Down Drain", cql: "CULVERT_TYPE='D'" },
								{ name: "Entrance", cql: "CULVERT_TYPE='E'" },
								{ name: "Flume", cql: "CULVERT_TYPE='F'" },
								{ name: "Horizontal", cql: "CULVERT_TYPE='H'" },
								{ name: "Other", cql: "CULVERT_TYPE='N'" },
								{ name: "Roadway", cql: "CULVERT_TYPE='R'" },
								{ name: "Unknown", cql: "CULVERT_TYPE='Z'" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),

			new ol.layer.Image({
				title: "Curb and Gutter",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:CWR_CGUT_EXPORT"
					},
					transition: 0
				}),

				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CGUT_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_CGUT_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_CGUT_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "CURB_GUTTER_TYPE",
							label: "Curb and Gutter Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Ashphalt", cql: "CURB_GUTTER_TYPE='A'" },
								{ name: "Concrete", cql: "CURB_GUTTER_TYPE='C'" },
								{ name: "Other", cql: "CURB_GUTTER_TYPE='N'" },
								{ name: "Unresolved at Conversion", cql: "CURB_GUTTER_TYPE='S'" },
								{ name: "Ashphalt Sidewalk", cql: "CURB_GUTTER_TYPE='SA'" },
								{ name: "Concrete Sidewalk", cql: "CURB_GUTTER_TYPE=SC'" },
								{ name: "Gravel Sidewalk", cql: "CURB_GUTTER_TYPE=SG'" },
								{ name: "Timber Sidewalk", cql: "CURB_GUTTER_TYPE=SW'" },
								{ name: "Unknown", cql: "CURB_GUTTER_TYPE='Z'" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),
			
			new ol.layer.Image({
				title: "Drainage Appliance",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_DA"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_DA&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_DA&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_DA&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "DRAINAGE_APPLIANCE_TYPE",
							label: "Drainage Appliance Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Catch Basins", cql: "DRAINAGE_APPLIANCE_TYPE='CATCH BASINS'" },
								{ name: "CB Double Grage", cql: "DRAINAGE_APPLIANCE_TYPE='CB DOUBLE GRATE'" },
								{ name: "Debris Torrent Structure", cql: "DRAINAGE_APPLIANCE_TYPE='DEBRIS TORRENT STRUCTURE'" },
								{ name: "Dry Well", cql: "DRAINAGE_APPLIANCE_TYPE='DRY WELL'" },
								{ name: "Engineered Wetland", cql: "DRAINAGE_APPLIANCE_TYPE='ENGINEERED WETLAND'" },
								{ name: "Manholes", cql: "DRAINAGE_APPLIANCE_TYPE='MANHOLES'" },
								{ name: "Manhole and Catch Basin", cql: "DRAINAGE_APPLIANCE_TYPE='MANHOLE AND CATCH BASIN'" },
								{ name: "Other", cql: "DRAINAGE_APPLIANCE_TYPE='OTHER'" },
								{ name: "Settlement Pond", cql: "DRAINAGE_APPLIANCE_TYPE='SETTLEMENT POND'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Guardrail",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_GR"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_GR&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_GR&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "GUARDRAIL_TYPE",
							label: "Guardrail Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "690mm NP Old Style", cql: "GUARDRAIL_TYPE='690mm NP Old Style'" },
								{ name: "460mm NP Old Style", cql: "GUARDRAIL_TYPE='460mm NP Old Style'" },
								{ name: "760mm NP Old Style", cql: "GUARDRAIL_TYPE='760mm NP Old Style'" },
								{ name: "Sub-Standard W-Beam", cql: "GUARDRAIL_TYPE='Sub-Standard W-Beam'" },
								{ name: "Standard W-Beam", cql: "GUARDRAIL_TYPE='Standard W-Beam'" },
								{ name: "690mm NP New Style", cql: "GUARDRAIL_TYPE='690mm NP New Style'" },
								{ name: "810mm NP New Style", cql: "GUARDRAIL_TYPE='810mm NP New Style'" },
								{ name: "Cable Barrier", cql: "GUARDRAIL_TYPE='Cable Barrier'" },
								{ name: "Other", cql: "GUARDRAIL_TYPE='Other'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Linear Safety Feature",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_LSF"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_LSF&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_LSF&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "LSF_TYPE",
							label: "LSF Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Arrestor Bed", cql: "LSF_TYPE='Arrestor Bed'" },
								{ name: "Glare Screen", cql: "LSF_TYPE='Glare Screen'" },
								{ name: "Runaway Lane", cql: "LSF_TYPE='Runaway Lane'" },
								{ name: "Rumble Strip", cql: "LSF_TYPE='Rumble Strip'" },
								{ name: "Bed", cql: "LSF_TYPE='FOO'" },
								{ name: "Undefined/Other", cql: "LSF_TYPE='Undefined/Other'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Rest Area",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_RA"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_RA&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_RA&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_RA&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "REST_AREA_CLASS",
							label: "Rest Area Class",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Class A", cql: "REST_AREA_CLASS='RAM Class A'" },
								{ name: "Class B", cql: "REST_AREA_CLASS='RAM Class B'" },
								{ name: "Class C", cql: "REST_AREA_CLASS='RAM Class C'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Railway Crossing",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_RRX"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_RRX&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_RRX&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_RRX&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "HQ", cql: "ADMIN_UNIT_CODE=100" }
							]
						},
						{
							field: "CROSS_SECTION_POSITION",
							label: "Cross Section Position",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Overhead - Left", cql: "CROSS_SECTION_POSITION='Overhead - Left'" },
								{ name: "Overhead - Right", cql: "CROSS_SECTION_POSITION='Overhead - Right'" },
								{ name: "Underpass - Left", cql: "CROSS_SECTION_POSITION='Underpass - Left'" },
								{ name: "Underpass - Right", cql: "CROSS_SECTION_POSITION='Underpass - Right'" },
								{ name: "Level - Left", cql: "CROSS_SECTION_POSITION='Level - Left'" },
								{ name: "Overhead", cql: "CROSS_SECTION_POSITION='Overhead'" },
								{ name: "Level - Right", cql: "CROSS_SECTION_POSITION='Level - Right'" },
								{ name: "Underpass", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Level", cql: "CROSS_SECTION_POSITION='Level'" }
							]
						}
					]
				}
			}),
			
			new ol.layer.Image({
				title: "Safety Feature",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_SF"
					},
					transition: 0
				}),
				advancedExporter: { // max 63
					types: [ 
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_SF&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_SF&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_SF&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "SAFETY_FEATURE_TYPE",
							label: "Safety Feature Type",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Barrels", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Other", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Sand Barrel Crash", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Sliding", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Styrofoam Block", cql: "CROSS_SECTION_POSITION='Underpass'" },
								{ name: "Unknown", cql: "CROSS_SECTION_POSITION='Level'" }
							]
						}
					]
				}
			}),
			
			new ol.layer.Image({
				title: "Signs",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_SIGN"
					},
					transition: 0
				}),
				advancedExporter: { // max 24000
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SIGN_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SIGN_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_SIGN_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							mandatory: true,
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),

			new ol.layer.Image({
				title: "Storm Sewer",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_SS"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_SS&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_SS&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_SS&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT_CODE",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT_CODE=401" },
								{ name: "02", cql: "ADMIN_UNIT_CODE=402" },
								{ name: "03", cql: "ADMIN_UNIT_CODE=403" },
								{ name: "04", cql: "ADMIN_UNIT_CODE=404" },
								{ name: "05", cql: "ADMIN_UNIT_CODE=405" },
								{ name: "06", cql: "ADMIN_UNIT_CODE=406" },
								{ name: "07", cql: "ADMIN_UNIT_CODE=407" },
								{ name: "08", cql: "ADMIN_UNIT_CODE=408" },
								{ name: "09", cql: "ADMIN_UNIT_CODE=409" },
								{ name: "10", cql: "ADMIN_UNIT_CODE=410" },
								{ name: "11", cql: "ADMIN_UNIT_CODE=411" },
								{ name: "12", cql: "ADMIN_UNIT_CODE=412" },
								{ name: "13", cql: "ADMIN_UNIT_CODE=413" },
								{ name: "14", cql: "ADMIN_UNIT_CODE=414" },
								{ name: "15", cql: "ADMIN_UNIT_CODE=415" },
								{ name: "16", cql: "ADMIN_UNIT_CODE=416" },
								{ name: "17", cql: "ADMIN_UNIT_CODE=417" },
								{ name: "18", cql: "ADMIN_UNIT_CODE=418" },
								{ name: "19", cql: "ADMIN_UNIT_CODE=419" },
								{ name: "20", cql: "ADMIN_UNIT_CODE=420" },
								{ name: "21", cql: "ADMIN_UNIT_CODE=421" },
								{ name: "22", cql: "ADMIN_UNIT_CODE=422" },
								{ name: "23", cql: "ADMIN_UNIT_CODE=423" },
								{ name: "24", cql: "ADMIN_UNIT_CODE=424" },
								{ name: "25", cql: "ADMIN_UNIT_CODE=425" },
								{ name: "26", cql: "ADMIN_UNIT_CODE=426" },
								{ name: "27", cql: "ADMIN_UNIT_CODE=427" },
								{ name: "28", cql: "ADMIN_UNIT_CODE=428" },
								{ name: "40", cql: "ADMIN_UNIT_CODE=440" },
								{ name: "41", cql: "ADMIN_UNIT_CODE=441" },
								{ name: "42", cql: "ADMIN_UNIT_CODE=442" },
								{ name: "43", cql: "ADMIN_UNIT_CODE=443" },
								{ name: "44", cql: "ADMIN_UNIT_CODE=444" }
							]
						},
						{
							field: "STORM_SEWER_MATERIAL",
							label: "Storm Sewer Material",
							type: "select",
							options: [
								{ name: "All Types", cql: "" },
								{ name: "Box", cql: "STORM_SEWER_MATERIAL='Box'" },
								{ name: "Concrete", cql: "STORM_SEWER_MATERIAL='Concrete'" },
								{ name: "Galvanized", cql: "STORM_SEWER_MATERIAL='Galvanized'" },
								{ name: "Plastic", cql: "STORM_SEWER_MATERIAL='Plastic'" },
								{ name: "Multiplate", cql: "STORM_SEWER_MATERIAL='Multiplate'" },
								{ name: "Other", cql: "STORM_SEWER_MATERIAL='Other'" },
								{ name: "Galvanized Perforated Pipe", cql: "STORM_SEWER_MATERIAL='Galvanized Perforated Pipe'" },
								{ name: "Plastic Perforated Pipe", cql: "STORM_SEWER_MATERIAL='Plastic Perforated Pipe'" },
								{ name: "Wood", cql: "STORM_SEWER_MATERIAL='Wood'" },
								{ name: "Unknown", cql: "STORM_SEWER_MATERIAL='Unknown'" }
							]
						}
					]
				}
			}),

			new ol.layer.Image({
				title: "Highway Profile",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_HP"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_HP_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_HP_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_HP_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),
			new ol.layer.Image({
				title: "Highway Reference Points",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_HRP"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_HRP_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_HRP_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_HRP_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}

					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),
			new ol.layer.Image({
				title: "Maintenance Class (showing Winter)",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_MC",
						STYLES: "CWR_MC_WINTER_XBC"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_MC_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_MC_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_MC_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}


					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),
			new ol.layer.Image({
				title: "Special Lanes",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_SL"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SL_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SL_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_SL_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}


					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE = '{{value}}'"
						}

					]
				}
			}),
			new ol.layer.Image({
				title: "Surface",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",

					params: {
						LAYERS: "hwy:CWR_SURF_EXPORT"
					},
					transition: 0
				}),
				advancedExporter: {
					types: [
						{
							name: "Comma Delimited Textfile (CSV)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SURF_REPORT&maxFeatures=50000&outputFormat=csv"
						},
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:CWR_SURF_EXPORT&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3ACWR_SURF_EXPORT&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}


					],
					criteria: [
						{
							field: "ADMIN_UNIT",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "ADMIN_UNIT=401" },
								{ name: "02", cql: "ADMIN_UNIT=402" },
								{ name: "03", cql: "ADMIN_UNIT=403" },
								{ name: "04", cql: "ADMIN_UNIT=404" },
								{ name: "05", cql: "ADMIN_UNIT=405" },
								{ name: "06", cql: "ADMIN_UNIT=406" },
								{ name: "07", cql: "ADMIN_UNIT=407" },
								{ name: "08", cql: "ADMIN_UNIT=408" },
								{ name: "09", cql: "ADMIN_UNIT=409" },
								{ name: "10", cql: "ADMIN_UNIT=410" },
								{ name: "11", cql: "ADMIN_UNIT=411" },
								{ name: "12", cql: "ADMIN_UNIT=412" },
								{ name: "13", cql: "ADMIN_UNIT=413" },
								{ name: "14", cql: "ADMIN_UNIT=414" },
								{ name: "15", cql: "ADMIN_UNIT=415" },
								{ name: "16", cql: "ADMIN_UNIT=416" },
								{ name: "17", cql: "ADMIN_UNIT=417" },
								{ name: "18", cql: "ADMIN_UNIT=418" },
								{ name: "19", cql: "ADMIN_UNIT=419" },
								{ name: "20", cql: "ADMIN_UNIT=420" },
								{ name: "21", cql: "ADMIN_UNIT=421" },
								{ name: "22", cql: "ADMIN_UNIT=422" },
								{ name: "23", cql: "ADMIN_UNIT=423" },
								{ name: "24", cql: "ADMIN_UNIT=424" },
								{ name: "25", cql: "ADMIN_UNIT=425" },
								{ name: "26", cql: "ADMIN_UNIT=426" },
								{ name: "27", cql: "ADMIN_UNIT=427" },
								{ name: "28", cql: "ADMIN_UNIT=428" },
								{ name: "40", cql: "ADMIN_UNIT=440" },
								{ name: "41", cql: "ADMIN_UNIT=441" },
								{ name: "42", cql: "ADMIN_UNIT=442" },
								{ name: "43", cql: "ADMIN_UNIT=443" },
								{ name: "44", cql: "ADMIN_UNIT=444" }
							]
						},
						{
							field: "RFI_UNIQUE",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_UNIQUE='{{value}}'"
						}

					]
				}
			}),
			
			
			new ol.layer.Image({
				title: "MoTT Highways",
				type: "overlay",
				visible: true,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_RFI"
					},
					transition: 0
				}),
				fields: [
					{
						name: "RFI_HIGHWAY_NAME",
						searchable: true,
						nameTransform: function(name) {return "RFI Unique ID"}
					},
					{
						name: "RFI_HIGHWAY_DESCRIPTION",
						searchable: true,
						nameTransform: function(name) {return "Description"}
					},
					{
						name: "RFI_HIGHWAY_DIRECTION",
						nameTransform: function(name) {return "Direction"}
					},
					{
						name: "RFI_HIGHWAY_LENGTH",
						nameTransform: function(name) {return "Length"}
					}
				],
				advancedExporter: {
					types: [
						{
							name: "Keyhole Markup Language (KML)",
							url: returnEnvironmentUrl("ogs-public") + "/ows/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:XBC_LRDW_SDO_RFI&maxFeatures=50000&outputFormat=kml"
						},
						{
							name: "KML with styling (see NOTES below)",
							url: returnEnvironmentUrl("ogs-public") + "/ows?service=WMS&version=1.3.0&request=GetMap&layers=hwy%3AXBC_LRDW_SDO_RFI&format=application%2Fvnd.google-earth.kml%2Bxml&width=1024&height=1024&maxFeatures=50000&bbox="
						}


					],
					criteria: [
						{
							field: "SERVICE_AREA",
							label: "Service Area",
							type: "select",
							options: [
								{ name: "Choose one", cql: "" },
								{ name: "01", cql: "SERVICE_AREA='01'" },
								{ name: "02", cql: "SERVICE_AREA='02'" },
								{ name: "03", cql: "SERVICE_AREA='03'" },
								{ name: "04", cql: "SERVICE_AREA='04'" },
								{ name: "05", cql: "SERVICE_AREA='05'" },
								{ name: "06", cql: "SERVICE_AREA='06'" },
								{ name: "07", cql: "SERVICE_AREA='07'" },
								{ name: "08", cql: "SERVICE_AREA='08'" },
								{ name: "09", cql: "SERVICE_AREA='09'" },
								{ name: "10", cql: "SERVICE_AREA='10'" },
								{ name: "11", cql: "SERVICE_AREA='11'" },
								{ name: "12", cql: "SERVICE_AREA='12'" },
								{ name: "13", cql: "SERVICE_AREA='13'" },
								{ name: "14", cql: "SERVICE_AREA='14'" },
								{ name: "15", cql: "SERVICE_AREA='15'" },
								{ name: "16", cql: "SERVICE_AREA='16'" },
								{ name: "17", cql: "SERVICE_AREA='17'" },
								{ name: "18", cql: "SERVICE_AREA='18'" },
								{ name: "19", cql: "SERVICE_AREA='19'" },
								{ name: "20", cql: "SERVICE_AREA='20'" },
								{ name: "21", cql: "SERVICE_AREA='21'" },
								{ name: "22", cql: "SERVICE_AREA='22'" },
								{ name: "23", cql: "SERVICE_AREA='23'" },
								{ name: "24", cql: "SERVICE_AREA='24'" },
								{ name: "25", cql: "SERVICE_AREA='25'" },
								{ name: "26", cql: "SERVICE_AREA='26'" },
								{ name: "27", cql: "SERVICE_AREA='27'" },
								{ name: "28", cql: "SERVICE_AREA='28'" },
								{ name: "40", cql: "SERVICE_AREA='40'" },
								{ name: "41", cql: "SERVICE_AREA='41'" },
								{ name: "42", cql: "SERVICE_AREA='42'" },
								{ name: "43", cql: "SERVICE_AREA='43'" },
								{ name: "44", cql: "SERVICE_AREA='44'" }
							]
						},
						{
							field: "RFI_HIGHWAY_NAME",
							label: "RFI Unique ID",
							placeholder:"S-A-S-H-H-H",
							type: "text",
							cql: "RFI_HIGHWAY_NAME = '{{value}}'"
						}

					]
				}				
			}),
			
			
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
				title: "ESRI Navigation (vector)",
				type: "base",
				allowVectorFeaturesToBeIdentified: false,
				visible: false,
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
			}),
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
			})	
		
		]
	}
}