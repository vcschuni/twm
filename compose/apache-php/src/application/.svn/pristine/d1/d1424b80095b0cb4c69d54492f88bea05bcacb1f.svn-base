class CVRestrictionFinder {
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "CVRestrictionFinder";
		this.version = 2.0;
		this.author = "MoTT Spatial Team";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = this.pcfg.tabName ? this.pcfg.tabName : "CVRestrictionFinder";
		this.tabContentFile = "application/plugins/CVRestrictionFinder/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent; // jQuery element
		this.waitingForMapClick = false;

		//Dimensional and Weight Restriction Presets
		this.defaultWidth = 0;
		this.defaultHeight = 0;
		this.defaultLength = 0;
		this.defaultWeightGVW = 0;
		this.defaultWeight1AXLE = 0;
		this.defaultWeight2AXLE = 0;
		this.defaultWeight3AXLE = 0;

		//Config App Features
		this.weightFeature = this.pcfg.weightsFeature;
		this.showRestrictionType = this.pcfg.showRestrictionType ? this.pcfg.showRestrictionType : [];
		this.showAllRestrictionsFeature = this.pcfg.showAllRestrictions;
		this.showPermittableRoute = this.pcfg.showPermittableRoute;
		this.showAllRestrictions = this.pcfg.showAllRestrictions;
		this.showRouteOwnership = this.pcfg.showRouteOwnership;
		this.showOverrideRestrictions = this.pcfg.showOverrideRestrictions;
		this.showAlertModal = this.pcfg.showAlertModal ? this.pcfg.showAlertModal : false;

		//Counts
		this.failedRestrictionCount = 0;
		this.cautionRestrictionCount = 0;
		this.tempRestrictionCount = 0;

		//Global lists
		//this.points = [];
		this.primaryRouteSummaryStatistics = {};
		//this.permittableRouteSummaryDirections = [];
		this.permittableRouteSummaryStatistics = {};
		this.primaryRouteSummaryDirections = [];
		this.informationRestrictions = [];
		this.restrictionLocationData = [];
		this.restrictionOverride = [];
		this.primaryRoute = [];
		//this.permittableRoute = [];
		this.tlidSegments = [];
		this.routeRestrictions = [];
		this.allRestrictions = [];

		// Define route point styles

		//Define restriction point styles
		this.routeRestrictionsStyles = {
			Fail: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-violation.png",
				}),
			}),
			Temporary: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-temporary.png",
				}),
			}),
			Override: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-override.png",
				}),
			}),
			Pass: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					declutterMode: "declutter",
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-pass.png",
				}),
			}),
			Caution: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-caution.png",
				}),
			}),
			Clear: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/navigation-restriction-clear.png",
				}),
			}),
			Info: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [50, 50],
					anchorXUnits: "pixels",
					anchorYUnits: "pixels",
					scale: 0.23,
					src: "application/plugins/CVRestrictionFinder/img/route-restriction-info.png",
				}),
			}),
		};
		// Define route point styles
		this.pointStyles = {
			start: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(35, 119, 16, 1)",
						width: 2,
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)",
					}),
				}),
			}),
			waypoint: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(0, 0, 255, 1)",
						width: 2,
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)",
					}),
				}),
			}),
			end: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(255, 0, 0, 1)",
						width: 2,
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 1)",
					}),
				}),
			}),
		};
		this.routePartitionStyles = {
			MOTT: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(43, 115, 218)",
					width: 5,
				}),
			}),
			Other: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(50, 205, 50)",
					width: 5,
				}),
			}),
			Ferry: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(51, 171, 249)",
					width: 4,
				}),
			}),
			Federal: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(235, 45, 55)",
					width: 5,
				}),
			}),
			truckRoute: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(44, 95, 45)",
					width: 5,
				}),
			}),
			nonTruckRoute: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: "rgba(151, 188, 98)",
					width: 5,
				}),
			}),
		};
		this.primaryRouteStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(43, 115, 218, 0.5)",
				width: 5,
			}),
		});
		this.permittableRouteStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(0, 255, 0, 0.5)",
				width: 5,
			}),
		});
		this.restrictedRouteStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(255, 0, 0, 0.5)",
				lineDash: [10, 10], //or other combinations
				width: 4,
				lineDashOffset: 6,
			}),
		});
		this.hiddenRouteStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(255, 0, 0, 0.01)",
				lineDash: [10, 10], //or other combinations
				width: 4,
				lineDashOffset: 6,
			}),
		});

		/////Layer Section

		// Define and add the allrestriction layer
		this.allRestrictionLayer = new ol.layer.Vector({
			title: " All Restrictions",
			hideFromLayerController: true,
			fields: [
				{
					name: "LOCATION_ID",
					title: true,
					searchable: true,
					nameTransform: function (name) {
						return "Location ID";
					},
				},
				{
					name: "FEATURE_NAME",
					searchable: true,
					title: true,
					nameTransform: function (name) {
						return "Feature Name";
					},
				},
				{
					name: "ROAD_NAME",
					title: true,
					nameTransform: function (name) {
						return "Road Name";
					},
				},
				{
					name: "TRAVEL_DIRECTION",
					title: true,
					nameTransform: function (name) {
						return "Travel Directions";
					},
				},
				{
					name: "NETWORK_SEGMENT_ID",
					title: true,
					nameTransform: function (name) {
						return "Network Segment ID";
					},
				},
				{
					//Define css for vertical restrictions per lane
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("VERTICAL") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Vertical Restrictions";
						} else {
							return false;
						}
					},

					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("VERTICAL") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rVertElement = $('<div class="cvrf-rVert-container"></div>');

							//Sort by lanes
							value.sort((a, b) => a.RESTRICTION_LANE_NUMBER - b.RESTRICTION_LANE_NUMBER);
							var restrictionCount = value.length;
							$.each(value, function (i, restriction) {
								var laneCount = restriction.RESTRICTION_TOTAL_LANES;

								if (restriction.RESTRICTION_TYPE == "VERTICAL") {
									var laneValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											laneValDiv = '<div class=cvrf-vertsummary-lane-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
											break;
										case "Override":
											laneValDiv = '<div class=cvrf-vertsummary-lane-value style="background-color:rgb(0 148 255 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
											break;
										default:
											laneValDiv = '<div class="cvrf-vertsummary-lane-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
									}
									//If there are more lanes on segment then restrictions by lane, add addtional "Clear" Lane
									if (laneCount > restrictionCount) {
										for (var i = 0; i < laneCount; i++) {
											var laneNumber = i + 1;
											if (restriction.RESTRICTION_LANE_NUMBER == laneNumber) {
												var vertSummary = $(
													'\
											<div class="cvrf-vertsummary-container">\
											<span class="cvrf-vertsummary-lane">Lane ' +
														laneNumber +
														" - " +
														restriction.RESTRICTION_DIRECTION +
														"</span>\
											" +
														laneValDiv +
														"\
											</div>"
												);
												rVertElement.append(vertSummary);
											} else {
												var vertSummary = $(
													'\
										<div class="cvrf-vertsummary-container">\
										<span class="cvrf-vertsummary-lane">Lane ' +
														laneNumber +
														" - " +
														restriction.RESTRICTION_DIRECTION +
														'</span>\
										<div class="cvrf-vertsummary-lane-value" style="background-color:rgb(255 255 255);"><p >Clear</p></div>\
										</div>'
												);
												rVertElement.append(vertSummary);
											}
										}
									} else {
										var vertSummary = $(
											'\
									<div class="cvrf-vertsummary-container">\
									<span class="cvrf-vertsummary-lane">Lane ' +
												restriction.RESTRICTION_LANE_NUMBER +
												" - " +
												restriction.RESTRICTION_DIRECTION +
												"</span>\
									" +
												laneValDiv +
												"\
									</div>"
										);
										rVertElement.append(vertSummary);
									}
								}

								//hide restrictionElement

								restrictionElement.append(rVertElement);
							});

							if (!!$(restrictionElement).text()) {
								return restrictionElement.html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for horizontal restrictions
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("HORIZONTAL") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Horizontal Restrictions";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("HORIZONTAL") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rHorElement = $('<div class="cvrf-rHor-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "HORIZONTAL") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-horsummary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-horsummary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
									}
									var horSummary = $(
										'\
										<div class="cvrf-horsummary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rHorElement.append(horSummary);
								}
								restrictionElement.append(rHorElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for length restrictions
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("LENGTH") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Length Restrictions";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("LENGTH") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rLenElement = $('<div class="cvrf-rLen-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "LENGTH") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-lenSummary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-lenSummary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "m</p></div>";
									}
									var lenSummary = $(
										'\
										<div class="cvrf-lenSummary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rLenElement.append(lenSummary);
								}
								restrictionElement.append(rLenElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for weight-gvw restrictions
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-GVW") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Weight - GVW";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-GVW") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rW_gvwElement = $('<div class="cvrf-rweight-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "WEIGHT-GVW") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-rweight_summary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-rweight_summary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
									}
									var w_gvw_Summary = $(
										'\
										<div class="cvrf-rweight_summary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rW_gvwElement.append(w_gvw_Summary);
								}

								restrictionElement.append(rW_gvwElement);
							});

							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for weight-single axle restrictions
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-1AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Weight - Single Axle";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-1AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rW_gvwElement = $('<div class="cvrf-rweight-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "WEIGHT-1AXLE") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-rweight_summary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-rweight_summary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
									}
									var w_gvw_Summary = $(
										'\
										<div class="cvrf-rweight_summary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rW_gvwElement.append(w_gvw_Summary);
								}
								restrictionElement.append(rW_gvwElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for weight-Tandem Axle restrictions
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-2AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Weight - Tandem Axle";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-2AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rW_gvwElement = $('<div class="cvrf-rweight-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "WEIGHT-2AXLE") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-rweight_summary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-rweight_summary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
									}
									var w_gvw_Summary = $(
										'\
										<div class="cvrf-rweight_summary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rW_gvwElement.append(w_gvw_Summary);
								}
								restrictionElement.append(rW_gvwElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for weight-Tridem Axle restriction
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-3AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "Weight - Tridem Axle";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("WEIGHT-3AXLE") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rW_gvwElement = $('<div class="cvrf-rweight-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "WEIGHT-3AXLE") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-rweight_summary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-rweight_summary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.RESTRICTION_VALUE + "kg</p></div>";
									}
									var w_gvw_Summary = $(
										'\
										<div class="cvrf-rweight_summary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rW_gvwElement.append(w_gvw_Summary);
								}
								restrictionElement.append(rW_gvwElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for no commercial vehicle Axle restriction
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("NCV") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							return "No Commercial Vehicle";
						} else {
							return false;
						}
					},
					valueTransform: function (value, feature) {
						if (app.plugins.CVRestrictionFinder.showRestrictionType.includes("NCV") || app.plugins.CVRestrictionFinder.showRestrictionType.length === 0) {
							var restrictionElement = $('<div class="cvrf-r-container"></div>');
							var rW_gvwElement = $('<div class="cvrf-ncv-container"></div>');
							$.each(value, function (i, restriction) {
								if (restriction.RESTRICTION_TYPE == "NCV") {
									var status_ValDiv;
									switch (restriction.RESTRICTION_STATUS) {
										case "Fail":
											status_ValDiv = '<div class=cvrf-ncv_summary-value style="background-color:rgb(242 0 0 / 35%);"><p >' + "Yes" + "</p></div>";
											break;
										default:
											status_ValDiv = '<div class="cvrf-ncv_summary-value" style="background-color:rgb(255 255 255);"><p >' + "No" + "</p></div>";
									}
									var w_gvw_Summary = $(
										'\
										<div class="cvrf-ncv_summary-container">\
										' +
											status_ValDiv +
											"\
										</div>"
									);
									rW_gvwElement.append(w_gvw_Summary);
								}
								restrictionElement.append(rW_gvwElement);
							});
							if (!!$(restrictionElement).text()) {
								return $(restrictionElement).html();
							} else {
								return "None";
							}
						} else {
							return false;
						}
					},
				},
				{
					//Define css for weight-Tridem Axle restriction
					name: "RESTRICTIONS",
					nameTransform: function (name) {
						return "Alert";
					},
					valueTransform: function (value, feature) {
						var restrictionElement = $('<div class="cvrf-i-container"></div>');
						var rW_gvwElement = $('<div class="cvrf-alert-container"></div>');
						$.each(value, function (i, restriction) {
							if (restriction.RESTRICTION_TYPE == "INFO") {
								var status_ValDiv = '<div class="cvrf-alert_summary-value" style="background-color:rgb(255 255 255);"><p >' + restriction.PUBLIC_COMMENT + "</p></div>";
								var w_gvw_Summary = $(
									'\
									<div class="cvrf-alert_summary-container">\
									' +
										status_ValDiv +
										"\
									</div>"
								);
								rW_gvwElement.append(w_gvw_Summary);
							}
							restrictionElement.append(rW_gvwElement);
						});
						if (!!$(restrictionElement).text()) {
							return $(restrictionElement).html();
						} else {
							return "None";
						}
					},
				},
			],
			//allowVectorFeaturesToBeIdentified: true,
			//type: "overlay",
			source: new ol.source.Vector({}),
			style: this.getRestrictionStyle,
		});
		this.allRestrictionLayer.setZIndex(621);
		app.map.addLayer(this.allRestrictionLayer);

		// Define and add the route points layer
		var source = new ol.source.Vector({});
		this.routePointsLayer = new ol.layer.Vector({
			source: source,
			style: this.getPointStyle,
		});
		this.routePointsLayer.setZIndex(650);
		app.map.addLayer(this.routePointsLayer);

		// Define and add the route path points hover layer
		this.routePathPointHoverLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 4,
					stroke: new ol.style.Stroke({
						color: "rgba(128, 128, 128, 0.7)",
						width: 2,
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 0.7)",
					}),
				}),
			}),
		});
		this.routePathPointHoverLayer.setZIndex(606);
		app.map.addLayer(this.routePathPointHoverLayer);

		// Define and add the restriction layer
		this.routeRestrictionLayer = new ol.layer.Vector({
			hideFromLayerController: true,
			title: "Route Restrictions",
			fields: [],
			preventIdentify: true,
			type: "overlay",
			source: new ol.source.Vector({}),
			style: this.getRestrictionStyle,
		});
		this.routeRestrictionLayer.setZIndex(621);
		app.map.addLayer(this.routeRestrictionLayer);

		// Define and add the route Ownership Layer
		this.permittableRoutePartitionLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: this.getRoutePartitionStyle,
		});
		this.permittableRoutePartitionLayer.setZIndex(611);
		app.map.addLayer(this.permittableRoutePartitionLayer);

		// Define and add the route Ownership Layer
		this.primaryRoutePartitionLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: this.getRoutePartitionStyle,
		});
		this.primaryRoutePartitionLayer.setZIndex(611);
		app.map.addLayer(this.primaryRoutePartitionLayer);

		// Make route points draggable
		var modify = new ol.interaction.Modify({
			source: source,
			deleteCondition: function () {
				return false;
			},
			insertVertexCondition: function () {
				return false;
			},
		});
		modify.on("modifyend", function (evt) {
			// For each point modified (should only be 1), update it's corresponding input
			$.each(evt.features.getArray(), function (index, feature) {
				var feature4326 = transformFeature(feature, app.map.getView().getProjection(), "EPSG:4326");
				var centreLL = getFeatureCentre(feature4326);
				var inputId = feature.get("routePointId");
				$("#" + inputId).val(formatCoordinateAsString(centreLL, 4326));
				$("#" + inputId).attr("longitude", centreLL[0]);
				$("#" + inputId).attr("latitude", centreLL[1]);
			});

			// Update Layers with change
			app.plugins.CVRestrictionFinder.updatelayersonchange();
		});
		app.map.addInteraction(modify);

		// Define and add the route path layer
		this.routePathLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: [
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(43, 115, 218, 0.5)",
						width: 5,
					}),
				}),
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(102, 157, 246, 0.5)",
						width: 2,
					}),
				}),
			],
		});
		this.routePathLayer.setZIndex(605);
		app.map.addLayer(this.routePathLayer);

		// Define and add the permittable route layer
		this.permittableRouteLayer = new ol.layer.Vector({
			source: new ol.source.Vector({}),
			style: [
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: "rgba(0, 255, 0, 0.5)",
						width: 5,
					}),
				}),
			],
		});
		this.permittableRouteLayer.setZIndex(606);
		app.map.addLayer(this.permittableRouteLayer);

		// Allow the creation of new route points when an existing route path is clicked on (if configured)
		if (this.pcfg.allowWayPoints) {
			app.map.on("pointerdown", function (e) {
				if (app.plugins.CVRestrictionFinder.waitingForMapClick === false) {
					var pixel = app.map.getEventPixel(e.originalEvent);
					var isFirstFeature = true;
					app.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
						if (isFirstFeature && feature.get("routePath")) {
							var clickCoordinateMap = e.coordinate;
							var clickCoordinate4326 = ol.proj.transform(clickCoordinateMap, app.map.getView().getProjection(), "EPSG:4326");
							app.plugins.CVRestrictionFinder.addRoutePoint(clickCoordinate4326);
						}
						if (!feature.get("routePathHoverPoint")) isFirstFeature = false;
					});
				}
			});
		}
		// Highlight various elements as the mouse is moved
		app.map.on("pointermove", function (e) {
			// Clear any highlighting
			$(".cvrf-location-input").css("background-color", "transparent");
			app.plugins.CVRestrictionFinder.routePathPointHoverLayer.getSource().clear();

			// Find features currently at the mouse pointer
			var pixel = app.map.getEventPixel(e.originalEvent);
			app.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
				// Highlight route points
				if (feature.get("routePoint")) {
					var locationInputId = feature.get("routePointId");
					$("#" + locationInputId).css("background-color", "rgba(255,255,0,0.4)");
				}
				// Show a point snapped to the route path (ux feature that shows user that route can be dragged
				if (feature.get("routePath")) {
					// Define GeoJSON formatter
					var gjFormat = new ol.format.GeoJSON();
					// Convert the OpenLayers route path into GeoJSON 4326
					var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.CVRestrictionFinder.routePathLayer.getSource().getFeatures(), {
						dataProjection: "EPSG:4326",
						featureProjection: app.map.getView().getProjection(),
					});
					// Snap the current mouse location to the path
					var routePathPointFeature = new ol.Feature({
						geometry: new ol.geom.Point(e.coordinate),
					});
					var routePathPointFeature4326 = transformFeature(routePathPointFeature, app.map.getView().getProjection(), "EPSG:4326");
					var routePathPointGeoJSON = turf.point(routePathPointFeature4326.getGeometry().getCoordinates());
					var routePathPointSnappedGeoJSON = turf.nearestPointOnLine(routePathGeoJSON, routePathPointGeoJSON, { units: "kilometers" });
					// Transform that snapped location to the map projection and show it
					var routePathPointFeatures = gjFormat.readFeatures(routePathPointSnappedGeoJSON, {
						dataProjection: "EPSG:4326",
						featureProjection: app.map.getView().getProjection(),
					});
					var firstRoutePathPointFeature = routePathPointFeatures[0]; // should only be 1
					firstRoutePathPointFeature.set("routePathHoverPoint", true);
					app.plugins.CVRestrictionFinder.routePathPointHoverLayer.getSource().addFeature(firstRoutePathPointFeature);
				}
			});
		});

		// Add the plugin
		this.addPlugin();
	}

	/**
	 * Function: clearAll
	 * @param () none
	 * @returns () nothing
	 * Function that clears everything back to default
	 */
	clearAll() {
		// Set default height & width
		$("#cvrf-height-input").val(app.plugins.CVRestrictionFinder.defaultHeight);
		$("#cvrf-width-input").val(app.plugins.CVRestrictionFinder.defaultWidth);
		$("#cvrf-length-input").val(app.plugins.CVRestrictionFinder.defaultLength);
		$("#cvrf-weight-input").val(app.plugins.CVRestrictionFinder.defaultWeightGVW);
		$("#cvrf-weight-TanA-input").val(app.plugins.CVRestrictionFinder.defaultWeight2AXLE);
		$("#cvrf-weight-TriA-input").val(app.plugins.CVRestrictionFinder.defaultWeight3AXLE);
		$("#cvrf-weight-SA-input").val(app.plugins.CVRestrictionFinder.defaultWeight1AXLE);

		//Clear all global variables
		app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics = {};
		app.plugins.CVRestrictionFinder.restrictedRouteTLIDs = [];
		app.plugins.CVRestrictionFinder.restrictionLocationData = [];
		app.plugins.CVRestrictionFinder.primaryRoute = [];
		app.plugins.CVRestrictionFinder.permittableRoute = [];
		//Clears restriction List
		$("#restriction-list").empty();
		//Clear Layers
		app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().clear();

		//Rerun to set all restrictions based on cleared inputs
		app.plugins.CVRestrictionFinder.setRestrictionStatus(app.plugins.CVRestrictionFinder.routeRestrictions);
		//Rerun Primary Route
		app.plugins.CVRestrictionFinder.findRoute();

		//Rerun show all restrictions if turned on
		if ($("#cvrf-show-all-restrictions-btn").is(":checked")) {
			app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();
		}
	}

	/**
	 * Function: Show Restriction List for override
	 * @param () none
	 * @returns () nothing
	 * Function opens a multifloating window to display all conflicting restrictions on the route to override
	 */
	overrideRestrictions() {
		var crWindow = $("<div id='rdmReporter-crwindow'></div>");
		//Loop through each location and add to element
		$.each(app.plugins.CVRestrictionFinder.restrictionLocationData, function (i, location) {
			if (location.STATUS != "Pass") {
				var RestrictionData = $('<div class="cvrf-conflict-restriction-container"></div>');
				var restrictionTable = $(
					'\
							<table id="restrictionTable" table class="table table-responsive table-hover">\
         					<thead>\
							<tr>\
							<th class="text-center">Restriction Type</th>\
							<th class="text-center">Lane Number</th>\
							<th class="text-center">Value</th>\
							<th class="text-center">Override</th>\
							</tr>\
							</thead>\
							<tbody></tbody>\
							</table>'
				);
				//Loop through each restriction and apply sort order based on type and lane #
				var vRestrictions = [];
				var hRestrictions = [];
				var lRestrictions = [];
				var ncvRestrictions = [];
				var wRestrictions = [];
				$.each(location.DATA, function (i, restriction) {
					if (restriction.RESTRICTION_TYPE == "VERTICAL") {
						vRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "HORIZONTAL") {
						hRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "LENGTH") {
						lRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "NCV") {
						ncvRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "WEIGHT-GVW") {
						wRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "WEIGHT-1AXLE") {
						wRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "WEIGHT-2AXLE") {
						wRestrictions.push(restriction);
					}
					if (restriction.RESTRICTION_TYPE == "WEIGHT-3AXLE") {
						wRestrictions.push(restriction);
					}
				});
				//Sort vertical restrictions by lane number
				vRestrictions.sort((a, b) => a.RESTRICTION_LANE_NUMBER - b.RESTRICTION_LANE_NUMBER);
				var restrictionList = vRestrictions.concat(hRestrictions, lRestrictions, ncvRestrictions, wRestrictions);
				//Loop through each restriction on a location and add to table and append to location element
				$.each(restrictionList, function (i, restriction) {
					if (restriction.RESTRICTION_STATUS != "Pass") {
						var restrictionType;
						var restrictionMeasurement;
						//Switch background colour depending on the restrictions type
						switch (restriction.RESTRICTION_TYPE) {
							case "VERTICAL":
								restrictionType = "Vertical";
								restrictionMeasurement = "m";
								break;
							case "HORIZONTAL":
								restrictionType = "Horizontal";
								restrictionMeasurement = "m";
								break;
							case "LENGTH":
								restrictionType = "Length";
								restrictionMeasurement = "m";
								break;
							case "NCV":
								restrictionType = "No Commercial Vehicles";
								restrictionMeasurement = "";
								break;
							case "WEIGHT-GVW":
								restrictionType = "Weight-GVW";
								restrictionMeasurement = "kg";
								break;
							case "WEIGHT-1AXLE":
								restrictionType = "Weight-1AXLE";
								restrictionMeasurement = "kg";
								break;
							case "WEIGHT-2AXLE":
								restrictionType = "Weight-2AXLE";
								restrictionMeasurement = "kg";
								break;
							case "WEIGHT-3AXLE":
								restrictionType = "Weight-3AXLE";
								restrictionMeasurement = "kg";
								break;
							default:
								restrictionType = restriction.RESTRICTION_TYPE.charAt(0) + restriction.RESTRICTION_TYPE.substring(1).toLowerCase();
						}

						var restrictionLaneNumber = restriction.RESTRICTION_LANE_NUMBER;
						if (restriction.RESTRICTION_LANE_NUMBER == null) {
							restrictionLaneNumber = "";
						}

						var restrictionTableRow = $(
							'\
						<tr class="clickable" data-bs-toggle="collapse" data-bs-target="#group-of-rows-1" aria-expanded="false" aria-controls="group-of-rows-1">\
						<td class="text-center">' +
								restrictionType +
								'</td>\
						<td class="text-center">' +
								restrictionLaneNumber +
								'</td>\
						<td class="text-center">' +
								(restriction.RESTRICTION_VALUE + restrictionMeasurement) +
								'</td>\
						<td class="text-center" id="overridebuttons"></td>\
						</tr>'
						);
						$(restrictionTable).append(restrictionTableRow);
						var overrideSwitch = $('<input class="form-check-input" type="checkbox" role="switch" id="overrideSwitch_' + restriction.RESTRICTION_ID + '">');

						//If restrictions in global override list, turn switches on
						if (app.plugins.CVRestrictionFinder.restrictionOverride.includes(restriction.RESTRICTION_ID)) {
							overrideSwitch.prop("checked", true);
						}
						overrideSwitch.data("RestrictionID", restriction.RESTRICTION_ID);
						overrideSwitch.click(function () {
							if ($(this).is(":checked")) {
								var restrictionID = restriction.RESTRICTION_ID;
								var restrictionStatus = [];
								//Loop through restrictions layer and if restriction = toggled restriction, set status to override
								$.each(app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().getFeatures(), function (index, feature) {
									var locationID = feature.get("LOCATION_ID");
									if (location.LOCATION_ID == locationID) {
										$.each(feature.get("RESTRICTIONS"), function (index, restriction) {
											if (restrictionID == restriction["RESTRICTION_ID"]) {
												restriction["RESTRICTION_STATUS"] = "Override";
											}
											restrictionStatus.push(restriction["RESTRICTION_STATUS"]);
										});
										feature.set("STATUS", "Override");
									}
								});
								app.plugins.CVRestrictionFinder.restrictionOverride.push($(this).data("RestrictionID"));
								app.plugins.CVRestrictionFinder.findPermittableRoute();
							} else {
								var restrictionID = restriction.RESTRICTION_ID;
								var restrictionStatus = [];
								$.each(app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().getFeatures(), function (index, feature) {
									var locationID = feature.get("LOCATION_ID");
									if (location.LOCATION_ID == locationID) {
										$.each(feature.get("RESTRICTIONS"), function (index, restriction) {
											if (restrictionID == restriction["RESTRICTION_ID"]) {
												restriction["RESTRICTION_STATUS"] = "Fail";
											}
											restrictionStatus.push(restriction["RESTRICTION_STATUS"]);
										});
										if (restrictionStatus.includes("Override")) {
											feature.set("STATUS", "Override");
										} else {
											feature.set("STATUS", "Failed");
										}
									}
								});
								let index = app.plugins.CVRestrictionFinder.restrictionOverride.indexOf($(this).data("RestrictionID"));
								if (index != -1) {
									app.plugins.CVRestrictionFinder.restrictionOverride.splice(index, 1);
								}
								app.plugins.CVRestrictionFinder.findPermittableRoute();
							}
						});
						var overrideSwitchDiv = $('<div class="form-check form-switch"></div>');
						overrideSwitchDiv.append(overrideSwitch);
						restrictionTableRow.find("td#overridebuttons").append(overrideSwitchDiv);
					}
					$(RestrictionData).append(restrictionTable);
				});

				var LocationData = $(
					'\
				<div class="cvrf-conflict-location-container">\
					<div class="cvrf-conflict-location-details">\
						<div class="zoomtolocationbutton"></div>\
						<div class="cvrf-conflict-location-info">\
							<div class="cvrf-conflict-location-details-name">' +
						location.FEATURE_NAME +
						" (#" +
						location.LOCATION_ID +
						')</div>\
							<div class="cvrf-conflict-location-details-roadname">' +
						location.LOCATION_ROAD_NAME +
						"</div>\
						</div>\
					</div>\
				</div>"
				);
				var zoomtobuttom = $('<button title="Zoom to Location" id="cvrf-zoomto-btn" button type="button" class="btn btn-sm btn btn-light"><span class="oi oi-compass"></span></button>');
				zoomtobuttom.data("locationID", location.LOCATION_ID);
				zoomtobuttom.click(function () {
					var locationID = $(this).data("locationID");
					$.each(app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().getFeatures(), function (i, feature) {
						if (feature.getProperties()["LOCATION_ID"] == locationID) {
							zoomToFeature(feature);
						}
					});
				});
				LocationData.find(".zoomtolocationbutton").append(zoomtobuttom);
				$(LocationData).append(RestrictionData);
				$(crWindow).append(LocationData);
			}
		});
		app.plugins.MultiFloatingWindow.open("OverrideRestrictions", "Override Restrictions", crWindow, 400, 300);
	}

	/**
	 * Function: getPartitionedLayers
	 * @param () none
	 * @returns () nothing
	 * Function builds the partitioned layers on the route
	 */
	getPartitionedLayers(data, routeType) {
		//Build Partition Layers
		// deturmine the start and end indices of each partition of the route
		var partitionDetails = {};
		var lastStartIndex = 0;
		var lastEndIndex = data.route.length - 1;
		var lastIndex = 0;

		$.each(data.partitions, function (index, partition) {
			//Clean up MOTI Partition Name, temporary while data gets corrected on the ITN
			if (partition.ownership == "Ministry Of Transportation") {
				//Correcting for capital O in of
				partition.ownership = "Ministry of Transportation";
			}
			if (partition.ownership == "Ministery of Transportation") {
				//Correcting for misspelling of Ministry
				partition.ownership = "Ministry of Transportation";
			}
			partitionDetails[index] = {
				startIndex: partition.index,
				endIndex: lastEndIndex,
				ownership: partition.ownership,
				ferry: partition.isFerry,
				truckroute: partition.isTruckRoute,
				x: data.route[lastEndIndex][0],
				y: data.route[lastEndIndex][1],
			};
			if (index == 0) {
				partitionDetails[index].endIndex = partition.index;
				partitionDetails[index].x = data.route[partition.index][0];
				partitionDetails[index].y = data.route[partition.index][1];
			} else {
				partitionDetails[index - 1].endIndex = partition.index;
				partitionDetails[index].x = data.route[partition.index][0];
				partitionDetails[index].y = data.route[partition.index][1];
			}
			lastEndIndex = lastStartIndex;
			lastStartIndex = partition.index;
			lastIndex = index;
		});
		partitionDetails[lastIndex].endIndex = data.route.length - 1;
		//Build each route partition segment
		//If ownership button is not active hide ownership layer
		if (!$("#cvrf-showOwnershipRoutes-btn").is(":checked")) {
			if (routeType == "Primary Route") {
				app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.hiddenRouteStyle);
			}
			if (routeType == "Permittable Route") {
				app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.hiddenRouteStyle);
			}
		}
		$.each(partitionDetails, function (partitionIndex, partition) {
			var startSlice = partition.startIndex;
			if (partition.endIndex == data.route.length - 1) {
				var partitionGeometry = new ol.geom.LineString(data.route.slice(startSlice));
			} else {
				var partitionGeometry = new ol.geom.LineString(data.route.slice(startSlice, partition.endIndex + 1));
			}
			var partitionGeometryInMapProjection = partitionGeometry.transform("EPSG:" + data.srsCode, app.map.getView().getProjection());
			var partitionFeature = new ol.Feature({
				geometry: partitionGeometryInMapProjection,
			});
			partitionFeature.set("routePath", true);
			partitionFeature.set("ownership", partition.ownership);
			partitionFeature.set("ferry", partition.ferry);
			partitionFeature.set("truckRoute", partition.truckroute);
			if (routeType == "Primary Route") {
				app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.getSource().addFeature(partitionFeature);
			}
			if (routeType == "Permittable Route") {
				app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.getSource().addFeature(partitionFeature);
			}
		});

		//Build full Route for directions
		var routeGeometry = new ol.geom.LineString(data.route);
		var routeGeometryInMapProjection = routeGeometry.transform("EPSG:" + data.srsCode, app.map.getView().getProjection());
		var routeFeature = new ol.Feature({
			geometry: routeGeometryInMapProjection,
		});

		//Function to find array match for coordinate search for partitions
		function findPartitionCords(partitionIndex) {
			var match = false;
			$.each(data.route, function (index, route) {
				if (partitionIndex == index) {
					match = [route[0], route[1]];
				}
			});
			return match;
		}
		//Calculate Distance by Partitions
		var moti_Distance = 0;
		var fed_Distance = 0;
		var local_Road = 0;
		var ferry = 0;
		var truckRouteDistance = 0;
		var nonTruckRouteDistance = 0;

		//Add partition distance to each ownership classification
		$.each(data.partitions, function (index, partition) {
			//Add to partition class distance
			if (partition.ownership == "Ministry of Transportation") {
				moti_Distance += partition.distance;
			}
			if (partition.ownership == "Federal Government") {
				fed_Distance += partition.distance;
			}
			if (partition.isFerry == true) {
				ferry += partition.distance;
			}
			if (partition.ownership === null) {
				local_Road += partition.distance;
			}
			//Subtract if ferry is on partition class
			if (partition.ownership === null && partition.isFerry === true) {
				local_Road -= partition.distance;
			}
			if (partition.ownership == "Ministry of Transportation" && partition.isFerry === true) {
				moti_Distance -= partition.distance;
			}
			if (partition.isTruckRoute === true) {
				truckRouteDistance += partition.distance;
			}
			if (partition.isTruckRoute === false) {
				nonTruckRouteDistance += partition.distance;
			}
		});

		if (routeType == "Primary Route") {
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.moti_Distance = moti_Distance;
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.fed_Distance = fed_Distance;
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.local_Road = local_Road;
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.ferry = ferry;
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.truckRouteDistance = truckRouteDistance;
			app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.nonTruckRouteDistance = nonTruckRouteDistance;
		}
		if (routeType == "Permittable Route") {
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.moti_Distance = moti_Distance;
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.fed_Distance = fed_Distance;
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.local_Road = local_Road;
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.ferry = ferry;
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.truckRouteDistance = truckRouteDistance;
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.nonTruckRouteDistance = nonTruckRouteDistance;
		}

		//Add partition to directions array for MOTT segments
		var routeDirections = data.directions;
		$.each(data.partitions, function (index, partition) {
			var partitionIndex = partition.index;
			//Get coordanates from route array based on index match
			var match = findPartitionCords(partitionIndex);
			partitionDetails = {
				distance: null,
				heading: null,
				name: partition.ownership,
				ferry: partition.isFerry,
				truckRoute: partition.isTruckRoute,
				point: [match[0], match[1]],
				text: null,
				time: null,
				type: "Partition",
			};
			routeDirections.unshift(partitionDetails);
		});
		// Get the coordinate pairs from route
		var routePoints = [];
		$.each(data.route, function (index, routeCoordinate) {
			routePoints.push(turf.point(routeCoordinate));
		});
		var routePointsFC = turf.featureCollection(routePoints);

		//For each direction coordinate, find closest point along route
		$.each(routeDirections, function (index, direction) {
			var directionCoordinate = direction.point;
			var directionGeometry = new ol.geom.Point(directionCoordinate);
			var directionPoint = turf.point(directionCoordinate);
			var nearestRoutePoint = turf.nearest(directionPoint, routePointsFC); // turf operations must be done in 4326
			routeDirections[index].sortOrder = nearestRoutePoint.properties.featureIndex;
		});

		// Sort the directions based on sortOrder
		routeDirections.sort(function (a, b) {
			var a1 = a.sortOrder,
				b1 = b.sortOrder;
			if (a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});

		return routeDirections;
	}

	/**
	 * Function: open directions multiwindow
	 * @param () none
	 * @returns () nothing
	 *
	 */
	directions() {
		//If permittable route is on, use its direction data
		var summaryStatistics = this.primaryRouteSummaryStatistics;

		if ($("#cvrf-toggle-permittable-route-switch").is(":checked")) {
			summaryStatistics = this.permittableRouteSummaryStatistics;
		}
		var directionDetails = [];

		//If ownership and truck route buttons are off, remove all partitions from directions window
		if (!$("#cvrf-showOwnershipRoutes-btn").is(":checked") && !$("#cvrf-showTruckRoutes-btn").is(":checked")) {
			$.each(summaryStatistics.travelDirections, function (index, direction) {
				if (direction.type != "STOPOVER") {
					//Do not pass values if STOPOVER is present
					//Build PrimaryRoute Directions
					if (!$("#cvrf-showOwnershipRoutes-btn").is(":checked") && !$("#cvrf-showTruckRoutes-btn").is(":checked")) {
						if (direction.type != "Partition") {
							directionDetails.push(direction);
						}
					}
				}
			});
		}
		//If Truck Route button is active, format directions window to only include partitions for truck routes
		if ($("#cvrf-showTruckRoutes-btn").is(":checked")) {
			var truckRouteFlag = [];
			$.each(summaryStatistics.travelDirections, function (index, direction) {
				if (direction.type != "STOPOVER") {
					//Do not pass values if STOPOVER is present
					if (direction.type != "Partition") {
						directionDetails.push(direction);
					} else {
						if (direction.truckRoute != truckRouteFlag[0]) {
							var splitText;
							if (direction.truckRoute == true) splitText = "<div class='ownershipSplit' style='color:rgba(44, 95, 45)' ><b>Entering Truck Route</b></div>";
							if (direction.truckRoute == false) splitText = "<div class='ownershipSplit' style='color:rgba(151, 188, 98)' ><b>Entering Non-Truck Route</b></div>";
							var partitionSplit = {
								distance: 0,
								name: direction.name,
								point: [direction.point[0], direction.point[1]],
								text: splitText,
								time: 0,
								type: direction.type,
							};
							directionDetails.push(partitionSplit);
						}
						truckRouteFlag = [];
						truckRouteFlag.push(direction.truckRoute);
					}
				}
			});
		}
		//If Ownership Route button is active, format directions window to only include partitions for ownership
		if ($("#cvrf-showOwnershipRoutes-btn").is(":checked")) {
			var ownershipPartionName = [];
			$.each(summaryStatistics.travelDirections, function (index, direction) {
				if (direction.type != "STOPOVER") {
					//Do not pass values if STOPOVER is present
					if (direction.type != "Partition") {
						directionDetails.push(direction);
					} else {
						if (ownershipPartionName != direction.name || direction.ferry === true) {
							if (direction.name == null) {
								var splitText = "<div class='ownershipSplit' style='color:rgba(50, 205, 50);'>Entering Local Government Permitted Road Network</div>";
							}
							if (direction.name == "Ministry of Transportation") {
								var splitText = "<div class='ownershipSplit' style='color:rgba(43, 115, 218)' >Entering MOTT Permitted Road Network</div>";
							}
							if (direction.ferry === true) {
								var splitText = "<div class='ownershipSplit' style='color:rgba(51, 171, 249)' >Entering Ferry Route</div>";
							}
							if (direction.name == "Federal Government") {
								var splitText = "<div class='ownershipSplit' style='color:rgba(235, 45, 55);' >Entering Federal Permitted Road Network</div>";
							}
							ownershipPartionName = direction.name;
							var partitionSplit = {
								distance: 0,
								name: direction.name,
								point: [direction.point[0], direction.point[1]],
								text: splitText,
								time: 0,
								type: direction.type,
							};
							directionDetails.push(partitionSplit);
						}
					}
				}
			});
		}
		$("#cvrf-directions").html("");
		if (summaryStatistics.hasOwnProperty("travelDirections")) {
			// Build the directions table
			var directionsTable = $("<table class='table table-sm cvrf-directions-table'><tbody></tbody></table>");
			// Loop thru each direction leg

			$.each(directionDetails, function (index, leg) {
				//Get route attributes by direction point location
				// Determine which icon to use
				var navIcon;
				switch (leg.type) {
					case "START":
					case "FINISH":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-start-end.png";
						break;
					case "CONTINUE":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-continue.png";
						break;
					case "TURN_LEFT":
					case "TURN_SHARP_LEFT":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-turn-left.png";
						break;
					case "TURN_RIGHT":
					case "TURN_SHARP_RIGHT":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-turn-right.png";
						break;
					case "TURN_SLIGHT_LEFT":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-turn-slight-left.png";
						break;
					case "TURN_SLIGHT_RIGHT":
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-turn-slight-right.png";
						break;
					case "FERRY":
						navIcon = "application/plugins/CVRestrictionFinder/img/ferry.png";
						break;
					case "INFORMATION":
						navIcon = "application/plugins/CVRestrictionFinder/img/route-restriction-info.png";
						break;
					case "Info":
						navIcon = "application/plugins/CVRestrictionFinder/img/route-restriction-info.png";
						break;
					case "Failed":
						navIcon = "application/plugins/CVRestrictionFinder/img/route-restriction-violation.png";
						break;
					case "Caution":
						navIcon = "application/plugins/CVRestrictionFinder/img/route-restriction-caution.png";
						break;
					default:
						navIcon = "application/plugins/CVRestrictionFinder/img/navigation-unknown.png";
				}
				// Get and cleanup the direct leg text
				var directionText = leg.text;
				var distancetext = Number(leg.distance).toFixed(2);
				// Build the direction leg (append the leg as data)
				var direction;
				//Switch background colour depending on the restrictions type
				switch (leg.type) {
					case "Failed":
						direction = $(`<tr><td><img src="${navIcon}"style='height: 18px;width: 18px;'></td><td style="background-color: #ff000040;">${directionText}</td></tr>`).data(leg);
						break;
					case "Caution":
						direction = $(`<tr><td><img src="${navIcon}"style='height: 18px;width: 18px;'></td><td style="background-color: #ffff0040;">${directionText}</td></tr>`).data(leg);
						break;
					default:
						direction = $(`<tr><td><img src="${navIcon}"style='height: 18px;width: 20px;'></td><td>${directionText}</td></tr>`).data(leg);
				}
				// Add the event handlers
				direction.hover(function () {
					var directionPoint4326 = $(this).data().point;
					var directionGeometry = new ol.geom.Point(directionPoint4326);
					var directionGeometryInMapProjection = directionGeometry.transform("EPSG:4326", app.map.getView().getProjection());
					var directionFeature = new ol.Feature({
						geometry: directionGeometryInMapProjection,
					});
					highlightFeature(directionFeature);
				}, clearHighlightedFeatures);
				direction.click(function () {
					var directionPoint4326 = $(this).data().point;
					var directionGeometry = new ol.geom.Point(directionPoint4326);
					var directionGeometryInMapProjection = directionGeometry.transform("EPSG:4326", app.map.getView().getProjection());
					var directionFeature = new ol.Feature({
						geometry: directionGeometryInMapProjection,
					});
					zoomToFeature(directionFeature);
					highlightFeature(directionFeature);
				});
				// Append leg to overall directions
				directionsTable.append(direction);
			});
		}

		//Create floating window element for directions
		var dwindow = $("<div id='cvrf-dwindow'></div>");

		var summaryTable = $(
			'\
			<div class="cvrf-dSummary" style="display:none;">\
			<div class="cvrf-dSummary-container">\
			<div class="cvrf-dSummary-container-name"">Total Distance: \
			</div>\
			<div class="cvrf-dSummary-container-value">\
			<p>' +
				summaryStatistics.routeDistance +
				'</p>\
			</div>\
			</div>\
			<hr class="solid">'
		);

		if ($("#cvrf-showOwnershipRoutes-btn").is(":checked")) {
			//Append MOTT Permittable Road Distance Summary
			if (summaryStatistics.moti_Distance != 0) {
				var motiDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total MOTT Permittable Roads: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(43,115,218);">' +
						Math.round(this.primaryRouteSummaryStatistics.moti_Distance) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(motiDistanceTotal);
			}
			if (summaryStatistics.fed_Distance != 0) {
				var fedDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total Federal Permittable Roads: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(235,45,55);">' +
						Math.round(this.primaryRouteSummaryStatistics.fed_Distance) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(fedDistanceTotal);
			}

			if (summaryStatistics.local_Road != 0) {
				var locDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total Local Permittable Roads: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(50,205,50);">' +
						Math.round(this.primaryRouteSummaryStatistics.local_Road) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(locDistanceTotal);
			}

			if (summaryStatistics.ferry != 0) {
				var ferryDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total Ferry Distance: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(51, 171, 249);">' +
						Math.round(this.primaryRouteSummaryStatistics.ferry) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(ferryDistanceTotal);
			}
		}
		if ($("#cvrf-showTruckRoutes-btn").is(":checked")) {
			//Append Truck Route Distance Summary
			if (summaryStatistics.truckRouteDistance != 0) {
				var truckRouteDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total Truck Routes: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(44, 95, 45);">' +
						Math.round(this.primaryRouteSummaryStatistics.truckRouteDistance) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(truckRouteDistanceTotal);
			}
			if (summaryStatistics.nonTruckRouteDistance != 0) {
				var nonTruckRouteDistanceTotal = $(
					'<div class="cvrf-dSummary-container"><div class="cvrf-dSummary-container-name">Total Non-Truck Routes: </div><div class="cvrf-dSummary-container-value"><p style="color:rgb(151, 188, 98);">' +
						Math.round(this.primaryRouteSummaryStatistics.nonTruckRouteDistance) +
						" km</p></div></div></div>"
				);
				$(dwindow).append(nonTruckRouteDistanceTotal);
			}
		}
		//Append Direction window buttons and content
		dwindow.append(summaryTable);
		dwindow.append(directionsTable);
		app.plugins.MultiFloatingWindow.open("directions", "Directions", dwindow, 500, 300);

		//If data in route distance, keep display of summary
		if (summaryStatistics.routeDistance) {
			$(".cvrf-dSummary").show();
		}
	}

	/**
	 * Function: Find Permittable Route
	 * @param () none
	 * @returns () nothing
	 * Function creates a route which routes around restriction values provided by the user
	 */
	findPermittableRoute() {
		if ($("#cvrf-toggle-permittable-route-switch").is(":checked")) {
			//clear permittable route contents
			app.plugins.CVRestrictionFinder.permittableRouteLayer.getSource().clear();
			app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.getSource().clear();

			// Hide messages
			$("#cvrf-message").hide();

			// Clear summary and permittable route variables
			app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics = {};
			app.plugins.CVRestrictionFinder.updateSummary();
			app.plugins.CVRestrictionFinder.permittableRoute = [];

			// Hide messages
			$("#cvrf-message").hide();

			// Show the route points on the map
			app.plugins.CVRestrictionFinder.updateRoutePointsOnMap();

			// Determine if reverse route button should be enabled
			if (app.plugins.CVRestrictionFinder.routePointsLayer.getSource().getFeatures().length > 1) {
				$("#cvrf-reverse-route-btn").prop("disabled", false);
			} else {
				$("#cvrf-reverse-route-btn").prop("disabled", true);
			}

			// Get the route points as a 2d array
			var points = [];
			$.each(app.plugins.CVRestrictionFinder.routePointsLayer.getSource().getFeatures(), function (index, feature) {
				var feature4326 = transformFeature(feature, app.map.getView().getProjection(), "EPSG:4326");
				points.push(feature4326.getGeometry().getCoordinates());
			});

			// Bail if there are not enough points
			if (points.length < 2) return;

			// Convert points array into string usable by the router-form
			var pointString = "";
			$.each(points, function (index, point) {
				if (pointString != "") pointString += ",";
				pointString += point[0] + "," + point[1];
			});
			// Get the height and width of load as entered by user
			var loadWidth = $("#cvrf-width-input").val();
			var loadHeight = $("#cvrf-height-input").val();
			var loadLength = $("#cvrf-length-input").val();
			var loadWeightGVW = $("#cvrf-weight-input").val();
			var loadWeight1AXLE = $("#cvrf-weight-SA-input").val();
			var loadWeight2AXLE = $("#cvrf-weight-TanA-input").val();
			var loadWeight3AXLE = $("#cvrf-weight-TriA-input").val();

			// Define the parameters
			var params = {
				points: pointString,
				//partition:["ownership","locality"],
				partition: ["ownership", "isTruckRoute", "isFerry"],
				//followTruckRoute: true,
				restrictionSource: "RDM",
				criteria: "fastest",
				vehicleType: "truck",
				truckRouteMultiplier: 3,
				enable: ["tl", "gdf", "ldf", "tc", "tr", "xc"],
				weight: loadWeightGVW,
				height: loadHeight,
				length: loadLength,
				width: loadWidth,
				snapDistance: 4000,
				restrictionValues: ["WEIGHT-1AXLE:" + loadWeight1AXLE + "", "WEIGHT-2AXLE:" + loadWeight2AXLE + "", "WEIGHT-3AXLE :" + loadWeight3AXLE + "", "NCV:1"],
				simplifyDirections: true,
				excludeRestrictions: app.plugins.CVRestrictionFinder.restrictionOverride,
				roundTrip: false,
				correctSide: false,
				apikey: app.plugins.CVRestrictionFinder.pcfg.routerApiKey,
			};

			var url = "https://router.api.gov.bc.ca/directions.json";
			// Query the DataBC Router for route around restriction values provided
			$.ajax({
				url: url,
				data: params,
				timeout: 7500,
			})

				// Handle a successful result
				.done(function (data) {
					// Bail if a route was not found
					if (!data.routeFound) {
						$("#cvrf-message").html("A route could not be found");
						$("#cvrf-message").show();
						return;
					}

					//add new route data to primary route data global variable and Permittable Route
					app.plugins.CVRestrictionFinder.permittableRoute.push(data);

					// Get, transform, and display route geometry on map for RoutePath Layer
					var routeGeometry = new ol.geom.LineString(data.route);
					var routeGeometryInMapProjection = routeGeometry.transform("EPSG:" + data.srsCode, app.map.getView().getProjection());
					var routeFeature = new ol.Feature({
						geometry: routeGeometryInMapProjection,
					});
					app.plugins.CVRestrictionFinder.permittableRouteLayer.getSource().addFeature(routeFeature);

					// Enable find features button
					$("#cvrf-find-restrictions-btn").attr("disabled", false);

					// Update summary
					app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.travelDirections = data.directions;
					app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.routeDistance = data.distance.toFixed() + " " + data.distanceUnit;
					app.plugins.CVRestrictionFinder.updateSummary();

					//run partition route
					app.plugins.CVRestrictionFinder.getPartitionedLayers(data, "Permittable Route");

					//Save Array to primaryRouteSummaryDirections has fallback directions when processing restrictions
					app.plugins.CVRestrictionFinder.primaryRouteSummaryDirections = app.plugins.CVRestrictionFinder.permittableRouteSummaryStatistics.travelDirections;

					// Update summary
					app.plugins.CVRestrictionFinder.updateSummary();

					//Show Directions Summary in Directions Multi Window
					$(".cvrf-dSummary").show();
				})

				// Handle a failure
				.fail(function (jqxhr, settings, exception) {
					spinner.stop();
					$("#cvrf-message").html("A route could not be found");
					$("#cvrf-message").show();
					logger("ERROR", app.plugins.CVRestrictionFinder.name + ": Router Error");
				});
		}
	}

	/**
	 * Function: generateRestrictionList
	 * @param () none
	 * @returns () nothing
	 * Function that generates the restriction details cards
	 */
	generateRestrictionList(routeRestrctions) {
		//Add restrictions to restriction-list
		var restrictionsList = $("#restriction-list");
		$.each(routeRestrctions, function (index, location) {
			app.plugins.CVRestrictionFinder.restrictionLocationData.push(location);
			var publicCommentCount = 0;
			var internalCommentCount = 0;
			var failedWeightRestrictionCount = 0;
			var failedRestrictionCount = 0;
			var alertCount = 0;
			var hRestrictionCount = 0;
			var wRestrictionCount = 0;
			var lRestrictionCount = 0;
			/* var locationTravelDirection = location.TRAVEL_DIRECTION; */
			var locationTravelDirection;
			//Switch cartinal direction to abbreviated direction
			switch (location.ROUTE_TRAVEL_DIRECTION) {
				case "North":
					locationTravelDirection = "N";
					break;
				case "South":
					locationTravelDirection = "S";
					break;
				case "East":
					locationTravelDirection = "E";
					break;
				case "West":
					locationTravelDirection = "W";
					break;
			}
			var restTitle = location.FEATURE_NAME + " - " + location.LOCATION_ROAD_NAME;
			if (location.FEATURE_NAME == null) {
				restTitle = location.LOCATION_ROAD_NAME;
			}
			var rest = $(`<div id="${location.LOCATION_ID}" class="card mb-3"></div>`).appendTo(restrictionsList);
			var restHeader = $(`<h6 class="card-header rf-location-cards"></h6>`).appendTo(rest);
			var titleContainer = $(`<div class="titlecontainer" style="display: flex;justify-content: space-between;"></div>`).appendTo(restHeader);
			var titleInfo = $(`<div class="titleInfo"></div>`).appendTo(titleContainer);
			var titleContainerButtons = $(`<div class="titlecontainerbuttons"></div>`).appendTo(titleContainer);

			//Create google street view button and on click, open a new window and show location
			var googleStreetButton = $(
				`<button tabindex="-1" id="cvrf-google-street-btn" class="btn btn-sm btn-outline-secondary" type="button" title="Open Google Street View"><img src="application/plugins/CVRestrictionFinder/img/streetview-icon.png" alt="Trulli" width="14" height="16" style="vertical-align: text-bottom;"></button>`
			).appendTo(titleContainerButtons);
			googleStreetButton.click(function () {
				app.plugins.CVRestrictionFinder.showLocationInGoogleStreetView(location.GEOMETRY);
			});
			$(`<div class="rf-streetview-btn" title="Open Streetview"></div>`).appendTo(titleContainerButtons);
			$(`<div class="routeName">${restTitle}</div>`).appendTo(titleInfo);
			var direction;
			//Switch background colour depending on the restrictions type
			switch (location.ROUTE_TRAVEL_DIRECTION) {
				case "North":
					direction = "Northbound";
					break;
				case "South":
					direction = "Southbound";
					break;
				case "East":
					direction = "Eastbound";
					break;
				case "West":
					direction = "Westbound";
					break;
			}
			$(`<div class="direction">${direction}</div>`).appendTo(titleInfo);
			$(`<div class="ID">${location.LOCATION_ID}</div>`).appendTo(titleInfo);
			var headerTabs = $(`<ul class="nav nav-tabs card-header-tabs"></ul>`).appendTo(restHeader);
			var restrictionTabItem = $(`<li class="nav-item" id="navItem-restrictionBody${location.LOCATION_ID}" style="display: inline-flex;align-items: center;">
				<a class="nav-link" data-bs-toggle="tab" href="#restrictionBody${location.LOCATION_ID}">Restrictions</a>
			</li>`);
			var alertsTabItem = $(`<li class="nav-item" id="navItem-alerts${location.LOCATION_ID}" style="display: inline-flex;align-items: center;">
				<a class="nav-link" data-bs-toggle="tab" href="#alerts${location.LOCATION_ID}">Alerts</a>
			</li>`);
			var notesTabItem = $(`<li class="nav-item" id="navItem-notes${location.LOCATION_ID}" style="display: inline-flex;align-items: center;">
				<a class="nav-link" data-bs-toggle="tab" href="#notes${location.LOCATION_ID}">Notes</a>
			</li>`);
			var internalNotesTabItem = $(`<li class="nav-item" id="navItem-internalNotes${location.LOCATION_ID}" style="display: inline-flex;align-items: center;">
				<a class="nav-link" data-bs-toggle="tab" href="#internalNotes${location.LOCATION_ID}">Internal Notes</a>
			</li>`);

			restrictionTabItem.appendTo(headerTabs);
			alertsTabItem.appendTo(headerTabs);
			notesTabItem.appendTo(headerTabs);

			//Append only if internal API is used
			if (app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint === "rdm-api") {
				internalNotesTabItem.appendTo(headerTabs);
			}

			var detailsTabBody = $(`<div class="tab-content">`).appendTo(rest);

			//Build the cards for each tab and their sub cards within
			var restrictionBody = $(`<div class="tab-pane container fade" id=${"restrictionBody" + location.LOCATION_ID}></div>`).appendTo(detailsTabBody);
			var restrictionContainer = $(`<div id="restrictionContainer" class="card-deck mt-4"></div>`).appendTo(restrictionBody);
			var rDimentionalCard = $(`<div id="rVertCard" class=""></div>`).appendTo(restrictionContainer);
			var notesBody = $(`<div class="tab-pane container fade" id=${"notes" + location.LOCATION_ID}></div>`).appendTo(detailsTabBody);
			if (app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint === "rdm-api") {
				var internalNotesBody = $(`<div class="tab-pane container fade" id=${"internalNotes" + location.LOCATION_ID}></div>`).appendTo(detailsTabBody);
			}

			var alertsBody = $(`<div class="tab-pane container fade" id=${"alerts" + location.LOCATION_ID}></div>`).appendTo(detailsTabBody);

			titleInfo.hover(function () {
				var coord = location.GEOMETRY.coordinates;
				var restrictionGeometry = ol.proj.transform(coord, "EPSG:3005", "EPSG:4326");
				var restrictionGeometry = new ol.geom.Point(restrictionGeometry);
				var restrictionGeometryInMapProjection = restrictionGeometry.transform("EPSG:4326", app.map.getView().getProjection());
				var restrictionFeature = new ol.Feature({
					geometry: restrictionGeometryInMapProjection,
				});
				highlightFeature(restrictionFeature);
				//zoomToFeature(restrictionFeature);
				titleInfo.click(function () {
					zoomToFeature(restrictionFeature);
				});
			});
			var dRestrictionContainer = $('<div class="dRestriction-container class="card-deck mt-4" style="display: flex;align-items: center;"></div>').appendTo(rDimentionalCard);
			var heightWidthContainer = $(`<div id="heightWidthContainer" class=""></div>`).appendTo(dRestrictionContainer);
			var lengthContainer = $(`<div id="lengthContainer" class=""></div>`).appendTo(dRestrictionContainer);
			var laneContainer = $(`<div id="laneContainer" class="" style="display: flex;flex-direction: row;padding-bottom: 4px;justify-content: center;"></div>`).appendTo(heightWidthContainer);
			var restrictionContainer = $(`<div id="restrictionContainer" class=""></div>`).appendTo(heightWidthContainer);
			var widthRestrictionContainer = $(
				`<div id="width-restriction-container" class="card" style="background: rgb(255, 241, 0);outline-offset: -4px;padding: 2px;display: flex;flex-direction: column;justify-content: center;outline: rgb(0, 0, 0) solid 1px;border-radius: 6px;align-items: center;"></div>`
			).appendTo(restrictionContainer);
			// Add width restriction title inside the container
			$('<div id="widthrestrictiontitle" style="font-size: 11.5px;">WIDTH LIMIT</div>').appendTo(widthRestrictionContainer);
			var lengthRestrictionContainer = $(
				`<div id="length-restriction-container" class="card" style="padding: 6px;background: rgb(255, 241, 0);outline-offset: -4px;display: flex;flex-direction: column;justify-content: center;outline: rgb(0, 0, 0) solid 1px;border-radius: 6px;align-items: center;">LENGTH LIMIT</div>`
			).appendTo(restrictionContainer);
			var weightRestrictionContainer = $(`<div id="weight-restriction-container" class="" style="display: flex;padding: 0px;justify-content: center;flex-direction: column;align-items: center;"></div>`).appendTo(restrictionContainer);
			location.DATA.sort((a, b) => a.RESTRICTION_LANE_NUMBER - b.RESTRICTION_LANE_NUMBER);
			var vRestrictionCount = 0;

			///Weight Containers
			var weightSignContainer = $(`<div id="weight-restriction-sign-container" class="card" style="padding: 8px;width: fit-content;outline-offset: -4px;outline: 1px solid #000;border-radius: 6px;" ></div>`).appendTo(weightRestrictionContainer);
			var weightSignTitle = $(`<div class="" id="title" style="display: flex;padding-top: 7px;justify-content: center;align-content: center;flex-direction: row;align-items: center;"></div>`).appendTo(weightSignContainer);
			$(`<p> BRIDGE LOAD LIMIT</p>`).appendTo(weightSignTitle);

			var gvwContainer = $(`<div class="axle-container" id="gvwContainer" style="display: none;">`).appendTo(weightSignContainer);
			var gvwValue = $(`<div class="" id="gvwValue" style="font-weight: bold;">0</div>`).appendTo(gvwContainer);
			$(`<div class="" id="gvwName">G.V.W</div>`).appendTo(gvwContainer);

			var axle1Container = $(`<div class="axle-container" id="axle1Container" style="display: none;">`).appendTo(weightSignContainer);
			$(`<div class="" id="axle1Name">SINGLE AXLE</div>`).appendTo(axle1Container);
			var axleValue = $(`<div class="" id="axleValue" style="font-weight: bold;">0</div>`).appendTo(axle1Container);

			var axle2Container = $(`<div class="axle-container" id="axle2Container" style="display: none;">`).appendTo(weightSignContainer);
			$(`<div class="" id="axle2Name">TANDEM AXLE</div>`).appendTo(axle2Container);
			var axle2Value = $(`<div class="" id="axle2Value" style="font-weight: bold;">0</div>`).appendTo(axle2Container);

			var axle3Container = $(`<div class="axle-container" id="axle3Container" style="display: none;">`).appendTo(weightSignContainer);
			$(`<div class="" id="axle3Name">TRIDEM AXLE</div>`).appendTo(axle3Container);
			var axle3Value = $(`<div class="" id="axle3Value" style="font-weight: bold;">0</div>`).appendTo(axle3Container);

			$.each(location.DATA, function (index, restriction) {
				var restrictionTravelDirection = restriction.RESTRICTION_DIRECTION;
				if (restrictionTravelDirection == "B" || restrictionTravelDirection == locationTravelDirection) {
					if (restriction.RESTRICTION_TYPE == "VERTICAL") {
						vRestrictionCount += 1;
						var lane = $(`<div id="${restriction.RESTRICTION_LANE_NUMBER}" class="card" style="width: 80px;display: flex;flex-direction: column;align-items: center;"></div>`).appendTo(laneContainer);
						var restrictionCard = $(`<div id="restrictionCard" class="card" style="width: -webkit-fill-available;border-radius: 3px;background: rgb(255 241 0);display: flex;flex-direction: column;"></div>`).appendTo(lane);
						var laneDetailsCard = $(`<div id="laneDetailsCard" class="" style="height: 135px;display: flex;flex-direction: column;align-items: center;justify-content: space-evenly;align-content: stretch;"></div>`).appendTo(lane);

						//Add linetype arrows for lane type class
						if (restriction.LANE_TYPE == "RA") {
							$(`<img src="application/plugins/CVRestrictionFinder/img/arrow-right-acceleration.png" alt="Trulli" width="14" height="16">`).appendTo(laneDetailsCard);
						}
						if (restriction.LANE_TYPE == "RDRT") {
							$(`<img src="application/plugins/CVRestrictionFinder/img/arrow-right-deceleration.png" alt="Trulli" width="14" height="16">`).appendTo(laneDetailsCard);
						}
						if (restriction.LANE_TYPE == "LA") {
							$(`<img src="application/plugins/CVRestrictionFinder/img/arrow-right-acceleration.png" alt="Trulli" width="14" height="16">`).appendTo(laneDetailsCard);
						}
						if (restriction.LANE_TYPE == "T" || restriction.LANE_TYPE == null) {
							$(`<div class="oi oi-arrow-top"></div>'`).appendTo(laneDetailsCard);
						}
						if (restriction.LANE_TYPE == "LT") {
							$(`<img src="application/plugins/CVRestrictionFinder/img/leftturn.png" alt="Trulli" width="14" height="16">`).appendTo(laneDetailsCard);
						}
						//if restrction has status failed, add 1 to count and colour red
						var verticalRestrictionValue = $(`<div class="card-body" id="lane-value" style="display: flex;flex-direction: column;align-items: center;border-radius: 4px;outline: 1px solid #000;outline-offset: -3px;"></div>`);
						if (restriction.RESTRICTION_STATUS == "Fail") {
							failedRestrictionCount += 1;
							//$(lane).css("opacity",".5");
							//$(restrictionCard).css("box-shadow","0 0 14px 2pt #fd0000");
							$(`<div class="arrow oi oi-ban" style="color: red;"></div>`).appendTo(laneDetailsCard);
							$(verticalRestrictionValue).css("color", "red");
						}
						if (restriction.RESTRICTION_STATUS == "Pass") {
							$(`<div class="arrow oi oi-check" style="color: green;"></div>'`).appendTo(laneDetailsCard);
						}
						verticalRestrictionValue.appendTo(restrictionCard);
						$(`<div class="" id="width-value" style="font-weight: bold;">${restriction.RESTRICTION_VALUE + "m"}</div>`).appendTo(verticalRestrictionValue);
						$(`<span class="oi oi-arrow-thick-bottom"></span>`).appendTo(verticalRestrictionValue);
						$(`<div class="" id="lane-number">${"Lane " + restriction.RESTRICTION_LANE_NUMBER}</div>`).appendTo(laneDetailsCard);
					}
					if (restriction.RESTRICTION_TYPE == "HORIZONTAL") {
						hRestrictionCount += 1;
						if (restriction.RESTRICTION_STATUS == "Fail") {
							failedRestrictionCount += 1;
							var widthValue = $(`<div class="" id="width-value" style="padding-left: 10px;padding-right: 10px;font-weight: bold;">${restriction.RESTRICTION_VALUE + "m"}</div>`).appendTo(widthRestrictionContainer);
							$(widthValue).css("color", "red");
						}
						if (restriction.RESTRICTION_STATUS == "Pass") {
							$(`<div class="" id="width-value" style="padding-left: 10px;padding-right: 10px;font-weight: bold;">${restriction.RESTRICTION_VALUE + "m"}</div>`).appendTo(widthRestrictionContainer);
						}
					}
					if (restriction.RESTRICTION_TYPE == "LENGTH") {
						lRestrictionCount += 1;
						if (restriction.RESTRICTION_STATUS == "Fail") {
							failedRestrictionCount += 1;
							$(`<div class="" id="width-value" style="color: red;font-weight: bold;">${restriction.RESTRICTION_VALUE + "m"}</div>`).appendTo(lengthRestrictionContainer);
						}
						if (restriction.RESTRICTION_STATUS == "Pass") {
							$(`<div class="" id="width-value" style="font-weight: bold;">${restriction.RESTRICTION_VALUE + "m"} </div>`).appendTo(lengthRestrictionContainer);
						}
					}
					if (restriction.RESTRICTION_TYPE == "INFO") {
						//Set information for internal card
						if (restriction.PUBLIC_COMMENT != null) {
							alertCount += 1;
							$(`<div class="" id="alerts" style="padding-bottom: 20px;padding-top: 20px;">${"<li id=restriction-tab-alert>" + urlify(restriction.PUBLIC_COMMENT) + "</li>"}</div>`).appendTo(alertsBody);
						}
					}
					//Append Weight Restrction data to Weight Restriction Tab Body
					if (restriction.RESTRICTION_TYPE == "WEIGHT-GVW" || restriction.RESTRICTION_TYPE == "WEIGHT-1AXLE" || restriction.RESTRICTION_TYPE == "WEIGHT-2AXLE" || restriction.RESTRICTION_TYPE == "WEIGHT-3AXLE") {
						wRestrictionCount += 1;
						//if spesific weight restriction is present, replace restriction value in the div and unhide element
						var rvalue = restriction.RESTRICTION_VALUE;
						var rStatus = restriction.RESTRICTION_STATUS;
						const formattedNumber = rvalue.toLocaleString();
						switch (restriction.RESTRICTION_TYPE) {
							case "WEIGHT-GVW":
								$(gvwValue).text(formattedNumber + "kg");
								$(gvwContainer).show();
								$(gvwContainer).css({
									display: "flex",
									"justify-content": "space-around",
									"align-items": "center",
									"padding-bottom": "6px",
								});
								if (rStatus == "Fail") {
									failedRestrictionCount += 1;
									$(gvwContainer).css("color", "red");
								}

								break;
							case "WEIGHT-1AXLE":
								$(axleValue).text(formattedNumber + "kg");
								$(axle1Container).show();
								$(axle1Container).css({
									display: "flex",
									"justify-content": "space-around",
									"flex-direction": "row",
								});
								if (rStatus == "Fail") {
									failedRestrictionCount += 1;
									$(axle1Container).css("color", "red");
								}
								break;
							case "WEIGHT-2AXLE":
								$(axle2Value).text(formattedNumber + "kg");
								$(axle2Container).show();
								$(axle2Container).css({
									display: "flex",
									"justify-content": "space-around",
									"flex-direction": "row",
								});
								if (rStatus == "Fail") {
									failedRestrictionCount += 1;
									$(axle2Container).css("color", "red");
								}
								break;
							case "WEIGHT-3AXLE":
								$(axle3Value).text(formattedNumber + "kg");
								$(axle3Container).show();
								$(axle3Container).css({
									display: "flex",
									"justify-content": "space-around",
									"flex-direction": "row",
								});
								if (rStatus == "Fail") {
									failedRestrictionCount += 1;
									$(axle3Container).css("color", "red");
								}
								break;
						}
					}
					if (restriction.RESTRICTION_TYPE == "NCV") {
						//if NCV is present, clear contents of restriction div and add NCV icon and message
						failedRestrictionCount += 1;
						$(dRestrictionContainer).empty();
						var message = "Route is restricted for commercial vehicles travelling  " + direction.toLowerCase() + "  at " + restTitle;
						$(`<span><img src=application/plugins/CVRestrictionFinder/img/no-commercial.PNG style="height: 60px;" ></span><span>` + message + `</span></div>`).appendTo(dRestrictionContainer);
					}
					//Append Public Comment data to Public Comment Tab Body
					if (restriction.PUBLIC_COMMENT != null) {
						if (restriction.RESTRICTION_TYPE != "INFO") {
							publicCommentCount += 1;
							var pubCommentContainer = $('<div class="public-comment-container"></div>').appendTo(notesBody);

							if (restriction.RESTRICTION_TYPE == "VERTICAL") {
								$(`<div class="public-comment">${"Lane " + restriction.RESTRICTION_LANE_NUMBER + " - " + urlify(restriction.PUBLIC_COMMENT)}</div>`).appendTo(pubCommentContainer);
							} else {
								$(`<div class="public-comment">${urlify(restriction.PUBLIC_COMMENT)}</div>`).appendTo(pubCommentContainer);
							}
						}
					}
					if (restriction.INTERNAL_COMMENT != null) {
						if (restriction.RESTRICTION_TYPE != "INFO") {
							internalCommentCount += 1;
							var internalCommentContainer = $('<div class="internal-comment-container"></div>').appendTo(internalNotesBody);

							if (restriction.RESTRICTION_TYPE == "VERTICAL") {
								$(`<div class="public-comment">${"Lane " + restriction.RESTRICTION_LANE_NUMBER + " - " + urlify(restriction.INTERNAL_COMMENT)}</div>`).appendTo(internalCommentContainer);
							} else {
								$(`<div class="public-comment">${urlify(restriction.INTERNAL_COMMENT)}</div>`).appendTo(internalCommentContainer);
							}
						}
					}
				}
			});
			//Hide width restrction element if no restrctions are found
			if (hRestrictionCount == 0) {
				$(widthRestrictionContainer).hide();
			}
			//Hide weight restrction element if no restrctions are found
			if (wRestrictionCount == 0) {
				$(weightRestrictionContainer).hide();
			}
			//Hide length restrction element if no restrctions are found
			if (lRestrictionCount == 0) {
				$(lengthRestrictionContainer).hide();
			}

			//If vertical restriction count is 0, build new lane elements based on lane count from ITN
			if (vRestrictionCount == 0) {
				for (var i = 0; i < location.LANE_COUNT; i++) {
					var laneNumber = i + 1;
					var lane = $(`<div id="${laneNumber}" class="card" style="width: 82px;height: 200px;display: flex;flex-direction: column;align-items: center;justify-content: space-evenly;align-content: space-around;"></div>`).appendTo(
						laneContainer
					);
					$(`<div class="oi oi-arrow-top"></div>'`).appendTo(lane);
					//Add linetype arrows for lane type class
					$(`<div class="arrow oi oi-check" style="color: green;"></div>'`).appendTo(lane);
					$(`<div class="" id="lane-number">Clear</div>`).appendTo(lane);
					$(`<div class="" id="lane-number">${"Lane " + laneNumber}</div>`).appendTo(lane);
				}
			}

			//Append badges to nav-items if >0

			if (publicCommentCount > 0) {
				$("#navItem-notes" + location.LOCATION_ID).append($(`<sup><span class="badge bg-danger">` + publicCommentCount + `</span></sup>`));
			}
			if (internalCommentCount > 0) {
				$("#navItem-internalNotes" + location.LOCATION_ID).append($(`<sup><span class="badge bg-danger">` + internalCommentCount + `</span></sup>`));
			}
			if (alertCount > 0) {
				$("#navItem-alerts" + location.LOCATION_ID).append($(`<sup><span class="badge bg-danger">` + alertCount + `</span></sup>`));
			}
			if (failedWeightRestrictionCount > 0) {
				$("#navItem-restrictionBody" + location.LOCATION_ID).append($(`<sup><span class="badge bg-danger">` + failedWeightRestrictionCount + `</span></sup>`));
			}
			if (failedRestrictionCount > 0) {
				$("#navItem-restrictionBody" + location.LOCATION_ID).append($(`<sup><span class="badge bg-danger">` + failedRestrictionCount + `</span></sup>`));
			}
		});

		//run restrictionOverride if active
		if ($("#rf2-override-restrictions-btn").hasClass("active")) {
			app.plugins.CVRestrictionFinder.overrideRestrictions();
		}
	}

	/**
	 * Function: updateSummary
	 * @param () none
	 * @returns () nothing
	 * Function that shows/hides the route summary
	 */
	updateSummary() {
		if ($("#cvrf-dwindow").length) {
			this.directions();
		}
		//Replace values in the route summary section
		var totalRouteRestrictions = app.plugins.CVRestrictionFinder.failedRestrictionCount;
		$("#cvrf-total-restrictions-summary-text").text(totalRouteRestrictions);

		//Remove duplicate locations when multiple alerts are set on commercial vehical closures
		var alertRestrictions = [];
		$.each(app.plugins.CVRestrictionFinder.informationRestrictions, function (index, data) {
			const objectExists = alertRestrictions.some((obj) => obj.LOCATION_ID === data.LOCATION_ID);
			if (!objectExists) {
				alertRestrictions.push(data);
			}
		});

		//If permittable route is on, use its direction data
		var summaryStatistics = this.primaryRouteSummaryStatistics;

		if ($("#cvrf-toggle-permittable-route-switch").is(":checked")) {
			summaryStatistics = this.permittableRouteSummaryStatistics;
		}
		var totalInfoRestrictions = alertRestrictions.length;
		$("#cvrf-total-alert-summary-text").text(totalInfoRestrictions);

		$("#cvrf-total-restrictions-temporary-summary-text").text(app.plugins.CVRestrictionFinder.tempRestrictionCount);

		var totalCautionRestrictions = app.plugins.CVRestrictionFinder.cautionRestrictionCount;
		$("#cvrf-total-restrictions-caution-summary-text").text(totalCautionRestrictions);

		if (summaryStatistics.moti_Distance != null) {
			var totalMOTTDistance = "" + Number(summaryStatistics.moti_Distance).toFixed(0) + " km";
			$("#cvrf-distance-summary-MOTT").text(totalMOTTDistance);
		}

		if (summaryStatistics.fed_Distance != null) {
			var totalFedDistance = "" + Number(summaryStatistics.fed_Distance).toFixed(0) + " km";
			$("#cvrf-distance-summary-Fed").text(totalFedDistance);
		}

		if (summaryStatistics.local_Road != null) {
			var totalLocalDistance = "" + Number(summaryStatistics.local_Road).toFixed(0) + " km";
			$("#cvrf-distance-summary-Local").text(totalLocalDistance);
		}

		if (summaryStatistics.ferry != null) {
			var totalFerryDistance = "" + Number(summaryStatistics.ferry).toFixed(0) + " km";
			$("#cvrf-distance-summary-ferry").text(totalFerryDistance);
		}
		if (summaryStatistics.routeDistance != null) {
			var totalRouteDistance = summaryStatistics.routeDistance;
			$("#cvrf-total-distance-summary-text").text(totalRouteDistance);
		}
	}
	/**
	 * Function: showLocationInGoogleStreetView
	 * @param (integer) locationId
	 * @returns () nothing
	 * Function that show the location in Google StreetView
	 */
	showLocationInGoogleStreetView(locationGeomentry) {
		// Find the location feature within the clustered layers (if it exists)
		var coord = locationGeomentry.coordinates;
		var locationGeometry = ol.proj.transform(coord, "EPSG:3005", "EPSG:4326");
		var locationGeometry = new ol.geom.Point(locationGeometry);
		// Open Streetview based on location
		var streetViewUrl = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + locationGeometry.flatCoordinates[1] + "," + locationGeometry.flatCoordinates[0];
		window.open(streetViewUrl);
	}

	/**
	 * Function: getRouteRestrictions
	 * @param () none
	 * @returns () nothing
	 * Function that sets route restrictions status and generates direction partitions and builds route restriction layers
	 */
	getRouteRestrictions() {
		//var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CVRestrictionFinder.tabContent)[0]);
		var failedRestrictionsCount = 0;
		var routeRestrctions = [];

		//Function that builds partition array for directions
		function buildPartitionDetails(name, geometry, text, type) {
			var partitionDetails = {
				distance: null,
				heading: null,
				name: name,
				ferry: null,
				truckRoute: null,
				point: [geometry[0], geometry[1]],
				text: text,
				time: null,
				type: type,
			};
			return partitionDetails;
		}

		//Clear restriction layers
		app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().clear();

		//Clear restrictions list
		app.plugins.CVRestrictionFinder.cautionRestrictionCount = 0;
		app.plugins.CVRestrictionFinder.failedRestrictionCount = 0;
		app.plugins.CVRestrictionFinder.tempRestrictionCount = 0;
		$("#restriction-list").empty();

		//Clear restriction location list
		app.plugins.CVRestrictionFinder.restrictionLocationData = [];
		app.plugins.CVRestrictionFinder.informationRestrictions = [];

		//If permittable route is active, run restrictions generation on the tlids from the data
		var TLIDS = app.plugins.CVRestrictionFinder.primaryRoute[0].tlids;
		var routeData = app.plugins.CVRestrictionFinder.primaryRoute[0];

		//Create new directions array from primaryRouteSummaryDirections, this is unedited copy
		var directionData = [];
		$.each(app.plugins.CVRestrictionFinder.primaryRouteSummaryDirections, function (index, sDirections) {
			directionData.push(sDirections);
		});

		//Extract restriction data from global allRestrictions if segment ID match route
		$.each(app.plugins.CVRestrictionFinder.routeRestrictions, function (index, location) {
			if (TLIDS.includes(location.NETWORK_SEGMENT_ID)) {
				var directionGeometry = ol.proj.transform(location.GEOMETRY.coordinates, "EPSG:3005", "EPSG:4326");
				var locationStatus = location.STATUS;
				var featureName = location.FEATURE_NAME;
				var infoComment;
				var tlidObject = app.plugins.CVRestrictionFinder.tlidSegments.find((obj) => obj.properties.TRANSPORT_LINE_ID === location.NETWORK_SEGMENT_ID);
				if (!tlidObject) {
					return; // Skip this iteration if no matching TLID object is found
				}
				location["SegmentData"] = tlidObject;
				location["LANE_COUNT"] = tlidObject.properties.RIGHT_NUMBER_OF_LANES;
				var networkSegmentDirection;
				var segmentData = location.SegmentData;
				var routeAzmithDirection = app.plugins.CVRestrictionFinder.getrouteAzimuth(segmentData);
				networkSegmentDirection = routeAzmithDirection.charAt(0);
				location["ROUTE_TRAVEL_DIRECTION"] = routeAzmithDirection;
				var infoRestrctionCount = 0;
				var restrctionCount = 0;

				//Pass counts of temporary locations to global variable
				if (location.TEMPORARY && location.STATUS == "Fail") {
					app.plugins.CVRestrictionFinder.tempRestrictionCount += 1; //Add to global count for summary page
				}

				$.each(location.DATA, function (index, restriction) {
					//Loop over each restriction and only use if direction is both and travel direction matches network segment direction
					var restrictionTravelDirection = restriction.RESTRICTION_DIRECTION;
					if (restrictionTravelDirection == "B" || restrictionTravelDirection == networkSegmentDirection) {
						if (restriction.RESTRICTION_TYPE == "INFO") {
							(infoRestrctionCount += 1), (infoComment = restriction.PUBLIC_COMMENT), app.plugins.CVRestrictionFinder.informationRestrictions.push(location);
						}
						if (restriction.RESTRICTION_TYPE == "NCV") {
							app.plugins.CVRestrictionFinder.informationRestrictions.push(location);
						}
						if (restriction.RESTRICTION_STATUS == "Fail") {
							app.plugins.CVRestrictionFinder.failedRestrictionCount += 1; //Add to global count for summary page
							restrctionCount += 1;
							failedRestrictionsCount += 1;
						}
					}
				});
				//If info restriction is found, add feature and append info partition to directions array
				if (infoRestrctionCount > 0) {
					app.plugins.CVRestrictionFinder.addRouteRestrictionLayerFeatures(location, "INFO", locationStatus);
					var partitionDetails = buildPartitionDetails(featureName, directionGeometry, infoComment, "Info");
					routeRestrctions.push(location);
					directionData.push(partitionDetails);
				}
				//If restrictions are found, add feature and append directions based on status of caution and failed
				if (restrctionCount > 0) {
					switch (location.STATUS) {
						case "Caution":
							app.plugins.CVRestrictionFinder.cautionRestrictionCount += 1; //Add to global count for summary page
							var text = "Caution, route is partially restricted at " + location.FEATURE_NAME;
							var partitionDetails = buildPartitionDetails(featureName, directionGeometry, text, "Caution");
							app.plugins.CVRestrictionFinder.addRouteRestrictionLayerFeatures(location, "RESTRICTION", locationStatus);
							routeRestrctions.push(location);
							directionData.push(partitionDetails);
							break;
						case "Fail":
							var text = "Route is restricted at " + location.FEATURE_NAME;
							var partitionDetails = buildPartitionDetails(featureName, directionGeometry, text, "Failed");
							app.plugins.CVRestrictionFinder.addRouteRestrictionLayerFeatures(location, "RESTRICTION", locationStatus);
							routeRestrctions.push(location);
							directionData.push(partitionDetails);
							break;
					}
				}
			}
		});

		//if restrctions are present along route, change route style to hashed red
		if (failedRestrictionsCount > 0) {
			app.plugins.CVRestrictionFinder.routePathLayer.setStyle(app.plugins.CVRestrictionFinder.restrictedRouteStyle);
		} else {
			app.plugins.CVRestrictionFinder.routePathLayer.setStyle(app.plugins.CVRestrictionFinder.primaryRouteStyle);
		}

		// Get the coordinate pairs from route
		var routePoints = [];
		$.each(routeData.route, function (index, routeCoordinate) {
			routePoints.push(turf.point(routeCoordinate));
		});
		var routePointsFC = turf.featureCollection(routePoints);
		//Add restrictiond details to directions
		//Sort directions with restrictions along route
		$.each(directionData, function (index, direction) {
			var directionPoint = turf.point(direction.point);
			var nearestRoutePoint = turf.nearest(directionPoint, routePointsFC); // turf operations must be done in 4326
			directionData[index].sortOrder = nearestRoutePoint.properties.featureIndex;
		});
		// Sort the restricted directions based on sortOrder
		directionData.sort(function (a, b) {
			var a1 = a.sortOrder,
				b1 = b.sortOrder;
			if (a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});

		//Overwrite travelDirections with new object
		app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.travelDirections = directionData;

		// // Update summary
		app.plugins.CVRestrictionFinder.updateSummary();

		//For each direction coordinate, find closest point along route
		$.each(routeRestrctions, function (index, direction) {
			var directionGeometry = ol.proj.transform(direction.GEOMETRY.coordinates, "EPSG:3005", "EPSG:4326");
			var directionPoint = turf.point(directionGeometry);
			var nearestRoutePoint = turf.nearest(directionPoint, routePointsFC); // turf operations must be done in 4326
			routeRestrctions[index].sortOrder = nearestRoutePoint.properties.featureIndex;
		});
		// Sort the directions based on sortOrder
		routeRestrctions.sort(function (a, b) {
			var a1 = a.sortOrder,
				b1 = b.sortOrder;
			if (a1 == b1) return 0;
			return a1 > b1 ? 1 : -1;
		});

		//Remove duplicates from routeRestrictions before passing into generateRestrictionList Function
		var routeRestrctionsList = [];
		$.each(routeRestrctions, function (index, location) {
			if (routeRestrctionsList.includes(location) == false) {
				routeRestrctionsList.push(location);
			}
		});
		//Runs function to generate restriction details cards
		app.plugins.CVRestrictionFinder.generateRestrictionList(routeRestrctionsList);

		//Rerun Show Conflicting Restrictions if active
		if ($("#cvrf-override-restrictions-btn").hasClass("active")) {
			app.plugins.CVRestrictionFinder.overrideRestrictions();
		}
	}

	/**
	 * Function: getTLIDData
	 * @param () none
	 * @returns () nothing
	 * Function that requests TLID segment data from GeoBC webservices via the RDM API
	 */
	getTLIDData(TLIDS, callback) {
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CVRestrictionFinder.tabContent)[0]);
		var attempts = 1;
		function requestRoadData() {
			var url = returnEnvironmentUrl(app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint) + "/roads";
			$.ajax({
				type: "POST",
				url: url,
				dataType: "json",
				data: {
					road_id_list: TLIDS.join(","),
				},
				xhrFields: {
					withCredentials: true,
				},
			})
				.done(function (data) {
					callback(data);
					spinner.stop();
				})
				.fail(function (jqxhr, settings, exception) {
					//Try to access the web service 3 times, if not successful show error to user. This is to capture random errors with the ITN web service not "Waking Up"
					if (attempts == 3) {
						var userMessage = "There was an error getting road data from the ITN Web Service, Please restart applicaion and try again. If error continues, please contract a IMB Spatial Team Member.";
						var error = "Error getting TLID data (" + jqxhr.responseText + ")";
						showModalDialog("Error", userMessage, "lg", false);
						logger("ERROR", error);
						spinner.stop();
					}
					if (attempts < 3) {
						attempts++;
						requestRoadData();
					}
				});
		}
		requestRoadData();
	}

	/**
	 * Function: reverseRoute
	 * @param () none
	 * @returns () nothing
	 * Function that reverse the route (if possible)
	 */
	reverseRoute() {
		// Define the array that will house the route point data
		var routePointData = [];
		// Loop through the existing location inputs (route points)
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (index) {
				// Process location input if coords are valid
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					// Create a location input object and populate it
					var inputLocation = new Object();
					inputLocation.longitude = $(this).attr("longitude");
					inputLocation.latitude = $(this).attr("latitude");
					inputLocation.text = $(this).val();
					// Add the location input object to the route point array
					routePointData.push(inputLocation);
					// Remove any route points that have invalid coordinates
				} else {
					if ($(this).parent().hasClass("cvrf-route-point")) $(this).parent().remove();
				}
			});
		// Reverse the route point data array
		var routePointDataReversed = routePointData.reverse();
		// Loop through the existing location inputs (route points) and add the reverse route point data
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (index) {
				// Get the corresponding route point object
				var inputLocation = routePointDataReversed[index];
				// Set the input location attributes
				$(this).attr("longitude", inputLocation.longitude);
				$(this).attr("latitude", inputLocation.latitude);
				$(this).val(inputLocation.text);
			});
		// Re-run the Route
		//If Permittable Route is present, rerun using permittable route, else use find Route Function
		if (app.plugins.CVRestrictionFinder.permittableRouteLayer.length > 0) {
			app.plugins.CVRestrictionFinder.findPermittableRoute();
		} else {
			app.plugins.CVRestrictionFinder.findRoute();
		}
	}

	/**
	 * Function: updateRoutePointsOnMap
	 * @param () none
	 * @returns () nothing
	 * Function that shows valid route points on the map
	 */
	updateRoutePointsOnMap() {
		// Clear existing route points
		app.plugins.CVRestrictionFinder.routePointsLayer.getSource().clear();
		// Determine what the index is of the first and last valid route points
		var firstRoutePointIndex;
		var lastRoutePointIndex;
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (routePointIndex, inputElement) {
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					if (firstRoutePointIndex == null) firstRoutePointIndex = routePointIndex;
					lastRoutePointIndex = routePointIndex;
				}
			});
		// Add the valid route points to the route points layer
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (routePointIndex, inputElement) {
				// Remove the color from the map marker
				$(inputElement).parent().find(".oi-map-marker").removeClass("text-success text-primary text-danger");

				// Only process valid route points
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					// Build a feature from the route point
					var pointGeometry = new ol.geom.Point([$(this).attr("longitude"), $(this).attr("latitude")]);
					var pointGeometryInMapProjection = pointGeometry.transform("EPSG:4326", app.map.getView().getProjection());
					var pointFeature = new ol.Feature({
						geometry: pointGeometryInMapProjection,
					});
					// Determine which point style to apply
					switch (routePointIndex) {
						case firstRoutePointIndex:
							pointFeature.set("pointStyle", "start");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-success");
							break;
						case lastRoutePointIndex:
							pointFeature.set("pointStyle", "end");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-danger");
							break;
						default:
							pointFeature.set("pointStyle", "waypoint");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-primary");
					}

					// Set a few point properties (for use in misc functions)
					pointFeature.set("routePathGhostLayer", true);
					pointFeature.set("routePointId", $(this).attr("id"));

					// Add the styled feature to the points layer
					app.plugins.CVRestrictionFinder.routePointsLayer.getSource().addFeature(pointFeature);
				}
			});
	}

	/**
	 * Function:get Route Azimuth
	 * @param () none
	 * @returns () nothing
	 * Function opens a multifloating window to display all conflicting restrictions on the route
	 */
	getrouteAzimuth(segmentData) {
		var line = turf.lineString(app.plugins.CVRestrictionFinder.primaryRoute[0].route);
		var road = segmentData;
		var olFeature4326 = convertToOpenLayersFeature("GeoJSON", road);
		var TLID_start = olFeature4326.getGeometry().getCoordinates()[0];
		var TLID_end = olFeature4326.getGeometry().getCoordinates()[olFeature4326.getGeometry().getCoordinates().length - 1];
		var TLID_startPoint = turf.point([TLID_start[0], TLID_start[1]]);
		var TLID_endPoint = turf.point([TLID_end[0], TLID_end[1]]);
		var TLID_startPoint_snapped = turf.nearestPointOnLine(line, TLID_startPoint, { units: "kilometers" });
		var TLID_endPoint_snapped = turf.nearestPointOnLine(line, TLID_endPoint, {
			units: "kilometers",
		});
		var TLID_startDistance = Math.abs(TLID_startPoint_snapped.properties.location);
		var TLID_endDistance = Math.abs(TLID_endPoint_snapped.properties.location);
		// Calculate the azimuth between the start and end nodes
		var bearing = turf.bearing(TLID_startPoint, TLID_endPoint);
		//var azimuth = turf.bearingToAzimuth(bearing);
		var cDirection;
		var azimuth;
		if (TLID_endDistance > TLID_startDistance) {
			azimuth = turf.bearingToAzimuth(bearing);
		} else {
			if (turf.bearingToAzimuth(bearing) <= 180) {
				azimuth = turf.bearingToAzimuth(bearing) + 180;
			} else {
				azimuth = turf.bearingToAzimuth(bearing) - 180;
			}
		}
		if (azimuth >= 0 && azimuth < 45) {
			cDirection = "North";
		} else if (azimuth >= 45 && azimuth < 135) {
			cDirection = "East";
		} else if (azimuth >= 135 && azimuth < 225) {
			cDirection = "South";
		} else if (azimuth >= 225 && azimuth < 315) {
			cDirection = "West";
		} else if (azimuth >= 315 && azimuth <= 360) {
			cDirection = "North";
		}
		var routeDirection = cDirection;
		return routeDirection;
	}

	/**
	 * Function: search
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search (may use several providers)
	 */
	search(request, callback, options) {
		// Setup variables
		var completeResultsList = [];
		var providersToSearchCount = 0;
		var providerSearchCompletedCount = 0;

		// Define the callback function that will handle all of the search results
		var overallResultsAggregator = function (list) {
			// Merge result to master list
			$.merge(completeResultsList, list);

			// Increment the completion count
			providerSearchCompletedCount++;

			// Return complete list if all providers have completed
			if (providerSearchCompletedCount >= providersToSearchCount) {
				callback(completeResultsList);
			}
		};

		// Search for a "coordinate pattern" within user input
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];
		var location = convertStringToCoordinate(request.term, outputSRS);
		if (location.hasOwnProperty("category")) {
			overallResultsAggregator([
				{
					value: request.term,
					category: location.category,
					data: {
						type: "Feature",
						geometry: {
							type: "Point",
							crs: {
								type: "EPSG",
								properties: {
									code: location.epsg,
								},
							},
							coordinates: location.coordinate,
						},
					},
				},
			]);
		} else {
			overallResultsAggregator([]);
		}

		// Search BC GeoCoder if configured
		if (app.plugins.CVRestrictionFinder.pcfg.geoCoderEnabled) {
			providersToSearchCount++;
			app.plugins.CVRestrictionFinder.searchBcGeoCoder(request, overallResultsAggregator, options);
		}

		// Search visible (and configured) layers if configured
		if (app.plugins.CVRestrictionFinder.pcfg.visibleLayerSearchEnabled) {
			providersToSearchCount++;
			app.plugins.CVRestrictionFinder.searchLayers(request, overallResultsAggregator, options);
		}
	}

	/**
	 * Function: searchBcGeoCoder
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search agains the BC geoCoder
	 */
	searchBcGeoCoder(request, callback, options) {
		// Get the map's projection
		var outputSRS = app.map.getView().getProjection().getCode().split(":")[1];

		// Define the parameters
		var params = {
			minScore: 50,
			maxResults: app.plugins.CVRestrictionFinder.pcfg.geoCoderMaxResults,
			echo: "false",
			brief: true,
			autoComplete: true,
			//locationDescriptor: "accessPoint", // forces geocoder to snap to road (or with 3 meters)
			snapDistance: 2000,
			outputSRS: outputSRS,
			addressString: request.term,
			apikey: app.plugins.CVRestrictionFinder.pcfg.geoCoderApiKey,
		};
		$.extend(params, options);

		// Query the DataBC GeoCoder
		$.ajax({
			url: "https://geocoder.api.gov.bc.ca/addresses.json",
			data: params,
		})
			// Handle a successful result
			.done(function (data) {
				var list = [];
				if (data.features && data.features.length > 0) {
					list = data.features.map(function (item) {
						return {
							value: item.properties.fullAddress,
							category: "BC Places",
							data: item,
						};
					});
				}
				callback(list);
			})

			// Handle a failure
			.fail(function (jqxhr, settings, exception) {
				callback([]);
			});
	}

	/**
	 * Function: searchLayers
	 * @param (string) request
	 * @param (function) callback
	 * @param (array) options
	 * @returns (array) results
	 * Function that executes the search on layers
	 */
	searchLayers(request, callback, options) {
		// Setup variables
		var completeLayerResultsList = [];
		var layersToSearchCount = 0;
		var layerSearchCompletedCount = 0;
		var layerIDsToSearch = [];

		// Define the callback function that will handle all of the layer search results
		var layerResultsAggregator = function (list) {
			// Merge result to master list
			$.merge(completeLayerResultsList, list);

			// Increment the completion count
			layerSearchCompletedCount++;

			// Return complete list if all layers have completed
			if (layerSearchCompletedCount >= layersToSearchCount) {
				callback(completeLayerResultsList);
			}
		};

		// Determine how many layers will be searched
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			// Default is to assume layer type is not searchable
			var layerTypeIsSearchable = false;

			// Vector layers
			if (layer.get("visible") === true && layer.get("title") && layer instanceof ol.layer.Vector) {
				layerTypeIsSearchable = true;
			}

			// WMS layers
			if (layer.get("visible") === true && layer.get("title") && typeof layer.getSource().getFeatureInfoUrl == "function") {
				layerTypeIsSearchable = true;
			}

			// If layer type is searchable, see if it's visible and configured
			if (layerTypeIsSearchable) {
				var layerIsSearchable = false;
				if (layer.get("visible")) {
					if (layer.get("fields")) {
						$.each(layer.get("fields"), function (index, configField) {
							if (configField.searchable) {
								layerIsSearchable = true;
								layerIDsToSearch.push(layer.ol_uid);
							}
						});
					}
				}
				if (layerIsSearchable) layersToSearchCount++;
			}
		});

		// If no searchable layers are configured or visible, return an empty result
		if (layerSearchCompletedCount >= layersToSearchCount) {
			callback(completeLayerResultsList);
		}

		// Iterate through each map layer
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			// Skip current layer if its not in layerIDsToSearch array
			if (!layerIDsToSearch.includes(layer.ol_uid)) return true;

			// Get the searchable fields and the fields that make up the title for this layer
			var searchableFields = [];
			var titleFields = [];
			if (layer.get("fields")) {
				$.each(layer.get("fields"), function (index, configField) {
					if (configField.searchable) {
						searchableFields.push(configField.name);
					}
					if (configField.title) {
						titleFields.push(configField.name);
					}
				});
			}

			// Skip current layer if no searchable fields exist
			if (searchableFields.length == 0) return true;

			// Vector :: Perform a GetFeature
			if (layer instanceof ol.layer.Vector) {
				// Get all of the layers features
				var features = layer.getSource().getFeatures();

				// Loop through the features and searchable fields to find matches
				var matchedFeatures = [];
				$.each(features, function (index, feature) {
					if (matchedFeatures.length < app.plugins.CVRestrictionFinder.pcfg.visibleLayerSearchMaxResults) {
						var properties = feature.getProperties();
						$.each(searchableFields, function (index, searchableField) {
							var searchableFieldValue = properties[searchableField];
							if (searchableFieldValue) {
								if (searchableFieldValue.toLowerCase().indexOf(request.term.toLowerCase()) != -1) {
									matchedFeatures.push(feature);
								}
							}
						});
					}
				});

				// Define an empty list
				var list = [];

				// Process results if any
				if (matchedFeatures.length > 0) {
					// Map results
					list = matchedFeatures.map(function (feature) {
						// Build the title (value)
						var value = "";
						$.each(titleFields, function (index, titleField) {
							if (value != "") value += " - ";
							value += feature.getProperties()[titleField];
						});

						// Build the data object (format similar to what GetFeatureInfo returns)
						var data = {};
						data.type = "Feature";
						data.id = feature.getId();
						data.geometry_name = feature.getGeometryName();
						data.geometry = {};
						data.geometry.type = feature.getGeometry().getType();
						data.geometry.coordinates = feature.getGeometry().getCoordinates();
						data.properties = feature.getProperties();

						// Map
						return {
							value: value,
							category: layer.get("title"),
							data: data,
						};
					});
				}

				// Sort the list based on value
				list.sort(function (a, b) {
					var a1 = a.value,
						b1 = b.value;
					if (a1 == b1) return 0;
					return a1 > b1 ? 1 : -1;
				});

				// Send to aggregator
				layerResultsAggregator(list);
			}

			// WMS :: Perform a GetFeatureInfo
			if (typeof layer.getSource().getFeatureInfoUrl == "function") {
				// ImageWMS layers have a single url in their source, TileWMS have multiple
				var url = "";
				if (layer.get("source").urls) {
					url = layer.getSource().getUrls()[0];
				} else {
					url = layer.getSource().getUrl();
				}

				// Get layer details
				var layers;
				$.each(layer.getSource().getParams(), function (parameterName, parameterValue) {
					if (parameterName.toUpperCase() == "LAYERS") layers = parameterValue;
				});

				// Build the CQL filter statement
				var cqlFilter = "";
				$.each(searchableFields, function (index, searchField) {
					if (cqlFilter != "") cqlFilter += " OR ";
					cqlFilter += searchField + " ilike '%" + request.term + "%'";
				});

				// Define the parameters
				var params = {
					service: "WFS",
					version: "2.0.0",
					request: "GetFeature",
					typeNames: layers,
					outputFormat: "json",
					count: app.plugins.CVRestrictionFinder.pcfg.visibleLayerSearchMaxResults,
					srsName: app.map.getView().getProjection().getCode(),
					cql_filter: cqlFilter,
				};
				$.extend(params, options);

				// Issue the request (async)
				$.ajax({
					type: "GET",
					url: url,
					timeout: 5000,
					data: params,
				})

					// Handle the response
					.done(function (data) {
						// Define an empty list
						var list = [];

						// Process results if any
						if (data.features && data.features.length > 0) {
							// Map results
							list = data.features.map(function (item) {
								// Build the title (value)
								var value = "";
								$.each(titleFields, function (index, titleField) {
									if (value != "") value += " - ";
									value += item.properties[titleField];
								});

								// Map
								return {
									value: value,
									category: layer.get("title"),
									data: item,
								};
							});
						}
						// Send to aggregator
						layerResultsAggregator(list);
					})
					// Handle a failure
					.fail(function (jqxhr, settings, exception) {
						layerResultsAggregator([]);
					});
			}
		});
	}

	/**
	 * Function: removeRoutePoint
	 * @param (object) route point element
	 * @returns () nothing
	 * Function that removes a route point input element.  Clears is if there are only 2 remaining.
	 */
	removeRoutePoint(rpElement) {
		if ($("#cvrf-route-points").find(".cvrf-route-point").length > 2) {
			rpElement.remove();
		} else {
			rpElement.find(".cvrf-location-input").val("");
			rpElement.find(".cvrf-location-input").attr("longitude", null);
			rpElement.find(".cvrf-location-input").attr("latitude", null);
		}
		app.plugins.CVRestrictionFinder.findRoute();
	}

	/**
	 * Function: registerMapClickLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that gets and registers where the user clicked on the map
	 */
	registerMapClickLocation(target) {
		// Define function that handles the get map click location
		var mapClickFunction = function (e) {
			// Get the click coordinate in EPSG:4326
			var centreLL = ol.proj.transform(e.coordinate, app.map.getView().getProjection(), "EPSG:4326");

			// Toggle function as inactive
			app.plugins.CVRestrictionFinder.waitingForMapClick = false;

			// Reset the map's single click function to default
			resetDefaultMapSingleClickFunction();

			// Set the input's lon/lat attributes (and display value)
			target.val(formatCoordinateAsString(centreLL, 4326));
			target.attr("longitude", centreLL[0]);
			target.attr("latitude", centreLL[1]);

			// If mobile and there is no valid route, show sidebar
			if (isMobile()) {
				if (app.plugins.CVRestrictionFinder.routePathLayer.getSource().getFeatures().length == 0) showSidebar();
			}
			// Update Layers with change
			app.plugins.CVRestrictionFinder.updatelayersonchange();
		};

		// Toggle function as active
		app.plugins.CVRestrictionFinder.waitingForMapClick = true;

		// Redirect the map's single click function to this mapClickFunction (temporary)
		redirectMapSingleClickFunction("crosshair", mapClickFunction);

		// If mobile, hide sidebar
		if (isMobile()) hideSidebar();
	}

	/**
	 * Function: registerSearchSelectionLocation
	 * @param (object) target
	 * @param (object) selection
	 * @returns () nothing
	 * Function that registers the user's search selection
	 */
	registerSearchSelectionLocation(target, selection) {
		// Transform the selection into a feature and get it's centre in Lon/Lat
		var olFeature = convertToOpenLayersFeature("GeoJSON", selection.data);
		var olFeature4326 = transformFeature(olFeature, "EPSG:3857", "EPSG:4326");
		var centreLL = getFeatureCentre(olFeature4326);

		// Set the input's lon/lat attributes based on user selection
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);

		// Update Layers with change
		app.plugins.CVRestrictionFinder.updatelayersonchange();
	}

	/**
	 * Function: registerFeatureLocation
	 * @param (object) target
	 * @param (object) feature
	 * @returns () nothing
	 * Function that gets and registers a features location
	 */
	registerFeatureLocation(target, feature) {
		// Get the feature's centre in Lon/Lat
		var feature4326 = transformFeature(feature, "EPSG:3857", "EPSG:4326");
		var centreLL = getFeatureCentre(feature4326);

		// Set the input's lon/lat attributes based on user selection
		target.val(formatCoordinateAsString(centreLL, 4326));
		target.attr("longitude", centreLL[0]);
		target.attr("latitude", centreLL[1]);

		// Update Layers with change
		app.plugins.CVRestrictionFinder.updatelayersonchange();
	}

	/**
	 * Function: updatelayersonchange
	 * @param () none
	 * @returns () nothing
	 * Function that clears route variables and layers on change
	 */
	updatelayersonchange() {
		//clear restrictions list
		$("#restriction-list").empty();
		app.plugins.CVRestrictionFinder.findRoute();
		app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().clear();
		app.plugins.CVRestrictionFinder.restrictionLocationData = [];
		app.plugins.CVRestrictionFinder.findPermittableRoute();
	}

	/**
	 * Function: registerDeviceLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that gets and registers the user's device location
	 */
	registerDeviceLocation(target) {
		// Get current location if possible
		if (navigator.geolocation) {
			var options = {
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0,
			};
			var geoLocationSuccess = function (position) {
				// Set the input's lon/lat attributes (and display value) based on geolocation
				target.val(formatCoordinateAsString([position.coords.longitude, position.coords.latitude], 4326));
				target.attr("longitude", position.coords.longitude);
				target.attr("latitude", position.coords.latitude);

				// Update Layers with change
				app.plugins.CVRestrictionFinder.updatelayersonchange();
			};
			var geoLocationError = function (error) {
				// Display error/suggestion
				var errorNotice = bootbox.dialog({
					title: "Error",
					message: "<p class='text-center'>Cannot determine your current location.<br><br>Please turn on location services.<br></p>",
					closeButton: true,
				});
			};
			navigator.geolocation.getCurrentPosition(geoLocationSuccess, geoLocationError, options);
		}
	}

	/**
	 * Function: addLocationInputEventHandlers
	 * @param (string) parentId
	 * @returns () nothing
	 * Function that adds misc event handlers to specified location input
	 */
	addLocationInputEventHandlers(parentId) {
		// Register the get location from map buttons
		$("#" + parentId + " .cvrf-get-location-from-map-btn").click(function () {
			var associatedInput = $(this).parent().find(".cvrf-location-input");
			app.plugins.CVRestrictionFinder.registerMapClickLocation(associatedInput);
		});
		// Register the category autocompletes
		$("#" + parentId + " .cvrf-location-input").catcomplete({
			minLength: 3,
			source: this.search,
			autoFocus: true,
			select: function (event, selection) {
				app.plugins.CVRestrictionFinder.registerSearchSelectionLocation($(this), selection.item);
			},
		});
		// Register the geolocator buttons
		$("#" + parentId + " .cvrf-get-geolocation-btn").click(function () {
			var associatedInput = $(this).parent().find(".cvrf-location-input");
			app.plugins.CVRestrictionFinder.registerDeviceLocation(associatedInput);
		});
		// Register the clear input buttons
		$("#" + parentId + " .cvrf-clear-input-btn").click(function () {
			// Clear the input and attributes
			var associatedInput = $(this).parent().find(".cvrf-location-input");
			associatedInput.val("");
			associatedInput.attr("longitude", null);
			associatedInput.attr("latitude", null);

			// Find Route
			app.plugins.CVRestrictionFinder.findRoute();
		});
		// Register the delete route point button
		$("#" + parentId + " .cvrf-delete-route-point-btn").click(function () {
			app.plugins.CVRestrictionFinder.removeRoutePoint($(this).parent());
		});
	}

	/**
	 * Function: getPointStyle
	 * @param (object) feature
	 * @returns (object) style
	 * Function that returns a style based on the passed feature's point type.
	 */
	getPointStyle(feature) {
		return app.plugins.CVRestrictionFinder.pointStyles[feature.get("pointStyle")];
	}

	/**
	 * Function: getRestrictionStyle
	 * @param (object) feature
	 * @returns (object) style
	 * Function that returns a style based the restrictions along a route.
	 */
	getRestrictionStyle(feature) {
		var status = "Fail";
		var type = feature.get("TYPE");
		var temp = feature.get("TEMPORARY");

		if (type == "INFO") {
			status = "Info";
		}

		if (type == "RESTRICTION") {
			if (feature.get("STATUS") == "Fail") {
				//If feauture has a temporary status and is Failed, change the status to Temp for icon
				if (temp) {
					status = "Temporary";
				} else {
					status = "Fail";
				}
			}
			if (feature.get("STATUS") == "Override") status = "Override";
			if (feature.get("STATUS") == "Pass") status = "Pass";
			if (feature.get("STATUS") == "Caution") status = "Caution";
			if (feature.get("STATUS") == "Temporary") status = "Temporary";
		}
		return app.plugins.CVRestrictionFinder.routeRestrictionsStyles[status];
	}

	/**
	 * Function: getRoutePartitionStyle
	 * @param (object) feature
	 * @returns (object) style
	 * Function that returns a style based for the route.
	 */
	getRoutePartitionStyle(feature) {
		var owner = "Other";
		//Partitions for Ownership
		if (feature.get("ownership") == "Ministry of Transportation") owner = "MOTT";
		if (feature.get("ownership") == "Federal Government") owner = "Federal";
		if (feature.get("ferry") === true) owner = "Ferry";
		//Partitions for Truck Route
		if (feature.get("isTruckRoute") === true) owner = "truckRoute";
		if (feature.get("isTruckRoute") === false) owner = "nonTruckRoute";

		return app.plugins.CVRestrictionFinder.routePartitionStyles[owner];
	}

	/**
	 * Function:addAllRestrictionLayerFeatures
	 * @param () none
	 * @returns () nothing
	 * Function to add features to the AllRestrictions Layer
	 */
	addAllRestrictionLayerFeatures(location, type, locationStatus) {
		var pointFeature = new ol.Feature({
			geometry: new ol.geom.Point(location.GEOMETRY.coordinates), // Set the point coordinates
			locaionID: new ol.geom.Point(location.LOCATION_ID),
		});
		// Transfer the properties
		var properties = {};
		properties["LOCATION_ID"] = location.LOCATION_ID;
		properties["NETWORK_SEGMENT_ID"] = location.NETWORK_SEGMENT_ID;
		properties["FEATURE_NAME"] = location.FEATURE_NAME;
		properties["FEATURE_SOURCE_SYSTEM"] = location.FEATURE_SOURCE_SYSTEM;
		properties["FEATURE_SOURCE_SYSTEM_KEY"] = location.FEATURE_SOURCE_SYSTEM_KEY;
		properties["ROAD_NAME"] = location.LOCATION_ROAD_NAME;
		properties["TRAVEL_DIRECTION"] = location.TRAVEL_DIRECTION;
		properties["RESTRICTIONS"] = location.DATA;
		properties["TYPE"] = type;
		properties["STATUS"] = locationStatus;
		properties["TEMPORARY"] = location.TEMPORARY;
		pointFeature.setProperties(properties);
		var restrictionFeature3857 = transformFeature(pointFeature, "EPSG:3005", app.map.getView().getProjection());
		app.plugins.CVRestrictionFinder.allRestrictionLayer.getSource().addFeature(restrictionFeature3857);
	}
	/**
	 * Function:addRouteRestrictionLayerFeatures
	 * @param () none
	 * @returns () nothing
	 * Function to add features to the Route Restrictions Layer
	 */
	addRouteRestrictionLayerFeatures(location, type, locationStatus) {
		var pointFeature = new ol.Feature({
			geometry: new ol.geom.Point(location.GEOMETRY.coordinates), // Set the point coordinates
			locaionID: new ol.geom.Point(location.LOCATION_ID),
		});
		// Transfer the properties
		var properties = {};
		properties["LOCATION_ID"] = location.LOCATION_ID;
		properties["NETWORK_SEGMENT_ID"] = location.NETWORK_SEGMENT_ID;
		properties["FEATURE_NAME"] = location.FEATURE_NAME;
		properties["FEATURE_SOURCE_SYSTEM"] = location.FEATURE_SOURCE_SYSTEM;
		properties["FEATURE_SOURCE_SYSTEM_KEY"] = location.FEATURE_SOURCE_SYSTEM_KEY;
		properties["ROAD_NAME"] = location.LOCATION_ROAD_NAME;
		properties["TRAVEL_DIRECTION"] = location.TRAVEL_DIRECTION;
		properties["RESTRICTIONS"] = location.DATA;
		properties["TYPE"] = type;
		properties["STATUS"] = locationStatus;
		properties["TEMPORARY"] = location.TEMPORARY;
		pointFeature.setProperties(properties);
		var restrictionFeature3857 = transformFeature(pointFeature, "EPSG:3005", app.map.getView().getProjection());
		app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().addFeature(restrictionFeature3857);
	}

	/**
	 * Function:setRestrictionStatus
	 * @param () none
	 * @returns () nothing
	 * sets the status of the restrictions and locations based on user inputs
	 */
	setRestrictionStatus(data) {
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CVRestrictionFinder.tabContent)[0]);
		//Restriction Value Inputs
		var loadWidth = $("#cvrf-width-input").val();
		var loadHeight = $("#cvrf-height-input").val();
		var loadLength = $("#cvrf-length-input").val();
		var loadWeightGVW = $("#cvrf-weight-input").val();
		var loadWeight1AXLE = $("#cvrf-weight-SA-input").val();
		var loadWeight2AXLE = $("#cvrf-weight-TanA-input").val();
		var loadWeight3AXLE = $("#cvrf-weight-TriA-input").val();

		//Function to take restriction values and deturmine if they are a pass/fail based on user inputs
		function restrictionStatus(restriction) {
			var restrictionType = restriction.RESTRICTION_TYPE;
			var restrictionValue = restriction.RESTRICTION_VALUE;
			var status;
			var measurement;
			switch (restrictionType) {
				case "VERTICAL":
					measurement = "m";
					if (restrictionValue < loadHeight) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "HORIZONTAL":
					measurement = "m";
					if (restrictionValue < loadWidth) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "LENGTH":
					measurement = "m";
					if (restrictionValue < loadLength) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "WEIGHT-GVW":
					measurement = "kg";
					if (restrictionValue < loadWeightGVW) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "WEIGHT-1AXLE":
					measurement = "kg";
					if (restrictionValue < loadWeight1AXLE) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "WEIGHT-2AXLE":
					measurement = "kg";
					if (restrictionValue < loadWeight2AXLE) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "WEIGHT-3AXLE":
					measurement = "kg";
					if (restrictionValue < loadWeight3AXLE) {
						status = "Fail";
					} else {
						status = "Pass";
					}
					break;
				case "NCV":
					measurement = "";
					status = "Fail";
					break;
				case "INFO":
					measurement = "";
					status = "Info";
					break;
			}
			return [status, measurement];
		}
		$.each(data, function (index, location) {
			//Loop over each location
			var hPass = 0; //Horizontal Restriction Pass
			var hFail = 0;
			var vPass = 0; //Vertical Restriction Pass
			var vFail = 0;
			var lPass = 0; //Length Restriction Pass
			var lFail = 0;
			var gwvPass = 0; //Weight-GVW Restriction Pass
			var gwvFail = 0;
			var w1aPass = 0; //Weight-GVW Restriction Pass
			var w1aFail = 0;
			var w2aPass = 0; //Weight-GVW Restriction Pass
			var w2aFail = 0;
			var w3aPass = 0; //Weight-GVW Restriction Pass
			var w3aFail = 0;
			var ncvFail = 0; //No Commercial Vehical
			var rInfoPass = 0; //Infortmational Restriction Pass
			var rInfoFail = 0;

			$.each(location.DATA, function (index, restriction) {
				//Loop over each restriction for each location
				var restrictionType = restriction.RESTRICTION_TYPE;
				var rStatus = restrictionStatus(restriction);
				var status = rStatus[0];
				var measure = rStatus[1];
				//set restriction status counters for location status calculation
				if (restrictionType == "VERTICAL") {
					if (status == "Fail") {
						vFail++;
					} else {
						vPass++;
					}
				}
				if (restrictionType == "HORIZONTAL") {
					if (status == "Fail") {
						hFail++;
					} else {
						hPass++;
					}
				}
				if (restrictionType == "LENGTH") {
					if (status == "Fail") {
						lFail++;
					} else {
						lPass++;
					}
				}
				if (restrictionType == "WEIGHT-GVW") {
					if (status == "Fail") {
						gwvFail++;
					} else {
						gwvPass++;
					}
				}
				if (restrictionType == "WEIGHT-1AXLE") {
					if (status == "Fail") {
						w1aFail++;
					} else {
						w1aPass++;
					}
				}
				if (restrictionType == "WEIGHT-2AXLE") {
					if (status == "Fail") {
						w2aFail++;
					} else {
						w2aPass++;
					}
				}
				if (restrictionType == "WEIGHT-3AXLE") {
					if (status == "Fail") {
						w3aFail++;
					} else {
						w3aPass++;
					}
				}
				if (restrictionType == "NCV") {
					if (status === "Fail") {
						ncvFail++, (restriction.RESTRICTION_STATUS = "Fail");
						//Only append to informational restrictions list if show all locations is toggled off
						if (!$("#cvrf-show-all-restrictions-btn").is(":checked")) {
							app.plugins.CVRestrictionFinder.informationRestrictions.push(location);
						}
					}
				}
				if (restrictionType == "INFO") {
					if (status == "Fail" && restriction.PUBLIC_COMMENT != null) {
						rInfoFail++, (restriction.RESTRICTION_STATUS = "Fail");
						//Only append to informational restrictions list if show all locations is toggled off
						if (!$("#cvrf-show-all-restrictions-btn").is(":checked")) {
							app.plugins.CVRestrictionFinder.informationRestrictions.push(location);
						}
					} else {
						rInfoPass++, (restriction.RESTRICTION_STATUS = "Pass");
					}
				}
				restriction.RESTRICTION_STATUS = status;
			});
			var locationStatus = "Pass";
			location.STATUS = "Pass";
			if (vPass > 0 && vFail > 0 && vFail > 0) {
				locationStatus = "Caution";
				location.STATUS = "Caution";
			}
			if ((vPass == 0 && vFail > 0) || hFail > 0 || lFail > 0 || gwvFail > 0 || w1aFail > 0 || w2aFail > 0 || w3aFail > 0 || ncvFail > 0 || rInfoFail > 0) {
				locationStatus = "Fail";
				location.STATUS = "Fail";
			}
			var infoRestrctionCount = 0;
			var restrctionCount = 0;
			$.each(location.DATA, function (index, restriction) {
				if (restriction.RESTRICTION_TYPE == "INFO") {
					infoRestrctionCount += 1;
				} else {
					restrctionCount += 1;
				}
			});
			//If show all restrictions button is on, add features to ALl Restriction Layer
			if ($("#cvrf-show-all-restrictions-btn").is(":checked")) {
				if (infoRestrctionCount > 0) {
					app.plugins.CVRestrictionFinder.addAllRestrictionLayerFeatures(location, "INFO", locationStatus);
				}
				if (restrctionCount > 0) {
					app.plugins.CVRestrictionFinder.addAllRestrictionLayerFeatures(location, "RESTRICTION", locationStatus);
				}
			}
		});
		spinner.stop();
	}

	/**
	 * Function:Toggle all restriction layer
	 * @param () none
	 * @returns () nothing
	 * Function that turns on all restrictions layer
	 */
	toggleAllRestrictionsLayer() {
		//if show all restrictions button is checked on, run function
		if ($("#cvrf-show-all-restrictions-btn").is(":checked")) {
			//clear all restrction layer
			app.plugins.CVRestrictionFinder.allRestrictionLayer.getSource().clear();
			//Run function to populate specified layer
			app.plugins.CVRestrictionFinder.setRestrictionStatus(app.plugins.CVRestrictionFinder.allRestrictions);
		}
	}

	/**
	 * Function: updateRoutePointsOnMap
	 * @param () none
	 * @returns () nothing
	 * Function that shows valid route points on the map
	 */
	updateRoutePointsOnMap() {
		// Clear existing route points
		app.plugins.CVRestrictionFinder.routePointsLayer.getSource().clear();
		// Determine what the index is of the first and last valid route points
		var firstRoutePointIndex;
		var lastRoutePointIndex;
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (routePointIndex, inputElement) {
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					if (firstRoutePointIndex == null) firstRoutePointIndex = routePointIndex;
					lastRoutePointIndex = routePointIndex;
				}
			});
		// Add the valid route points to the route points layer
		$("#simple-router-form")
			.find(".cvrf-location-input")
			.each(function (routePointIndex, inputElement) {
				// Remove the color from the map marker
				$(inputElement).parent().find(".oi-map-marker").removeClass("text-success text-primary text-danger");

				// Only process valid route points
				if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
					// Build a feature from the route point
					var pointGeometry = new ol.geom.Point([$(this).attr("longitude"), $(this).attr("latitude")]);
					var pointGeometryInMapProjection = pointGeometry.transform("EPSG:4326", app.map.getView().getProjection());
					var pointFeature = new ol.Feature({
						geometry: pointGeometryInMapProjection,
					});
					// Determine which point style to apply
					switch (routePointIndex) {
						case firstRoutePointIndex:
							pointFeature.set("pointStyle", "start");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-success");
							break;
						case lastRoutePointIndex:
							pointFeature.set("pointStyle", "end");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-danger");
							break;
						default:
							pointFeature.set("pointStyle", "waypoint");
							$(inputElement).parent().find(".oi-map-marker").addClass("text-primary");
					}

					// Set a few point properties (for use in misc functions)
					pointFeature.set("routePathLayer", true);
					pointFeature.set("routePointId", $(this).attr("id"));

					// Add the styled feature to the points layer
					app.plugins.CVRestrictionFinder.routePointsLayer.getSource().addFeature(pointFeature);
				}
			});
	}

	/**
	 * Function: addRoutePoint
	 * @param (array) coordinate (optional) - should be in 4326
	 * @returns () nothing
	 * Function that adds a route point
	 */
	addRoutePoint(coordinate) {
		// Optional params
		coordinate = coordinate || null;

		// Define some defaults
		var elementToAddNewRoutePointAfter = null;

		// Get the route point template, clone it, and add/remove classes/ids
		var clone = $(".cvrf-route-point-template").clone(true);
		var uniqueId = Date.now();
		clone.attr("id", "cvrf-route-point-" + uniqueId);
		clone.find(".cvrf-location-input").attr("id", "cvrf-route-point-input-" + uniqueId);
		clone.removeClass("cvrf-route-point-template");

		// If a coordinate was passed, then register that coordinate with the route point input
		if (coordinate) {
			clone.find(".cvrf-location-input").val(formatCoordinateAsString(coordinate, 4326));
			clone.find(".cvrf-location-input").attr("longitude", coordinate[0]);
			clone.find(".cvrf-location-input").attr("latitude", coordinate[1]);
		}

		// If a route path exists and a coordinate was passed, try to figure out where the route point input should be placed in the ordered list
		if (app.plugins.CVRestrictionFinder.routePathLayer.getSource().getFeatures().length == 1 && coordinate) {
			// Define GeoJSON formatter
			var gjFormat = new ol.format.GeoJSON();
			// Convert the OpenLayers route path into GeoJSON 4326
			var routePathGeoJSON = gjFormat.writeFeaturesObject(app.plugins.CVRestrictionFinder.routePathLayer.getSource().getFeatures(), {
				dataProjection: "EPSG:4326",
				featureProjection: app.map.getView().getProjection(),
			});
			// Find the distance along the route path (offset) where the new route point is closest to
			var newRoutePoint = turf.point(coordinate);
			var newRoutePointSnapped = turf.nearestPointOnLine(routePathGeoJSON, newRoutePoint, { units: "kilometers" });
			var newRoutePointOffset = newRoutePointSnapped.properties.location;
			// Loop through the existing router point inputs to find where to place the new route point
			$("#simple-router-form")
				.find(".cvrf-location-input")
				.each(function (index) {
					if (isLongitude($(this).attr("longitude")) && isLatitude($(this).attr("latitude"))) {
						var routePoint = turf.point([$(this).attr("longitude"), $(this).attr("latitude")]);
						var routePointSnapped = turf.nearestPointOnLine(routePathGeoJSON, routePoint, { units: "kilometers" });
						var routePointOffset = routePointSnapped.properties.location;
						if (newRoutePointOffset > routePointOffset) elementToAddNewRoutePointAfter = $(this).parent();
					}
				});
		}
		// Add the route point input to the appropriate position and show it
		if (elementToAddNewRoutePointAfter == null) {
			$("#cvrf-route-points").append(clone);
		} else {
			elementToAddNewRoutePointAfter.after(clone);
		}
		clone.show();

		// Add location event handlers to the route point input
		app.plugins.CVRestrictionFinder.addLocationInputEventHandlers("cvrf-route-point-" + uniqueId);

		// If a coordinate was passed, update the route points
		if (coordinate) app.plugins.CVRestrictionFinder.updateRoutePointsOnMap();
	}

	/**
	 * Function: alertInfoRestriction
	 * @param () none
	 * @returns () nothing
	 * Function creates alert when INFO restrction is present on the route
	 */
	alertInfoRestrction() {
		//Loop through global variable informationRestriction and display modal dialog for each restriction
		if (app.plugins.CVRestrictionFinder.informationRestrictions.length > 0) {
			var infoMessage = $("<div id='infoRestrictions'></div>");

			var alertRestrictions = [];
			$.each(app.plugins.CVRestrictionFinder.informationRestrictions, function (index, data) {
				const objectExists = alertRestrictions.some((obj) => obj.LOCATION_ID === data.LOCATION_ID);
				if (!objectExists) {
					alertRestrictions.push(data);
				}
			});
			var alertRestrictionContainer = $("<div id=alertRestrictionContainer class=alertContainer><label id=alertContainerLabel>Restrictions</label></div>");
			var alertContainer = $("<div id=alertContainer class=alertContainer><label id=alertContainerLabel>Alerts</label></div>");

			function getDirection(routeDirection) {
				var direction;
				//Switch background colour depending on the restrictions type
				switch (routeDirection) {
					case "North":
						direction = "Northbound";
						break;
					case "South":
						direction = "Southbound";
						break;
					case "East":
						direction = "Eastbound";
						break;
					case "West":
						direction = "Westbound";
						break;
				}
				return direction;
			}
			var infoCount = 0;
			var NCVCount = 0;

			//Build information list
			$.each(alertRestrictions, function (index, infoRestrction) {
				var restTitle = infoRestrction.FEATURE_NAME + " - " + infoRestrction.LOCATION_ROAD_NAME;
				if (infoRestrction.FEATURE_NAME == null) {
					restTitle = infoRestrction.LOCATION_ROAD_NAME;
				}
				var direction = getDirection(infoRestrction.ROUTE_TRAVEL_DIRECTION);
				$.each(infoRestrction.DATA, function (index, restriction) {
					//If alert is for No commercial Vehcials, append to restriction section
					if (restriction.RESTRICTION_TYPE == "NCV") {
						NCVCount += 1;

						$(alertRestrictionContainer).append(' <li id="alertItem" >Route is restricted for commercial vehicles travelling  ' + direction.toLowerCase() + "  at " + restTitle + "</li>");
					}
					//if alert is informational, append to alerts
					if (restriction.RESTRICTION_TYPE == "INFO") {
						if (restriction.PUBLIC_COMMENT != null) {
							infoCount += 1;
							infoRestrction.PUBLIC_COMMENT = restriction.PUBLIC_COMMENT;
							$(alertContainer).append(' <li id="alertItem">' + urlify(restriction.PUBLIC_COMMENT) + "</li>");
						}
					}
				});
			});
			//Only show alert types if count is greater than 0
			if (NCVCount > 0) {
				$(infoMessage).append(alertRestrictionContainer);
			}
			if (infoCount > 0) {
				$(infoMessage).append(alertContainer);
			}
			if (app.plugins.CVRestrictionFinder.showAlertModal) {
				showModalDialog("Attention ", infoMessage, "lg");
			}
		}
	}

	/**
	 * Function: find Route
	 * @param () none
	 * @returns () nothing
	 * Function that attempts to find a route and display it on the map
	 */
	findRoute() {
		//clear the global Primary Route data variable
		app.plugins.CVRestrictionFinder.primaryRoute = [];
		app.plugins.CVRestrictionFinder.tlidSegments = [];
		this.informationRestrictions = [];
		this.restrictionLocationData = [];
		app.plugins.CVRestrictionFinder.routeRestrictions = [];

		// Clear existing route path
		app.plugins.CVRestrictionFinder.routePathLayer.getSource().clear();
		app.plugins.CVRestrictionFinder.routeRestrictionLayer.getSource().clear();
		app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.getSource().clear();

		// Hide messages
		$("#cvrf-message").hide();

		// Clear summary
		app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics = {};
		app.plugins.CVRestrictionFinder.updateSummary();

		// Show the route points on the map
		app.plugins.CVRestrictionFinder.updateRoutePointsOnMap();

		// Determine if reverse route button should be enabled
		if (app.plugins.CVRestrictionFinder.routePointsLayer.getSource().getFeatures().length > 1) {
			$("#cvrf-reverse-route-btn").prop("disabled", false);
		} else {
			$("#cvrf-reverse-route-btn").prop("disabled", true);
		}

		// Get the route points as a 2d array
		var points = [];
		$.each(app.plugins.CVRestrictionFinder.routePointsLayer.getSource().getFeatures(), function (index, feature) {
			var feature4326 = transformFeature(feature, app.map.getView().getProjection(), "EPSG:4326");
			points.push(feature4326.getGeometry().getCoordinates());
		});

		// Bail if there are not enough points
		if (points.length < 2) return;

		// Convert points array into string usable by the router-form
		var pointString = "";
		$.each(points, function (index, point) {
			if (pointString != "") pointString += ",";
			pointString += point[0] + "," + point[1];
		});

		// Define the parameters
		var params = {
			points: pointString,
			//partition:["ownership","locality"],
			partition: ["ownership", "isTruckRoute", "isFerry"],
			//followTruckRoute: true,
			restrictionSource: "RDM",
			criteria: "fastest",
			snapDistance: 4000,
			vehicleType: "truck",
			truckRouteMultiplier: 3,
			enable: ["tl", "gdf", "ldf", "tc", "tr", "xc"],
			simplifyDirections: true,
			roundTrip: false,
			correctSide: false,
			apikey: app.plugins.CVRestrictionFinder.pcfg.routerApiKey,
		};

		// Add the tab spinner
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CVRestrictionFinder.tabContent)[0]);

		// Query the DataBC Router
		var url = "https://router.api.gov.bc.ca/directions.json";
		$.ajax({
			url: url,
			data: params,
			timeout: 7500,
		})

			// Handle a successful result
			.done(function (data) {
				// Bail if a route was not found
				if (!data.routeFound) {
					$("#cvrf-message").html("A route could not be found");
					$("#cvrf-message").show();
					spinner.stop();
					return;
				}
				app.plugins.CVRestrictionFinder.primaryRoute.push(data);

				// Get, transform, and display route geometry on map for RoutePath Layer
				var routeGeometry = new ol.geom.LineString(data.route);
				var routeGeometryInMapProjection = routeGeometry.transform("EPSG:" + data.srsCode, app.map.getView().getProjection());
				var routeFeature = new ol.Feature({
					geometry: routeGeometryInMapProjection,
				});
				routeFeature.set("routePath", true);
				app.plugins.CVRestrictionFinder.routePathLayer.getSource().addFeature(routeFeature);

				// Zoom to the route (only if 2 points were defined)
				if (points.length == 2) zoomToFeature(routeFeature);

				//Build new directions array for primary route directions and add to object
				var directionData = [];
				$.each(data.directions, function (index, directions) {
					directionData.push(directions);
				});

				//Update primary route object
				app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.travelDirections = directionData;
				app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.routeDistance = data.distance.toFixed() + " " + data.distanceUnit;

				//run partition route
				var routeDirections = app.plugins.CVRestrictionFinder.getPartitionedLayers(data, "Primary Route");

				// Update OwnershipRoute Object
				app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.travelDirections = routeDirections;
				app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.routeDistance = data.distance.toFixed() + " " + data.distanceUnit;

				//Show Directions Summary in Directions Multi Window
				$(".cvrf-dSummary").show();

				//Save Array to primaryRouteSummaryDirections as fallback directions when processing restrictions
				app.plugins.CVRestrictionFinder.primaryRouteSummaryDirections = app.plugins.CVRestrictionFinder.primaryRouteSummaryStatistics.travelDirections;

				// Update summary
				app.plugins.CVRestrictionFinder.updateSummary();

				var routeTLIDS = app.plugins.CVRestrictionFinder.primaryRoute[0].tlids;

				//Run function to get all restrictions along the route from RDM API
				var offset = 0;
				var limit = 500;
				var segmentFilter = "NETWORK_SEGMENT_ID IN (" + routeTLIDS.join(",") + ")";
				var typeFilter = "RESTRICTION_TYPE IN (" + app.plugins.CVRestrictionFinder.showRestrictionType.map((type) => `'${type}'`).join(",") + ")";

				var filter;
				if (app.plugins.CVRestrictionFinder.showRestrictionType.length > 0) {
					filter = segmentFilter + " AND " + typeFilter;
				} else {
					filter = segmentFilter;
				}

				//This is where to put load all restrictions
				var url = returnEnvironmentUrl(app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint) + "/view/restrictions_active";
				function getActiveLocations(callback) {
					$.ajax({
						type: "POST",
						url: url,
						dataType: "json",
						data: {
							filter: filter,
						},
						xhrFields: {
							withCredentials: true,
						},
					})
						.done(function (data) {
							callback(data);
						})
						.fail(function (jqxhr, settings, exception) {
							var error = "Error getting active restrictions (" + jqxhr.responseText + ")";
							logger("ERROR", error);
						});
				}

				var callback = function (data) {
					var locationList = [];
					//Create a new object of locations and their related restrictions
					spinner.stop();
					$.each(data, function (index, location) {
						var ncvCount = 0;
						var tempCount = 0;
						var index = locationList.findIndex((item) => item.LOCATION_ID == location.LOCATION_ID);
						if (index === -1) {
							var lData = {};
							//Build Location information
							lData["LOCATION_ID"] = location.LOCATION_ID;
							lData["NETWORK_SEGMENT_ID"] = location.NETWORK_SEGMENT_ID;
							lData["LOCATION_ROAD_NAME"] = location.LOCATION_ROAD_NAME;
							lData["FEATURE_NAME"] = location.FEATURE_NAME;
							lData["FEATURE_SOURCE_SYSTEM"] = location.FEATURE_SOURCE_SYSTEM;
							lData["FEATURE_SOURCE_SYSTEM_KEY"] = location.FEATURE_SOURCE_SYSTEM_KEY;
							lData["TRAVEL_DIRECTION"] = location.TRAVEL_DIRECTION;
							lData["GEOMETRY"] = location.GEOMETRY;
							lData["STATUS"] = "Pass";
							lData["TEMPORARY"];
							var restrictionData = [];
							//Loop through restrictions that equal location ID and add to location data
							$.each(data, function (index, restriction) {
								//If restriction is for the same location, add to restriction data
								if (location.LOCATION_ID == restriction.LOCATION_ID) {
									var rData = {};
									var restrictionType = restriction.RESTRICTION_TYPE;
									var restrictionValue = restriction.PERMITABLE_VALUE;
									var laneType = restriction.LANE_TYPE;
									rData["RESTRICTION_ID"] = restriction.RESTRICTION_ID;
									rData["RESTRICTION_TRAVEL_DIRECTION"];
									rData["RESTRICTION_LANE_NUMBER"] = restriction.LANE_NUMBER;
									rData["RESTRICTION_TYPE"] = restrictionType;
									rData["LANE_TYPE"] = laneType;
									rData["PUBLIC_COMMENT"] = restriction.PUBLIC_COMMENT;
									//IF API call is internal only
									if (app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint === "rdm-api") {
										rData["INTERNAL_COMMENT"] = restriction.INTERNAL_COMMENT;
									}
									rData["START_DATE"] = restriction.START_DATE;
									rData["END_DATE"] = restriction.END_DATE;
									rData["RESTRICTION_VALUE"] = restrictionValue;
									if (restrictionType == "NCV") {
										(rData["RESTRICTION_STATUS"] = "Fail"), (ncvCount += 1);
									} else {
										rData["RESTRICTION_STATUS"] = "Pass";
									}

									//This is to flag the location that has a temporary restrictions for icon placement
									if (restriction.IS_TEMPORARY == 1) {
										tempCount += 1;
									}
									rData["RESTRICTION_DIRECTION"] = restriction.TRAVEL_DIRECTION;
									restrictionData.push(rData);
								}
							});
							if (tempCount > 0) {
								lData["TEMPORARY"] = true;
							} else {
								lData["TEMPORARY"] = false;
							}
							if (ncvCount > 0) {
								lData["STATUS"] = "Fail";
							} else {
								lData["STATUS"] = "Pass";
							}
							lData["DATA"] = restrictionData;
							locationList.push(lData);
							//If location contains no restrictions, do not add to global list
							if (lData.DATA.length > 0) {
								app.plugins.CVRestrictionFinder.routeRestrictions.push(lData);
							}
						}
					});

					// Run function to set restrction status on all restrictions based on if user inputs changed
					app.plugins.CVRestrictionFinder.setRestrictionStatus(app.plugins.CVRestrictionFinder.routeRestrictions);

					//Loop through all restrictions and extract only the TLIDS along the route that have restrictions and populate TLID segment global variable
					var callback = function (tlidSegments) {
						app.plugins.CVRestrictionFinder.tlidSegments = tlidSegments;

						//Run function to generate restrictions along route
						app.plugins.CVRestrictionFinder.getRouteRestrictions();

						//Run alert info restrction function
						app.plugins.CVRestrictionFinder.alertInfoRestrction();

						//Open Summary Accordian
						$("#cvrf-summary-panel").collapse("show");

						spinner.stop();
					};

					var routeRestrictionTLIDS = [];
					$.each(app.plugins.CVRestrictionFinder.routeRestrictions, function (index, location) {
						if (routeTLIDS.includes(location.NETWORK_SEGMENT_ID)) {
							routeRestrictionTLIDS.push(location.NETWORK_SEGMENT_ID);
						}
					});
					if (routeRestrictionTLIDS.length > 0) {
						app.plugins.CVRestrictionFinder.getTLIDData(routeRestrictionTLIDS, callback);
					}
				};

				//If all restrictions are loaded, use the data
				if (app.plugins.CVRestrictionFinder.allRestrictions.length > 0) {
					var callback = function (tlidSegments) {
						app.plugins.CVRestrictionFinder.tlidSegments = tlidSegments;

						//Run function to generate restrictions along route
						app.plugins.CVRestrictionFinder.getRouteRestrictions();

						//Run alert info restrction function
						app.plugins.CVRestrictionFinder.alertInfoRestrction();

						//Open Summary Accordian
						$("#cvrf-summary-panel").collapse("show");

						spinner.stop();
					};
					var routeRestrictionTLIDS = [];
					var TLIDS = data.tlids;
					var locationList = [];
					$.each(app.plugins.CVRestrictionFinder.allRestrictions, function (index, location) {
						if (TLIDS.includes(location.NETWORK_SEGMENT_ID)) {
							locationList.push(location);
							routeRestrictionTLIDS.push(location.NETWORK_SEGMENT_ID);
						}
					});
					app.plugins.CVRestrictionFinder.routeRestrictions = locationList;
					if (routeRestrictionTLIDS.length > 0) {
						app.plugins.CVRestrictionFinder.getTLIDData(routeRestrictionTLIDS, callback);
					}
				} else {
					getActiveLocations(callback);
				}
				app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();

				if (app.plugins.CVRestrictionFinder.primaryRoute.length > 0) {
					$("#restriction-list").empty();
					app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();
					app.plugins.CVRestrictionFinder.setRestrictionStatus(app.plugins.CVRestrictionFinder.routeRestrictions);
					app.plugins.CVRestrictionFinder.getRouteRestrictions();
					app.plugins.CVRestrictionFinder.findPermittableRoute();
				}
				spinner.stop();
			})

			// Handle a failure
			.fail(function (jqxhr, settings, exception) {
				spinner.stop();
				$("#cvrf-message").html("A route could not be found");
				$("#cvrf-message").show();
				logger("ERROR", app.plugins.CVRestrictionFinder.name + ": Router Error");
			});
	}

	/**
	 * Function: scroll2SelectedRestrictions
	 * @param (object) event
	 * @returns () nothing
	 * Function that scrolls the sidebar to the clicked on restrictions
	 */
	scroll2SelectedRestrictions(event) {
		// Get all features close to click
		var pixel = app.map.getEventPixel(event.originalEvent);
		//var foundFeatures = app.map.forEachFeatureAtPixel(pixel, {
		var featureLayer;
		var idList = [];
		var feature = app.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
			featureLayer = layer;
			var featureName = featureLayer.get("title");
			if (featureName == "Route Restrictions") {
				idList.push(feature.get("LOCATION_ID"));
			}
		});
		if (idList.length > 0) {
			// If you can find a matching restriction div/table with the current group id, scroll to it
			// Define the executeScroll function
			var executeScroll = function () {
				var currentScrollPosition = $("#RestrictionFinder-tab-content").scrollTop();
				var offset = Math.floor($("#" + idList[0]).offset().top - 130);
				var newScrollPosition = currentScrollPosition + offset;
				$("#" + idList[0]).effect("highlight", {}, 4000);
				$("#RestrictionFinder-tab-content").animate(
					{
						scrollTop: newScrollPosition,
						scrollLeft: 0,
					},
					1500
				);
			};

			// Scoll to restriction after short pause
			setTimeout(function () {
				executeScroll();
			}, 500);
		}
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function (success, tabNav, tabContent) {
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.CVRestrictionFinder.name + ": Plugin failed to initialize");
				return;
			}
			// Set class variables
			app.plugins.CVRestrictionFinder.tabNav = tabNav;
			app.plugins.CVRestrictionFinder.tabContent = tabContent;

			// Register single click
			app.plugins.CVRestrictionFinder.singleClick = app.map.on("click", function (event) {
				app.plugins.CVRestrictionFinder.scroll2SelectedRestrictions(event);
			});

			//loop through the showRestrictionType array if length is greater than 0
			if (app.plugins.CVRestrictionFinder.showRestrictionType.length > 0) {
				$.each(app.plugins.CVRestrictionFinder.showRestrictionType, function (index, restrictionType) {
					if (restrictionType == "HORIZONTAL" || restrictionType == "VERTICAL" || restrictionType == "LENGTH") {
						$("#cvrf-dimension-group-container").show();
					}
					if (restrictionType == "WEIGHT-GVW" || restrictionType == "WEIGHT-1AXLE" || restrictionType == "WEIGHT-2AXLE" || restrictionType == "WEIGHT-3AXLE") {
						$("#cvrf-weight-group-container").show();
					}

					switch (restrictionType) {
						case "HORIZONTAL":
							$("#cvrf-width").show();
							break;
						case "VERTICAL":
							$("#cvrf-height").show();
							break;
						case "LENGTH":
							$("#cvrf-length").show();
							break;
						case "WEIGHT-GVW":
							$("#cvrf-weight").show();
							break;
						case "WEIGHT-1AXLE":
							$("#cvrf-weight-SA").show();
							break;
						case "WEIGHT-2AXLE":
							$("#cvrf-weight-TanA").show();
							break;
						case "WEIGHT-3AXLE":
							$("#cvrf-weight-TriA").show();
							break;
					}
				});
			} else {
				//If no restrictions are set to show, show all restriction inputs and headers
				$("#cvrf-dimension-group-container").show();
				$("#cvrf-weight-group-container").show();
				$("#cvrf-width").show();
				$("#cvrf-height").show();
				$("#cvrf-length").show();
				$("#cvrf-weight").show();
				$("#cvrf-weight-SA").show();
				$("#cvrf-weight-SA").show();
				$("#cvrf-weight-TanA").show();
				$("#cvrf-weight-TriA").show();
			}

			// Add 2 route point inputs to start with
			app.plugins.CVRestrictionFinder.addRoutePoint();
			app.plugins.CVRestrictionFinder.addRoutePoint();

			// Allow adding of route points if so configured
			if (app.plugins.CVRestrictionFinder.pcfg.allowWayPoints) {
				$("#cvrf-route-point-add-div").show();
				$("#cvrf-route-point-add-instructions").show();
				$("#simple-router-form #cvrf-route-point-add-btn").click(function () {
					app.plugins.CVRestrictionFinder.addRoutePoint();
				});
			}

			// Register get Directions Button
			$("#cvrf-directions-btn").click(function () {
				if ($(this).hasClass("active")) {
					$(this).removeClass("active");
					app.plugins.MultiFloatingWindow.close("directions");
				} else {
					$(this).addClass("active");
					app.plugins.CVRestrictionFinder.directions();
				}
			});

			// Register Clear All Button
			$("#cvrf-clear-restrictions-btn").click(function () {
				app.plugins.CVRestrictionFinder.routePathLayer.setStyle(app.plugins.CVRestrictionFinder.primaryRouteStyle);
				app.plugins.CVRestrictionFinder.clearAll();
			});

			// Register Reverse Route button
			$("#cvrf-reverse-route-btn").click(function () {
				app.plugins.CVRestrictionFinder.reverseRoute();
			});

			// Make the route points sortable (so user can change the order)
			$("#cvrf-route-points").sortable({
				update: function (event, ui) {
					app.plugins.CVRestrictionFinder.findRoute();
				},
			});

			/// Register show permittable route switch
			$("#cvrf-toggle-permittable-route-switch").click(function () {
				if ($(this).is(":checked")) {
					$("#cvrf-override-restrictions-btn").prop("disabled", false);
					app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.hiddenRouteStyle);
					app.plugins.CVRestrictionFinder.findPermittableRoute();
				} else {
					$("#cvrf-message").hide();
					$("#cvrf-override-restrictions-btn").removeClass("active");
					$(".mfw-OverrideRestrictions").prop("disabled", true);
					app.plugins.MultiFloatingWindow.close("OverrideRestrictions");
					app.plugins.CVRestrictionFinder.permittableRouteLayer.getSource().clear();
					app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.getSource().clear();
					app.plugins.CVRestrictionFinder.permittableRoute = [];
					app.plugins.CVRestrictionFinder.updateSummary();
				}
			});

			$("#cvrf-override-restrictions-btn").click(function () {
				if ($(this).hasClass("active")) {
					$(this).removeClass("active");
					app.plugins.MultiFloatingWindow.close("OverrideRestrictions");
				} else {
					$(this).addClass("active");
					app.plugins.CVRestrictionFinder.overrideRestrictions();
				}
			});

			// Register Show Ownership Routes Button
			$("#cvrf-showOwnershipRoutes-btn").click(function () {
				if ($(this).is(":checked")) {
					//Set Colour of Summary Distances to associated route partition colour
					$("#cvrf-distance-summary-MOTT").css({ color: "rgba(43, 115, 218)" });
					$("#cvrf-distance-summary-Fed").css({ color: "rgba(235, 45, 55)" });
					$("#cvrf-distance-summary-Local").css({ color: "rgba(50, 205, 50)" });
					$("#cvrf-distance-summary-ferry").css({
						color: "rgba(51, 171, 249)",
					});

					//If Permittable Route is on
					if ($("#cvrf-toggle-permittable-route-switch").is(":checked")) {
						app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.getRoutePartitionStyle);
						app.plugins.CVRestrictionFinder.updateSummary();
					} else {
						app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.getRoutePartitionStyle);
						app.plugins.CVRestrictionFinder.updateSummary();
					}
				} else {
					//Set Colour of Summary Distances to black
					$("#cvrf-distance-summary-MOTT").css({ color: "black" });
					$("#cvrf-distance-summary-Fed").css({ color: "black" });
					$("#cvrf-distance-summary-Local").css({ color: "black" });
					$("#cvrf-distance-summary-ferry").css({ color: "black" });
					app.plugins.CVRestrictionFinder.primaryRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.hiddenRouteStyle);
					app.plugins.CVRestrictionFinder.permittableRoutePartitionLayer.setStyle(app.plugins.CVRestrictionFinder.hiddenRouteStyle);
					app.plugins.CVRestrictionFinder.updateSummary();
				}
			});

			//If route is generated, clear route layers and restrictions and re-run, if no route data is present, only run toggle all restrictions function
			$("#cvrf-height-input, #cvrf-weight-input, #cvrf-weight-SA-input, #cvrf-weight-TanA-input, #cvrf-weight-TriA-input, #cvrf-length-input, #cvrf-width-input").change(function () {
				var spinner = new Spinner(app.spinnerOptionsMedium).spin($(app.plugins.CVRestrictionFinder.tabContent)[0]);

				// Let spinner render before running heavy logic
				setTimeout(function () {
					app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();

					if (app.plugins.CVRestrictionFinder.primaryRoute.length > 0) {
						$("#restriction-list").empty();
						app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();
						app.plugins.CVRestrictionFinder.setRestrictionStatus(app.plugins.CVRestrictionFinder.routeRestrictions);
						app.plugins.CVRestrictionFinder.getRouteRestrictions();
						app.plugins.CVRestrictionFinder.findPermittableRoute();
					}

					spinner.stop();
				}, 50); // Delay just enough for the spinner to show
			});

			//Show hide features based on config settings
			//Config on/off Permittable Route feature
			if (app.plugins.CVRestrictionFinder.showPermittableRoute == true) {
				$("#cvrf-toggle-permittable-route-container").show();
			} else {
				$("#cvrf-toggle-permittable-route-container").hide();
			}
			//Config on/off showAllRestrictions feature
			if (app.plugins.CVRestrictionFinder.showAllRestrictions == true) {
				$("#cvrf-show-all-restrictions-container").show();
			} else {
				$("#cvrf-show-all-restrictions-container").hide();
			}
			//Config on/off show Route Ownershipe feature
			if (app.plugins.CVRestrictionFinder.showRouteOwnership == true) {
				$("#cvrf-toggle-showOwnershipRoutes-container").show();
			} else {
				$("#cvrf-toggle-showOwnershipRoutes-container").hide();
			}
			if (app.plugins.CVRestrictionFinder.showOverrideRestrictions == true) {
				$("#cvrf-override-restrictions-btn").show();
			} else {
				$("#cvrf-override-restrictions-btn").hide();
			}
			//Config on/off find intersecting municipalities
			if (app.plugins.CVRestrictionFinder.showMunicipalSegments == true) {
				$(".cvrf-summary-municipality-distance").show();
			} else {
				$(".cvrf-summary-municipality-distance").hide();
			}

			//Config on/off find intersecting municipalities
			if (app.plugins.CVRestrictionFinder.showPolicySegments == true) {
				$(".cvrf-summary-policy-distance").show();
			} else {
				$(".cvrf-summary-policy-distance").hide();
			}

			// Register Show all restrictions Button
			$("#cvrf-show-all-restrictions-btn").click(function () {
				if ($(this).is(":checked")) {
					app.plugins.CVRestrictionFinder.toggleAllRestrictionsLayer();
				} else {
					app.plugins.CVRestrictionFinder.allRestrictionLayer.getSource().clear();
				}
			});

			//Retrieve status page from RDM API that contains total restriction count to be used in progress bar for splash screen
			//Add restrictions loader Spinner
			$("#cvrf-show-all-restrictions-label").append(`
				<span class="ms-2 spinner-border spinner-border-sm text-primary" role="status" id="cvrf-spinner">
					<span class="visually-hidden">Loading...</span>
				</span>
			`);
			getActiveRestrictions();

			//Function that retrieves all active restrictions from the RDM API
			function getActiveRestrictions() {
				var offset = 0;
				var limit = 500;
				//var filter  = "RESTRICTION_TYPE = HORIZONTAL";
				var activeRestrictions = [];

				//Filter condtion for if user wants to hide specific restriction types
				var filterCondition = app.plugins.CVRestrictionFinder.showRestrictionType.map((value) => "RESTRICTION_TYPE LIKE '%" + value + "%'").join(" OR ");
				//This is where to put load all restrictions
				var url = returnEnvironmentUrl(app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint) + "/view/restrictions_active";
				function getActiveLocations(limit, offset) {
					$.ajax({
						type: "POST",
						url: url,
						dataType: "json",
						data: {
							limit: limit,
							offset: offset,
							filter: filterCondition,
						},
						xhrFields: {
							withCredentials: true,
						},
					})
						.done(function (data) {
							if (data.length == 0) {
								getRestrictions(activeRestrictions);
								//closeLoadingScreen();
							} else {
								$.merge(activeRestrictions, data);
								offset = offset + limit;
								getActiveLocations(limit, offset);
							}
						})
						.fail(function (jqxhr, settings, exception) {
							var error = "Error getting active restrictions (" + jqxhr.responseText + ")";
							//showLoadingScreen({progress: Math.round(currentPageCount/totalPageCount*100)});
							logger("ERROR", error);
						});
				}

				getActiveLocations(limit, offset);
			}
			//Get all restrictions
			function getRestrictions(activeRestrictions) {
				var locationList = [];
				//Create a new object of locations and their related restrictions

				$.each(activeRestrictions, function (index, location) {
					var ncvCount = 0;
					var tempCount = 0;
					var index = locationList.findIndex((item) => item.LOCATION_ID == location.LOCATION_ID);
					if (index === -1) {
						var lData = {};
						//Build Location information
						lData["LOCATION_ID"] = location.LOCATION_ID;
						lData["NETWORK_SEGMENT_ID"] = location.NETWORK_SEGMENT_ID;
						lData["LOCATION_ROAD_NAME"] = location.LOCATION_ROAD_NAME;
						lData["FEATURE_NAME"] = location.FEATURE_NAME;
						lData["FEATURE_SOURCE_SYSTEM"] = location.FEATURE_SOURCE_SYSTEM;
						lData["FEATURE_SOURCE_SYSTEM_KEY"] = location.FEATURE_SOURCE_SYSTEM_KEY;
						lData["TRAVEL_DIRECTION"] = location.TRAVEL_DIRECTION;
						lData["GEOMETRY"] = location.GEOMETRY;
						lData["STATUS"] = "Pass";
						lData["TEMPORARY"];
						var restrictionData = [];
						//Loop through restrictions that equal location ID and add to location data
						$.each(activeRestrictions, function (index, restriction) {
							//If restriction is for the same location, add to restriction data
							if (location.LOCATION_ID == restriction.LOCATION_ID) {
								//This is to flag the location that has a temporary restrictions for icon placement
								if (restriction.IS_TEMPORARY == 1) {
									lData["TEMPORARY"] = true;
								} else {
									lData["TEMPORARY"] = false;
								}
								var rData = {};
								var restrictionType = restriction.RESTRICTION_TYPE;
								var restrictionValue = restriction.PERMITABLE_VALUE;
								var laneType = restriction.LANE_TYPE;
								rData["RESTRICTION_ID"] = restriction.RESTRICTION_ID;
								rData["RESTRICTION_TRAVEL_DIRECTION"];
								rData["RESTRICTION_LANE_NUMBER"] = restriction.LANE_NUMBER;
								rData["RESTRICTION_TYPE"] = restrictionType;
								rData["LANE_TYPE"] = laneType;
								rData["PUBLIC_COMMENT"] = restriction.PUBLIC_COMMENT;
								//IF API call is internal only
								if (app.plugins.CVRestrictionFinder.pcfg.rdmApiEndPoint === "rdm-api") {
									rData["INTERNAL_COMMENT"] = restriction.INTERNAL_COMMENT;
								}
								rData["START_DATE"] = restriction.START_DATE;
								rData["END_DATE"] = restriction.END_DATE;
								rData["RESTRICTION_VALUE"] = restrictionValue;
								if (restrictionType == "NCV") {
									(rData["RESTRICTION_STATUS"] = "Fail"), (ncvCount += 1);
								} else {
									rData["RESTRICTION_STATUS"] = "Pass";
								}

								//This is to flag the location that has a temporary restrictions for icon placement
								if (restriction.IS_TEMPORARY == 1) {
									tempCount += 1;
								}

								rData["RESTRICTION_DIRECTION"] = restriction.TRAVEL_DIRECTION;
								restrictionData.push(rData);
							}
						});
						//This is to flag the location that has a temporary restrictions for icon placement
						if (tempCount > 0) {
							lData["TEMPORARY"] = true;
						} else {
							lData["TEMPORARY"] = false;
						}
						if (ncvCount > 0) {
							lData["STATUS"] = "Fail";
						} else {
							lData["STATUS"] = "Pass";
						}
						if (tempCount > 0) {
							lData["TEMPORARY"] = true;
						} else {
							lData["TEMPORARY"] = false;
						}
						lData["DATA"] = restrictionData;
						locationList.push(lData);
						//If location contains no restrictions, do not add to global list
						if (lData.DATA.length > 0) {
							app.plugins.CVRestrictionFinder.allRestrictions.push(lData);
						}
					}
				});
				//Remove restrictions loader Spinner
				$("#cvrf-spinner").remove();
				//enable show all restrictions button
				$("#cvrf-show-all-restrictions-btn").prop("disabled", false);
			}

			// Log success
			logger("INFO", app.plugins.CVRestrictionFinder.name + ": Plugin successfully loaded");
		};
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}
