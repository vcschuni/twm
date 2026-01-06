class Markup {
  /**
   * Function: constructor
   * @param () none
   * @returns () nothing
   * Function that initializes the class
   */
  constructor() {
    this.name = "Markup";
    this.version = 1.0;
    this.author = "";
    this.pcfg = getPluginConfig(this.name);
    this.contentFile = "application/plugins/Markup/content.html";
    this.addPlugin(); // Initializes the plugin

    // Define and add an empty RED highlight layer
    this.redHighlightLayer = new ol.layer.Vector({
	  hideFromLayerController: true,
      source: new ol.source.Vector({}),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: "rgba(255, 0, 0, 0.6)",
          width: 8,
        }),
        image: new ol.style.Circle({
          radius: 7,
          stroke: new ol.style.Stroke({
            color: "rgba(255, 0, 0, 0.6)",
            width: 4,
          }),
          fill: new ol.style.Fill({
            color: "#ffc400",
          }),
        }),
      }),
    });
    app.map.addLayer(this.redHighlightLayer);
    this.redHighlightLayer.setZIndex(652);
  }

  /**
   * Function: turnAllOff
   * Turn off all Markers
   * @param () none
   * @returns () nothing
   */
  turnAllOff() {
    $(".le-markup-btn-grp")
      .not(".master")
      .find(".le-markup-btn")
      .removeClass("active");
      this.vectorLayer.setZIndex(651);
  }

  /**
   * Function: exportMarkup
   * Export markup as a kml file then download
   * @param () none
   * @returns () nothing
   */
  exportMarkup() {
    const features = this.markupSource.getFeatures();
    const geogFeatures = features.map((feature) => {
      return transformFeature(feature, "EPSG:3857", "EPSG:4326");
    });
    // .transform("EPSG:3857", "EPSG:4326");
    const format = new ol.format.KML({'extractStyles':true});
    
    // Loop through each feature to create the appropriate KML scale for text items
	geogFeatures.forEach(function(feat) {
		// if this is a text field, get the size and adjust kml accordingly
		if (feat.getStyle().getText().getText()) {
			let textSize = feat.getStyle().getText().getFont().match(/\d+/);
			var kmlScale = Number(textSize)*0.061;
			feat.setProperties({'kmlScale':kmlScale});
			const reg2 = new RegExp(/(<name>.*?<LabelStyle>)/, "gis");
		}
	});
	// convert to KML
	let kml = format.writeFeatures(geogFeatures);

    // Hide the dot for labels
    const reg = new RegExp(/(<name>.*?<IconStyle><scale>)\d.*?</, "gis");
    kml = kml.replace(reg, (_, g1) => `${g1}0.1<`);
    // Make the labels bigger
    const reg2 = new RegExp(/(<name>.*?<LabelStyle>)/, "gis");
    kml = kml.replace(reg2, (_, g1) => `${g1}<scale>1.2</scale>`);

	
    /**
     * Fix label scales kml here
     */
     // need to find new scale values in the KML, use XML parsing
	var xmlKml = $.parseXML(kml);
	$(xmlKml).find("Data").each(function() {
		var newScale = $(this).text();
		$(this).parent().parent().find("LabelStyle").find("scale").text(newScale);
		$(this).remove();
	});

	// convert back to KML (string)
	var fixedKml = new XMLSerializer().serializeToString(xmlKml);
	
    const blob = new Blob([fixedKml], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "markup.kml");

    this.turnAllOff();
  }

  /**
   * Function: toggleTools
   * Add or remove all markup buttons
   * @param () none
   * @returns () nothing
   */
  toggleTools() {
    // Always remove a previous tool.
    this.unregisterMarkup();

    if ($(".le-markup-btn-grp.hide").hasClass("hidden")) {
      $(".le-markup-btn-grp.hide").removeClass("hidden out").addClass("in");
    } else {
      $(".le-markup-btn-grp.hide").removeClass("in").addClass("hidden out");
      this.turnAllOff();
    }
  }

  /**
   * Function: toggleVector
   * Turn on and off the vector marker tools
   * @param () active
   * @param () type
   * @returns () nothing
   */
  toggleVector(active, type) {
    // Always remove a previous tool.
    this.unregisterMarkup();

    // If turning something on.
    if (active) {
      this.vectorDraw = new ol.interaction.Draw({
        source: this.markupSource,
        type: type,
      });
      const that = this;
      this.vectorDraw.on("drawend", function (e) {
        const style = that.makeFeatureStyle();
        e.feature.setStyle(style);
        // e.feature.set("style", style);
      });
      app.map.addInteraction(this.vectorDraw);
    }
  }

  /**
   * Function: togglePointPalette
   * Open the point symbol palette
   * @param {*} active
   * @returns () nothing
   */
  togglePointPalette(active) {
    // Display the symbol picker
    if (active) {
      $("#le-markup-toolbar .font-pallet").fadeIn(200);
      $("body").on("mouseup", (e) => {
        const fontClass = $(e.target).hasClass("pallet-btn");

        /**
         *  If clicking outside the symbol picker
         *  close the palette and turn off the control
         */
        if (!fontClass) {
          $("#le-markup-toolbar .font-pallet").fadeOut(200);
          $(
            "#le-markup-toolbar .le-markup-btn[data-action='Point']"
          ).removeClass("active");

          $("body").off("mouseup");
          return;
        }

        const palletBtn = e.target.className;

        const newFont = /oi\-(.*)\s/.exec(palletBtn)[1];

        const src = `application/lib/open-iconic-1.1.1/svg/${newFont}.svg`;

        // Change the symbol on the button
        $("#le-markup-toolbar .le-markup-btn[data-action='Point']")
          .find("div")
          .css("background-image", `url('${src}')`);

        const that = this;
        $.get(src).done((dom) => {
          const svg = $(dom).find("svg");

          // Get the current styles
          const colour = that.pcfg.colour.current || that.pcfg.colour.default;
          const size = that.pcfg.size.current || that.pcfg.size.default;

          // adjust size and colour
          svg.attr("width", size * 5);
          svg.attr("height", size * 5);
          svg.find("path").attr("fill", colour.replace(/#/, "%23"));

          // Convert the svg to a string
          const svgString = svg.prop("outerHTML");

          this.pcfg.icons.current = `data:image/svg+xml;utf8,${svgString}`;

          // Always remove a previous tool.
          this.unregisterMarkup();

          // Turn on the draw interaction
          that.toggleVector(true, "Point");
        });

        // Close the symbol picker
        $("#le-markup-toolbar .font-pallet").fadeOut(200);
        $("body").off("mouseup");
      });
    } else {
      $("#le-markup-toolbar .font-pallet").fadeOut(200);
      this.unregisterMarkup();
    }

    // Register a listener for clicking outside the symbol picker
  }

  /**
   * Function: addText
   * Add text to the map.
   * When clicking the map a input box will appear.
   * When you hit enter the text will be added to the map.
   * When you hit escape the input box will be removed.
   * If you click outside the input box the input box will be removed and
   * a new one will be added.
   * @param {object} e jQuery click event
   * @returns () nothing
   */
  addText(e) {
    const loc = ol.proj.transform(e.coordinate, "EPSG:3857", "EPSG:4326");
    const pos = e.pixel;

    $('<input type="text"/>')
      .css("top", pos[1] + "px")
      .css("left", pos[0] + "px")
      .addClass("le-markup-text-input")
      .appendTo("#content")
      .focus()
      .on("keyup", (e) => {
        e.preventDefault();
        if (e.key === "Enter") {
          const text = $(e.target).val();
          const style = app.plugins.Markup.makeFeatureStyle();

          // Have to set the text manually
          style.getText().setText(text);

          style.getText().setTextAlign("start");

          // Hide the point
          style.getImage().setOpacity(0);

          const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat(loc)),
          });

          // Set the style
          feature.setStyle(style);
          // Add text
          app.plugins.Markup.markupSource.addFeature(feature);

          // Remove the input box
          $(e.target).remove();
        }
      })
      .focusout((e) => {
        $(e.target).remove();
      });
  }

  /**
   * Function: unregisterMarkup
   * Turn off all Markup tools
   * @param () none
   * @returns () nothing
   */
  unregisterMarkup() {
    if (this.vectorDraw) app.map.removeInteraction(this.vectorDraw);
    app.map.un("click", this.addText);
    app.map.un("click", this.removeMarkup);

    if (typeof this.deleteMarkup === "object") {
      app.map.removeInteraction(this.deleteMarkup);
    }

    // Clear the highlight layer
    app.plugins.Markup.redHighlightLayer.getSource().clear();
    app.map.un("pointermove", this.highlightFeatureOnHover);
  }

  /**
   * Function toggleText
   * Turn on and off adding text
   * @param () active
   * @returns () nothing
   */
  toggleText(active) {
    // Always remove a previous tool.
    this.unregisterMarkup();

    app.map.on("click", this.addText);

    // If turning something on.
    if (active) {
      app.map.on("click", this.addText);
    } else {
      app.map.un("click", this.addText);
    }
  }

  /**
   * Function: removeMarkup
   * Remove a markup feature from the map.
   * @param {*} active
   * @returns () nothing
   */
  removeMarkup(active) {
    app.plugins.Markup.deleteMarkup = new ol.interaction.Select({
      layers: [app.plugins.Markup.vectorLayer],
    });

    app.map.addInteraction(app.plugins.Markup.deleteMarkup);

    const remove = (e) => {
      app.plugins.Markup.redHighlightLayer.getSource().clear();
      app.plugins.Markup.vectorLayer.getSource().removeFeature(e.element);
      app.plugins.Markup.deleteMarkup.getFeatures().un("add", remove);
    };

    app.plugins.Markup.deleteMarkup.getFeatures().on("add", remove);
  }

  /**
   * Function: highlightFeatureOnHover
   * @param (object) event
   * @returns () nothing
   * Function to highlight a 'hovered feature in red
   */
  highlightFeatureOnHover(e) {
    app.plugins.Markup.redHighlightLayer.getSource().clear();
    app.map.forEachFeatureAtPixel(e.pixel, function (feature) {
      app.plugins.Markup.redHighlightLayer.getSource().clear();
      app.plugins.Markup.redHighlightLayer.getSource().addFeature(feature);
    });
  }

  /**
   * Function toggleDelete
   * Turn on and off the delete button
   * @param () active
   * @returns () nothing
   */
  toggleDelete(active) {
    // Always remove a previous tool.
    this.unregisterMarkup();

    app.map.on("click", this.removeMarkup);

    this.redHighlightLayer.getSource().clear();

    // If turning something on.
    if (active) {
      app.map.on("click", this.removeMarkup);
      app.map.on("pointermove", this.highlightFeatureOnHover);
    } else {
      app.map.un("click", this.removeMarkup);
      app.map.un("pointermove", this.highlightFeatureOnHover);
    }
  }

  /**
   * Function: toggleColor
   * Turn on and off the color picker
   * @param () active
   * @returns () nothing
   */
  toggleColor(active) {
    // Always remove a previous tool.
    this.unregisterMarkup();
  }

  /**
   * Function: toggleSize
   * Turn on and off the size picker
   * @param () active
   * @returns () nothing
   */
  toggleSize(active) {
    // Always remove a previous tool.
    this.unregisterMarkup();
  }

  /**
   * Function: toggleMarkerFunction
   * Handle the click on all marker buttons.
   * @param {string} action Type of button that was pressed
   * @param {object} e jQuery click event
   */
  toggleMarkerFunction(action, e) {
    let btn;
    if ($(e.target).is("img")) {
      btn = $(e.target).parent();
    } else if ($(e.target).is("rect")) {
      btn = $(e.target).parent().parent();
    } else {
      btn = $(e.target);
    }
    const active = btn.hasClass("active");
    switch (action) {
      case "activate":
        this.toggleTools();
        break;
      case "Point": // Fall through
        this.togglePointPalette(active);
        break;
      case "LineString":
      case "Polygon":
        this.toggleVector(active, action);
        break;
      case "Text":
        this.toggleText(active);
        break;
      case "Delete":
        this.toggleDelete(active);
        break;
      case "Size":
        this.toggleSize(active);
        this.toggleDelete(false); // prevent unexpected deletions
        break;
      case "Colour":
        this.toggleColor(active);
        this.toggleDelete(false); // ditto
        break;
      case "Download":
        this.exportMarkup();
        this.toggleDelete(false); // ditto
        break;
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null; // If the hex is not valid, return null.
  }

  /**
   * Compute the Openlayers markup styles based on the configuration.
   */
  makeFeatureStyle() {
    const size = this.pcfg.size.current || this.pcfg.size.default;
    const { r, g, b } = this.hexToRgb(
      this.pcfg.colour.current || this.pcfg.colour.default
    );
    const colour = `${r},${g},${b}`;
    const dark = isDark(`rgb(${colour})`);
    const icon = this.pcfg.icons.current || this.pcfg.icons.default;

    const style = new ol.style.Style({
      text: new ol.style.Text({
        font: `bold ${size * 7}px sans-serif`,
        overflow: true,
        fill: new ol.style.Fill({
          color: `rgba(${colour}, 1)`,
        }),
        stroke: new ol.style.Stroke({
          color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
          width: size,
        }),
      }),
      fill: new ol.style.Fill({
        color: `rgba(${colour}, 0.5)`,
      }),
      stroke: new ol.style.Stroke({
        color: `rgba(${colour}, 1)`,
        width: size,
      }),
      image: new ol.style.Icon({
        src: icon,
      }),
    });

    return style;
  }

  /**
   * Function: registerMarkup
   * @param () none
   * @returns () nothing
   * Register markup buttons
   */
  registerMarkup() {
    const that = this;

    /**
     * ## updateStyle
     * Update the style of the markup layer.
     * @param {*} colour
     * @param {*} size
     */
    const updateStyle = (colour, size) => {
      // If layer is not yet defined, exit.
      if (!this.vectorLayer) return;

      if (colour) {
        // Update the style.
        this.pcfg.colour.current = colour;
      }

      if (size) {
        this.pcfg.size.current = size;
      }
    };

    // Set size from the config file
    $(".le-markup-btn[data-action='Size']")
      .text(this.pcfg.size.current || this.pcfg.size.default)
      .on("input", (e) => {
        // Set the size value
        let value = parseInt($(e.target).text(), 10) || this.pcfg.size.min;
        // Keep the value within the range
        if (value < this.pcfg.size.min) value = this.pcfg.size.min;
        if (value > this.pcfg.size.max) value = this.pcfg.size.max;

        updateStyle(null, value);
      });

    // Register the colour picker
    $(".le-markup-btn[data-action='Colour']").colorPick({
      initialColor: this.pcfg.colour.default,
      allowRecent: this.pcfg.colour.allowRecent,
      recentMax: this.pcfg.colour.numberRecentColours,
      palette: this.pcfg.colour.palette,
      onColorSelected: function () {
        this.element.css({ backgroundColor: this.color });
        updateStyle(this.color, null);
      },
    });

    // Load the symbol palette
    this.pcfg.icons.palette.forEach((icon) => {
      $("#le-markup-toolbar .pallet-symbols").append(
        `<div class="oi ${icon} pallet-btn">`
      );
    });

    $(".le-markup-btn").click(function (e) {
      let btn;
      if ($(e.target).is("img")) {
        btn = $(e.target).parent();
      } else if ($(e.target).is("rect")) {
        btn = $(e.target).parent().parent();
      } else {
        btn = $(e.target);
      }
      var action = btn.data("action");

      // Highlight and unhighlight the button
      if (btn.hasClass("active")) {
        btn.removeClass("active");
      } else {
        that.turnAllOff();
        btn.addClass("active");
      }
      that.toggleMarkerFunction(action, e);
    });
    // Determine which tools are available
    const controls = Object.keys(this.pcfg.controls);
    controls.forEach((control) => {
      const display = this.pcfg.controls[control] ? "flex" : "none";
      $(`.le-markup-btn[data-action='${control}']`).css("display", display);
    });

    // Make the vector source global within the plugin object
    this.markupSource = new ol.source.Vector();

    // Layer definition. This is where you adjust the style
    this.vectorLayer = new ol.layer.Vector({
	  hideFromLayerController: true,
      source: this.markupSource,
      preventRefresh: true,
    });

    // Add layer
    app.map.addLayer(this.vectorLayer);
    this.vectorLayer.setZIndex(nextAvailableOverlayLayerZIndex());
  }

  /**
   * Function: addPlugin
   * @param () none
   * @returns () nothing
   * Function that adds the plugin tab to the sidebar
   */
  addPlugin() {
    // Define Callback
    var callback = function (success, content) {
      // Bail if failed
      if (!success) {
        logger(
          "ERROR",
          app.plugins.Markup.name + ": Plugin failed to initialize"
        );
        return;
      }

      // Append content to map
      $("#map").append(content);

      // Register the plugin
      app.plugins.Markup.registerMarkup();

      // Log success
      logger("INFO", app.plugins.Markup.name + ": Plugin successfully loaded");
    };

    // Load content file
    loadTemplate(this.contentFile, callback);
  }
}
