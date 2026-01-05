class MeasureTool {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "MeasureTool";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.pcfg = getPluginConfig(this.name);
		this.type = (this.pcfg.type); // must be 'LineString' or 'Polygon' 
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : false;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "10em";
		this.intervalProcessId;
		this.overlayCount; // used to track and then remove all map overlays when we are done.
		// measure tool map interaction
		this.draw;
		this.source;
		this.vector; 
		this.helpTooltip;
		this.measureTooltip;
		this.helpTooltip;
		this.isOn = false;
		this.mSquared = "m<sup>2</sup>";
		this.source = new ol.source.Vector();

		// Define and add the new measure layer
		var measureSource = new ol.source.Vector({});
		this.measureLayer = new ol.layer.Vector({
			source: measureSource,
			  style: {
				'fill-color': 'rgba(255, 255, 255, 0.2)',
				'stroke-color': '#ff1100',
				'stroke-width': 4,
				'circle-radius': 7,
				'circle-fill-color': '#ff1100',
			  },
		});
		this.measureLayer.setZIndex(nextAvailableOverlayLayerZIndex());
		app.map.addLayer(this.measureLayer);		
		
		this.addPlugin();
	}
	
    /**
	 * Function: createMeasureFunction
	 * @param () none
	 * @returns () nothing
	 * Function that setups up the measure function
	 * Based on https://openlayers.org/en/latest/examples/measure.html
	 */	
	createMeasureFunction() {
		// drawing
		app.plugins.MeasureTool.vector = new ol.layer.Vector({
		  source: app.plugins.MeasureTool.source,
		  style: {
			'fill-color': 'rgba(255, 255, 255, 0.2)',
			'stroke-color': '#ffcc33',
			'stroke-width': 2,
			'circle-radius': 7,
			'circle-fill-color': '#ffcc33',
		  },
		});		

		// variables
		let sketch;
		let helpTooltipElement;
//		let helpTooltip;
		let measureTooltipElement;
//		let measureTooltip;
		const continutePolygonMsg = 'Click to continue drawing the polygon';		
		const continueLineMsg = 'Click to continue drawing the line';
		const pointerMoveHandler = function (evt) {
		  if (evt.dragging) {
			return;
		  }
		  /** @type {string} */
		  let helpMsg = 'Click to start drawing';
		
		  if (sketch) {
			const geom = sketch.getGeometry();
			if (geom instanceof ol.geom.Polygon) {
			  helpMsg = continuePolygonMsg;
			} else if (geom instanceof ol.geom.LineString) {
			  helpMsg = continueLineMsg;
			}
		  }
		
		  helpTooltipElement.innerHTML = helpMsg;
		  app.plugins.MeasureTool.helpTooltip.setPosition(evt.coordinate);
		
		  helpTooltipElement.classList.remove('hidden');
		};
		
		app.map.addLayer(app.plugins.MeasureTool.vector);
		
		app.map.on('pointermove', app.plugins.MeasureTool.pointerMoveHandler);
		
		app.map.getViewport().addEventListener('mouseout', function () {
		  helpTooltipElement.classList.add('hidden');
		});
						
		/**
		 * Format length output.
		 * @param {LineString} line The line.
		 * @return {string} The formatted length.
		 */
		const formatLength = function (line) {
		  const length = ol.sphere.getLength(line);
		  let output;
		  if (length > 100) {
			output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
		  } else {
			output = Math.round(length * 100) / 100 + ' ' + 'm';
		  }
		  return output;
		};
		
		/**
		 * Format area output.
		 * @param {Polygon} polygon The polygon.
		 * @return {string} Formatted area.
		 */
		const formatArea = function (polygon) {
		  const area = ol.sphere.getArea(polygon);
		  let output;
		  if (area > 10000) {
			output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
		  } else {
			output = Math.round(area * 100) / 100 + " " + app.plugins.MeasureTool.mSquared;
		  }
		  return output;
		};
		
		const style = new ol.style.Style({
		  fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.2)',
		  }),
		  stroke: new ol.style.Stroke({
			color: 'rgba(0, 0, 0, 0.5)',
			lineDash: [10, 10],
			width: 2,
		  }),
		  image: new ol.style.Circle({
			radius: 5,
			stroke: new ol.style.Stroke({
			  color: 'rgba(0, 0, 0, 0.7)',
			}),
			fill: new ol.style.Fill({
			  color: 'rgba(255, 255, 255, 0.2)',
			}),
		  }),
		});
		
		function addInteraction() {
		  app.plugins.MeasureTool.draw = new ol.interaction.Draw({
			source: app.plugins.MeasureTool.source,
			type: app.plugins.MeasureTool.type,
			style: function (feature) {
			  const geometryType = feature.getGeometry().getType();
			  if (geometryType === app.plugins.MeasureTool.type || geometryType === 'Point') {
				return style;
			  }
			},
		  });
		  app.map.addInteraction(app.plugins.MeasureTool.draw);
		
		  createMeasureTooltip();
		  createHelpTooltip();
		
		  let listener;
		  app.plugins.MeasureTool.draw.on('drawstart', function (evt) {
			// set sketch
			sketch = evt.feature;
		
			/** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
			let tooltipCoord = evt.coordinate;
		
			listener = sketch.getGeometry().on('change', function (evt) {
			  const geom = evt.target;
			  let output;
			  if (geom instanceof ol.geom.Polygon) {
				output = formatArea(geom);
				tooltipCoord = geom.getInteriorPoint().getCoordinates();
			  } else if (geom instanceof ol.geom.LineString) {
				output = formatLength(geom);
				tooltipCoord = geom.getLastCoordinate();
			  }
			  measureTooltipElement.innerHTML = output;
			  app.plugins.MeasureTool.measureTooltip.setPosition(tooltipCoord);
			});
		  });
		
		  app.plugins.MeasureTool.draw.on('drawend', function () {
			measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
			app.plugins.MeasureTool.measureTooltip.setOffset([0, -7]);
			
			// save to screen
			var drawnFeature = new ol.Feature({geometry:sketch.getGeometry()});
			app.plugins.MeasureTool.measureLayer.getSource().addFeature(drawnFeature);
			
			// unset sketch
			sketch = null;
			// unset tooltip so that a new one can be created
			measureTooltipElement = null;
			createMeasureTooltip();
			ol.Observable.unByKey(listener);
		  });
		}
		
		/**
		 * Creates a new help tooltip
		 */
		function createHelpTooltip() {
		  if (helpTooltipElement) {
			helpTooltipElement.parentNode.removeChild(helpTooltipElement);
		  }
		  helpTooltipElement = document.createElement('div');
		  helpTooltipElement.className = 'ol-tooltip hidden';
		  app.plugins.MeasureTool.helpTooltip = new ol.Overlay({
			element: helpTooltipElement,
			offset: [15, 0],
			positioning: 'center-left',
		  });
		  app.map.addOverlay(app.plugins.MeasureTool.helpTooltip);
		}
		
		/**
		 * Creates a new measure tooltip
		 */
		function createMeasureTooltip() {
		  if (measureTooltipElement) {
			measureTooltipElement.parentNode.removeChild(measureTooltipElement);
		  }
		  measureTooltipElement = document.createElement('div');
		  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
		  app.plugins.MeasureTool.measureTooltip = new ol.Overlay({
			element: measureTooltipElement,
			offset: [0, -15],
			positioning: 'bottom-center',
			stopEvent: false,
			insertFirst: false,
		  });
		  app.map.addOverlay(app.plugins.MeasureTool.measureTooltip);
		}
		
		addInteraction();		
	}

	/** F
	Function: removeMeasureToolOverlays
	* @param () none
	* @returns () nothing
	* Function to remove the map overlays added by using the MeasureTool
	*/
	removeMeasureToolOverlays() {
		while (app.map.getOverlays().getArray().length > this.overlayCount) {
			app.map.getOverlays().pop();
		}		
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Add a custom style sheet.
		$('head').append('<link rel="stylesheet" href="./application/plugins/MeasureTool/style.css" type="text/css" />');
		
        // Load in the button icon
		var iconSrcOn = '<img src="./application/plugins/MeasureTool/img/measurement-2.svg" width="15" height="15">';
		var iconSrcOff = '<img src="./application/plugins/MeasureTool/img/measurement-1.svg" width="15" height="15">';
		
        // Create the MeasureTool button
        var button = document.createElement('button');
        button.id = "sv-MeasureTool-btn";
		button.innerHTML = iconSrcOff; 

		
        // Create the MeasureTool location div
		var element = document.createElement('div');
		element.title = "Measure Tool";
		element.id = "mt-measuretool-btn";
		element.className = 'Measuretool-btn ol-control';
		if (this.buttonLocatedTop) {
			element.style.top = this.buttonLocationOffset;
		} else {
			element.style.bottom = this.buttonLocationOffset;
		}
		if (this.buttonLocatedRight) {
			element.style.right = '.5em';
		} else {
			element.style.left = '.5em';
		}
		element.appendChild(button);
		
		// Create a new open layers control for the MeasureTool location button
		var MeasureToolLocationTransition = new ol.control.Control({
			element: element    
		});
		
		// Add the new control to the map
		app.map.addControl(MeasureToolLocationTransition);

		// Add the click event to the MeasureTool  button
        $("#mt-measuretool-btn").click(function() {
            if (!app.plugins.MeasureTool.isOn) { 
	   			// start using the measure tool
	   			app.plugins.MeasureTool.overlayCount = app.map.getOverlays().getArray().length;
				app.plugins.MeasureTool.createMeasureFunction();
				button.innerHTML = iconSrcOn; 
				app.plugins.MeasureTool.isOn = true;
			} else {
				app.map.removeInteraction(app.plugins.MeasureTool.draw);
				app.plugins.MeasureTool.removeMeasureToolOverlays();
				$( ".ol-tooltip" ).remove();
				button.innerHTML = iconSrcOff; 
				app.plugins.MeasureTool.isOn = false;
				app.plugins.MeasureTool.measureLayer.getSource().clear();
				app.plugins.MeasureTool.vector.getSource().clear();
			}
        });

		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}