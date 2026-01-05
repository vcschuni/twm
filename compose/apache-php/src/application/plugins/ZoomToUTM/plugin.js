class ZoomToUTM {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ZoomToUTM";
		this.version = 1.0;
		this.author = "Peter Spry";
		this.contentFile = "application/plugins/ZoomToUTM/utmTemplate.html"; // UI for template
		this.windowContent = $("<div id='utmForm'/>"); // placeholder for template
		this.pcfg = getPluginConfig(this.name);
		this.buttonLocatedRight = (this.pcfg.buttonLocatedRight) ? this.pcfg.buttonLocatedRight : true;
		this.buttonLocatedTop = (this.pcfg.buttonLocatedTop) ? this.pcfg.buttonLocatedTop : false;
		this.buttonLocationOffset = (this.pcfg.buttonLocationOffset) ? this.pcfg.buttonLocationOffset : "10em";	
		
		this.iconFeature = new ol.Feature({ geometry: new ol.geom.Point([0,0])});
		this.iconStyle = new ol.style.Style({image: new ol.style.Icon({
			anchor:[0.5,0.5],
			displacement: [0, 24],			
			src:"application/img/GeoCoderMarker.png"})});
		this.iconFeature.setStyle(this.iconStyle);
		this.iconSource = new ol.source.Vector({features: [this.iconFeature]});
		this.iconLayer = new ol.layer.Vector({source: this.iconSource, name: "utmIcon"});		
		
		this.addPlugin();
	}
	
    /**
	 * Function: zoomToFormUTM
	 * @param () none
	 * @returns () none
	 * Function that converts a UTM X,Y and Zone to Map Point and zooms to it
	 */	
	zoomToFormUTM() {
		var EPSG = $('input[name=UTM]:checked', '.utm-check').val();
		var x = $("#utmX").val();
		var y = $("#utmY").val();
		var label;
		var utmPointGeometry = new ol.geom.Point([Number(x),Number($("#utmY").val())]);
		var pointInMapCoords = utmPointGeometry.transform(EPSG, app.map.getView().getProjection().getCode());
		var pointFeature = new ol.Feature({geometry:pointInMapCoords});
		// create marker
		switch (EPSG) {
			case "EPSG:4326":
				label = y+" N, "+x+" W";
				break;
			case "EPSG:26908":
				label = "UTM: 8N, E: "+x+"m, N: "+y+"m";
				break;
			case "EPSG:26909":
				label = "UTM: 9N, E: "+x+"m, N: "+y+"m";
				break;
			case "EPSG:26910":
				label = "UTM: 10N, E: "+x+"m, N: "+y+"m";
				break;
			case "EPSG:26911":
				label = "UTM: 11N, E: "+x+"m, N: "+y+"m";
				break;
		}		

		zoomToFeature(pointFeature);
		var centre = app.map.getView().getCenter();
					
		// Place mark to indicate where we zoomed to
		app.map.removeLayer(app.plugins.ZoomToUTM.iconLayer); // remove any previous marker	
		app.plugins.ZoomToUTM.iconFeature.getGeometry().setCoordinates(centre);					
		app.map.addLayer(app.plugins.ZoomToUTM.iconLayer);
		app.plugins.ZoomToUTM.iconLayer.setZIndex(nextAvailableOverlayLayerZIndex());
			
		if (($("#utmClear-btn").hasClass("disabled"))) {
			$("#utmClear-btn").removeClass("disabled");
		}
		
	}
	
	/**
	* Function: clearUTM
	* @param () none
	* @returns () none
	* Function to remove the map marker placed by zoomToFormUTM function
	*/
	clearUTM() {
		// remove marker
		app.map.removeLayer(app.plugins.ZoomToUTM.iconLayer);
		if (!($("#utmClear-btn").hasClass("disabled"))) { // disable Clear button
			$("#utmClear-btn").addClass("disabled");
		}
	}		


	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
        // Load in the button icon
		var iconSrc = '<img src="./application/plugins/ZoomToUTM/img/utmIcon.png" width="15" height="15">';
		
        // Create the ZoomToUTM button
        var button = document.createElement('button');
		button.innerHTML = iconSrc; 
	
        // Create the ZoomToUTM location div
		var element = document.createElement('div');
		element.title = "Zoom to UTM";
		element.id = "ZoomToUTM-btn";
		element.className = 'ZoomToUTM-btn ol-control';
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
		
		// Create a new open layers control for the ZoomToUTM location button
		var ZoomToUTMControl = new ol.control.Control({
			element: element    
		});
		
		// Add the new control to the map
		app.map.addControl(ZoomToUTMControl);
		
		this.windowContent = `
		<center>
<div class="utm-check">
  <input class="utm-check-input" type="radio" name="UTM" id="utm7N" value="EPSG:26907">
  <label class="utm-check-label" for="utm7N">
    UTM 8N
  </label>
</div>		
<div class="utm-check">
  <input class="utm-check-input" type="radio" name="UTM" id="utm8N" value="EPSG:26908">
  <label class="utm-check-label" for="utm8N">
    UTM 8N
  </label>
</div>
<div class="utm-check">
  <input class="utm-check-input" type="radio" name="UTM" id="utm9N"  value="EPSG:26909">
  <label class="utm-check-label" for="utm9N">
    UTM 9N
  </label>
</div>
<div class="utm-check">
  <input class="utm-check-input" type="radio" name="UTM" id="utm10N" checked value="EPSG:26910">
  <label class="utm-check-label" for="utm10N">
    UTM 10N
  </label>
</div>
<div class="utm-check">
  <input class="utm-check-input" type="radio" name="UTM" id="utm11N"  value="EPSG:26911">
  <label class="utm-check-label" for="utm11N">
    UTM 11N
  </label>
</div>

<div class="input-group mb-3">
  <span class="input-group-text">X (Easting)</span>
  <input id="utmX" type="text" class="form-control utm-input" placeholder="example: 515300" style="background-color:pink;" aria-label="X (Easting)" aria-describedby="utmX" required>
</div>
<div class="input-group mb-3">
  <span class="input-group-text utm-input" >Y (Northing)</span>
  <input id="utmY" type="text" class="form-control utm-input" placeholder="example: 5972000" style="background-color:pink;" aria-label="Y (Northing)" aria-describedby="utmY" required>
</div>

<button value="Zoom" class="btn btn-primary disabled" id="utmZoom-btn">Zoom</button>
<button value="Clear" class="btn btn-primary disabled" id="utmClear-btn">Clear</button>

</center>
`;		
		
		// Add the click event to the ZoomToUTM  button
		$("#ZoomToUTM-btn").click(function() {
			app.plugins.MultiFloatingWindow.open("utm", "Zoom to UTM Coordinate", app.plugins.ZoomToUTM.windowContent, 350, 250, 'left',app.plugins.ZoomToUTM.clearUTM ,app.plugins.ZoomToUTM.clearUTM);

			$("#utmZoom-btn").click(function() {
				app.plugins.ZoomToUTM.zoomToFormUTM(); 
			});
			$("#utmClear-btn").click(function() {
				app.plugins.ZoomToUTM.clearUTM(); 
			});
			$(".utm-input").on( "keyup", function() {
				if ($.isNumeric($(this).val())) {
					$(this).css({"background-color": "white"}); 
				} else {
					$(this).css({"background-color": "pink"}); 
				}
				if ($.isNumeric($("#utmX").val()) && $.isNumeric($("#utmY").val())) {
					$("#utmZoom-btn").removeClass("disabled");
				} else {
					if (!($("#utmZoom-btn").hasClass("disabled"))) {
						$("#utmZoom-btn").addClass("disabled");
					}
				}
			} );
		});

		// Log success
		logger("INFO",  "ZoomToUTM: Plugin successfully loaded");


	}
}