class SelectTool {
  /**
   * Function: constructor
   * @param () none
   * @returns () nothing
   * Function that initializes the class
   */
  constructor() {
    this.name = "SelectTool";
    this.version = 1.0;
    this.author = "MoTI Spatial Team";
    this.pcfg = getPluginConfig(this.name);
    this.tabName = this.pcfg.tabName ? this.pcfg.tabName : "SelectTool";
    this.tabContentFile = "application/plugins/SelectTool/tab-content.html";
    this.layerDownloaderContentFile =
      "application/plugins/LayerController/downloader.html";
    this.tabNav; // jQuery element
    this.tabContent; // jQuery element
    this.featureStore = []; //The store that contains the selected features on the map
    this.searchFeature = []; // feature data being used for search function
    this.drawnFeature;

    //Search Radius Feature
    this.searchRadiusFeature = new ol.Feature();
    this.searchRadiusLayer = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: "rgba(255, 255, 0, 0.5)",
          width: 8,
        }),
        fill: new ol.style.Fill({
          color: "rgba(255, 255, 0, 0.2)",
        }),
      }),
    });
    this.searchRadiusLayer.setZIndex(604);
    app.map.addLayer(this.searchRadiusLayer);

    // Define and add the Point
    this.drawPoint = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: [
        new ol.style.Style({
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
      ],
    });
    this.drawPoint.setZIndex(605);
    app.map.addLayer(this.drawPoint);

    // Define and add the Polygon
    this.drawLine = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "rgba(0, 160, 255)",
            lineDash: [10, 10], //or other combinations
            width: 4,
            lineDashOffset: 6,
          }),
        }),
      ],
    });
    this.drawLine.setZIndex(604);
    app.map.addLayer(this.drawLine);

    // Define and add the Polygon
    this.drawPolygon = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "rgba(0, 160, 255)",
            lineDash: [10, 10], //or other combinations
            width: 4,
            lineDashOffset: 6,
          }),
        }),
      ],
    });
    this.drawPolygon.setZIndex(603);
    app.map.addLayer(this.drawPolygon);

    // Define and add the route path layer
    this.routePathLayer = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "rgba(0, 160, 255)",
            lineDash: [10, 10], //or other combinations
            width: 4,
            lineDashOffset: 6,
          }),
        }),
      ],
    });
    this.routePathLayer.setZIndex(605);
    app.map.addLayer(this.routePathLayer);

    // Add the plugin
    this.addPlugin();
  }

  /**
   * Function: downloadAsGeoJSON
   * @param (array) features
   * @returns () nothing
   * Function takes a list of features and downloads as geojson
   */
  downloadAsGeoJSON(features, formattedLayerName) {
    const format = new ol.format.GeoJSON();
    const geojsonStr = format.writeFeatures(features);
    app.plugins.SelectTool.triggerDownload(
      "data:text/json;charset=utf-8," + encodeURIComponent(geojsonStr),
      formattedLayerName + ".geojson"
    );
  }

  /**
   * Function: downloadAsCSV
   * @param (array) features
   * @returns () nothing
   * Function takes a list of features and downloads as csv
   */
  downloadAsCSV(features, formattedLayerName) {
    if (features.length === 0) return;

    // Collect all unique keys from either .properties or direct properties
    const allKeys = new Set();
    features.forEach((f) => {
      const props = f.getProperties();
      const data = props.properties || props; // support both structures
      Object.keys(data).forEach((k) => {
        if (k !== "geometry") allKeys.add(k);
      });
    });

    const keys = Array.from(allKeys);
    const csvRows = [keys.join(",")];

    features.forEach((f) => {
      const props = f.getProperties();
      const data = props.properties || props; // support both structures

      const row = keys
        .map((k) => {
          let value = data[k];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") {
            try {
              value = JSON.stringify(value);
            } catch (e) {
              value = "[Unserializable]";
            }
          } else {
            value = String(value);
          }

          // Escape double quotes, commas, and line breaks
          if (/[",\n]/.test(value)) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
      csvRows.push(row);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", formattedLayerName + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  /**
   * Function: downloadAsCSV
   * @param (array) features
   * @returns () nothing
   * Function takes a list of features and downloads as csv with shpwrite
   */
  downloadAsShapefile(features, formattedLayerName) {
    const format = new ol.format.GeoJSON();
    const geojson = format.writeFeaturesObject(features);
    const wgs84Prj = `GEOGCS["WGS 84",
			DATUM["WGS_1984",
				SPHEROID["WGS 84",6378137,298.257223563,
					AUTHORITY["EPSG","7030"]],
				AUTHORITY["EPSG","6326"]],
			PRIMEM["Greenwich",0,
				AUTHORITY["EPSG","8901"]],
			UNIT["degree",0.0174532925199433,
				AUTHORITY["EPSG","9122"]],
			AUTHORITY["EPSG","4326"]]`;

    geojson.features = geojson.features.map((f) => {
      // Handle both nested and flat structures
      const rawProps = f.properties?.properties ?? f.properties ?? {};
      const cleanProps = {};
      for (const [key, value] of Object.entries(rawProps)) {
        let val = value;
        if (val === null || val === undefined) val = "";
        else if (typeof val === "object") val = JSON.stringify(val);
        const shortKey = key.length > 10 ? key.slice(0, 10) : key;
        cleanProps[shortKey] = val;
      }

      return {
        type: "Feature",
        geometry: f.geometry,
        properties: cleanProps,
      };
    });

    const options = {
      folder: formattedLayerName,
      filename: formattedLayerName,
      outputType: "blob",
      //compression: "DEFLATE",
      types: {
        point: "points",
        polygon: "polygons",
        polyline: "lines",
      },
      prj: wgs84Prj,
    };
    //Save zip with shpwrite and pas to triggerDownloader function
    shpwrite
      .zip(geojson, options)
      .then((zipData) => {
        const blobUrl = URL.createObjectURL(zipData);
        app.plugins.SelectTool.triggerDownload(
          blobUrl,
          formattedLayerName + ".zip"
        );
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      })
      .catch((error) => {
        console.error("Error generating shapefile zip:", error);
      });
  }

  /**
   * Function: triggerDownload
   * @param () uri
   * @returns () filename
   * Function that allows you to download a file from a given uri (Uniform Resource Identifier) and save it with a specified filename
   */
  triggerDownload(uri, filename) {
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Function: showFeaturePopup
   * @param (integer) featureStoreId
   * @returns () nothing
   * Function that populates and shows a feature popup (using the Identify2Popup pluging if configured)
   */
  showFeaturePopup(layer, feature) {
    let olFeature;
    let originalFeature = feature; // We'll pass this to the popup functions

    // If it's already an OpenLayers feature
    if (feature instanceof ol.Feature) {
      olFeature = feature;

      // Convert OpenLayers feature to GeoJSON-like object
      let f = {};
      f.type = "Feature";
      f.id = feature.getId();
      f.geometry_name = feature.getGeometryName();
      f.geometry = {
        type: feature.getGeometry().getType(),
      };

      // Handle multi-geometry cases
      if (typeof feature.getGeometry().getGeometries === "function") {
        f.geometry.coordinates = feature
          .getGeometry()
          .getGeometries()[0]
          .getCoordinates();
      } else {
        f.geometry.coordinates = feature.getGeometry().getCoordinates();
      }

      // Remove geometry from properties to avoid duplication
      f.properties = feature.getProperties();
      delete f.properties[f.geometry_name];

      originalFeature = f;
    } else {
      // Convert to OpenLayers Feature if necessary
      olFeature = convertToOpenLayersFeature("GeoJSON", feature);
    }

    // Use the geometry to find the center
    const extent = olFeature.getGeometry().getExtent();
    const centre = ol.extent.getCenter(extent);

    // Try to show the Identify2Popup
    if (app.plugins.Identify2Popup) {
      app.plugins.Identify2Popup.clickEventCoordinate = centre;
      app.plugins.Identify2Popup.clear();
      app.plugins.Identify2Popup.resultsAggregator(layer, [originalFeature]);
      app.plugins.Identify2Popup.showResult();

      // Or use Identify2Tab as a fallback
    } else if (app.plugins.Identify2Tab) {
      app.plugins.Identify2Tab.clear();
      app.plugins.Identify2Tab.resultsAggregator(layer, [originalFeature]);
      app.plugins.Identify2Tab.showResult();
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
      maxResults: app.plugins.SelectTool.pcfg.geoCoderMaxResults,
      echo: "false",
      brief: true,
      autoComplete: true,
      outputSRS: outputSRS,
      addressString: request.term,
      apikey: app.plugins.SelectTool.pcfg.geoCoderApiKey,
    };
    $.extend(params, options);

    // Query the DataBC GeoCoder
    $.ajax({
      url: "https://geocoder.api.gov.bc.ca/addresses.json",
      data: params,
      timeout: 7500,
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
    if (app.plugins.SelectTool.pcfg.geoCoderEnabled) {
      providersToSearchCount++;
      app.plugins.SelectTool.searchBcGeoCoder(
        request,
        overallResultsAggregator,
        options
      );
    }

    // Search visible (and configured) layers if configured
    if (app.plugins.SelectTool.pcfg.visibleLayerSearchEnabled) {
      providersToSearchCount++;
      app.plugins.SelectTool.searchLayers(
        request,
        overallResultsAggregator,
        options
      );
    }
  }

  /**
   * Function: registerSearchSelectionLocation
   * @param (object) target
   * @param (object) selection
   * @returns () nothing
   * Function that registers the user's search selection
   */
  registerSearchSelectionLocation(target, selection) {
    //Clear contents of layer
    app.plugins.SelectTool.drawPoint.getSource().clear();

    // Transform the selection into a feature and get it's centre in Lon/Lat
    var olFeature = convertToOpenLayersFeature("GeoJSON", selection.data);
    var olFeature4326 = transformFeature(olFeature, "EPSG:3857", "EPSG:4326"); // Assume feature was delivered in 3857
    var centreLL = getFeatureCentre(olFeature4326);
    app.plugins.SelectTool.drawPoint.getSource().addFeature(olFeature);

    //Add selected feature to
    // Set the input's lon/lat attributes based on user selection
    target.attr("longitude", centreLL[0]);
    target.attr("latitude", centreLL[1]);

    // Register the search radius
    app.plugins.SelectTool.registerSearchRadius();
  }

  /**
   * Function: clearContent
   * @param () none
   * @returns () nothing
   * Function that clears the content from the select containers and resets plugin
   */
  clearContent() {
    //Turn off results title
    $("#st-results-title").hide();

    //Disable by Feaute tab
    $("#st-byFeature-tab").prop("disabled", true);

    //Clear inputs on all tabs
    $(".st-location-input").val("");
    $("#st-search-distance-input").val(0);
    $("#st-lineString-search-distance-input").val(0);
    $("#st-router-search-distance-input").val(0);

    //disable the find features buttons
    $(
      "#st-polygon-overlay-search-btn,#st-overlay-search-btn,#st-lineString-overlay-search-btn,#st-lineString-overlay-search-btn,#st-router-search-distance-input,#st-byFeature-search-btn"
    ).prop("disabled", true);

    //Clear Drawn Features
    app.plugins.SelectTool.clearDrawFeatures();
    app.plugins.SelectTool.routePathLayer.getSource().clear();

    //Clear results
    $("#st-resultAccordian").empty();
  }

  /**
   * Function: Get Map Layers
   * @param () none
   * @returns () nothing
   * Function that lists all map layers displayed on the map
   */
  findFeatures() {
    var spinner = new Spinner(app.spinnerOptionsMedium).spin(
      $(app.plugins.SelectTool.tabContent)[0]
    );

    // Defer heavy processing so the spinner can start rendering
    setTimeout(function () {
      // Clear featureStore
      app.plugins.SelectTool.featureStore = [];

      // Show Results
      $("#st-results-title").show();

      let pendingAjaxCalls = 0;
      function tryStopSpinner() {
        if (pendingAjaxCalls === 0) {
          spinner.stop();
        }
      }

      var drawFeature;
      var type;

      //Get drawn features that have been defined
      if (
        app.plugins.SelectTool.drawPoint.getSource().getFeatures().length > 0
      ) {
        type = "Point";
        drawFeature = app.plugins.SelectTool.drawPoint
          .getSource()
          .getFeatures()[0];
      }
      if (
        app.plugins.SelectTool.drawLine.getSource().getFeatures().length > 0
      ) {
        type = "LineString";
        drawFeature = app.plugins.SelectTool.drawLine
          .getSource()
          .getFeatures()[0];
      }
      if (
        app.plugins.SelectTool.drawPolygon.getSource().getFeatures().length > 0
      ) {
        type = "Polygon";
        drawFeature = app.plugins.SelectTool.drawPolygon
          .getSource()
          .getFeatures()[0];
      }

      //If no drawn features are present, look to routing tool for the path layer
      if (!drawFeature) {
        if (
          app.plugins.SelectTool.routePathLayer.getSource().getFeatures()
            .length > 1
        ) {
          type = "MultiLineString";
          const lines = app.plugins.SelectTool.routePathLayer
            .getSource()
            .getFeatures()
            .map((f) => {
              const geom = f
                .getGeometry()
                .clone()
                .transform(
                  app.map.getView().getProjection().getCode(),
                  "EPSG:4326"
                );
              return geom.getCoordinates();
            });
          const multiLineGeom = new ol.geom.MultiLineString(lines);
          multiLineGeom.transform(
            "EPSG:4326",
            app.map.getView().getProjection().getCode()
          );
          drawFeature = new ol.Feature({ geometry: multiLineGeom });
        } else {
          type = "LineString";
          drawFeature = app.plugins.SelectTool.routePathLayer
            .getSource()
            .getFeatures()[0];
        }
      }

      var olBufferFeature;
      //IF search buffer is present use to intersect
      if (
        app.plugins.SelectTool.searchRadiusLayer.getSource().getFeatures()
          .length > 0
      ) {
        const searchRadiusFeatures = app.plugins.SelectTool.searchRadiusLayer
          .getSource()
          .getFeatures();

        if (searchRadiusFeatures.length > 1) {
          const turfPolygons = searchRadiusFeatures.map((feature) =>
            convertOpenLayersFeatureToTurfFeature(
              feature,
              app.map.getView().getProjection().getCode()
            )
          );
          let dissolved = turfPolygons[0];
          for (let i = 1; i < turfPolygons.length; i++) {
            dissolved = turf.union(dissolved, turfPolygons[i]);
          }
          const olFeature = convertToOpenLayersFeature("GeoJSON", dissolved);
          const olFeatureReprojected = transformFeature(
            olFeature,
            "EPSG:4326",
            app.map.getView().getProjection().getCode()
          );
          olBufferFeature = olFeatureReprojected;
        } else {
          olBufferFeature = searchRadiusFeatures[0];
        }
      }
      //Convert to turf js feature for intersect analysis
      var turfSearchFeature = convertOpenLayersFeatureToTurfFeature(
        drawFeature,
        app.map.getView().getProjection().getCode()
      );
      delete turfSearchFeature.properties.geometry;

      var layerCount = 0;
      $.each(app.map.getLayers().getArray(), function (index, layer) {
        if (layer.get("type") !== "overlay" || layer.get("visible") !== true)
          return;
        layerCount++;
        var featureCounter = 0;
        var layerID = layer.ol_uid;
        var resultAccordian = $("#st-resultAccordian");
        var layerName = layer.get("title");

        //Build the accordian for each layer with total count of features
        var layerAccordian = $(`
				<div class="accordion-item accordion-item-sm" style="padding: 2px;">
					<h2 class="accordion-header">
						<button class="accordion-button accordion-button-sm collapsed d-flex justify-content-between align-items-center py-1 px-2" type="button" data-bs-toggle="collapse" data-bs-target="#${"layer-accord" + layerID
          }" aria-expanded="false" aria-controls="${"layer-accord" + layerID
          }">
							<span class="flex-grow-1 text-start" style="font-size:0.95em;">
								${layerName} <sup><span class="badge bg-danger" style="margin-left:2px;">${featureCounter}</span></sup>
							</span>
							<button type="button" disabled class="btn btn-sm btn-outline-secondary ms-2 download-layer-btn" id="st-layer-downloader" data-layer-id="${layerID}" title="Download Layer">
								<span class="oi oi-data-transfer-download"></span>
							</button>
						</button>
					</h2>
					<div id="${"layer-accord" + layerID
          }" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
						<div class="accordion-body st-accordian-body py-2 px-2" id="${"layer-accord-body" + layerID
          }" style="font-size:0.95em;"></div>
					</div>
				</div>`).appendTo(resultAccordian);

        // Attach download button click event within the loop
        layerAccordian.find(".download-layer-btn").on("click", function (e) {
          e.stopPropagation(); // Prevent accordion toggle
          $.each(app.plugins.SelectTool.featureStore, function (index, data) {
            if (data.Layer == layerName) {
              var features = [];
              $.each(data.Features, function (index, feature) {
                var transformedFeature = transformFeature(
                  feature,
                  "EPSG:3857",
                  "EPSG:4326"
                );
                features.push(transformedFeature);
              });

              //var format = 'geojson'

              //app.plugins.SelectTool.downloadSelectedFeatures(format,features);
              // Load the form
              $.ajax({
                type: "GET",
                url: app.plugins.SelectTool.layerDownloaderContentFile,
              }).done(function (response) {
                // Get the form from the response
                var lForm = $(response);

                // Populate the export layer input (readonly)
                lForm.find("#lc-output-layer").val(layerName);

                var exportOutputProjections = [
                  {
                    name: " WGS 84",
                    value: "EPSG:4326",
                  },
                ];
                var exportOutputFormats = [
                  {
                    name: "Comma Delimited Text File",
                  },
                  {
                    name: "GeoJSON",
                  },
                  {
                    name: "Compressed Shapefile",
                  },
                ];

                // Populate the export output formats select box
                $.each(
                  exportOutputFormats,
                  function (exportOutputFormatId, exportOutputFormat) {
                    lForm
                      .find("#lc-output-format")
                      .append(
                        "<option value='" +
                        exportOutputFormatId +
                        "'>" +
                        exportOutputFormat.name +
                        "</option>"
                      );
                  }
                );

                // Populate the export output projections select box
                $.each(
                  exportOutputProjections,
                  function (index, exportOutputProjection) {
                    lForm
                      .find("#lc-output-projection")
                      .append(
                        "<option value='" +
                        exportOutputProjection.value +
                        "'>" +
                        exportOutputProjection.name +
                        "</option>"
                      );
                  }
                );

                // Register the output format change listener
                lForm.find("#lc-output-format").on("change", function (e) {
                  lForm.find("#lc-output-projection").prop("disabled", true);
                  var outputFormatId = $(this).val();
                  var outputFormat = exportOutputFormats[outputFormatId];
                  if (outputFormat.requiredSrs) {
                    lForm
                      .find("#lc-output-projection")
                      .val(outputFormat.requiredSrs);
                    lForm.find("#lc-output-projection").prop("disabled", true);
                  }
                });
                lForm.find("#lc-output-format").change();

                // Define and option the downloader dialog
                bootbox.dialog({
                  title: "Download Layer",
                  message: lForm,
                  centerVertical: true,
                  buttons: {
                    download: {
                      label: "Download",
                      className: "btn-primary",
                      callback: function (result) {
                        // Get the selected output format
                        var outputFormatId = $("#lc-output-format").val();
                        var formattedLayerName = layerName.replace(
                          /[^a-zA-Z0-9]/g,
                          ""
                        );
                        var outputFormat = exportOutputFormats[outputFormatId];
                        switch (outputFormat.name) {
                          case "GeoJSON":
                            app.plugins.SelectTool.downloadAsGeoJSON(
                              features,
                              formattedLayerName
                            );
                            break;
                          case "Comma Delimited Text File":
                            app.plugins.SelectTool.downloadAsCSV(
                              features,
                              formattedLayerName
                            );
                            break;
                          case "kml":
                            app.plugins.SelectTool.downloadAsKML(
                              features,
                              formattedLayerName
                            );
                            break;
                          case "Compressed Shapefile":
                            app.plugins.SelectTool.downloadAsShapefile(
                              features,
                              formattedLayerName
                            );
                            break;
                        }
                      },
                    },
                  },
                });
              });
            }
          });
        });

        layerAccordian.find(".accordion-button").on("click", function () {
          const matchedFeatures = app.plugins.SelectTool.featureStore
            .filter((layerObj) => layerObj.Layer === layerName)
            .flatMap((layerObj) => layerObj.Features);

          const isCollapsed = $(this).hasClass("collapsed");
          if (app.plugins.AttributeTableViewer) {
            app.plugins.AttributeTableViewer.highlightFeaturesById(
              layerName,
              matchedFeatures,
              !isCollapsed
            );
          }
        });

        if (layer instanceof ol.layer.Vector) {
          if (
            app.plugins.SelectTool.searchRadiusLayer.getSource().getFeatures()
              .length > 0
          ) {
            var olSearchRadiusFeature = olBufferFeature;
            type = "Polygon";
            turfSearchFeature = convertOpenLayersFeatureToTurfFeature(
              olSearchRadiusFeature,
              app.map.getView().getProjection().getCode()
            );
          }

          let features = layer.getSource().getFeatures();
          var intersectedFeatures = [];
          features.forEach((layerFeature) => {
            const olFeatures = layerFeature.get("features") || [layerFeature];
            olFeatures.forEach((olFeature) => {
              if (olFeature.get("geometry") || olFeature.get("GEOMETRY")) {
                const turfFeature = convertOpenLayersFeatureToTurfFeature(
                  olFeature,
                  app.map.getView().getProjection().getCode()
                );
                if (!turfFeature || !turfFeature.geometry) return;
                delete turfFeature.properties.geometry;
                let intersects = false;
                const turfFeatureType = turfFeature.geometry.type;

                const turfSearchType = turfSearchFeature.geometry?.type;
                if (
                  turfFeatureType === "Point" &&
                  (turfSearchType === "Polygon" ||
                    turfSearchType === "MultiPolygon")
                ) {
                  intersects = turf.booleanPointInPolygon(
                    turfFeature,
                    turfSearchFeature
                  );
                } else {
                  try {
                    intersects = turf.booleanIntersects(
                      turfFeature,
                      turfSearchFeature
                    );
                  } catch (e) {
                    console.warn(
                      "Intersection error:",
                      e,
                      turfFeature,
                      turfSearchFeature
                    );
                  }
                }
                if (intersects) {
                  var titleParts = [];
                  // Loop through fields and collect values
                  $.each(layer.get("fields"), function(index, configField) {
                      if (configField.title) {
                          var fieldValue = olFeature.get(configField.name); // safer than olFeature.values_
                          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
                              titleParts.push(fieldValue);
                          }
                      }
                  });
                  var title = titleParts.join(" - ");
                  featureCounter++;
                  intersectedFeatures.push(olFeature);
                  
                  if(title){
                    var button = $(`<button type="button" class="btn btn-light" id="st-feature-button">${title}</button>`).appendTo("#layer-accord-body" + layerID);
                  }else{
                    var button = $(`<button type="button" class="btn btn-light" id="st-feature-button">${layerName + "[" + featureCounter + "]"}</button>`).appendTo("#layer-accord-body" + layerID);
                  }

                  //const button = $(`<button type="button" class="btn btn-light" id="st-feature-button">${layerName + "[" + featureCounter + "]"}</button>`).appendTo("#layer-accord-body" + layerID);
                 
                  button.hover(
                    () => highlightFeature(olFeature),
                    () => clearHighlightedFeatures()
                  );
                  button.click(() =>
                    app.plugins.SelectTool.showFeaturePopup(layer, olFeature)
                  );
                }
              }
            });
          });

          app.plugins.SelectTool.featureStore.push({
            Layer: layerName,
            Features: intersectedFeatures,
          });
        } else {
          if (
            app.plugins.SelectTool.searchRadiusLayer.getSource().getFeatures()
              .length > 0
          ) {
            drawFeature = olBufferFeature;
          }

          let searchUrl;
          if (layer.getSource() instanceof ol.source.TileWMS) {
            searchUrl = layer.getSource().getUrls()[0];
          } else if (layer.getSource() instanceof ol.source.ImageWMS) {
            searchUrl = layer.getSource().getUrl();
          } else {
            logger(
              "WARN",
              "Could not determine search url for layer " + layer.get("title")
            );
            return;
          }
          searchUrl = searchUrl.replace(/\/ows/gi, "/wfs");

          var searchLayerName, existingCqlFilter;
          $.each(
            layer.getSource().getParams(),
            function (parameterName, parameterValue) {
              if (parameterName.toUpperCase() === "LAYERS")
                searchLayerName = parameterValue;
              if (parameterName.toUpperCase() === "CQL_FILTER")
                existingCqlFilter = parameterValue;
            }
          );

          var geometryField;
          $.each(layer.get("attributes"), function (index, attribute) {
            if (attribute.type.startsWith("gml:")) {
              geometryField = attribute.name;
            }
          });

          var layerSRS =
            layer.get("nativeProjection") ||
            layer.getSource().getParams().srsName;
          var searchPolygonInLayerNativeProj = transformFeature(
            drawFeature,
            app.map.getView().getProjection().getCode(),
            layerSRS
          );
          var wktFormat = new ol.format.WKT();
          var searchPolygonWKT = wktFormat.writeGeometry(
            searchPolygonInLayerNativeProj.getGeometry()
          );

          if (layer.get("preventIdentify")) return;

          if (
            layer.get("visible") === true &&
            layer.get("title") &&
            typeof layer.getSource().getFeatureInfoUrl === "function"
          ) {
            var cqlFilter = `INTERSECTS(${geometryField}, ${searchPolygonWKT})`;

            let options = {
              service: "WFS",
              version: "2.0.0",
              request: "GetFeature",
              typeNames: searchLayerName,
              outputFormat: "application/json",
              count: 500,
              srsName: app.map.getView().getProjection().getCode(),
              cql_filter: cqlFilter,
            };

            pendingAjaxCalls++;

            $.ajax({
              type: "POST",
              url: searchUrl,
              dataType: "json",
              contentType: "application/x-www-form-urlencoded",
              data: $.param(options),
              xhrFields: {
                withCredentials: layer.get("withCredentials") || false,
              },
            })
              .done(function (response) {
                var olFeatures = [];
                var featureCount = 0;
                response.features.forEach((feature) => {
                  var olFeature = convertToOpenLayersFeature(
                    "GeoJSON",
                    feature
                  );
                  var titleParts = [];
                  // Loop through fields and collect values
                  $.each(layer.get("fields"), function(index, configField) {
                      if (configField.title) {
                          var fieldValue = feature.properties[configField.name];
                          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
                              titleParts.push(fieldValue);
                          }
                      }
                  });
                  var title = titleParts.join(" - ");
                  if(title){
                    var button = $(`<button type="button" class="btn btn-light" id="st-feature-button">${title}</button>`).appendTo("#layer-accord-body" + layerID);
                  }else{
                    var button = $(`<button type="button" class="btn btn-light" id="st-feature-button">${layerName + "[" + featureCount + "]"}</button>`).appendTo("#layer-accord-body" + layerID);
                  }
                  featureCount++;
                  
                  button.hover(
                    () => highlightFeature(olFeature),
                    () => clearHighlightedFeatures()
                  );
                  button.click(() =>
                    app.plugins.SelectTool.showFeaturePopup(layer, feature)
                  );
                  olFeatures.push(olFeature);
                });
                featureCounter = featureCount;

                $(
                  `button[data-bs-target="#layer-accord${layerID}"] .badge`
                ).text(featureCounter);
                app.plugins.SelectTool.featureStore.push({
                  Layer: layerName,
                  Features: olFeatures,
                });
                //Enable buttons and accordians when feature count is greater than 0
                if (featureCounter > 0) {
                  $(`#st-layer-downloader[data-layer-id="${layerID}"]`).attr(
                    "disabled",
                    false
                  ); // Enable download button
                }

                pendingAjaxCalls--;
                tryStopSpinner();
              })
              .fail(function (jqxhr, settings, exception) {
                logger(
                  "ERROR",
                  app.plugins.SelectTool.name +
                  ": Error querying " +
                  layer.get("title")
                );
                pendingAjaxCalls--;
                tryStopSpinner();
              });
          }
        }
        $(`button[data-bs-target="#layer-accord${layerID}"] .badge`).text(
          featureCounter
        );
        //Enable buttons and accordians when feature count is greater than 0
        if (featureCounter > 0) {
          $(`#st-layer-downloader[data-layer-id="${layerID}"]`).attr(
            "disabled",
            false
          ); // Enable download button
        }
      });
      //Add wording to Search Results if no layers are found
      if (layerCount == 0) {
        $(
          '<h7 class="" id="st-results-title" style="padding-left: 10px;">No Layers Found</h7>'
        ).appendTo($("#st-resultAccordian"));
      }

      $(".select-tabs").scrollingTabs("refresh", { forceActiveTab: true });
      tryStopSpinner(); // In case no async calls were triggered
    }, 0); // <-- let the spinner render
  }

  /**
   * Function: createFeature
   * @param () none
   * @returns () nothing
   * Function that creates a new draw feature (point,line,polygon) based on button clicked
   */
  createFeature(type) {
    // Clear Draw Features and search features
    app.plugins.SelectTool.clearDrawFeatures();
    $("#st-resultAccordian").empty();

    // Remove any existing draw interaction
    if (app.plugins.SelectTool.currentDrawInteraction) {
      app.map.removeInteraction(app.plugins.SelectTool.currentDrawInteraction);
      app.plugins.SelectTool.currentDrawInteraction = null;
    }

    // Disable map click handler during drawing
    redirectMapSingleClickFunction("crosshair", function () { }); // Disable clicks with neutral cursor

    // Remove select/modify interactions if present
    if (app.plugins.SelectTool.selectInteraction) {
      app.map.removeInteraction(app.plugins.SelectTool.selectInteraction);
    }

    if (app.plugins.SelectTool.modifyInteraction) {
      app.map.removeInteraction(app.plugins.SelectTool.modifyInteraction);
    }

    // Select appropriate source
    let targetSource;
    if (type === "Point") {
      targetSource = app.plugins.SelectTool.drawPoint.getSource();
    } else if (type === "LineString") {
      targetSource = app.plugins.SelectTool.drawLine.getSource();
    } else if (type === "Polygon") {
      targetSource = app.plugins.SelectTool.drawPolygon.getSource();
    } else {
      console.warn("Unsupported feature type:", type);
      return;
    }

    targetSource.clear(); // Clear existing features from source

    // Create draw interaction
    const draw = new ol.interaction.Draw({
      source: targetSource,
      type: type,
    });

    app.map.addInteraction(draw);
    app.plugins.SelectTool.currentDrawInteraction = draw;

    draw.on("drawend", function (event) {
      $("#st-resultAccordian").empty();
      const feature = event.feature;
      const geometry = feature.getGeometry();
      const coordinates = geometry.getCoordinates();

      if (type === "LineString") {
        app.plugins.SelectTool.buildLineElements(coordinates);
        $("#st-lineString-overlay-search-btn").prop("disabled", false);
      }
      if (type === "Polygon") {
        $("#st-polygon-overlay-search-btn").prop("disabled", false);
      }
      if (type === "Point") {
        var associatedInput = $(".st-location-input");
        app.plugins.SelectTool.registerMapClickLocation(associatedInput, event);
      }

      // Clean up after short delay
      setTimeout(() => {
        app.map.removeInteraction(draw);
        app.plugins.SelectTool.currentDrawInteraction = null;

        // Restore click handler
        resetDefaultMapSingleClickFunction();

        // Restore select/modify interactions if needed
        if (app.plugins.SelectTool.selectInteraction) {
          app.map.addInteraction(app.plugins.SelectTool.selectInteraction);
        }

        if (app.plugins.SelectTool.modifyInteraction) {
          app.map.addInteraction(app.plugins.SelectTool.modifyInteraction);
        }
      }, 100);
    });
  }

  /**
   * Function: registerMapClickLocation
   * @param (object) target
   * @returns () nothing
   * Function that gets and registers where the user clicked on the map
   */
  registerMapClickLocation(target, e) {
    // Define function that handles the get map click location
    var mapClickFunction = function (e) {
      // Get the click coordinate in EPSG:4326
      var centreLL = ol.proj.transform(
        e.coordinate,
        app.map.getView().getProjection(),
        "EPSG:4326"
      );

      // Reset the map's single click function to default
      resetDefaultMapSingleClickFunction();

      // Set the input's lon/lat attributes (and display value)
      target.val(formatCoordinateAsString(centreLL, 4326));
      target.attr("longitude", centreLL[0]);
      target.attr("latitude", centreLL[1]);
      // Show the search point
      app.plugins.SelectTool.registerSearchRadius();

      // If mobile, show sidebar
      if (isMobile()) showSidebar();
    };

    // Redirect the map's single click function to this mapClickFunction (temporary)
    redirectMapSingleClickFunction("crosshair", mapClickFunction);

    // If mobile, hide sidebar
    if (isMobile()) hideSidebar();
  }

  /**
   * Function: registerSearchRadius
   * @param () none
   * @returns () nothing
   * Function that registers the search radius
   */
  registerSearchRadius() {
    // Clear existing search radius
    app.plugins.SelectTool.searchRadiusLayer.getSource().clear();

    if (app.plugins.SelectTool.drawPoint.getSource().getFeatures().length > 0) {
      var sLongitude = $(".st-location-input").attr("longitude");
      var sLatitude = $(".st-location-input").attr("latitude");

      if (!sLongitude || !sLatitude) return;

      //Distance calculation based on unit toggle
      var unitSet = $("#st-point-unit-toggle").text();
      var sDistanceMetres;
      if (unitSet == "km") {
        sDistanceMetres = $("#st-search-distance-input").val() * 1000;
      } else {
        sDistanceMetres = $("#st-search-distance-input").val();
      }
      var radius =
        sDistanceMetres /
        ol.proj.getPointResolution(
          app.map.getView().getProjection(),
          1,
          ol.proj.transform(
            [sLongitude, sLatitude],
            "EPSG:4326",
            app.map.getView().getProjection()
          )
        );

      var searchCircle = new ol.geom.Circle(
        ol.proj.transform(
          [sLongitude, sLatitude],
          "EPSG:4326",
          app.map.getView().getProjection()
        ),
        radius
      );
      var searchPolygon = ol.geom.Polygon.fromCircle(searchCircle, 24);
      app.plugins.SelectTool.searchRadiusFeature = new ol.Feature(
        searchPolygon
      );

      if (radius > 0) {
        app.plugins.SelectTool.searchRadiusLayer
          .getSource()
          .addFeature(app.plugins.SelectTool.searchRadiusFeature);
      }
    }
    if (app.plugins.SelectTool.drawLine.getSource().getFeatures().length > 0) {
      var unitSet = $("#st-lineString-unit-toggle").text();
      var bufferDistance;
      if (unitSet == "km") {
        bufferDistance = $("#st-lineString-search-distance-input").val() * 1000;
      } else {
        bufferDistance = $("#st-lineString-search-distance-input").val();
      }
      var lineFeature = app.plugins.SelectTool.drawLine
        .getSource()
        .getFeatures()[0];
      var turfLine = convertOpenLayersFeatureToTurfFeature(
        lineFeature,
        app.map.getView().getProjection().getCode()
      );
      // Buffer distance in kilometers
      var buffered = turf.buffer(turfLine, bufferDistance, { units: "metres" });
      // Convert back to OL geometry
      var bufferedFeature = convertToOpenLayersFeature("GeoJSON", buffered);
      var selectionBufferFeature = transformFeature(
        bufferedFeature,
        "EPSG:4326",
        app.map.getView().getProjection().getCode()
      );

      app.plugins.SelectTool.searchRadiusLayer
        .getSource()
        .addFeature(selectionBufferFeature);
    }

    if (
      app.plugins.SelectTool.drawLine.getSource().getFeatures().length == 0 &&
      app.plugins.SelectTool.routePathLayer.getSource().getFeatures().length > 0
    ) {
      var bufferDistance = $("#st-router-search-distance-input").val() * 1000;

      if (
        app.plugins.SelectTool.routePathLayer.getSource().getFeatures().length >
        1
      ) {
      }
      app.plugins.SelectTool.routePathLayer
        .getSource()
        .getFeatures()
        .forEach((feature) => {
          var turfLine = convertOpenLayersFeatureToTurfFeature(
            feature,
            app.map.getView().getProjection().getCode()
          );
          // Buffer distance in kilometers
          var unitSet = $("#st-router-unit-toggle").text();
          var bufferDistance;
          if (unitSet == "km") {
            bufferDistance = $("#st-router-search-distance-input").val() * 1000;
          } else {
            bufferDistance = $("#st-router-search-distance-input").val();
          }
          var buffered = turf.buffer(turfLine, bufferDistance, {
            units: "metres",
          });
          // Convert back to OL geometry
          var bufferedFeature = convertToOpenLayersFeature("GeoJSON", buffered);
          var selectionBufferFeature = transformFeature(
            bufferedFeature,
            "EPSG:4326",
            app.map.getView().getProjection().getCode()
          );
          //Add routeID to buffer feature
          selectionBufferFeature.set("routeID", "st-route-" + feature.ol_uid);

          app.plugins.SelectTool.searchRadiusLayer
            .getSource()
            .addFeature(selectionBufferFeature);
        });
    }
    // Enable search button
    $("#st-overlay-search-btn").prop("disabled", false);
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
        target.val(
          formatCoordinateAsString(
            [position.coords.longitude, position.coords.latitude],
            4326
          )
        );
        target.attr("longitude", position.coords.longitude);
        target.attr("latitude", position.coords.latitude);

        //Draw point on map based on coordiante of location
        var lat = target.attr("longitude");
        var long = target.attr("latitude");
        var coordinates = [lat, long];
        var transformedCoordinates = ol.proj.fromLonLat(coordinates);
        var feature = new ol.Feature({
          geometry: new ol.geom.Point(transformedCoordinates),
        });
        app.plugins.SelectTool.drawPoint.getSource().addFeature(feature);

        // Register the search radius
        app.plugins.SelectTool.registerSearchRadius();
      };
      var geoLocationError = function (error) {
        // Display error/suggestion
        var errorNotice = bootbox.dialog({
          title: "Error",
          message:
            "<p class='text-center'>Cannot determine your current location.<br><br>Please turn on location services.<br></p>",
          closeButton: true,
          centerVertical: true,
        });
      };
      navigator.geolocation.getCurrentPosition(
        geoLocationSuccess,
        geoLocationError,
        options
      );
    }
  }
  buildLineElements() { }

  /**
   * Function: clear draw features
   * @param () none
   * @returns () nothing
   * Function that clears all draw features on the map
   */
  clearDrawFeatures() {
    app.plugins.SelectTool.drawPoint.getSource().clear();
    app.plugins.SelectTool.drawLine.getSource().clear();
    app.plugins.SelectTool.drawPolygon.getSource().clear();
    app.plugins.SelectTool.searchRadiusLayer.getSource().clear();
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
        logger(
          "ERROR",
          app.plugins.SelectTool.name + ": Plugin failed to initialize"
        );
        return;
      }

      // Register the get location from map buttons
      $(".st-search-point .st-get-location-from-map-btn").click(function () {
        var associatedInput = $(this).parent().find(".st-location-input");
        app.plugins.SelectTool.registerMapClickLocation(associatedInput);
      });

      //Draw Point Button Click
      $(".st-search-point .st-get-location-from-map-btn").click(function () {
        var type = "Point";
        app.plugins.SelectTool.createFeature(type);
      });

      //Draw Line Button Click
      $(".st-draw-line-btn").click(function () {
        var type = "LineString";
        app.plugins.SelectTool.createFeature(type);
      });

      //Draw Polygon Button Click
      $(".st-draw-polygon-btn").click(function () {
        var type = "Polygon";
        app.plugins.SelectTool.createFeature(type);
      });

      // Register the geolocator buttons
      $(".st-get-geolocation-point-btn").click(function () {
        app.plugins.SelectTool.drawPoint.getSource().clear();
        var associatedInput = $(this).parent().find(".st-location-input");
        app.plugins.SelectTool.registerDeviceLocation(associatedInput);
      });

      // Register Point search button
      $("#st-overlay-search-btn").click(function () {
        $("#st-resultAccordian").empty();
        app.plugins.SelectTool.findFeatures();
      });

      // Register Line search button
      $("#st-lineString-overlay-search-btn").click(function () {
        $("#st-resultAccordian").empty();
        app.plugins.SelectTool.findFeatures();
      });

      // Register polygon search button
      $("#st-polygon-overlay-search-btn").click(function () {
        $("#st-resultAccordian").empty();
        app.plugins.SelectTool.findFeatures();
      });

      // Register polygon search button
      $("#st-route-search-btn").click(function () {
        $("#st-resultAccordian").empty();
        app.plugins.SelectTool.findFeatures();
      });

      // Register polygon search button
      $("#st-byFeature-search-btn").click(function () {
        app.plugins.SelectTool.drawPolygon.getSource().clear();
        app.plugins.SelectTool.drawLine.getSource().clear();
        app.plugins.SelectTool.drawPoint.getSource().clear();

        var data = $(".st-route-item").data("featureObject");
        var geomType = data.getGeometry().getType();
        if (geomType == "Polygon") {
          app.plugins.SelectTool.drawPolygon.getSource().addFeature(data);
        }
        if (geomType == "LineString") {
          app.plugins.SelectTool.drawPolygon.getSource().addFeature(data);
        }
        if (geomType == "Point") {
          app.plugins.SelectTool.drawPoint.getSource().addFeature(data);
        }
        $("#st-resultAccordian").empty();
        app.plugins.SelectTool.findFeatures();
      });

      // Register search button
      $(
        "#st-search-distance-input, #st-lineString-search-distance-input, #st-router-search-distance-input"
      ).change(function () {
        app.plugins.SelectTool.registerSearchRadius();
      });

      // Register the category autocompletes
      $(".st-location-input").catcomplete({
        minLength: 3,
        source: app.plugins.SelectTool.search,
        autoFocus: true,
        select: function (event, selection) {
          app.plugins.SelectTool.registerSearchSelectionLocation(
            $(this),
            selection.item
          );
        },
      });

      //Register Toggle Between Linear and Router Buttons
      $(".st-get-linear-btn").click(function () {
        $(".st-get-router-btn").removeClass("active");
        $(".st-get-linear-btn").addClass("active");
      });
      $(".st-get-router-btn").click(function () {
        $(".st-get-router-btn").addClass("active");
        $(".st-get-linear-btn").removeClass("active");
      });

      ////Register clear button click
      $(
        "#st-byFeature-clear-btn, #st-route-clear-btn, #st-polygon-clear-btn, #st-lineString-clear-btn, #st-point-clear-btn"
      ).click(function () {
        app.plugins.SelectTool.clearContent();
      });

      // Clear Geometry on Tab Click
      //$("#st-point-tab, #st-line-tab, #st-polygon-tab, #st-router-tab, #st-byFeature-tab").click(function() {
      //	app.plugins.SelectTool.clearContent();
      //});

      $("#Select-tab-nav").click(function () {
        if (
          app.plugins.SelectTool.routePathLayer.getSource().getFeatures()
            .length > 0
        ) {
          $("#st-router-tab").prop("disabled", false);
          $("#st-route-search-btn").prop("disabled", false);
        }
      });

      // Register the clear route button
      $(document).on("click", ".st-remove-route-btn", function () {
        var targetRouteID = `st-route-${$(this).data("route-id")}`;
        $("#" + targetRouteID).remove();

        //If route count is 0, disable search function
        var routeCount = $("#st-route-container .st-route-item").length;
        if (routeCount == 0) {
          $("#st-route-search-btn").prop("disabled", true);
        }

        //Remove buffer from buffer layer
        // Find the feature with matching routeID
        app.plugins.SelectTool.searchRadiusLayer
          .getSource()
          .getFeatures()
          .forEach(function (feature) {
            if (feature.get("routeID") === targetRouteID) {
              app.plugins.SelectTool.searchRadiusLayer
                .getSource()
                .removeFeature(feature);
            }
          });
        //Remove feature from routePathLayer
        app.plugins.SelectTool.routePathLayer
          .getSource()
          .getFeatures()
          .forEach(function (feature) {
            if (feature.get("routeID") === targetRouteID) {
              app.plugins.SelectTool.routePathLayer
                .getSource()
                .removeFeature(feature);
            }
          });
      });

      // Register the clear input buttons
      $(".st-clear-input-point-btn").click(function () {
        var associatedInput = $(this).parent().find(".st-location-input");
        associatedInput.val("");
        associatedInput.attr("longitude", null);
        associatedInput.attr("latitude", null);
        app.plugins.SelectTool.searchRadiusLayer.getSource().clear();
        $("#st-overlay-search-btn").prop("disabled", true);

        // Clear results
        $("#st-results").empty();
        $("#st-no-results").hide();
        $("#st-resultAccordian").empty();
      });

      $(
        "#st-lineString-unit-toggle, #st-point-unit-toggle, #st-router-unit-toggle"
      ).click(function () {
        const current = $(this).text().trim();
        $(this).text(current === "km" ? "m" : "km");
        app.plugins.SelectTool.registerSearchRadius();
      });

      //If Router plugin is available, show router select tab
      if (app.plugins.DynamicRouter) {
        $("#st-router-tab").show();
      }
      //If identify2Popup plugin is available, show feature select tab
      if (app.plugins.Identify2Popup) {
        $("#st-byFeature-tab").show();
      }

      // Set class variables
      app.plugins.SelectTool.tabNav = tabNav;
      app.plugins.SelectTool.tabContent = tabContent;

      //For select tab scrolling
      $(".select-tabs").scrollingTabs({
        bootstrapVersion: 5,
        cssClassLeftArrow: "oi oi-chevron-left",
        cssClassRightArrow: "oi oi-chevron-right",
        disableScrollArrowsOnFullyScrolled: true,
        scrollToTabEdge: true,
        enableSwiping: true,
        tabClickHandler: function (e) {
          setTimeout(function () {
            $(".select-tabs").scrollingTabs("scrollToActiveTab");
          }, 150);
        },
      });

      $(document).on("shown.bs.tab", "#Select-tab-nav", function () {
        setTimeout(function () {
          $(".select-tabs").scrollingTabs("refresh", { forceActiveTab: true });
          $(window).trigger("resize");
        }, 100);
      });

      // Log success
      logger(
        "INFO",
        app.plugins.SelectTool.name + ": Plugin successfully loaded"
      );
    };

    // Add the tab
    addSideBarTab(this.tabName, this.tabContentFile, callback);
  }
}
