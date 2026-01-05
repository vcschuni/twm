app.config = {
	title: {
		desktop: "Development Services Offices",
		mobile: "DSO"
	},
	meta: {
		description: "The Ministry of Transportation and Transit (MoTT) has offices thoughout BC to assist you with your application.",
		author: ""
	},
	version: 1.0,
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
			text: "About Highway Use Permits",
			iconCls: "oi oi-info",
			action: "link",
			url: "https://www2.gov.bc.ca/gov/content/transportation/funding-engagement-permits/permits"
		},
		{ divider: true },
		{
			text: "Subdividing outside a municipality",
			iconCls: "oi oi-info",
			action: "link",
			url: "https://www2.gov.bc.ca/gov/content?id=98219C50C0A74658AB8CC813D5A92558"
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
	scaleline: {
		bar: true, // set to true to display a scale bar. default is false for a scale line
	 	units: "metric", // choices are: "metric","imperial","degrees". default is "metric"
		steps: 4, // number of scale bar divisions (applies only if bar=true). default is 4
		text: true, // set to true to display current scale ratio (applies only if bar=true). default is false
		minWidth: 240 // width of scaleline in pixels. default is 64		
	},			
	plugins: [
		{ 
			name: "DAGoffices",
			enabled: true
		},
		{
			name: "Home",
			tabName: "About",
			enabled: false
		},
		{
			name: "ZoomToGeoLocation",
			enabled: true,
			showBlip: true
		},
		// {
		// 	name: "Identify2Popup",
		// 	tabName: "Features",
		// 	enabled: true,
		// 	maxResults: 50
		// },
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
			name: "BasemapSwitcher",
			enabled: true
		},
		{
			name: "LayerController",
			tabName: "Layers",
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
				title: "Development Services Offices Locations",
				type: "overlay",
				visible: true,
				source: new ol.source.Vector({
					url: returnEnvironmentUrl("ogs-public") + "/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:ISS_DEVELOPMENT_SERVICES_OFFICE&maxFeatures=500&outputFormat=application/json",
					format: new ol.format.GeoJSON()
				}),

				style: new ol.style.Style({image: new ol.style.Icon({anchor: [0.5, 46],anchorXUnits: 'fraction',anchorYUnits: 'pixels',src: 'application/plugins/DAGoffices/img/pin.png',}),}),

				fields: [
					{
						name: "OFFICE_LIST_NAME",
						searchable: true,
						nameTransform: function(name) { return "Office Name"; }
					},
					{
						name: "OFFICE_ADDRESS",
						nameTransform: function(name) { return "Address"; }
					},
					{
						name: "OFFICE_PHONE_NUMBER",
						nameTransform: function(name) { return "Phone"; },
						valueTransform: function(value) {
							return '<a href="tel:'+value+'">'+value+'<a>'; }
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
							return "<span id='"+md5(feature.id)+"'><div style='height:31px;line-height:31px;'>Calculating distance <image src='data:image/gif;base64,R0lGODlhgAAGAPcAAAAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICAkJCQoKCgsLCwwMDA0NDQ4ODg8PDxAQEBERERISEhMTExQUFBUVFRYWFhcXFxgYGBkZGRoaGhsbGxwcHB0dHR4eHh8fHyAgICEhISIiIiMjIyQkJCUlJSYmJicnJygoKCkpKSoqKisrKywsLC0tLS4uLi8vLzAwMDExMTIyMjMzMzQ0NDU1NTY2Njc3Nzg4ODk5OTo6Ojs7Ozw8PD09PT4+Pj8/P0BAQEFBQUJCQkNDQ0REREVFRUZGRkdHR0hISElJSUpKSktLS0xMTE1NTU5OTk9PT1BQUFFRUVJSUlNTU1RUVFVVVVZWVldXV1hYWFlZWVpaWltbW1xcXF1dXV5eXl9fX2BgYGFhYWJiYmNjY2RkZGVlZWZmZmdnZ2hoaGlpaWpqamtra2xsbG1tbW5ubm9vb3BwcHFxcXJycnNzc3R0dHV1dXZ2dnd3d3h4eHl5eXp6ent7e3x8fH19fX5+fn9/f4GBgYKCgoODg4SEhIWFhYaGhoeHh4iIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp+fn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq+vr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6+vr+/v8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs/Pz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f7+/v///////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCgD/ACwAAAAAgAAGAAAIQgBV/Cn3r6DBgwgTKlzIsKHDhxAjSkQIAMCfiRgzatzIMWJFFR1DihxJkiIAkCVTqlzZsOJFljBjphRIUKbNmxoDAgAh+QQJCgD/ACwAAAAAgAAGAAAITgD/CRw4sNwfFSr+lCPIsKHDhxAjSpxIsaLFh38AaATw56LHjyBDipSoYiMAFSNTqlzJUmDJjShbypxJ02HGjR1r6ty50iBChTyDCn0YEAAh+QQJCgD/ACwAAAAAgAAGAAAIWgBV/Cn3r6DBgwgNlvujQiDBhBAjSpxIsaLFixMBAPiD0eAfjRo5dhxJsqTJjABUkFQBMuXJlzBjUtSociRLkDVl6tx5MiTJjyBF8hxKtKJDkgsbDizKtCnCgAAh+QQJCgD/ACwAAAAAgAAGAAAIYQD/CRw4sNwfFSr+lCPIsOE/gwgVOpxIsaLFixgzavz3B4BHAH82dvwYcqPJkyhTUlTxEYCKjSw/vlRJs6bNlS1nZozpUefNn0BRjvRYMuNQkEGTKsUIMeFCjU0lLp0KNCAAIfkECQoA/wAsAAAAAIAABgAACGoAVfwp96+gwYMIDZb7o0IgwYQIFzYcCLGixYsYM2rUCADAn40H/3Ts+BGjyJElQapcyRJkRxUsVYwEABOjzJE1W+rcufNlzJk5Ld70ybOoUY4eWZ4kmXFp0qNQox50yFIiVYxWKUrdejQgACH5BAkKAP8ALAAAAACAAAYAAAhyAP8JHDiw3B8VKv6UI8iw4T+DCBU6fHgw4cKJGDNq3Mix48Q/AEIC+OPxH0iRJB2eDJmypMuXMDuqEAlARcmZIm06xBlSZ8yfQH/yrHmTpk+GQ48GXco048qRJZ+2ZCi1qdWrDCFaLKlVosOuF7GKLRkQACH5BAkKAP8ALAAAAACAAAYAAAh6AFX8KfevoMGDCA2W+6NCIMGECBc2HHhQokOIGDNq3Mixo0EAAP54PPgHJEiRG0uaRFlQ5cmRMGPKhAhShUwVJgHY3IjT5M6CPWvOHEq0o9CYQXVyTPrzH9OiUKMefBnTZUiOVln+yyq1a9GLMS1S3Cj2YcGyXtPKDAgAIfkECQoA/wAsAAAAAIAABgAACHsA/wkcOLDcHxUq/pQjyLDhP4MIFTp8eDDhQooRL07cyLGjx48f/wAYCeAPSIEiSZp0mHLkypYlT8qcSdOjCpIAVMi8SVKnQ54jfQLNWbOoUZpDfYJMOpHpP6dHo0pliXMlSJhWGWJFWXWq168QLcoMK9Eh2Ytnv6oFGRAAIfkECQoA/wAsAAAAAIAABgAACIYAVfwp96+gwYMIDZb7o0IgwYQIFzYceFCiw4IWKULcyLGjx48QAQD4AxLhH5EiSXo8iVJlQZYpX6IcWbKmzZsGRarAqWLmTo89Uf4sGFQnUZ84kyrdaPRmUQBDOT6NOvWo0KVYsca8CZPmypku/3VVOTarWZ4abWZ82HFtRYYX/7k9SxdkQAAh+QQJCgD/ACwAAAAAgAAGAAAIhgD/CRw4sNwfFSr+lCPIsOE/gwgVOnx4MOFCihEvQrQ4saPHjyBDOvwDoCSAPyIFkjSJcqTJkypftlxZsmXKmzhzClTxUsVNniZ9OgRaUihRAEZ76lzK1ONRoSKfTpT6jyrVplix0oSZcqtNhl5jshRbM6tZphslpkx7sSFbgW8xcjxL12FAACH5BAkKAP8ALAAAAACAAAYAAAiLAP8JHEiwoMFyf1So+FPO4MGECxsORKiQoUCKES9CtOiwo8ePIEOKdPgHgEkAf0KWPJly4EqTLV+iFCiz5cibOHOOVHESgIqQPE/+HBjU5NCiPgUiHaqzqdOmS4H2ZPovatWpSrE+3coVZE2VPW3++zo2LE2zXdOq1VhR4keMHNlm/AdXYt21eAUGBAAh+QQJCgD/ACwAAAAAgAAGAAAIiQD/CRxIsKDBgwPL/VGh4k85hAoZOhQYseHDfxUnYlxoEaHHjyBDihx58A+AkwD+IDSJUuU/liddwkwpcKZLkjhz6sSpAiUAFQh7ogT6T+hJokZ/CkxKdKfTp1CZBvWJlOpSq0WxQt3KVaTNlT5lhq059mXZrmjTEsx40SBbihw1vt0osa1aqAEBACH5BAkKAP8ALAAAAACAAAYAAAiKAP8JHEiwoMGDCAeW+6NCxZ9yBBc2fChQokOI/yxSzMjwYsKPIEOKHEmS4B8AKAH8MZlSpcCTKVf+g4lSJk2XJXPq3JlTRUsVBH2mBPpPKEqiRgEg/cmzqdOnApMSjcq0aFWpVIdC3cpV5E2ZL1vaFBs2ZtmaXdOqjdhxY8W2GDXGhft2Isa1OQMCACH5BAkKAP8ALAAAAACAAAYAAAiGAP8JHEiwoMGDCBOW+6NCxZ9yAhc2fBiRoUOI/yRerDgRY8KPIEOKHEmS4B8AKAH8EXgy5cp/LVG+jKmSZcqaJXPq3LlTxU0VAn2mBPpPKEqiRgEg/cmzqdOnBJMuHRqUaVGrUqFq3UqS5sybX13aFAsTLNezaA1qpJjRItu1GOFy3Jh2ZEAAIfkECQoA/wAsAAAAAIAABgAACIkA/wkcSLCgwYMIExIs90eFij/lBDJ0CFFiw4cR/03EuPBiRYUgQ4ocSTLkHwAoAfwReDLlyn8tUb6MqZIgzZclc+rcWVJFSgAqBPpMGfTfUJRFjwIlqLQoz6dQozYV+jNpVapEmV6NyrUryZssf84UG9alTbJe06o1uPFj24xvLVLMKJfj2oQBAQAh+QQJCgD/ACwAAAAAgAAGAAAIiQD/CRxIsKDBgwgTIiz3R4WKP+UEMnQIUWLDhxH/TcS48GJFhSBDihxJEuEfACgB/BF4MuXKfy1Rvoyp0mTKmiVz6twpUsVNFQJ9pgT6TyhKokYBEDWYdCnPp1B1Ng36k+pQq0cRTo3KtStImjNvhnXJUqxNsl7TqrVIMePGj2/desxoMO5agQEBACH5BAkKAP8ALAAAAACAAAYAAAiJAP8JHEiwoMGDCBMqFFjujwoVf8oxdAhR4r+GDyMSxFhx4UWKGj2KHEmy5ME/AFIC+CMQpUqW/1ymhNlS5UqPMm+a3Mmz50AVNlUIBKpS6D+iKY0ODeoRKQClPqNKTejUaNWlRQleXbh1qtevMW3CzDlWLEGyOM2CXRuVY0i3FuFuBGlRodyeAQEAIfkECQoA/wAsAAAAAIAABgAACIcA/wkcSLCgwYMIEyo0WO6PChV/ygls+DDiRIcQJR6kmHFhQY4WPYocSZLkHwAoAfwReDLlyn8tUb40GFNlyZozS+rcWVJFSgAqBPpMGfTfUJRFDR4F2vNnUp5Qox5cWpSqUKcIrZLUKrVrV5wsf74Ee5DsSLNe0+4EqZHtxYoaGWIMOdItwoAAIfkECQoA/wAsAAAAAIAABgAACIUA/wkcSLCgwYMIEypUWO6PChV/ygls+DAiQYoQJS7EaHGhQYoeQ4ocufAPgJMA/gg0iVLlQJYnXSqEmZLkypM2c+pcqAIlABUCe6IEOlDoSaIKjf7MKXSn06dBfRJVivQfVY9XbTaFytUmTZdfCYYt6VPmSJZd04rkqJHtRYcZPbq1STEgACH5BAkKAP8ALAAAAACAAAYAAAh6AP8JHEiwoMGDCBMqXDiw3B8VKv6UE+gQokSEFSNOZNjwoUaOIEOKHDnwD4CTAP4INIlS5UGWJ12ChJmSpM2bOFWgBKBCoE6UPQ/+PBkU5FCeOJMqZXg0aFOET0NGXUq16j+aLrEi1BqSq9WvODNe/Cd2o8GyItEiDAgAIfkECQoA/wAsAAAAAIAABgAACHoA/wkcSLCgwYMIEypceLDcHxUq/pQj6BCiRIYVI05kWLAix48gQ4L8A6AkgD8ESZpEuVBlSZYhVYqcSZOmCpMAVBC8aVLnQp4lfYbkWbOoUYVAc+7EKTRh0qYfiR6dStXlyZQ4YSa0qvWjTKpgi2a8OHDsRoVmZ1YMCAAh+QQJCgD/ACwAAAAAgAAGAAAIcQD/CRxIsKDBgwgTKly4sNwfFSr+lEPoEKJEhgQrRpyIsaPHjyAV/gFAEsAfhCNLnvSYkuTKkDBjyjSooiQAFQhrlsTpUSdJnjODCu1pE2hBnzc/IjU6tKlTgi1NorT5EmPUqk+zDtV48SBXjh2/JgwIACH5BAkKAP8ALAAAAACAAAYAAAhrAP8JHEiwoMGDCBMqXMiwYLk/KlT8KcfwYcSJDR1CzMixo8ePA/8AGAngD0ORJE16RAmypcuX/1SQBKCCoUySNT3ehMmz58KbI3MqBErz406fSJP+QzlSpUKmJT+yVEoVpkWJFBdexejRYkAAIfkECQoA/wAsAAAAAIAABgAACGEA/wkcSLCgwYMIEypcyLBhuT8qVPwp13Dgw4gTK2rcyLGjx39/AIgE8GdjyJElP6pcybKhipEAVGx8OVJmy5s4W9IUabPizpg5gwo1CTNlxZMijQ5dypTgRYkUNT7NiDAgACH5BAkKAP8ALAAAAACAAAYAAAhZAP8JHEiwoMGDCBMqXMiwocJyf1So+FPOIUGIKixq3Mixo8Y/AEIC+MMRJACPKFOqtKhCJICMG1ueXEmzJk2ZIWFqlGmzp8+NJkOSBBryp9GjCDFOrLgRY0AAIfkECQoA/wAsAAAAAIAABgAACE0A/wkcSLCgwYMIEypcyLChQ4Tl/qhQ8afcw4sYM2rciPEPgI8A/nAcSbKkyYMqQAJQcbKly5cMU4JkCbOmTZceQYq8ybOnxogTKyYMCAAh+QQJCgD/ACwAAAAAgAAGAAAIQgD/CRxIsKDBgwgTKlzIsKHDhwXL/VEBsaLFixgzOvwDAIDGjyBDiiyoouPIkyhTLizpUaXLlyc5toRJs6ZFiSoCAgAh+QQJCgD/ACwAAAAAgAAGAAAILwD/CRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJjQEBADs=' /></div></span>";
						}
					}					
				]
			}),	
			

			new ol.layer.Vector({
				title: "MoTT Development Service Area",
				type: "overlay",
				visible: true,
				opacity: 0.5,
				source: new ol.source.Vector({
					url: returnEnvironmentUrl("ogs-public") + "/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=hwy:ISS_DEVELOPMENT_SERVCS_BNDRY_V&maxFeatures=500&outputFormat=application/json",
					format: new ol.format.GeoJSON()
				}), 

				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: "rgba(244, 184, 0, 0.1)",
						weight: 1
					  }),
				   stroke: new ol.style.Stroke({
						color: "rgba(117 115 105)",
						width: 3
				   })
				}),  

				fields: [
					{
						name: "MOTI_DISTRICT",
						searchable: true,
						nameTransform: function(name) { return "MOTT District"; }
					},
					{
						name: "AREA_NAME",
						searchable: true,
						nameTransform: function(name) { return "Development Services Area"; }
					},
					{
						name: "OFFICE_LIST_NAME",
						searchable: true,
						nameTransform: function(name) { return "Office Name"; }
					},
					
					{
						name: "OFFICE_ADDRESS",
						nameTransform: function(name) { return "Address"; }
					},
					{
						name: "OFFICE_PHONE_NUMBER",
						nameTransform: function(name) { return "Phone"; },
						valueTransform: function(value) {
							return '<a href="tel:'+value+'">'+value+'<a>'; }
					},
					{
						name: "GENERAL_INQUIRIES_EMAIL",
						nameTransform: function(name) { return "General Inquiries Email"; },
						valueTransform: function(value) {
							return '<a href="email:'+value+'">'+value+'<a>'; }
					},
					
					// {
					// 	name: "OFFICE_GEOMETRY",
					// 	nameTransform: function(name) { return "For future use"; },
					// 	valueTransform: function(value) {
					// 		console.log("hey stop here");
					// 		let officepoint = {geometry:value};
					// 		let newoffice = convertToOpenLayersFeature("GeoJSON",officepoint);
					// 		clearHighlightedFeatures();
					// 		highlightFeature(newoffice);
					// 		//build a button here that zooms to feature zoomToFeature(newofficepoint)---
					// 		return '<a href="email:'+value+'">'+value+'<a>'; }
					// }
					
				]
				
			}),

			new ol.layer.Image({
				title: "Arterial Highways",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:Arterial"
					},
					transition: 0
				})
			}),
			new ol.layer.Tile({
				title: "Controlled Access Highways",
				type: "overlay",
				visible: false,
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
			new ol.layer.Image({
				title: "Provincial Public Highways",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("ogs-public") + "/ows",
					params: {
						LAYERS: "hwy:XBC_LRDW_SDO_RFI",
						STYLES: "DAG_RFI"
					},
					transition: 0
				}),
				fields: [
					{
						name: "RFI_HIGHWAY_NAME",
						searchable: true,
						nameTransform: function(name) {return "Unique ID"}
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
				]
			}),	
		
			new ol.layer.Tile({
				title: "Land Title Parcels",
				type: "overlay",
				visible: false,
				opacity: 0.35,
				source: new ol.source.TileWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
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
						searchType: "number",
						searchable: true,
						title: true,
						nameTransform: function(name) { return "PID:"; }
					}
				] 
			}),	
			new ol.layer.Image({
				title: "Municipalities",
				type: "overlay",
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
					params: {
						LAYERS: "pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP"
					},
					transition: 0
				}),
				fields: [
					{
						name: "ADMIN_AREA_NAME",
						searchable: false,
						title: true,
						nameTransform: function(name) { return "Municipality:"; }
					}
				]
			}),
			new ol.layer.Image({
				title: "Regional Districts",
				type: "overlay",
				opacity: 0.5,
				visible: false,
				source: new ol.source.ImageWMS({
					url: returnEnvironmentUrl("bcgw-public") + "/ows",
					params: {
						LAYERS: "pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP"
					},
					transition: 0
				}),
				fields: [
					{
						name: "ADMIN_AREA_NAME",
						searchable: true,
						nameTransform: function(name) { return "Name"; }
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


