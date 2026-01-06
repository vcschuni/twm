class ImageViewer {
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ImageViewer";
		this.version = 2.0;
		this.author = "MoTT Spatial Team";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = this.pcfg.tabName ? this.pcfg.tabName : "Image Viewer";
		this.tabContentFile = "application/plugins/ImageViewer/tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent; // jQuery element
		this.syncMap = true; // Default to syncing map with image location
		this.keepPlayingVideo = false; // Flag to control video playback
		this.imageRouteRepository = []; // Repository to store image data

		// Define and add the restriction layer
		this.imageFrameLocation = new ol.layer.Vector({
			hideFromLayerController: true,
			title: "Route Restrictions",
			fields: [],
			preventIdentify: true,
			type: "overlay",
			source: new ol.source.Vector({}),
			style: new ol.style.Style({
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({ color: "#ff0000" }), // red circle
					stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 }),
				}),
			}),
		});
		this.imageFrameLocation.setZIndex(621);
		app.map.addLayer(this.imageFrameLocation);

		// Add the plugin
		this.addPlugin();
	}

	/**
	 * Function: stopVideo
	 * @param (object) target
	 * @returns () nothing
	 * Function to stop a streaming video
	 */
	stopVideo() {
		app.plugins.ImageViewer.keepPlayingVideo = false;
	}

	/**
	 * Function: downloadMultipleVideos
	 * @param (imageList)
	 * @returns () nothing
	 * Function to download multipe videos from the imageList
	 */
	downloadMultipleVideos(imageList, traversalCode) {
		let zip = new JSZip();
		let imgFolder = zip.folder("images");
		let completed = 0;

		$.each(imageList, function (index, url) {
			var url = "data/proxy.php?src=" + Base64.encode(url);
			fetch(url)
				.then((response) => response.blob())
				.then((blob) => {
					imgFolder.file(`image${index + 1}.jpg`, blob);
					completed++;

					// After all images are fetched
					if (completed === imageList.length) {
						zip.generateAsync({ type: "blob" }).then(function (content) {
							let link = document.createElement("a");
							link.href = URL.createObjectURL(content);
							link.download = "" + traversalCode + ".zip";
							link.click();
						});
					}
				});
		});
	}

	/**
	 * Function: downloadSingleImage
	 * @param (uniqueID)
	 * @param (frameCount)
	 * @param (preloadCompletion)
	 * @returns () nothing
	 * Function to download a signle image
	 */
	downloadSingleImage(imageUrl, filename) {
		// Optional: use proxy if required
		let url = "data/proxy.php?src=" + Base64.encode(imageUrl);

		fetch(url)
			.then((response) => response.blob())
			.then((blob) => {
				let link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				link.remove();
			})
			.catch((error) => console.error("Image download failed:", error));
	}

	/**
	 * Function: updatePhotoTitle
	 * @param (uniqueID)
	 * @param (frameCount)
	 * @param (preloadCompletion)
	 * @returns () nothing
	 * Function to update the photo/player title
	 */
	updatePhotoTitle(uniqueID, frameCount, preloadCompletion) {
		var img = $("#photolog-image-" + uniqueID);
		if (frameCount > 1) {
			$("#photo-title-" + uniqueID).html(
				img.attr("photologYear") +
					" - " +
					img.attr("photologTraversalCode") +
					" <span>[" +
					preloadCompletion.toFixed(0) +
					"%]</span>"
			);
		} else {
			$("#photo-title-" + uniqueID).html(img.attr("photologYear") + " - " + img.attr("photologTraversalCode"));
		}
	}
	/**
	 * Function: showNextOrPreviousImage
	 * @param (object) traversalCode, direction
	 * @returns () nothing
	 * Function that requests the next or previous image based on the current distance
	 */
	showNextOrPreviousImage(traversalCode, direction) {
		let img = $('img[photologtraversalcode="' + traversalCode + '"]');

		// Extract attributes
		var currentDistance = parseFloat(img.attr("photologtraversaldrivendistance"));
		var year = parseInt(img.attr("photologyear"));

		// Validate direction input
		if (direction !== "forward" && direction !== "reverse") {
			console.error("Direction must be 'forward' or 'reverse'");
			return;
		}

		// Build the XML WFS request to fetch 1 image either greater or less than currentDistance
		const comparisonOperator = direction === "forward" ? "PropertyIsGreaterThan" : "PropertyIsLessThan";
		const sortOrder = direction === "forward" ? "ASC" : "DESC";

		const xml = `<wfs:GetFeature
    outputFormat="json"
    service="WFS"
    version="1.1.0"
    maxFeatures="1"
    xmlns:wfs="http://www.opengis.net/wfs"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">
    <wfs:Query typeName="plg:PLG_PHOTOLOG_IMAGE_V" srsName="EPSG:3857">
      <ogc:SortBy>
        <ogc:SortProperty>
          <ogc:PropertyName>TRAVERSAL_DRIVEN_DISTANCE</ogc:PropertyName>
          <ogc:SortOrder>${sortOrder}</ogc:SortOrder>
        </ogc:SortProperty>
      </ogc:SortBy>
      <ogc:Filter>
        <ogc:And>
          <ogc:PropertyIsEqualTo>
            <ogc:PropertyName>TRAVERSAL_CODE</ogc:PropertyName>
            <ogc:Literal>${traversalCode}</ogc:Literal>
          </ogc:PropertyIsEqualTo>
          <ogc:PropertyIsEqualTo>
            <ogc:PropertyName>YEAR</ogc:PropertyName>
            <ogc:Literal>${year}</ogc:Literal>
          </ogc:PropertyIsEqualTo>
          <ogc:${comparisonOperator}>
            <ogc:PropertyName>TRAVERSAL_DRIVEN_DISTANCE</ogc:PropertyName>
            <ogc:Literal>${currentDistance}</ogc:Literal>
          </ogc:${comparisonOperator}>
        </ogc:And>
      </ogc:Filter>
    </wfs:Query>
  </wfs:GetFeature>`;

		// AJAX request
		$.ajax({
			dataType: "json",
			url: "../ogs-internal/wfs",
			contentType: "text/plain",
			type: "POST",
			data: xml,
		})
			.done((response) => {
				const jsonReader = new ol.format.GeoJSON();
				const features = jsonReader.readFeatures(response);

				if (features.length === 0) {
					return;
				}

				const f = features[0];
				const imageFilename = $.trim(f.get("IMAGE_FILENAME"));
				const fullUrl = `https://ext-driving-images.th.gov.bc.ca/hr/${f.get("YEAR")}/${f.get(
					"IMAGE_PATH"
				)}/${encodeURIComponent(imageFilename)}`;

				// Update the image element that matches traversalCode, or use a uniqueID approach
				// Example: update img with attribute photologtraversalcode = traversalCode
				const img = $('img[photologtraversalcode="' + traversalCode + '"]');
				img.attr("src", fullUrl)
					.attr("photologImageID", f.get("PHOTOLOG_IMAGE_ID"))
					.attr("photologProgramID", f.get("PHOTOLOG_PROGRAM_ID"))
					.attr("photologTraversalDrivenDistance", f.get("TRAVERSAL_DRIVEN_DISTANCE"))
					.attr("photologYear", f.get("YEAR"))
					.attr("photologTraversalCode", f.get("TRAVERSAL_CODE"))
					.attr("photologImagePath", f.get("IMAGE_PATH"))
					.attr("photologImageFilename", f.get("IMAGE_FILENAME"))
					.attr("photologLocationDescription", f.get("LOCATION_DESCRIPTION"))
					.attr("photologImageXcoord", f.getGeometry().getCoordinates()[0])
					.attr("photologImageYcoord", f.getGeometry().getCoordinates()[1]);

				// Update description
				const cleanedDescription = f.get("LOCATION_DESCRIPTION").split(";").pop().trim();
				$("#desc-" + traversalCode).html(cleanedDescription);

				// Optionally sync map location
				if (this.syncMap) {
					const coords = f.getGeometry().getCoordinates();
					app.map.getView().setCenter(coords);
					this.imageFrameLocation.getSource().clear();
					this.imageFrameLocation.getSource().addFeature(f);
				}

				// Optionally update photo title UI if you want to pass uniqueID or other info
				this.updatePhotoTitle("yourUniqueID", 1, 100);
			})
			.fail(() => {
				console.error(`Failed to load ${direction} image.`);
			});
	}

	/**
	 * Function: playVideo
	 * @param (object) target
	 * @returns () nothing
	 * Function that collects the images along the route and plays them in video player
	 */
	playVideo(featureID, uniqueID, traversalCode, direction) {
		app.plugins.ImageViewer.imageRouteRepository = []; // Clear or initialize repository
		let img = $('img[uniqueid="' + uniqueID + '"]');
		let batchSize = 50;
		let currentIndex = 0;
		let jsonFeatures = [];
		let preloadedImageCount = 0;
		var year = parseInt(img.attr("photologyear"));
		let framePauseLength = 150;
		let nextTraversalDistance = parseFloat(img.attr("photologtraversaldrivendistance"));
		let noMoreImages = false;
		app.plugins.ImageViewer.keepPlayingVideo = false;

		let nextBatchFeatures = [];
		let nextBatchLoading = false;

		var $spinner = $(` 
          <span class="ms-2 spinner-border spinner-border-sm text-primary" role="status" id="IV-spinner">
              <span class="visually-hidden">Loading...</span>
          </span>
    `);

		$(".control-group-1")
			.filter(function () {
				return $(this).find('a[uniqueid="' + uniqueID + '"]').length > 0;
			})
			.append($spinner);

		if (direction === "forward") {
			var sortOrder = "ASC";
			var traversalDirection = "PropertyIsGreaterThan";
		} else {
			var sortOrder = "DESC";
			var traversalDirection = "PropertyIsLessThan";
		}

		function fetchBatch(startDistance, callback) {
			const xml = `<wfs:GetFeature
          outputFormat="json"
          service="WFS"
          version="1.1.0"
          maxFeatures="${batchSize}"
          xmlns:property="http://th.gov.bc.ca/property"
          xmlns:wfs="http://www.opengis.net/wfs"
          xmlns:ogc="http://www.opengis.net/ogc"
          xmlns:gml="http://www.opengis.net/gml"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">
        <wfs:Query typeName="plg:PLG_PHOTOLOG_IMAGE_V" srsName="EPSG:3857">
          <ogc:SortBy>
            <ogc:SortProperty>
              <ogc:PropertyName>TRAVERSAL_DRIVEN_DISTANCE</ogc:PropertyName>
              <ogc:SortOrder>${sortOrder}</ogc:SortOrder>
            </ogc:SortProperty>
          </ogc:SortBy>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>TRAVERSAL_CODE</ogc:PropertyName>
                <ogc:Literal>${traversalCode}</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>YEAR</ogc:PropertyName>
                <ogc:Literal>${year}</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:${traversalDirection}>
                <ogc:PropertyName>TRAVERSAL_DRIVEN_DISTANCE</ogc:PropertyName>
                <ogc:Literal>${startDistance}</ogc:Literal>
              </ogc:${traversalDirection}>
            </ogc:And>
          </ogc:Filter>
        </wfs:Query>
      </wfs:GetFeature>`;

			$.ajax({
				dataType: "json",
				url: "../ogs-internal/wfs",
				contentType: "text/plain",
				type: "POST",
				data: xml,
			})
				.done(function (features) {
					const jsonReader = new ol.format.GeoJSON();
					const newFeatures = jsonReader.readFeatures(features);

					if (newFeatures.length === 0) {
						noMoreImages = true;
					} else {
						$.each(newFeatures, function (i, f) {
							let imageFilename = $.trim(f.get("IMAGE_FILENAME"));
							f.set("IMAGE_FILENAME", imageFilename);
							let fullUrl = `https://ext-driving-images.th.gov.bc.ca/hr/${f.get("YEAR")}/${f.get(
								"IMAGE_PATH"
							)}/${encodeURIComponent(imageFilename)}`;
							f.set("FULL_IMAGE_URL", fullUrl);
							$spinner.remove();
							const preloadImg = new Image();
							preloadImg.onload = function () {
								preloadedImageCount++;
							};
							preloadImg.src = fullUrl;
						});
					}
					callback(newFeatures);
				})
				.fail(function () {
					noMoreImages = true;
					$spinner.remove();
					callback([]);
				});
		}

		function updateFrame() {
			if (!app.plugins.ImageViewer.keepPlayingVideo) return;

			const preloadCompletion = (preloadedImageCount / jsonFeatures.length) * 100;
			app.plugins.ImageViewer.updatePhotoTitle(uniqueID, jsonFeatures.length, preloadCompletion);

			if (preloadCompletion < 50) {
				setTimeout(updateFrame, 250);
				return;
			}

			if (currentIndex < jsonFeatures.length) {
				const f = jsonFeatures[currentIndex];
				const img = $('img[uniqueid="' + f.get("YEAR") + f.get("TRAVERSAL_CODE") + '"]');
				img.attr("src", f.get("FULL_IMAGE_URL"))
					.attr("photologImageID", f.get("PHOTOLOG_IMAGE_ID"))
					.attr("photologProgramID", f.get("PHOTOLOG_PROGRAM_ID"))
					.attr("photologTraversalDrivenDistance", f.get("TRAVERSAL_DRIVEN_DISTANCE"))
					.attr("photologYear", f.get("YEAR"))
					.attr("photologTraversalCode", f.get("TRAVERSAL_CODE"))
					.attr("photologImagePath", f.get("IMAGE_PATH"))
					.attr("photologImageFilename", f.get("IMAGE_FILENAME"))
					.attr("photologLocationDescription", f.get("LOCATION_DESCRIPTION"))
					.attr("photologImageXcoord", f.getGeometry().getCoordinates()[0])
					.attr("photologImageYcoord", f.getGeometry().getCoordinates()[1]);

				$(".btn-toggle-recording").each(function () {
					if ($(this).attr("title") === "Recording") {
						app.plugins.ImageViewer.imageRouteRepository.push(f.get("FULL_IMAGE_URL"));
					}
				});

				const cleanedDescription = f.get("LOCATION_DESCRIPTION").split(";").pop().trim();
				$("#desc-" + f.get("TRAVERSAL_CODE")).html(cleanedDescription);

				if (app.plugins.ImageViewer.syncMap) {
					const coords = f.getGeometry().getCoordinates();
					app.map.getView().setCenter(coords);
					app.plugins.ImageViewer.imageFrameLocation.getSource().clear();
					app.plugins.ImageViewer.imageFrameLocation.getSource().addFeature(f);
				}

				currentIndex++;

				if (!noMoreImages && !nextBatchLoading && currentIndex >= jsonFeatures.length - 10) {
					nextBatchLoading = true;
					fetchBatch(nextTraversalDistance, function (newFeatures) {
						if (newFeatures.length > 0) {
							jsonFeatures = jsonFeatures.concat(newFeatures);
							nextTraversalDistance =
								newFeatures[newFeatures.length - 1].get("TRAVERSAL_DRIVEN_DISTANCE");
						} else {
							noMoreImages = true;
						}
						nextBatchLoading = false;
					});
				}

				const speed = document.getElementById(`playback-speed-${uniqueID}`).value;
				if (speed == 1) framePauseLength = 400;
				if (speed == 2) framePauseLength = 150;
				if (speed == 3) framePauseLength = 50;

				setTimeout(updateFrame, framePauseLength);
			} else {
				if (noMoreImages) {
					$("#photolog-image-td-" + uniqueID + " .spinner").hide();
				} else {
					fetchBatch(nextTraversalDistance, function (newFeatures) {
						if (newFeatures.length > 0) {
							jsonFeatures = jsonFeatures.concat(newFeatures);
							nextTraversalDistance =
								newFeatures[newFeatures.length - 1].get("TRAVERSAL_DRIVEN_DISTANCE");
							setTimeout(updateFrame, framePauseLength);
						} else {
							noMoreImages = true;
							$spinner.remove();
						}
					});
				}
			}
		}

		fetchBatch(nextTraversalDistance, function (initialFeatures) {
			if (initialFeatures.length > 0) {
				jsonFeatures = initialFeatures;
				nextTraversalDistance = initialFeatures[initialFeatures.length - 1].get("TRAVERSAL_DRIVEN_DISTANCE");
				app.plugins.ImageViewer.keepPlayingVideo = true;
				currentIndex = 0;
				updateFrame();
			} else {
				$spinner.remove();
			}
		});
	}

	/**
	 * Function: findImagePointsWithinDistanceOfXY
	 * @param (x) target
	 * @param (y) target
	 * @param (searchRadius) target
	 * @returns () nothing
	 * Function that finds the features from the click on the map
	 */
	findImagePointsWithinDistanceOfXY(x, y, searchRadius) {
		var spinner = new Spinner(app.spinnerOptionsMedium).spin($("#sidebar-tab-content")[0]);

		activateSidebarTab(app.plugins.ImageViewer.tabNav);
		//$("PhotologImages-tab-content").empty();
		$("#IV-year-accordion").empty();

		/// Transform from EPSG:4326 to EPSG:3005 (BC Albers)
		const albersCoords = ol.proj.transform([x, y], "EPSG:4326", "EPSG:3005");

		// Create a Point geometry in Albers
		const queryPoint = new ol.geom.Point(albersCoords);

		// Create a regular polygon (circle approximation) around the point
		const sRadius = 100; // meters
		const queryPolygon = ol.geom.Polygon.fromCircle(
			new ol.geom.Circle(albersCoords, sRadius),
			20 // number of sides
		);

		// Create a feature from the polygon
		const queryCircle = new ol.Feature(queryPolygon);

		// Get the coordinates for the polygon (returns [ [ [x1, y1], [x2, y2], ... ] ])
		const coordinates = queryCircle.getGeometry().getCoordinates();
		const vertices = coordinates[0]; // Outer ring

		// Build the CQL query statement
		let polyCoords = "";
		$.each(vertices, function (i, vertex) {
			if (polyCoords !== "") polyCoords += ",";
			polyCoords += vertex[0] + " " + vertex[1];
		});
		// Close the polygon by repeating the first vertex
		polyCoords += "," + vertices[0][0] + " " + vertices[0][1];

		const cql_filter = "INTERSECTS(SHAPE,POLYGON((" + polyCoords + ")))";
		//const cql_filter = `TRAVERSAL_CODE = 'H99RP1'`;

		function callback(response) {
			// Build Year Accordians
			var features = response.features;
			//If no features, append message to container
			var message = "No Images Found";
			if (features.length == 0) {
				$(".IV-No-Image-alert-info").show();
			} else {
				$(".IV-No-Image-alert-info").hide();
			}

			var yearList = [];
			var routeList = [];
			$.each(features, function (index, feature) {
				var route = feature.properties.TRAVERSAL_CODE;
				var year = feature.properties.YEAR;
				if (year !== undefined && !yearList.includes(year)) {
					yearList.push(year);
				}
				if (route !== undefined && !routeList.includes(route)) {
					routeList.push(route);
				}
			});

			// Sort the year list if needed
			yearList.sort(function (a, b) {
				return b - a;
			});

			$.each(yearList, function (index, year) {
				// Create an accordion item for each year
				var bodyContent = "";
				//Extract the data by year from the features variable
				const featuresForYear = features.filter(function (feature) {
					const takenDate = feature.properties.TAKEN_DATETIME;
					if (!takenDate) return false;
					const featureYear = feature.properties.YEAR;
					return featureYear === year; //Return the features that fall within the year
				});

				// Group by TRAVERSAL_CODE
				const featuresByTraversalCode = featuresForYear.reduce((acc, feature) => {
					const code = feature.properties.TRAVERSAL_CODE || "UNKNOWN";
					if (!acc[code]) acc[code] = [];
					acc[code].push(feature);
					return acc;
				}, {});

				// Loop through each TRAVERSAL_CODE group
				for (const [traversalCode, featuresArr] of Object.entries(featuresByTraversalCode)) {
					// Use the first feature in the group for the image
					const feature = featuresArr[0];

					//get the x/y coordinates of the image
					const imageXCoord = feature.geometry.coordinates[0];
					const imageYCoord = feature.geometry.coordinates[1];

					// Extract properties from the feature
					var filename = feature.properties.IMAGE_FILENAME;
					var imgPath = feature.properties.IMAGE_PATH;
					var imgID = feature.properties.PHOTOLOG_IMAGE_ID;
					var traversalDistance = feature.properties.TRAVERSAL_DRIVEN_DISTANCE;
					var uniqueID = year + traversalCode;
					var reverseDirectionFlag = feature.properties.REVERSE_DIRECTION_FLAG;
					var description = feature.properties.LOCATION_DESCRIPTION || "No description available";
					const cleanedDescription = description.substring(description.lastIndexOf(";") + 1);
					var olFeatureID = feature.id;
					const imageUrl =
						"https://ext-driving-images.th.gov.bc.ca/hr/" + year + "/" + imgPath + "/" + filename + "";
					const zoomMapBtn = `
            <a title="Zoom Map to Photolog Point" uniqueID =${uniqueID} id="btn-zoom-to-point-${imgID}" 
              class="btn btn-outline-secondary btn-sm btn-zoom-to-point" >
              <span class="oi oi-zoom-in"></span>
            </a>
          `;

					const recordButton = `
              <a title="Start Recording" id="btn-start-recording-${imgID}" 
                class="btn btn-outline-secondary btn-sm btn-toggle-recording">
                <span class="oi oi-media-record btn-record-icon" style="color: #6c757d;"></span>
              </a>
          `;

					const downloadImage = `
            <a title="Download Image" uniqueID =${uniqueID} id="btn-download-image-${imgID}" 
              class="btn btn-outline-secondary btn-sm btn-download-image">
              <span class="oi oi-image"></span>
            </a>
          `;

					bodyContent += `
              <div class="iv-image-wrapper mb-3" data-imgid="${imgID}">

                <div id="tc-${traversalCode}"><strong>${traversalCode}</strong></div>
                <div id="desc-${traversalCode}">${cleanedDescription}</div>

                <div class="IV-button-group mb-2">
                  ${zoomMapBtn}
                  ${recordButton}
                  ${downloadImage}
                </div>

          <div class="image-container mb-2" data-filename="${filename}" uniqueID ="${uniqueID}" data-traversalcode="${traversalCode}" style="cursor: pointer;">
            <img 
              id="photolog-image-${olFeatureID}" 
              photologimageid="${imgID}" 
              photologtraversaldrivendistance="${traversalDistance}" 
              photologyear="${year}" 
              uniqueID ="${uniqueID}" 
              photologtraversalcode="${traversalCode}" 
              photologimagepath="${imgPath}" 
              photologimagefilename="${filename}" 
              photologlocationdescription="${description}" 
              photologimagexcoord="${imageXCoord}" 
              photologimageycoord="${imageYCoord}" 
              src="${imageUrl}" 
              class="img-fluid"
              style="display: inline;">
          </div>
          
          <div class="IV-image-controls mb-2">
            <div class="control-group-1">
              <a title="Play" uniqueID =${uniqueID} id="btn-play-video-forward-${imgID}" class="btn-play-video btn btn-outline-secondary btn-sm";">
                <span class="oi oi-media-play" style="color: green;"></span>
              </a>
              <a title="Back One Image" id="btn-back-one-${imgID}" class="btn btn-outline-secondary btn-sm" onclick="app.plugins.ImageViewer.showNextOrPreviousImage('${traversalCode}', 'reverse');">
                <span class="oi oi-media-step-backward"></span>
              </a>
              <a title="Forward One Image" id="btn-forward-one-${imgID}" class="btn btn-outline-secondary btn-sm" onclick="app.plugins.ImageViewer.showNextOrPreviousImage('${traversalCode}', 'forward');">
                <span class="oi oi-media-step-forward"></span>
              </a>
              <a title="Play Video Backward" id="btn-play-video-backward-${uniqueID}" class="btn btn-outline-secondary btn-sm btn-play-video-backward">
                <span class="oi oi-loop" style="transform: scaleX(-1); display: inline-block;"></span>
              </a>
            </div>
             <div class="control-group-2">
              <div class="d-flex align-items-center" style="gap: 0.5rem;">
                <span>Slow</span>
                <input type="range" class="form-range" min="1" max="3" value="2" id="playback-speed-${uniqueID}" style="width: 40px;">
                <span>Fast</span>
              </div>
            </div>
          </div>

          

        </div>
        <hr>
      `;
				}

				var accordionItem = `
          <div class="accordion-item">
            <h2 class="accordion-header" id="IV-accordian-${year}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${year}" aria-expanded="false" aria-controls="collapse${year}">
                Year ${year}
              </button>
            </h2>
            <div id="collapse${year}" class="accordion-collapse collapse" aria-labelledby="IV-accordian-${year}" data-bs-parent="#yearAccordion">
              <div class="accordion-body" id="IV-accordian-body-${year}">
                ${bodyContent}
              </div>
            </div>
          </div>
        `;
				$("#IV-year-accordion").append(accordionItem);
			});
			spinner.stop();
		}
		let options = {
			typeName: "plg:PLG_PHOTOLOG_IMAGE_V",
			outputFormat: "json",
			service: "wfs",
			version: "2.0.0",
			request: "GetFeature",
			srsName: "EPSG:3857", // Your app already uses this
			maxFeatures: 100,
			cql_filter: cql_filter,
		};

		$.ajax({
			type: "POST",
			url: "../ogs-internal/wfs",
			dataType: "json",
			contentType: "application/x-www-form-urlencoded",
			data: $.param(options),
		})
			.done(function (response) {
				callback(response);
			})
			.fail(function (jqxhr, settings, exception) {
				spinner.stop();
				logger("ERROR", app.plugins.SelectTool.name + ": Error querying Data ");
			});
	}

	/**
	 * Function: registerMapClickLocation
	 * @param (object) target
	 * @returns () nothing
	 * Function that registers where the user clicked on the map
	 */
	registerMapClickLocation() {
		// Define function that handles the get map click location
		const callback = function (layer, features) {
			//Build Year Accordians
			var yearList = [];
			$.each(features, function (index, feature) {
				var year = feature.properties.YEAR;
				if (year !== undefined && !yearList.includes(year)) {
					yearList.push(year);
				}
			});

			// Sort the year list if needed
			yearList.sort(function (a, b) {
				return b - a;
			});

			$.each(yearList, function (index, year) {
				var accordionItem = `
				<div class="accordion-item">
					<h2 class="accordion-header" id="IV-accordian-${year}">
						<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${year}" aria-expanded="false" aria-controls="collapse${year}">
							Year ${year}
						</button>
					</h2>
					<div id="collapse${year}" class="accordion-collapse collapse" aria-labelledby="IV-accordian-${year}" data-bs-parent="#yearAccordion">
						<div class="accordion-body" id="IV-accordian-body-${year}">
							Content for ${year}
						</div>
					</div>
				</div>
			`;
				$("#IV-year-accordion").append(accordionItem);
			});
		};

		const mapClickFunction = function (event) {
			$(".sp-content-container").css("visibility", "hidden");
			app.mapSpinner = new Spinner(app.spinnerOptionsMedium).spin($(".sp-tab-container")[0]);

			const coord = event.coordinate;
			const lonLat = ol.proj.toLonLat(coord); // [lon, lat] in degrees
			const lon = lonLat[0];
			const lat = lonLat[1];

			// Determine the search radius (based on current map res)
			var searchRadius = 50;

			// Toggle function as inactive
			app.plugins.ImageViewer.waitingForMapClick = false;

			$(".sp-selection-tree-container").empty();

			app.plugins.ImageViewer.findImagePointsWithinDistanceOfXY(lon, lat, searchRadius);

			// If mobile, show sidebar
			if (isMobile()) showSidebar();
		};

		// Toggle function as active
		app.plugins.ImageViewer.waitingForMapClick = true;

		// Redirect the map's single click function to this mapClickFunction (temporary)
		redirectMapSingleClickFunction("crosshair", mapClickFunction);

		// If mobile, hide sidebar
		if (isMobile()) hideSidebar();
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
				logger("ERROR", app.plugins.ImageViewer.name + ": Plugin failed to initialize");
				return;
			}

			//Register the click handler for zoom to feature
			$(document).on("click", ".btn-zoom-to-point", function () {
				var uniqueID = $(this).attr("uniqueID");
				let img = $('img[uniqueid="' + uniqueID + '"]');
				var xCoord = parseFloat(img.attr("photologimagexcoord"));
				var yCoord = parseFloat(img.attr("photologimageycoord"));
				var olFeature = new ol.Feature({
					geometry: new ol.geom.Point([xCoord, yCoord]),
				});
				zoomToFeature(olFeature);
			});

			//Register the click handler for play video button
			$(document).on("click", `.btn-play-video`, function () {
				const $btn = $(this);
				const uniqueID = $btn.attr("uniqueID");
				let img = $('img[uniqueid="' + uniqueID + '"]');
				var olFeatureID = img.attr("id");
				var traversalCode = img.attr("photologtraversalcode");
				// Check if it's currently playing
				const isPlaying = $btn.hasClass("playing");
				if (!isPlaying) {
					// Start playback
					$btn.html('<span class="oi oi-media-stop"></span>');
					$btn.addClass("playing");
					$(this).attr("title", "Stop");

					// Call your playVideo function
					if ($("#btn-play-video-backward-" + uniqueID).hasClass("active")) {
						app.plugins.ImageViewer.playVideo(olFeatureID, uniqueID, traversalCode, "reverse");
					} else {
						app.plugins.ImageViewer.playVideo(olFeatureID, uniqueID, traversalCode, "forward");
					}
				} else {
					// Stop or pause playback (toggle)
					$btn.html('<span class="oi oi-media-play"></span>');
					$btn.removeClass("playing");
					$(this).attr("title", "Play");
					$(this).css("color", "green");

					// Optional: stop video logic here
					app.plugins.ImageViewer.stopVideo && app.plugins.ImageViewer.stopVideo(uniqueID);
				}
			});

			//Register the record button handler
			$(document).on("click", ".btn-toggle-recording", function () {
				const $btn = $(this);
				const icon = $btn.find(".btn-record-icon");

				// Find the nearest iv-image-wrapper
				const $wrapper = $btn.closest(".iv-image-wrapper");

				// Find the div with id starting with 'tc-' inside this wrapper
				const $tcDiv = $wrapper.find("div[id^='tc-']");
				const tcID = $tcDiv.attr("id"); // e.g., "tc-H1V_W_01_15"
				const traversalCode = tcID ? tcID.replace("tc-", "") : null; // e.g., "H1V_W_01_15"

				if (!$btn.hasClass("recording-active")) {
					// Start Recording
					$btn.addClass("recording-active").attr("title", "Recording");
					icon.css("color", "red");
				} else {
					// Stop Recording
					$btn.removeClass("recording-active").attr("title", "Start Recording");
					icon.css("color", "#6c757d");

					if (typeof app?.plugins?.ImageViewer?.downloadMultipleVideos === "function") {
						app.plugins.ImageViewer.downloadMultipleVideos(
							app.plugins.ImageViewer.imageRouteRepository,
							traversalCode
						);
						app.plugins.ImageViewer.imageRouteRepository = []; // Clear or initialize repository
					} else {
						console.warn("downloadMultipleVideos function not found.");
					}
				}
			});

			//Register the download image button handler
			$(document).on("click", ".btn-download-image", function () {
				var uniqueID = $(this).attr("uniqueID");
				let img = $('img[uniqueid="' + uniqueID + '"]');
				var src = img.attr("src");
				var fileName = img.attr("photologimagefilename");
				app.plugins.ImageViewer.downloadSingleImage(src, fileName);
			});

			$(document).on("click", `.btn-play-video-backward`, function () {
				const $btn = $(this);
				const isActive = $btn.hasClass("active");

				if (!isActive) {
					// Activate the button
					$btn.addClass("active btn-danger").removeClass("btn-outline-secondary");
				} else {
					// Deactivate the button
					$btn.removeClass("active btn-danger").addClass("btn-outline-secondary");
				}
			});

			// Set class variables
			app.plugins.ImageViewer.tabNav = tabNav;
			app.plugins.ImageViewer.tabContent = tabContent;

			const waitForImageViewer = setInterval(function () {
				if (app?.plugins?.ImageViewer?.registerMapClickLocation) {
					app.plugins.ImageViewer.registerMapClickLocation();
					clearInterval(waitForImageViewer);
				}
			}, 200); // checks every 200ms

			// Log success
			logger("INFO", app.plugins.ImageViewer.name + ": Plugin successfully loaded");
		};

		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}
