/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: definitions.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Houses misc defintions (common styles, spinners, etc.).
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * Definition: app.spinnerOptionsTextInput
 * Defines the options for a spinner inside a text input
 */
app.spinnerOptionsTextInput = {
	lines: 10,
	length: 6,
	width: 2,
	radius: 5,
	scale: 1,
	corners: 0.9,
	speed: 0.6,
	rotate: 0,
	animation: "spinner-line-fade-more",
	direction: 1,
	color: "#696969",
	fadeColor: 'transparent',
	top: "0%",
	left: "94%",
	shadow: "0 0 1px transparent",
	zIndex: 2000000000,
	className: "spinner",
	position: "relative"
};

/**
 * Definition: app.spinnerOptionsMedium
 * Defines the options for the medium sized spinner
 */
app.spinnerOptionsMedium = {
	lines: 15,
	length: 25,
	width: 4,
	radius: 20,
	scale: 1,
	corners: 0.9,
	speed: 0.6,
	rotate: 0,
	animation: "spinner-line-fade-more",
	direction: 1,
	color: "#696969",
	fadeColor: 'transparent',
	top: "50%",
	left: "50%",
	shadow: "0 0 1px transparent",
	zIndex: 2000000000,
	className: "spinner",
	position: "absolute"
};

/**
 * Definition: app.currentLocationStyle
 * Defines the styling for the current location icon
 */
app.currentLocationStyle = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 10,
		stroke: new ol.style.Stroke({
			color: "rgba(254, 192, 9, 1)",
			width: 4
		}),
		fill: new ol.style.Fill({
			color: "rgba(33, 150, 243, 0.7)"
		})
	})
});

/**
 * Definition: app.highlightStyles
 * Defines the feature styling for the highlight layer
 */
app.highlightStyles = {
	Point: new ol.style.Style({
		image: new ol.style.Circle({
			radius: 10,
			stroke: new ol.style.Stroke({
				color: "rgba(0, 255, 255, 0.6)",
				width: 2
			}),
			fill: new ol.style.Fill({
				color: "rgba(0, 255, 255, 0.3)"
			})
		})
	}),
	MultiPoint: new ol.style.Style({
		image: new ol.style.Circle({
			radius: 12,
			stroke: new ol.style.Stroke({
				color: "rgba(0, 255, 255, 0.6)",
				width: 2
			}),
			fill: new ol.style.Fill({
				color: "rgba(0, 255, 255, 0.3)"
			})
		})
	}),
	LineString: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: "rgba(0, 255, 255, 0.6)",
			width: 8
		})
	}),
	MultiLineString: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: "rgba(0, 255, 255, 0.6)",
			width: 8
		})
	}),
	Polygon: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: "rgba(0, 255, 255, 0.6)",
			width: 8
		}),
		fill: new ol.style.Fill({
			color: "rgba(0, 255, 255, 0.3)"
		})
	}),
	MultiPolygon: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: "rgba(0, 255, 255, 0.6)",
			width: 8
		}),
		fill: new ol.style.Fill({
			color: "rgba(0, 255, 255, 0.3)"
		})
	})
};