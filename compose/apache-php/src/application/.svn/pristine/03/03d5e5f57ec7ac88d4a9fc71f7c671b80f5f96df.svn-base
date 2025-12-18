class UploadSpatial {
  /**
   * Function: constructor
   * @param () none
   * @returns () nothing
   * Function that initializes the class
   */
  constructor() {
    this.name = "UploadSpatial";
    this.version = 1.0;
    this.author = "";
    this.pcfg = getPluginConfig(this.name);
    this.contentFile = "application/plugins/UploadSpatial/content.html";
    this.addPlugin(); // Initializes the plugin
  }

  /**
   * Function: readFileAsArrayBuffer
   * @param (string) file
   * @returns (object) array buffer
   * Read a file and return array buffer
   */
  async readFileAsArrayBuffer(file) {
    let buffer = await new Promise((resolve) => {
      let fileReader = new FileReader();
      fileReader.onload = (e) => resolve(fileReader.result);
      fileReader.readAsArrayBuffer(file);
    });
    return buffer;
  }

  /**
   * Function: showUploadMsg
   * @param (string) type
   * @returns () nothing
   * Function to show upload message
   */
  showUploadMsg(type) {
    dropZone.html(this.pcfg[type].dropMessage);
  }

  /**
   * Function: showUploadErr
   * @param (string) type
   * @returns () nothing
   * Function to show upload error
   */
  showUploadErr(type) {
    dropZone.html(this.pcfg[type].processingMessage);
  }

  /**
   * Function: showUploadProcessing
   * @param (string) type
   * @returns () nothing
   * Function to show upload processing
   */
  showUploadProcessing(type) {
    dropZone.html(this.pcfg[type].errorMessage);
  }

  /**
   * Function: convertKML
   * @param {*} kml Keyhole Markup Language file
   * @returns {object} GeoJSON
   */
  convertKML(kml) {
    const dom = new DOMParser().parseFromString(kml, "text/xml");
    return toGeoJSON.kml(dom);
  }

  /**
   * Function: convertKMZ
   * @param {*} kmz Compressed/Zipped Keyhole Markup Language file
   * @returns {object} GeoJSON
   */
  async convertKMZ(kmz) {
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(kmz);

    // We only care about the first file in the zip.
    const keys = Object.keys(unzipped.files);
    const file = unzipped.files[keys[0]];
    const kml = await file.async("string");

    return this.convertKML(kml);
  }

  /**
   * Function: convertSHP
   * @param {*} zip Compressed/Zipped Esri Shapefile
   * @returns {object} GeoJSON
   */
  async convertSHP(zip) {
    let buffer = await app.plugins.UploadSpatial.readFileAsArrayBuffer(zip);
    const geojson = await shp(buffer);
    return geojson;
  }

  /**
   * Function: registerUploadSpatial
   * @param () none
   * @returns () nothing
   * Register the upload spatial drop zone and associated features
   */
  registerUploadSpatial() {
    // Move the drop zone element fron the plugin side panel (invisible) to the map.
    const dropZone = $("#map #drop-zone");
    $("#map").append(dropZone);

    // When dragging a file within the map window/drop zone.
    $("#map")
      .on("dragenter", (event) => {
        const item = event.originalEvent.dataTransfer.items[0] || null;

        // If unsupported show a 'incompatible' message.
        if ((item && item.kind !== "file") || !this.pcfg[item.type]) {
          dropZone.html(this.pcfg.unsupportedTypeMessage);
          logger(
            "ERROR",
            "UploadSpatial: Unrecognized mime type: " + item.type
          );

          // Otherwise show hint text
        } else {
          dropZone.html(this.pcfg[item.type].dropMessage);
        }

        // Show drop zone
        $("#drop-zone").css("visibility", "initial");

        // Hide the drop zone
      })
      .on("dragleave", () => {
        $("#drop-zone").css("visibility", "hidden");

        // Necessary to stop opening of file
      })
      .on("dragover", (event) => {
        event.preventDefault();

        // The file has been dropped
      })
      .on("drop", (event) => {
        // Prevent default and get the file
        event.preventDefault();
        const item = event.originalEvent.dataTransfer.items[0] || null;

        // Bail if not supported file type
        if (!this.pcfg[item.type]) {
          $("#drop-zone").css("visibility", "hidden");
          return;
        }

        // Display the 'processing' message
        dropZone.html(this.pcfg[item.type].processingMessage);

        // No reaction if unsupported file type
        if ((item && item.kind !== "file") || !this.pcfg[item.type]) {
          $("#drop-zone").css("visibility", "hidden"); // Hide the drop zone
          logger(
            "ERROR",
            "UploadSpatial: Ignoring unsupported file type: " + item.type
          );
          return;
        }

        // Read the file
        const reader = new FileReader();
        const file = event.originalEvent.dataTransfer.files[0];
        if (item.type === "application/zip") {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }

        // Save the file type to be accessed in the file reader scope
        app.plugins.UploadSpatial.uploadThis = item.type;
        app.plugins.UploadSpatial.uploadFile = file;

        // Listen for when the file get's read
        reader.onload = async (e) => {
          let geojson;
          let kml;
          // Currently four formats supported
          switch (app.plugins.UploadSpatial.uploadThis) {
            case "application/vnd.google-earth.kml+xml":
              kml = e.target.result;
              break;
            case "application/vnd.google-earth.kmz":
              kml = await app.plugins.UploadSpatial.convertKMZ(
                app.plugins.UploadSpatial.uploadFile
              );
              break;
            case "application/x-zip-compressed":
              geojson = await app.plugins.UploadSpatial.convertSHP(
                app.plugins.UploadSpatial.uploadFile
              );
              break;
            case "application/json":
              geojson = JSON.parse(e.target.result);
              break;
          }

          // Create layer source from geojson
          let vectorSource;
          if (geojson) {
            vectorSource = new ol.source.Vector({
              features: new ol.format.GeoJSON({
                defaultDataProjection: "EPSG:4326",
                featureProjection: app.map.getView().getProjection().getCode(),
              }).readFeatures(geojson),
            });
          } else if (kml) {
            vectorSource = new ol.source.Vector({
              features: new ol.format.KML({
                extractStyles: true,
              }).readFeatures(kml, {
                dataProjection: "EPSG:4326",
                featureProjection: app.map.getView().getProjection().getCode(),
              }),
            });
          } else {
	          logger("WARN", app.plugins.UploadSptial.name + ": No geojson or kml found");
          }

          // Layer definition. This is where you adjust the style
          const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            title: app.plugins.UploadSpatial.uploadFile.name,
            type: "overlay",
            preventRefresh: true,
            featureStyle: $.extend(true, {}, app.defaultStyle),
          });
          vectorLayer.setStyle((feature) =>
            this.getStyles(feature, vectorLayer)
          );

          // Fly to extent of new data
          app.map.getView().fit(vectorSource.getExtent(), { duration: 700 });

          // For stats
          registerOverlayWithTWM(vectorLayer);

          // kludge to stop working spinner in layer controller plugin
			vectorLayer.dropped = true;
			
          // Add layer
          app.map.addLayer(vectorLayer);
          vectorLayer.setZIndex(nextAvailableOverlayLayerZIndex());

          // Add to the layer controller
          app.plugins.LayerController.addOverlayLayerControl(vectorLayer, true);
        };

        // Removing the drop zone element
        $("#drop-zone").css("visibility", "hidden");
      });
  }

  /**
   * Function: getStyles
   * Return layer style object for a feature.
   * @param (object) Openlayers feature object.
   * @param (object) Openlayers layer object.
   * @returns (object) Openlayers styling object.
   */
  getStyles(feature, layer) {
    const style = layer.get("featureStyle");
    return style[feature.getGeometry().getType()];
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
          app.plugins.UploadSpatial.name + ": Plugin failed to initialize"
        );
        return;
      }

      // Append content to map
      $("#map").append(content);

      // Register the plugin
      app.plugins.UploadSpatial.registerUploadSpatial();

      // Log success
      logger(
        "INFO",
        app.plugins.UploadSpatial.name + ": Plugin successfully loaded"
      );
    };

    // Load content file
    loadTemplate(this.contentFile, callback);
  }
}
