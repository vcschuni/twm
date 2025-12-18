class LayerEditor {
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "LayerEditor";
		this.version = 1.0;
		this.author = "";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = this.pcfg.tabName ? this.pcfg.tabName : "Layer Editor";
		this.tabContentFile = "application/plugins/LayerEditor/tab-content.html";
		this.tabNav;
		this.tabContent;
		this.spinner;
		this.modifyStyle;
		this.deleteStyle;
		this.editableLayer;
		this.drawnFeature;
		this.editableLayerSelectedFeatureIds = [];
		this.commentArray = [];
		this.editableFeature;
		this.editableFeatureOriginalGeometry;
		this.editableFeatureAttributeChanges = [];
		this.editableFeatureGeometryHasChanged = false;
		this.autoEdit = this.pcfg.autoEdit ? this.pcfg.autoEdit : false;
		this.formEmail = this.pcfg.formEmail ? this.pcfg.formEmail : false;
		this.nullGeometryCreateFeature = this.pcfg.nullGeometryCreateFeature
			? this.pcfg.nullGeometryCreateFeature
			: false;
		this.snapableCollection = new ol.Collection(); // Store features to snap too.
		this.addPlugin(); // Initializes the plugin
	}

	/**
	 * Function: turnEditingOff
	 * @param () none
	 * @returns () nothing
	 * Function to turn off all editing functionality
	 */
	turnEditingOff() {
		// Remove the interactions (if they exist)
		if (this.modify) app.map.removeInteraction(this.modify);
		if (this.select) app.map.removeInteraction(this.select);
		if (this.draw) app.map.removeInteraction(this.draw);
		if (this.snap) app.map.removeInteraction(this.snap);
		if (this.delete) app.map.removeInteraction(this.delete);
		if (this.dragBox) app.map.removeInteraction(this.dragBox);

		// Remove selections (if they exist)
		if (this.select) this.select.getFeatures().clear();
		if (this.delete) this.delete.getFeatures().clear();

		// Reset default single click function
		resetDefaultMapSingleClickFunction();

		// Clear and hide attribute editing
		this.populateFeatureEditorSelector(null);

		// Run feature change and delete watchers
		app.plugins.LayerEditor.featureChangeWatcher();
		app.plugins.LayerEditor.featureDeleteWatcher();

		// Empty and hide copy features list
		$("#le-copying-container").empty();
		$("#le-copying-container").hide();
	}

	/**
	 * Function: populateFeatureEditorSelector
	 * @param (object) features
	 * @param (boolean) selectFirstFeature
	 * @returns () nothing
	 * Function to populate and show the editable features (if more than one was selected)
	 */
	populateFeatureEditorSelector(features, selectFirstFeature = true) {
		// Reset editable feature selector and form
		//$("#le-editable-feature-select").parent().hide();
		$("#le-editable-feature-select").empty();
		$("#le-editable-feature-select-count").empty();
		$("#le-attribute-form").hide();

		//$("#le-digitize-toolbar-modify .le-edit-btn.active").removeClass("active");

		// Clear editable feature and reset the toolbar
		//app.plugins.LayerEditor.editableFeature = null;
		$("#le-digitize-toolbar-add-geometry").show();
		$("#le-digitize-toolbar-modify").show();
		$("#le-digitize-toolbar-functions").show();

		//If features, then set toolbar to hide add geometry and show modify and functions
		if (features) {
			$("#le-digitize-toolbar-add-geometry").hide();
			$("#le-digitize-toolbar-modify").show();
			$("#le-digitize-toolbar-functions").show();
		}

		app.plugins.LayerEditor.editableLayerSelectedFeatureIds = [];

		// Bail if no features were passed
		if (features == null) return;
		if (features.length == 0) return;

		// Remember selected feature IDs
		$.each(features, function (index, feature) {
			app.plugins.LayerEditor.editableLayerSelectedFeatureIds.push(feature.getId());
		});

		// Build the feature name
		var titleFields = [];
		$.each(this.editableLayer.get("fields"), function (index, field) {
			if (field.title) titleFields.push(field.name);
		});

		// Populate the editable feature selector with the passed features
		$.each(features, function (index, feature) {
			// Handle both geometry and GEOMETRY cases
			var properties = feature.values_?.properties || feature.values_ || {};
			var titleValues = [];

			// Iterate through titleFields to get their values
			$.each(titleFields, function (i, titleField) {
				if (properties[titleField]) {
					titleValues.push(properties[titleField]);
				}
			});

			// Fallback to feature UID if no title values are found
			if (titleValues.length === 0) {
				titleValues.push("[" + ol.util.getUid(feature) + "]");
			}

			var title = titleValues.join(" - ");
			var option = $("<option></option>");
			option.attr("value", feature.getId());
			option.html(title);
			$("#le-editable-feature-select").append(option);
		});

		// Show the editable feature selector
		$("#le-editable-feature-select").parent().show();

		// Show the selected feature count
		$("#le-editable-feature-select-count").html(features.length);

		// Optionally set the first feature as editable
		if (selectFirstFeature) {
			this.showFeatureEditor(features[0].getId());

			//Zoom to feature when first record is shown in selector, if Select/Modify is active, dont zoom to feature
			const isModifyActive = $(".le-edit-btn[data-action='modify']").hasClass("active");
			if (!isModifyActive) {
				//get feature geometry
				const geometry = features[0].getGeometry();
				// Zoom to feature (only if geometry is present)
				if (geometry) {
					const featureExtent = geometry.getExtent();
					app.map.getView().fit(featureExtent, { duration: 1000 });
				}
			}
		}

		// Add search functionality
		$("#le-editable-feature-search").on("input", function () {
			var searchTerm = $(this).val().toLowerCase();
			$("#le-editable-feature-select option").each(function () {
				var text = $(this).text().toLowerCase();
				$(this).toggle(text.indexOf(searchTerm) > -1);
			});
		});
	}

	/**
	 * Function: searchEditableLayer
	 * @param (integer) featureId
	 * @returns () nothing
	 * Function that searches for features within the selected editable layer
	 */
	searchEditableLayer(searchTerm) {
		var layer = app.plugins.LayerEditor.editableLayer;
		if (!layer) return;

		var params;
		if (searchTerm === "*") {
			// When searchTerm is '*', request all features (no filtering)
			params = {
				service: "WFS",
				version: "2.0.0",
				request: "GetFeature",
				outputFormat: "application/json",
				typeNames: layer.getSource().layerName,
				srsName: app.map.getView().getProjection().getCode(),
			};
		} else {
			// Get the searchable fields for this layer
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
			// If no title fields, use the first searchable one as fallback
			if (titleFields.length == 0 && searchableFields.length > 0) {
				titleFields.push(searchableFields[0]);
			}
			// Build the CQL filter statement
			var cqlFilter = "";
			$.each(searchableFields, function (index, searchField) {
				if (cqlFilter !== "") cqlFilter += " OR ";
				cqlFilter += searchField + " ilike '%" + searchTerm + "%'";
			});
			params = {
				service: "WFS",
				version: "2.0.0",
				request: "GetFeature",
				outputFormat: "application/json",
				typeNames: layer.getSource().layerName,
				srsName: app.map.getView().getProjection().getCode(),
				cql_filter: cqlFilter,
			};
		}

		// Issue the AJAX request
		$.ajax({
			type: "GET",
			url: layer.getSource().layerUrl,
			data: params,
			dataType: "json",
			success: function (data) {
				var olFeatures = [];
				data.features.forEach((feature) => {
					var featureID = feature.id;
					let olFeature;
					if (feature.geometry) {
						// Convert normally if geometry is valid
						olFeature = convertToOpenLayersFeature("GeoJSON", feature);
					} else {
						// Handle null geometry by creating an empty feature
						olFeature = new ol.Feature();
					}
					olFeature.setId(featureID);
					olFeature.setProperties(feature.properties || {}); // Set attributes
					olFeatures.push(olFeature);
				});
				app.plugins.LayerEditor.populateFeatureEditorSelector(olFeatures, true);
			},
			error: function () {
				console.error("Error fetching features for search term: " + searchTerm);
			},
		});
	}

	/**
	 * Function: showFeatureEditor
	 * @param (integer) featureId
	 * @returns () nothing
	 * Function to show and populate the feature editor for the passed feature ID
	 */
	showFeatureEditor(featureId) {
		//clear
		tinymce.remove("textarea.le-attr-htmleditor");
		$("#le-attribute-form .le-attr-input-div").remove();
		$("#le-attribute-form").hide();

		if (this.editableFeature) {
			//If editable feature is shown in editor, hide the add geometry buttons
			$("#le-digitize-toolbar-add-geometry").hide();
			$("#le-digitize-toolbar-modify").show();
			$("#le-digitize-toolbar-functions").show();
		}

		this.commentArray = []; // Reset the comment array

		//Turn of delete button if configured to allow delete
		if (this.editableLayer.get("controls").delete) {
			$("#le-delete-button").show();
		}

		// Reset feature change trackers
		app.plugins.LayerEditor.editableFeatureAttributeChanges = [];
		app.plugins.LayerEditor.editableFeatureGeometryHasChanged = false;

		// Run feature change and delete watchers
		app.plugins.LayerEditor.featureChangeWatcher();
		app.plugins.LayerEditor.featureDeleteWatcher();

		// Close an existing popup if necessary
		closePopup();

		// Bail if a null featureId was passed
		if (!featureId) return;

		// Set the editable feature
		this.editableFeature = this.editableLayer.getSource().getFeatureById(featureId);

		// Check for null geometry
		const geometry = this.editableFeature.getGeometry();

		this.editableFeatureOriginalGeometry = geometry ? geometry.clone() : null;

		// Add a "No Geometry" pill if geometry is null
		const legendElement = $("legend.w-auto:contains('Feature Attributes')");
		legendElement.find(".no-geometry-pill").remove(); // Remove existing pill if any
		if (!geometry) {
			$("#le-digitize-toolbar-add-geometry").show();
			$("#le-digitize-toolbar-modify").hide();
			//$("#le-digitize-toolbar-functions").hide();

			const noGeometryPill = $('<span class="badge bg-danger ms-2 no-geometry-pill">No Geometry</span>');
			legendElement.append(noGeometryPill);
		} else {
			$("#le-digitize-toolbar-add-geometry").hide();
			$("#le-digitize-toolbar-modify").show();
			//$("#le-digitize-toolbar-functions").show();
		}

		// Handle selection
		if (app.plugins.LayerEditor.select) {
			app.plugins.LayerEditor.select.getFeatures().clear();
			if (this.editableFeature) {
				app.plugins.LayerEditor.select.getFeatures().push(this.editableFeature);
			}
		}

		// Get feature properties
		var featureProperties = this.editableFeature.getProperties();

		// Sort featureProperties keys based on the order in this.editableLayer.get("fields")
		const sortedKeys = this.editableLayer
			.get("fields")
			.map((field) => field.name)
			.filter((key) => key in featureProperties);
		const sortedFeatureProperties = {};
		sortedKeys.forEach((key) => {
			sortedFeatureProperties[key] = featureProperties[key];
		});
		featureProperties = sortedFeatureProperties;

		// Add each key and value as a row
		Object.keys(featureProperties).forEach((key) => {
			// Skip if the geometry column
			if (key === app.plugins.LayerEditor.editableLayer.getSource().geometryColumnName) return;

			// Get configured field details
			var hideElement = false;
			var prettyFieldName = key;
			var editable = false;
			var valueOptions = [];
			var value = [];
			var controlType = null;
			var proximity = null;
			$.each(this.editableLayer.get("fields"), function (index, field) {
				if (field.name === key) {
					if (field.hideFromEditor) hideElement = true;
					if (field.editable) editable = true;
					if (field.nameTransform) prettyFieldName = field.nameTransform();
					if (field.valueTransform) value = field.valueTransform(featureProperties[key]);
					if (field.valueOptions) valueOptions = field.valueOptions;
					if (field.controlType) controlType = field.controlType;
					if (field.proximity) proximity = field.proximity;
				}
			});

			if (hideElement == true) return;

			// If the controlType was not specified, guess it from the dataType
			if (controlType == null) {
				// Get the dataType (if exists)
				var dataType = "string";
				if (this.editableLayer.get("attributes")) {
					$.each(this.editableLayer.get("attributes"), function (index, attribute) {
						if (attribute.name === key) {
							if (attribute.localType) dataType = attribute.localType;
						}
					});
				}

				// Set controlType based on dataType
				switch (dataType) {
					case "number":
						controlType = "number-input";
						break;
					case "date-time":
						controlType = "date-time-input";
						break;
					default:
						controlType = "text-input";
						break;
				}
			}

			// Get the field value
			var value = featureProperties[key];
			// Build attribute input for field with NO specified value options
			var input;
			if (valueOptions.length == 0) {
				switch (controlType) {
					case "text-input":
						input = $(".le-attr-input-template-text").clone(true);
						input.removeClass("le-attr-input-template-text");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						if (proximity) {
							const button = $(
								'<button type="button" class="btn btn-light"><img src="application/plugins/LayerEditor/img/lucide--radius.svg" title="Get Closest Feature" style="height: 20px;"alt="Proximity"></button>'
							);
							button.on("click", () => {
								this.findClosestFeature(
									this.editableFeature,
									input.find("input"),
									proximity.layerName,
									proximity.field
								);
							});
							input.append(button);
						}
						break;

					case "textarea-input":
						input = $(".le-attr-input-template-textarea").clone(true);
						input.removeClass("le-attr-input-template-textarea");
						input.find("span").html(prettyFieldName);
						input.find("textarea").attr("key", key);
						input.find("textarea").val(value);
						input.find("textarea").data("original-value", value);
						input.find("textarea").data("value-has-changed", false);
						if (!editable) input.find("textarea").prop("disabled", true);
						break;

					case "subcategory-input":
						input = $(".le-attr-input-template-option").clone(true);
						input.removeClass("le-attr-input-template-option");
						input.find("span").html(prettyFieldName);
						input.find("select").attr("key", key);

						// Find the field object for the current key
						const subCategoryField = this.editableLayer.get("fields").find((f) => f.name === key);

						if (subCategoryField && subCategoryField.subCategories) {
							// Get the parent field value (e.g., WAIVER)
							const parentFieldValue = featureProperties[subCategoryField.subCategories[0].parentField];

							// Find the matching sub-category based on the parent field value
							const matchingSubCategory = subCategoryField.subCategories.find(
								(subCategory) => subCategory.type === parentFieldValue
							);

							if (matchingSubCategory) {
								// Populate the dropdown with sub-category values
								matchingSubCategory.value.forEach((subCategory) => {
									const option = $("<option></option>");
									option.attr("value", subCategory);
									option.html(subCategory);
									input.find("select").append(option);
								});

								// Set the initial value
								input.find("select").val(value);
							} else {
							}
						} else {
						}

						// Add change listener to update the value dynamically
						input.find("select").on("change", function () {
							const selectedValue = $(this).val();
							$(this).trigger("input"); // Trigger input event for change detection
						});

						if (!editable) input.find("select").prop("disabled", true);
						break;

					case "category-input":
						input = $(".le-attr-input-template-option").clone(true);
						input.removeClass("le-attr-input-template-option");
						input.find("span").html(prettyFieldName);
						input.find("select").attr("key", key);

						// Find the field object for the current key
						const currentField = this.editableLayer.get("fields").find((f) => f.name === key);

						if (currentField && currentField.categories) {
							// Populate the dropdown with categories
							currentField.categories.forEach((category) => {
								const option = $("<option></option>");
								option.attr("value", category);
								option.html(category);
								input.find("select").append(option);
							});

							// Set the initial value
							input.find("select").val(value);

							// Automatically load subcategories for the initial value
							const initialCategory = value;
							const subCategoryFields = this.editableLayer
								.get("fields")
								.filter((field) => field.controlType === "subcategory-input");
							subCategoryFields.forEach((subCategoryField) => {
								const matchingValueOption = subCategoryField.subCategories.find(
									(option) => option.parentField === key && option.type === initialCategory
								);

								if (matchingValueOption) {
									const subCategoryInput = $(`select[key="${subCategoryField.name}"]`);
									matchingValueOption.value.forEach((subCategory) => {
										const option = $("<option></option>");
										option.attr("value", subCategory);
										option.html(subCategory);
										subCategoryInput.append(option);
									});

									// Optionally set the first value as selected
									subCategoryInput.val(matchingValueOption.value[0]);
								}
							});
						} else {
							console.error(`Categories not found for field: ${key}`);
						}

						// Add change listener to update subcategories dynamically
						input.find("select").on("change", function () {
							const selectedCategory = $(this).val();

							// Clear all subcategory-input fields
							const subCategoryFields = app.plugins.LayerEditor.editableLayer
								.get("fields")
								.filter((field) => field.controlType === "subcategory-input");
							subCategoryFields.forEach((subCategoryField) => {
								const subCategoryInput = $(`select[key="${subCategoryField.name}"]`);
								subCategoryInput.empty(); // Clear existing options
							});

							// Populate subcategory-input fields if applicable
							subCategoryFields.forEach((subCategoryField) => {
								const matchingValueOption = subCategoryField.subCategories.find(
									(option) => option.parentField === key && option.type === selectedCategory
								);

								if (matchingValueOption) {
									const subCategoryInput = $(`select[key="${subCategoryField.name}"]`);
									matchingValueOption.value.forEach((subCategory) => {
										const option = $("<option></option>");
										option.attr("value", subCategory);
										option.html(subCategory);
										subCategoryInput.append(option);
									});

									// Optionally set the first value as selected
									subCategoryInput.val(matchingValueOption.value[0]);
								}
							});
						});

						if (!editable) input.find("select").prop("disabled", true);
						break;

					case "update-by":
						input = $(".le-attr-input-template-text").clone(true);
						input.removeClass("le-attr-input-template-text");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "html-input":
						input = $(".le-attr-input-template-htmleditor").clone(true);
						input.removeClass("le-attr-input-template-htmleditor");
						input.find("span").html(prettyFieldName);
						input.find("textarea").addClass("le-attr-htmleditor");
						input.find("textarea").attr("key", key);
						input.find("textarea").val(value);
						input.find("textarea").data("original-value", value);
						input.find("textarea").data("value-has-changed", false);
						if (!editable) input.find("textarea").prop("disabled", true);
						break;

					case "number-input":
						input = $(".le-attr-input-template-number").clone(true);
						input.removeClass("le-attr-input-template-number");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "date-time-input":
						// Check if value is not null or undefined before calling slice
						if (value && value.slice && value.slice(-1) == "Z") {
							value = value.substring(0, value.length - 1);
						}
						input = $(".le-attr-input-template-datetime").clone(true);
						input.removeClass("le-attr-input-template-datetime");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;
					case "date-input":
						// Check if value is not null or undefined before calling slice
						if (value && value.slice && value.slice(-1) == "Z") {
							value = value.substring(0, value.length - 1);
						}
						input = $(".le-attr-input-template-date").clone(true);
						input.removeClass("le-attr-input-template-date");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "date-time-UTC-input":
						if (value) {
							value = convertUTCToDeviceTime(value);
						}
						// Check if value is not null or undefined before calling slice
						if (value && value.slice && value.slice(-1) == "Z") {
							value = value.substring(0, value.length - 1);
						}
						input = $(".le-attr-input-template-datetime").clone(true);
						input.removeClass("le-attr-input-template-datetime");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "update-datetime_UTC":
						// Check if value is not null or undefined before processing
						if (value) {
							// Convert UTC datetime to local time
							const utcDate = new Date(value);
							const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
							value = localDate.toISOString().slice(0, 19).replace("T", " "); // Format as local datetime
						}
						input = $(".le-attr-input-template-datetime").clone(true);
						input.removeClass("le-attr-input-template-datetime");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "comment-input":
						var commentObject = {
							key: key,
							comments: [], // Nested list for parsed values
						};
						input = $(".le-attr-input-template-comment-input").clone(true);
						input.removeClass("le-attr-input-template-comment-input");
						input.find("span").html(prettyFieldName);
						input.find("textarea").attr("key", key); // Use textarea instead of input
						input.find("#le-comment-input-container").attr("key", key); // Add key to le-comment-input-container
						input.find("#le-add-comment").attr("key", key); // Add key to le-add-comment
						input.find("textarea").data("original-value", JSON.stringify(value));
						input.find("textarea").data("value-has-changed", false);
						if (!editable) input.find("textarea").prop("disabled", true);

						// Parse the value if it's a JSON string
						let parsedValue = value;
						if (typeof value === "string") {
							try {
								parsedValue = JSON.parse(value);
								//this.commentArray = parsedValue;  // Store parsed values in commentArray
							} catch (e) {
								console.error("Failed to parse value as JSON", e);
							}
						}
						// If parsed value is an array, add it to the nested object and display it
						if (Array.isArray(parsedValue)) {
							commentObject.comments = parsedValue.map((comment) => ({
								userID: comment.userID,
								date: comment.date, //
								comment: comment.comment,
							}));

							// Append each comment to the display
							parsedValue.forEach((comment) => {
								const commentCard = `
									<div class="card mb-1">
										<div class="card-body p-2">
											<h6 class="card-title mb-1" style="font-size: .875rem;">${comment.userID}</h6>
											<h6 class="card-subtitle mb-1 text-muted" style="font-size: .875rem;">${
												new Date(comment.date).toISOString().split("T")[0]
											}, 
               								 ${new Date(comment.date).toLocaleTimeString()}</h6>
											<p class="card-text">${comment.comment}</p>
										</div>
									</div>
								`;
								input.find(".le-comment-display").append(commentCard);
							});
						}

						// Now you have a newObject with a nested list
						this.commentArray.push(commentObject);
						break;

					default:
						input = null;
						break;
				}

				// Add click listener for adding new comments
				$(".le-add-comment").on("click", (e) => {
					const input = $(e.target).siblings("textarea");
					const key = input.attr("key");
					const newComment = input.val();
					if (newComment.length > 0) {
						//Show edit and discard buttons if newComment length is >0
						app.plugins.LayerEditor.moveFeatureActionButtonContainer();
						$("#le-discard-changes-btn").show();
						$("#le-save-changes-btn").show();
						if (newComment) {
							const commentObj = app.plugins.LayerEditor.commentArray.find((obj) => obj.key === key);
							const newCommentEntry = {
								userID: app.plugins.SessionMinder.userId,
								date: new Date().toISOString(),
								comment: newComment,
							};
							const originalValue = JSON.parse(input.data("original-value"));

							if (originalValue !== null) {
								const updatedValue = [...originalValue, newCommentEntry];
								input.data("original-value", JSON.stringify(updatedValue));
								commentObj.comments.push(newCommentEntry);
							} else {
								const updatedValue = [newCommentEntry];
								input.data("original-value", JSON.stringify(updatedValue));
								commentObj.comments = updatedValue; // Assign the array directly
							}
							input.val("");
							input.trigger("input");

							// Update the correct .le-comment-display based on the key
							const commentDisplay = $(`.le-comment-display[key="${key}"]`);
							const commentCard = `
								<div class="card mb-1">
									<div class="card-body p-2">
										<h6 class="card-title mb-1" style="font-size: .875rem;">${app.plugins.SessionMinder.userId}</h6>
										<h6 class="card-subtitle mb-1 text-muted" style="font-size: .875rem;">${new Date().toISOString().split("T")[0]}, 
										${new Date().toLocaleTimeString()}</h6>
										<p class="card-text">${newComment}</p>
									</div>
								</div>
							`;
							commentDisplay.append(commentCard);
						}
					}
				});

				// Build attribute input for field with specified value options	(i.e. OPTIONS CONTROL)
			} else {
				input = $(".le-attr-input-template-option").clone(true);
				input.removeClass("le-attr-input-template-option");
				input.find("span").html(prettyFieldName);
				input.find("select").attr("key", key);
				$.each(valueOptions, function (index, value) {
					var option = $("<option></option>");
					option.attr("value", value);
					option.html(value);
					input.find("select").append(option);
				});
				input.find("select").val(value);
				input.find("select").data("original-value", value);
				input.find("select").data("value-has-changed", false);
				if (!editable) input.find("select").prop("disabled", true);
			}

			// Add attribute input
			if (input) {
				$("#le-attribute-form").append(input);
				input.show();
			}
		});

		// Show attribute editing form
		$("#le-attribute-form").show();

		//Show email button if configured
		if (app.plugins.LayerEditor.formEmail) {
			$("#le-email-button").show();
		}

		// Add change listeners to inputs
		$("#le-attribute-form").on("input change", ".le-form-input", (e) => {
			// Get the input
			const input = $(e.target);
			const originalValue = input.data("original-value");
			const currentValue = input.val();

			// Get the key
			const key = input.attr("key");

			// Switch the current value to null if the original value is null and the current is "blank"
			if (originalValue == null && currentValue === "") {
				currentValue = null;
			}

			// Track change
			if (originalValue != currentValue) {
				input.addClass("le-attr-input-changed");
				input.data("value-has-changed", true);
				if (!app.plugins.LayerEditor.editableFeatureAttributeChanges.includes(key)) {
					app.plugins.LayerEditor.editableFeatureAttributeChanges.push(key);
				}
			} else {
				input.removeClass("le-attr-input-changed");
				input.data("value-has-changed", false);
				if (app.plugins.LayerEditor.editableFeatureAttributeChanges.includes(key)) {
					app.plugins.LayerEditor.editableFeatureAttributeChanges.splice(
						app.plugins.LayerEditor.editableFeatureAttributeChanges.indexOf(key),
						1
					);
				}
			}

			// Run feature change watcher
			app.plugins.LayerEditor.featureChangeWatcher();
		});

		// Initialize html editors if required
		tinymce.init({
			selector: "textarea.le-attr-htmleditor",
			promotion: false,
			license_key: "gpl",
			menubar: false,
			plugins: "code autoresize",
			toolbar: "undo redo bold italic alignleft aligncenter alignright alignjustify indent outdent code",
			toolbar_mode: "wrap",
			statusbar: false,
			min_height: 200,
			setup: function (editor) {
				editor.on("input change", (e) => {
					var assocTextAreaElement = $("#" + editor.id);
					assocTextAreaElement.val(editor.getContent());
					assocTextAreaElement.trigger("input");
					if (assocTextAreaElement.data("value-has-changed") === true) {
						editor.getBody().style.backgroundColor = "pink";
					} else {
						editor.getBody().style.backgroundColor = "";
					}
				});
			},
		});
	}

	/**
	 * Function: showNewFeatureEditor
	 * @param (object) layer
	 * @returns () nothing
	 * Function to show and populate the feature editor for the passed layer
	 */
	showNewFeatureEditor(layer) {
		// Reset the attribute editing form
		tinymce.remove("textarea.le-attr-htmleditor");
		$("#le-attribute-form .le-attr-input-div").remove();
		$("#le-attribute-form").hide();

		// Get layer attributes
		const attributes = layer.get("fields");

		// Add each attribute as a row
		attributes.forEach((field) => {
			const key = field.name;
			const prettyFieldName = field.nameTransform ? field.nameTransform() : key;
			const value = field.valueTransform;
			const editable = field.editable || false;
			const valueOptions = field.valueOptions || [];
			const controlType = field.controlType || "text-input";
			// Build attribute input for field with NO specified value options
			let input;
			if (valueOptions.length == 0) {
				switch (controlType) {
					case "text-input":
						input = $(".le-attr-input-template-text").clone(true);
						input.removeClass("le-attr-input-template-text");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "category-input":
						input = $(".le-attr-input-template-option").clone(true);
						input.removeClass("le-attr-input-template-option");
						input.find("span").html(prettyFieldName);
						input.find("select").attr("key", key);

						// Find the field object for the current key
						const currentField = this.editableLayer.get("fields").find((f) => f.name === key);

						if (currentField && currentField.categories) {
							// Populate the dropdown with categories
							currentField.categories.forEach((category) => {
								const option = $("<option></option>");
								option.attr("value", category);
								option.html(category);
								input.find("select").append(option);
							});
						} else {
							console.error(`Categories not found for field: ${key}`);
						}

						// Set the initial value and add change listener
						input.find("select").val(value);
						input.find("select").on("change", function () {
							const selectedCategory = $(this).val();

							// Clear all subcategory-input fields
							const subCategoryFields = app.plugins.LayerEditor.editableLayer
								.get("fields")
								.filter((field) => field.controlType === "subcategory-input");
							subCategoryFields.forEach((subCategoryField) => {
								const subCategoryInput = $(`select[key="${subCategoryField.name}"]`);
								subCategoryInput.empty(); // Clear existing options
							});

							// Populate subcategory-input fields if applicable
							subCategoryFields.forEach((subCategoryField) => {
								const matchingValueOption = subCategoryField.valueOptions.find(
									(option) => option.parentField === key && option.type === selectedCategory
								);

								if (matchingValueOption) {
									const subCategoryInput = $(`select[key="${subCategoryField.name}"]`);
									matchingValueOption.value.forEach((subCategory) => {
										const option = $("<option></option>");
										option.attr("value", subCategory);
										option.html(subCategory);
										subCategoryInput.append(option);
									});

									// Optionally set the first value as selected
									subCategoryInput.val(matchingValueOption.value[0]);
								}
							});
						});

						if (!editable) input.find("select").prop("disabled", true);
						break;

					case "subcategory-input":
						input = $(".le-attr-input-template-option").clone(true);
						input.removeClass("le-attr-input-template-option");
						input.find("span").html(prettyFieldName);
						input.find("select").attr("key", key);

						// Find the field object for the current key
						const subCategoryField = this.editableLayer.get("fields").find((f) => f.name === key);

						if (subCategoryField && subCategoryField.subCategories) {
							// Get the parent field value (e.g., WAIVER)
							const parentFieldValue = featureProperties[subCategoryField.subCategories[0].parentField];

							// Find the matching sub-category based on the parent field value
							const matchingSubCategory = subCategoryField.subCategories.find(
								(subCategory) => subCategory.type === parentFieldValue
							);

							if (matchingSubCategory) {
								// Populate the dropdown with sub-category values
								matchingSubCategory.value.forEach((subCategory) => {
									const option = $("<option></option>");
									option.attr("value", subCategory);
									option.html(subCategory);
									input.find("select").append(option);
								});

								// Set the initial value
								input.find("select").val(value);
							} else {
							}
						} else {
						}

						// Add change listener to update the value dynamically
						input.find("select").on("change", function () {
							const selectedValue = $(this).val();
							$(this).trigger("input"); // Trigger input event for change detection
						});

						if (!editable) input.find("select").prop("disabled", true);
						break;

					case "update-by":
						input = $(".le-attr-input-template-text").clone(true);
						input.removeClass("le-attr-input-template-text");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "textarea-input":
						input = $(".le-attr-input-template-textarea").clone(true);
						input.removeClass("le-attr-input-template-textarea");
						input.find("span").html(prettyFieldName);
						input.find("textarea").attr("key", key);
						if (!editable) input.find("textarea").prop("disabled", true);
						break;

					case "html-input":
						input = $(".le-attr-input-template-htmleditor").clone(true);
						input.removeClass("le-attr-input-template-htmleditor");
						input.find("span").html(prettyFieldName);
						input.find("textarea").addClass("le-attr-htmleditor");
						input.find("textarea").attr("key", key);
						if (!editable) input.find("textarea").prop("disabled", true);
						break;

					case "number-input":
						input = $(".le-attr-input-template-number").clone(true);
						input.removeClass("le-attr-input-template-number");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "date-time-input":
						input = $(".le-attr-input-template-datetime").clone(true);
						input.removeClass("le-attr-input-template-datetime");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						if (!editable) input.find("input").prop("disabled", true);
						break;

					case "update-datetime_UTC":
						// Check if value is not null or undefined before processing
						if (value) {
							// Convert UTC datetime to local time
							const utcDate = new Date(value);
							const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
							value = localDate.toISOString().slice(0, 19).replace("T", " "); // Format as local datetime
						}
						input = $(".le-attr-input-template-datetime").clone(true);
						input.removeClass("le-attr-input-template-datetime");
						input.find("span").html(prettyFieldName);
						input.find("input").attr("key", key);
						input.find("input").val(value);
						input.find("input").data("original-value", value);
						input.find("input").data("value-has-changed", false);
						if (!editable) input.find("input").prop("disabled", true);
						break;
					case "comment-input":
						input = $(".le-attr-input-template-comment-input").clone(true);
						input.removeClass("le-attr-input-template-comment-input");
						input.find("span").html(prettyFieldName);
						input.find("textarea").attr("key", key); // Use textarea instead of input
						input.find("#le-comment-input-container").attr("key", key); // Add key to le-comment-input-container
						input.find("#le-add-comment").attr("key", key); // Add key to le-add-comment
						if (!editable) input.find("textarea").prop("disabled", true);
						break;

					default:
						input = null;
						break;
				}
			} else {
				// Build attribute input for field with specified value options
				input = $(".le-attr-input-template-option").clone(true);
				input.removeClass("le-attr-input-template-option");
				input.find("span").html(prettyFieldName);
				input.find("select").attr("key", key);
				valueOptions.forEach((value) => {
					const option = $("<option></option>");
					option.attr("value", value);
					option.html(value);
					input.find("select").append(option);
				});
				//if (!editable) input.find("select").prop("disabled", true);
			}

			// Add attribute input
			if (input) {
				$("#le-attribute-form").append(input);
				input.show();
			}
		});

		// Add click listener for adding new comments
		$("#le-attribute-form .le-add-comment").on("click", (e) => {
			const input = $(e.target).siblings("textarea");
			const key = input.attr("key");
			const newComment = input.val();
			if (newComment) {
				const originalValue = JSON.parse(input.data("original-value"));
				const updatedValue = [
					...originalValue,
					{
						userID: "currentUser",
						date: new Date().toISOString(),
						comment: newComment,
					},
				];
				input.data("original-value", JSON.stringify(updatedValue));
				input.val("");
				input.trigger("input");
			}
		});

		// Add Geometry field with buttons
		const geometryField = `
			<div class="input-group input-group-sm mb-1 le-attr-input-div">
				<span class="input-group-text border-0 bg-transparent justify-content-end le-attr-input-label">Add Geometry</span>
				<div class="le-tab-geometry-grp">
					<div class="le-edit-btn" data-action="point" style="margin-bottom: 1px;" title="Add a Point">
						<img class="le-edit-btn-img" src="application/plugins/LayerEditor/img/icons-v2/point-icon.svg">
					</div>
					<div class="le-edit-btn" data-action="linestring" style="margin-bottom: 1px;" title="Add a Line">
						<img class="le-edit-btn-img" src="application/plugins/LayerEditor/img/icons-v2/line-icon.svg">
					</div>
					<div class="le-edit-btn" data-action="polygon" title="Add a Polygon" style="">
						<img class="le-edit-btn-img" src="application/plugins/LayerEditor/img/icons-v2/poly-icon.svg">
					</div>
				</div>
			</div>
		`;
		$("#le-attribute-form").append(geometryField);

		// Register click event for geometry buttons
		$(".le-edit-btn-img").on("click", function () {
			const action = $(this).parent().data("action");
		});

		// Show attribute editing form
		$("#le-attribute-form").show();

		// Initialize html editors if required
		tinymce.init({
			selector: "textarea.le-attr-htmleditor",
			promotion: false,
			license_key: "gpl",
			menubar: false,
			plugins: "code autoresize",
			toolbar: "undo redo bold italic alignleft aligncenter alignright alignjustify indent outdent code",
			toolbar_mode: "wrap",
			statusbar: false,
			min_height: 200,
			setup: function (editor) {
				editor.on("input change", (e) => {
					const assocTextAreaElement = $("#" + editor.id);
					assocTextAreaElement.val(editor.getContent());
					assocTextAreaElement.trigger("input");
					if (assocTextAreaElement.data("value-has-changed") === true) {
						editor.getBody().style.backgroundColor = "pink";
					} else {
						editor.getBody().style.backgroundColor = "";
					}
				});
			},
		});
	}

	/**
	 * Function: transferAttributesOntoEditableFeature
	 * @param () none
	 * @returns () nothing
	 * Function to transfer changed attributes on ol feature (prior to saving)
	 */
	transferAttributesOntoEditableFeature() {
		$("#le-attribute-form .le-form-input").each(function () {
			// Get the input
			var input = $(this);
			var currentValue = input.val();

			// Get the key
			var key = input.attr("key");

			// Modify the editable feature attribute
			//if (input.prop("disabled") === false) {
			app.plugins.LayerEditor.editableFeature.set(key, currentValue);
			//}
		});
	}

	/**
	 * Function: featureChangeWatcher
	 * @param () none
	 * @returns () nothing
	 * Function to that watches changes to a feature and modifies the interface to suit
	 */
	featureChangeWatcher() {
		if (
			app.plugins.LayerEditor.editableFeatureAttributeChanges.length > 0 ||
			app.plugins.LayerEditor.editableFeatureGeometryHasChanged == true
		) {
			app.plugins.LayerEditor.moveFeatureActionButtonContainer();
			$("#le-discard-changes-btn").show();
			$("#le-save-changes-btn").show();
			if (app.plugins.LayerEditor.select) app.plugins.LayerEditor.select.setActive(false);
			return;
		}
		$("#le-discard-changes-btn").hide();
		$("#le-save-changes-btn").hide();
		if (app.plugins.LayerEditor.select) app.plugins.LayerEditor.select.setActive(true);
	}

	/**
	 * Function: featureDeleteWatcher
	 * @param () none
	 * @returns () nothing
	 * Function to that watches if features are marked for deletion and modifies the interface to suit
	 */
	featureDeleteWatcher() {
		if (app.plugins.LayerEditor.delete) {
			if (app.plugins.LayerEditor.delete.getFeatures().getArray().length > 0) {
				app.plugins.LayerEditor.moveFeatureActionButtonContainer();
				$("#le-delete-features-btn").show();
				$("#le-canceldelete-features-btn").show();
				return;
			}
		}
		$("#le-delete-features-btn").hide();
		$("#le-canceldelete-features-btn").hide();
	}

	/**
	 * Function: moveFeatureActionButtonContainer
	 * @param () none
	 * @returns () nothing
	 * Function to move the feature action button conatiner based on device
	 */
	moveFeatureActionButtonContainer() {
		if (isMobile()) {
			$("#le-feature-action-btn-container").detach().appendTo("body");
			$("#le-feature-action-btn-container").css("width", "100%");
			$("#le-feature-action-btn-container").css("bottom", "25px");
		} else {
			$("#le-feature-action-btn-container").detach().appendTo("#Editor-tab-content");
			$("#le-feature-action-btn-container").css("width", "calc(100% - 55px)");
			$("#le-feature-action-btn-container").css("bottom", "12px");
			showSidebar();
			activateSidebarTab(app.plugins.LayerEditor.tabNav);
		}
	}

	/**
	 * Function: checkForUnsavedChanges
	 * @param () none
	 * @returns (boolean) whether editable feature has unsvaed changes
	 * Function to check for unsaved changes and prompt user to save/discard
	 */
	checkForUnsavedChanges() {
		if (
			app.plugins.LayerEditor.editableFeatureAttributeChanges.length > 0 ||
			app.plugins.LayerEditor.editableFeatureGeometryHasChanged == true ||
			$(".le-comment-input-container .le-attr-input-changed").length > 0 // Detect changes in le-comment-input-container
		) {
			bootbox.dialog({
				title: "Unsaved Changes",
				message: "You have unsaved changes.  What do you want to do?",
				closeButton: true,
				centerVertical: true,
				buttons: {
					discard: {
						label: "Discard Changes",
						className: "btn-warning",
						callback: function () {
							$(this).modal("hide");
							$("#le-discard-changes-btn").trigger("click");
						},
					},
					save: {
						label: "Save Changes",
						className: "btn-success",
						callback: function () {
							$(this).modal("hide");
							$("#le-save-changes-btn").trigger("click");
						},
					},
				},
			});
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Function: saveFeature
	 * @param () none
	 * @returns () nothing
	 * Function to save feature changes
	 */
	saveFeature() {
		// Transfer the changes over to the editable feature
		app.plugins.LayerEditor.transferAttributesOntoEditableFeature();

		// Step 2: Loop through fields and assign values to newFeature
		$.each(this.editableLayer.get("fields"), function (index, field) {
			const fieldName = field.name;

			// Handle "update-by"
			if (field.controlType === "update-by") {
				const updatedUser = app.plugins.SessionMinder.userId;
				app.plugins.LayerEditor.editableFeature.set(fieldName, updatedUser);
			}

			// Handle "autoincrementor"
			else if (field.controlType === "autoincrementor") {
				const previousValue = app.plugins.LayerEditor.editableFeature?.get(fieldName) || 0;
				const newValue = previousValue + 1;
				app.plugins.LayerEditor.editableFeature.set(fieldName, newValue);
			}

			// Handle "update-datetime_UTC"
			else if (field.controlType === "update-datetime_UTC") {
				const currentUTCDateTime = new Date().toISOString();
				app.plugins.LayerEditor.editableFeature.set(fieldName, currentUTCDateTime);
			} else if (field.controlType === "date-input") {
				const input = document.querySelector(`#le-attribute-form .le-form-input[key="${fieldName}"]`);
				if (input && input.value) {
					const localValue = input.value; // e.g. "2025-07-25"
					const [year, month, day] = localValue.split("-").map(Number);
					const dateObj = new Date(year, month - 1, day); // local time
					const utcString = dateObj.toISOString(); // "2025-07-25T07:00:00.000Z" in PDT
					app.plugins.LayerEditor.editableFeature.set(fieldName, utcString);
				} else {
					app.plugins.LayerEditor.editableFeature.set(fieldName, null);
				}
			}

			// Handle "date-time-input"
			else if (field.controlType === "date-time-UTC-input") {
				const inputs = document.querySelectorAll("#le-attribute-form .le-form-input");
				inputs.forEach((input) => {
					const key = input.getAttribute("key");
					if (key === fieldName) {
						const localValue = input.value;
						if (localValue) {
							const inputDate = new Date(localValue).toISOString();
							app.plugins.LayerEditor.editableFeature.set(fieldName, inputDate);
						} else {
							app.plugins.LayerEditor.editableFeature.set(fieldName, null);
						}
					}
				});
			}
		});
		// Show working
		app.plugins.LayerEditor.showLayerEditorWorking(true);

		// Include commentArray in the feature properties
		if (app.plugins.LayerEditor.commentArray.length > 0) {
			app.plugins.LayerEditor.commentArray.forEach((commentObj) => {
				if (commentObj.key && Array.isArray(commentObj.comments)) {
					app.plugins.LayerEditor.editableFeature.set(commentObj.key, JSON.stringify(commentObj.comments));
				}
			});
		}
		// Execute the write function and handle the response
		app.plugins.LayerEditor.executeWFSTransaction(
			null,
			[app.plugins.LayerEditor.editableFeature],
			null,
			function (success, res) {
				if (success === true) {
					// Refresh the editable layer
					app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
					app.plugins.LayerEditor.editableLayer.getSource().refresh();

					// Define the function that will monitor the editable layer and do some actions after it has finished loading
					var attempt = 0;
					var lastEditableFeatureId = app.plugins.LayerEditor.editableFeature.getId();
					var waitForCompletedRefresh = function () {
						if (app.plugins.LayerEditor.editableLayer.get("isLoading") == false) {
							var selectedFeatures = [];
							$.each(
								app.plugins.LayerEditor.editableLayerSelectedFeatureIds,
								function (index, featureId) {
									selectedFeatures.push(
										app.plugins.LayerEditor.editableLayer.getSource().getFeatureById(featureId)
									);
								}
							);
							app.plugins.LayerEditor.populateFeatureEditorSelector(selectedFeatures);
							app.plugins.LayerEditor.showFeatureEditor(lastEditableFeatureId);
							app.plugins.LayerEditor.showLayerEditorWorking(false);
						} else {
							attempt++;
							if (attempt < 75) {
								setTimeout(waitForCompletedRefresh, 250);
							} else {
								logger("ERROR", "Gave up waiting for layer to reload after edit");
								app.plugins.LayerEditor.showLayerEditorWorking(false);
							}
						}
					};
					waitForCompletedRefresh();
				}
			}
		);
	}

	/**
	 * Function: deleteFeatures
	 * @param () none
	 * @returns () nothing
	 * Function to delete features in the delete features selection
	 */
	deleteFeatures() {
		// Execute the WFS-T transaction and handle the response
		var featuresToDelete = app.plugins.LayerEditor.delete.getFeatures().getArray();
		app.plugins.LayerEditor.executeWFSTransaction(null, null, featuresToDelete, function (success, res) {
			if (success === true) {
				// Clear the feature delete selection and run the watcher
				app.plugins.LayerEditor.delete.getFeatures().clear();
				app.plugins.LayerEditor.featureDeleteWatcher();

				// Refresh the editable layer
				app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
				app.plugins.LayerEditor.editableLayer.getSource().refresh();
			}
		});
	}

	/**
	 * Function: executeWFSTransaction
	 * @param (array) added
	 * @param (array) modified
	 * @param (array) removed
	 * @param (function) callback
	 * @returns () nothing
	 * Function to add/modify/remove feature via WFS-T transaction
	 */
	executeWFSTransaction(added, modified, removed, callback) {
		const featureCount = app.plugins.LayerEditor.editableLayer.getSource().getFeatures().length;

		// Show the map spinner
		showMapSpinner();

		// Handle optional parameters
		callback = callback || function () {};

		// Define the WFS format
		var formatWFS = new ol.format.WFS();

		// Define the GML format
		var formatGML = new ol.format.GML({
			featureNS: app.plugins.LayerEditor.editableLayer.getSource().layerNamespace,
			featureType: app.plugins.LayerEditor.editableLayer.getSource().layerName,
			version: "2.0.0",
			exceptions: "application/json",
			geometryName: app.plugins.LayerEditor.editableLayer.getSource().geometryColumnName,
			srsName: app.plugins.LayerEditor.editableLayer.getSource().params.srsName,
		});
		// Set default values for fields based on layer config
		if (added) {
			//Set the default value for each field
			$.each(app.plugins.LayerEditor.editableLayer.get("fields"), function (index, field) {
				if (field.defaultValue) {
					$.each(added, function (index, feature) {
						var defaultValue = field.defaultValue();
						feature.set(field.name, defaultValue);
					});
				}
			});

			// Detect if any field is required
			const requiredFields = app.plugins.LayerEditor.editableLayer
				.get("fields")
				.filter((field) => field.required);

			if (requiredFields.length > 0) {
				// Build the message with all fields and their values
				let message = "<form id='edit-fields-form'>";
				requiredFields.forEach((field) => {
					if (field.valueOptions) {
						message += `
							<div class="form-group">
								<label for="${field.name}">${field.name}</label>
								<select class="le-form-input form-select form-select-sm form-control" id="${field.name}" name="${field.name}" >`;
						$.each(field.valueOptions, function (index, value) {
							message += `<option value="${value}">${value}</option>`;
						});									
						message +=	`
								</select>
							</div>
						`;
					} else {
						message += `
							<div class="form-group">
								<label for="${field.name}">${field.name}</label>
								<input type="text" class="form-control" id="${field.name}" name="${field.name}" value="${""}">
							</div>
						`;
					}
				});
				message += "</form>";

				// Show the bootbox confirm dialog
				bootbox.confirm({
					title: "Edit Required Fields",
					message: message,
					buttons: {
						cancel: {
							label: "Cancel",
						},
						confirm: {
							label: "Save",
							className: "btn-success",
						},
					},
					callback: function (result) {
						if (result === true) {
							// Collect updated field values
							const updatedFields = {};
							requiredFields.forEach((field) => {
								updatedFields[field.name] = $(`#edit-fields-form #${field.name}`).val();
							});

							// Update the `added` features with the new values
							added.forEach((feature) => {
								Object.keys(updatedFields).forEach((key) => {
									feature.set(key, updatedFields[key]);
								});
							});
							executeConfirmedAction();
						} else {
							// User canceled, abort the function
							app.plugins.LayerEditor.editableLayer.getSource().refresh();
							$(this).modal("hide");
							hideMapSpinner();
							return;
						}
					},
				});
			} else {
				executeConfirmedAction();
			}
		} else {
			executeConfirmedAction();
		}

		// Function to execute the confirmed action, will run as default if no required fields are set
		function executeConfirmedAction() {
			const reprojectFeatures = (features) => {
				if (
					!features ||
					app.map.getView().getProjection().getCode() ===
						app.plugins.LayerEditor.editableLayer.getSource().params.srsName
				)
					return features;

				return features.map((feature) => {
					const geometry = feature.getGeometry();
					if (geometry) {
						const type = geometry.getType();
						let coords = geometry.getCoordinates();

						// Helper to check all coordinates are finite
						const areCoordsFinite = (arr) =>
							Array.isArray(arr) && arr.flat(Infinity).every(Number.isFinite);

						if (type === "MultiPolygon") {
							// MultiPolygon: check each polygon
							if (Array.isArray(coords) && coords.every((poly) => areCoordsFinite(poly))) {
								geometry.transform(
									app.map.getView().getProjection().getCode(),
									app.plugins.LayerEditor.editableLayer.getSource().params.srsName
								);
							}
						} else {
							// Other geometry types
							if (areCoordsFinite(coords)) {
								geometry.transform(
									app.map.getView().getProjection().getCode(),
									app.plugins.LayerEditor.editableLayer.getSource().params.srsName
								);
							}
						}
					}
					return feature;
				});
			};

			// Reproject features if necessary
			added = reprojectFeatures(added);
			modified = reprojectFeatures(modified);
			removed = reprojectFeatures(removed);

			//Count feautures in editableLayer
			const featureCount = app.plugins.LayerEditor.editableLayer.getSource().getFeatures().length;

			// Build the xml packet
			var xml = formatWFS.writeTransaction(added, modified, removed, formatGML);
			// Convert xml packet to a string
			var data = new XMLSerializer().serializeToString(xml);

			// Replace typeName="feature:<layer_name>" with typeName="<layer_namespace>:<layer_name>"
			data = data.replace(
				/typeName="feature:/,
				'typeName="' + app.plugins.LayerEditor.editableLayer.getSource().layerNamespace + ":"
			);

			// Post the transaction packet to the WFS-T endpoint
			$.ajax({
				type: "POST",
				url: app.plugins.LayerEditor.editableLayer.getSource().layerUrl,
				contentType: "text/xml",
				dataType: "xml",
				processData: false,
				data: data,
			})

				// Handle a valid response
				.done(function (response) {
					hideMapSpinner();
					var result = formatWFS.readTransactionResponse(response);
					callback(true, result);
				})

				// Handle a failure
				.fail(function (jqxhr, settings, exception) {
					hideMapSpinner();
					logger(
						"ERROR",
						"Error commiting transaction to " +
							app.plugins.LayerEditor.editableLayer.getSource().layerUrl +
							" [" +
							exception +
							"]"
					);

					// Warn user of error and give them a chance to retry.
					bootbox.dialog({
						title: "ERROR",
						message: "Could not modify '<i>" + app.plugins.LayerEditor.editableLayer.get("title") + "</i>'",
						size: "small",
						closeButton: false,
						centerVertical: true,
						buttons: {
							retry: {
								label: "Retry",
								className: "btn-success",
								callback: function () {
									$(this).modal("hide");
									app.plugins.LayerEditor.executeWFSTransaction(added, modified, removed, callback);
								},
							},
							cancel: {
								label: "Cancel",
								className: "btn-danger",
								callback: function () {
									app.plugins.LayerEditor.editableLayer.getSource().refresh();
									$(this).modal("hide");
								},
							},
						},
					});
				});
		}
	}

	/**
	 * Function populateFeatureList
	 * @param {Array} features
	 *
	 * Populate the side bar with a list of features possibly
	 * from different layers. The user will then have the option
	 * to copy into the editable layer.
	 */
	populateFeatureList(layers) {
		// Show the editor tab
		activateSidebarTab(app.plugins.LayerEditor.tabNav);

		// Show sidebar immediately if desktop
		if (!isMobile()) showSidebar();

		// Empty any existing results
		$("#le-copying-container").empty().show();

		// Define the callback
		var callback = function (success, result) {
			// Get the new feature ID
			var newlyInsertedFeatureId = result.insertIds[0];

			// Refresh the editable layer
			app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
			app.plugins.LayerEditor.editableLayer.getSource().refresh();

			// Define the function that will monitor the editable layer and do some actions after it has finished loading
			var attempt = 0;
			var waitForCompletedRefresh = function () {
				if (app.plugins.LayerEditor.editableLayer.get("isLoading") == false) {
					var newFeature = app.plugins.LayerEditor.editableLayer
						.getSource()
						.getFeatureById(newlyInsertedFeatureId);
					if (newFeature) {
						// Switch to the modify feature tool
						$(".le-edit-btn[data-action=modify]").trigger("click");

						// Edit the feature
						app.plugins.LayerEditor.populateFeatureEditorSelector([newFeature]);
					}
					app.plugins.LayerEditor.showLayerEditorWorking(false);
				} else {
					attempt++;
					if (attempt < 95) {
						setTimeout(waitForCompletedRefresh, 250);
					} else {
						logger("ERROR", "Gave up waiting for layer to reload after new insert");
						app.plugins.LayerEditor.showLayerEditorWorking(false);
					}
				}
			};
			waitForCompletedRefresh();
		};

		const $accordion = $('<div class="accordion" id="accordionExample"></div>');

		layers.forEach((layer, layerIndex) => {
			const layerId = `layer-accord${layerIndex}`;
			const bodyId = `layer-accord-body${layerIndex}`;
			const isFeatureCollection = layers[0].features.type === "FeatureCollection";
			const features = isFeatureCollection ? layer.features.features : layer.features;
			const numFeatures = features.length;

			// Accordion Header
			const accordionItem = $(`
			<div class="accordion-item">
				<h2 class="accordion-header" id="heading${layerIndex}">
					<button class="accordion-button ${layerIndex !== 0 ? "collapsed" : ""}" type="button" data-bs-toggle="collapse"
						data-bs-target="#${layerId}" aria-expanded="${layerIndex === 0}" aria-controls="${layerId}">
						${layer.title}<sup><span class="badge bg-danger"style="margin-left: 2px;">${numFeatures}</span></sup>
					</button>
				</h2>
				<div id="${layerId}" class="accordion-collapse collapse ${layerIndex === 0 ? "show" : ""}"
					aria-labelledby="heading${layerIndex}" data-bs-parent="#accordionExample">
					<div class="accordion-body" id="${bodyId}">
					</div>
				</div>
			</div>
		`);

			// Add feature buttons
			const $body = accordionItem.find(`#${bodyId}`);

			features.forEach((feature, featureIndex) => {
				const featureBtn = $(
					`<button type="button" class="btn btn-light m-1">${layer.title}[${featureIndex + 1}]</button>`
				);
				featureBtn
					.data("feature", feature)
					.on("mouseenter", (e) => {
						const geom = $(e.target).data("feature");
						const copiedFeature = new ol.format.GeoJSON().readFeature(geom);
						highlightFeature(copiedFeature);
					})
					.on("mouseleave", clearHighlightedFeatures())
					.on("click", function () {
						const geom = $(this).data("feature");
						const copiedFeature = new ol.format.GeoJSON().readFeature(geom);

						// Geometry remapping
						const geomCol = app.plugins.LayerEditor.editableLayer.getSource().geometryColumnName;
						let attributeTransforms = app.plugins.LayerEditor.editableLayer.get("attributeTransforms");

						const properties = copiedFeature.getProperties();
						Object.entries(properties).forEach(([key, value]) => {
							if (key === copiedFeature.getGeometryName()) {
								copiedFeature.unset(key);
								copiedFeature.set(geomCol, value);
								copiedFeature.setGeometryName(geomCol);
							}

							if (attributeTransforms) {
								Object.entries(attributeTransforms).forEach(([toAttr, fromAttr]) => {
									if (key === fromAttr) {
										copiedFeature.unset(key);
										copiedFeature.set(toAttr, value);
									}
								});
							}
						});

						// Post to WFS
						app.plugins.LayerEditor.executeWFSTransaction([copiedFeature], null, null, callback);
						$("#le-copying-container").hide();
						clearHighlightedFeatures();
					});

				$body.append(featureBtn);
			});

			$accordion.append(accordionItem);
		});

		$("#le-copying-container").append($accordion);
	}

	/**
	 * Function: toggleEditorFunction
	 * @param (string) action
	 * @returns () nothing
	 * Function to toggle (activate) an editing function based on passed action
	 */
	toggleEditorFunction(action) {
		/**
		 * Function: copyFeatures
		 * @param (object) searchFeature
		 * @returns () nothing
		 * Function copy features
		 */
		const copyFeatures = async (searchFeature) => {
			showMapSpinner();

			let availableLayerCount = 0;
			const layers = app.map.getLayers().getArray();

			// Count available overlay layers
			layers.forEach((layer) => {
				if (
					layer.get("type") != "overlay" ||
					layer.get("visible") !== true ||
					typeof layer.getSource().getFeatureInfoUrl != "function"
				)
					return;
				availableLayerCount++;
			});

			let collector = [];
			let promises = [];

			layers.forEach((layer) => {
				let serviceType = null;
				let layerUrl;
				if (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS) {
					serviceType = "WMS";
				} else if (layer.getSource() instanceof ol.source.Vector) {
					serviceType = "WFS";
				}

				if (serviceType == "WMS") {
					if (
						layer.get("type") != "overlay" ||
						layer.get("visible") !== true ||
						typeof layer.getSource().getFeatureInfoUrl != "function"
					)
						return;

					if (layer.getSource() instanceof ol.source.TileWMS) {
						layerUrl = layer.getSource().getUrls()[0];
					} else if (layer.getSource() instanceof ol.source.ImageWMS) {
						layerUrl = layer.getSource().getUrl();
					}
					layerUrl = layerUrl.replace(/\/ows/gi, "/wfs").replace(/\/wms/gi, "/wfs");
					const typeName = layer.getSource().getParams().LAYERS;
					let geometryField;
					$.each(layer.get("attributes"), function (index, attribute) {
						if (attribute.type.startsWith("gml:")) {
							geometryField = attribute.name;
						}
					});
					if (geometryField == null) return;
					if (layer.get("nativeProjection") == null) {
						layer.set("nativeProjection", "EPSG:3005");
					}
					const title = layer.get("title");
					const featureInLayerCoords = transformFeature(
						searchFeature,
						app.map.getView().getProjection().getCode(),
						layer.get("nativeProjection")
					);
					const wktFormat = new ol.format.WKT();
					const searchWKT = wktFormat.writeGeometry(featureInLayerCoords.getGeometry());

					// Use a promise for AJAX
					const promise = $.ajax({
						type: "GET",
						url: layerUrl,
						timeout: 10000,
						dataType: "json",
						data: {
							service: "WFS",
							version: "1.1.0",
							request: "GetFeature",
							typeNames: typeName,
							outputFormat: "application/json",
							maxFeatures: 1000,
							srsName: app.map.getView().getProjection().getCode(),
							cql_filter: "INTERSECTS(" + geometryField + "," + searchWKT + ")",
						},
						xhrFields: {
							withCredentials: layer.get("withCredentials") ? layer.get("withCredentials") : false,
						},
					})
						.then((features) => {
							collector.push({ title, features });
						})
						.catch((exception) => {
							logger(
								"ERROR",
								app.plugins.LayerEditor.name +
									": Could not copy features from " +
									layer.get("title") +
									" - " +
									exception
							);
							collector.push({ title, features: [] });
						});
					promises.push(promise);
				} else if (serviceType == "WFS") {
					if (layer.get("type") != "overlay" || layer.get("visible") !== true) return;
					const title = layer.get("title");
					const features = layer.getSource().getFeaturesInExtent(searchFeature.getGeometry().getExtent());
					if (features.length > 0) {
						let featureCollection = new ol.format.GeoJSON().writeFeaturesObject(features);
						collector.push({ title, features: featureCollection });
					}
					// For vector layers, push a resolved promise to keep the array in sync
					promises.push(Promise.resolve());
				}
			});

			// Wait for all AJAX requests to finish
			await Promise.all(promises);
			hideMapSpinner();
			app.plugins.LayerEditor.populateFeatureList(collector);
		};

		/**
		 * Function: toggleCopyFeature
		 * @param () none
		 * @returns () nothing
		 * Function to toggle the copy feature tool
		 */
		const toggleCopyFeature = () => {
			// Prepare for new map interaction
			this.turnEditingOff();

			// Copy based on a point click
			this.copyPoint = (e) => {
				// Proceed only if a map click
				//Old code for debugging
				//if (!e.originalEvent.path[0].matches("canvas") && !$(e.originalEvent.path[0]).hasClass("ol-layer")) return;
				if (!e.originalEvent.target.nodeName === "CANVAS" && !$(e.originalEvent.path[0]).hasClass("ol-layer"))
					return;

				// If in box select mode get out.
				if (e.originalEvent.ctrlKey) return;

				// Transform the map click coordinate into a tiny polygon feature (in map
				// coordinates).  Use a radius of 2 units and transform to 16 edges.
				var polygon = ol.geom.Polygon.fromCircle(new ol.geom.Circle(e.coordinate, 2), 16);
				var searchFeature = new ol.Feature(polygon);

				// Query for features
				copyFeatures(searchFeature);
			};

			// Copy based on drawing a box
			this.copyBox = (e) => {
				// Convert dragbox extent geometry into a feature
				var searchFeature = new ol.Feature({
					geometry: this.dragBox.getGeometry(),
				});

				// Query for features
				copyFeatures(searchFeature);
			};

			// The interaction for drawing a box
			this.dragBox = new ol.interaction.DragBox({
				condition: ol.events.condition.platformModifierKeyOnly,
			});

			// Redirect single map click
			redirectMapSingleClickFunction("alias", this.copyPoint);

			// Listen to box drag
			app.map.addInteraction(this.dragBox);
			this.dragBox.on("boxend", this.copyBox);
		};

		/**
		 * Function: toggleAddFeature
		 * @param (string) feature type
		 * @returns () nothing
		 * Function to toggle the add feature tool
		 */
		const toggleAddFeature = (featureType) => {
			// Prepare for new map interaction
			this.turnEditingOff();
			redirectMapSingleClickFunction("copy", null);

			// Track multipolygon mode and drawn polygons
			if (!this._multiPolygonMode) this._multiPolygonMode = false;
			if (!this._multiPolygonFeatures) this._multiPolygonFeatures = [];

			if (!this._multiLineMode) this._multiLineMode = false;
			if (!this._multiLineFeatures) this._multiLineFeatures = [];

			if (!this._multiPointMode) this._multiPointMode = false;
			if (!this._multiPointFeatures) this._multiPointFeatures = [];

			// Cache the polygon button for color changes
			const $polygonBtn = $('.le-edit-btn[data-action="polygon"]');
			const $lineBtn = $('.le-edit-btn[data-action="linestring"]');
			const $pointBtn = $('.le-edit-btn[data-action="point"]');

			const callback = (success, result) => {
				const newlyInsertedFeatureId = result.insertIds[0];
				app.plugins.LayerEditor.editableLayer.set("isLoading", true);
				app.plugins.LayerEditor.editableLayer.getSource().refresh();

				let attempt = 0;
				const waitForCompletedRefresh = () => {
					if (app.plugins.LayerEditor.editableLayer.get("isLoading") === false) {
						const newFeature = app.plugins.LayerEditor.editableLayer
							.getSource()
							.getFeatureById(newlyInsertedFeatureId);
						if (newFeature) {
							$(".le-edit-btn[data-action=modify]").trigger("click");
							app.plugins.LayerEditor.populateFeatureEditorSelector([newFeature]);
						}
						app.plugins.LayerEditor.showLayerEditorWorking(false);
					} else {
						attempt++;
						if (attempt < 95) {
							setTimeout(waitForCompletedRefresh, 250);
						} else {
							logger("ERROR", "Gave up waiting for layer to reload after new insert");
							app.plugins.LayerEditor.showLayerEditorWorking(false);
						}
					}
				};
				waitForCompletedRefresh();
			};

			// Listen for Ctrl key to toggle multipolygon mode
			const ctrlKeyHandler = (e) => {
				if (e.key === "Control") {
					// MultiLineString mode
					if (featureType === "linestring") {
						this._multiLineMode = !this._multiLineMode;
						$lineBtn.css("background-color", this._multiLineMode ? "#28a745" : "");
						if (!this._multiLineMode && this._multiLineFeatures.length > 0) {
							const allCoords = [];
							for (const f of this._multiLineFeatures) {
								const geom = f.getGeometry();
								if (geom.getType() === "LineString") {
									allCoords.push(geom.getCoordinates());
								} else if (geom.getType() === "MultiLineString") {
									allCoords.push(...geom.getCoordinates());
								}
							}
							const multiLineGeom = new ol.geom.MultiLineString(allCoords);
							const multiLineFeature = new ol.Feature({
								GEOMETRY: multiLineGeom,
							});
							multiLineFeature.setGeometryName("GEOMETRY");
							this.executeWFSTransaction([multiLineFeature], null, null, callback);
							this._multiLineFeatures = [];
						}
					}

					// MultiPolygon mode
					else if (featureType === "polygon") {
						this._multiPolygonMode = !this._multiPolygonMode;
						$polygonBtn.css("background-color", this._multiPolygonMode ? "#28a745" : "");
						if (!this._multiPolygonMode && this._multiPolygonFeatures.length > 0) {
							const allCoords = [];
							for (const f of this._multiPolygonFeatures) {
								const geom = f.getGeometry();
								if (geom.getType() === "Polygon") {
									allCoords.push(geom.getCoordinates());
								} else if (geom.getType() === "MultiPolygon") {
									allCoords.push(...geom.getCoordinates());
								}
							}
							const multiPolygonGeom = new ol.geom.MultiPolygon(allCoords);
							const multiPolygonFeature = new ol.Feature({
								GEOMETRY: multiPolygonGeom,
							});
							multiPolygonFeature.setGeometryName("GEOMETRY");
							this.executeWFSTransaction([multiPolygonFeature], null, null, callback);
							this._multiPolygonFeatures = [];
						}
					}

					// MultiPoint mode
					else if (featureType === "point") {
						this._multiPointMode = !this._multiPointMode;
						$pointBtn.css("background-color", this._multiPointMode ? "#28a745" : "");
						if (!this._multiPointMode && this._multiPointFeatures.length > 0) {
							const allCoords = [];
							for (const f of this._multiPointFeatures) {
								const geom = f.getGeometry();
								if (geom.getType() === "Point") {
									allCoords.push(geom.getCoordinates());
								} else if (geom.getType() === "MultiPoint") {
									allCoords.push(...geom.getCoordinates());
								}
							}
							const multiPointGeom = new ol.geom.MultiPoint(allCoords);
							const multiPointFeature = new ol.Feature({
								GEOMETRY: multiPointGeom,
							});
							multiPointFeature.setGeometryName("GEOMETRY");
							this.executeWFSTransaction([multiPointFeature], null, null, callback);
							this._multiPointFeatures = [];
						}
					}
				}
			};

			// Attach the key listener (only once)
			if (!this._multiPolygonKeyHandlerAttached) {
				window.addEventListener("keydown", ctrlKeyHandler);
				this._multiPolygonKeyHandlerAttached = true;
			}

			window.addEventListener("keydown", ctrlKeyHandler);

			// Determine which tool to build
			let type;
			switch (featureType) {
				case "point":
					type = "Point";
					break;
				case "linestring":
					type = "MultiLineString";
					break;
				case "polygon":
					type = "Polygon";
					break;
			}

			// Define and add new map interactions
			this.draw = new ol.interaction.Draw({
				source: app.plugins.LayerEditor.editableLayer.getSource(),
				type: type,
				geometryName: app.plugins.LayerEditor.editableLayer.getSource().geometryColumnName,
			});
			this.snap = new ol.interaction.Snap({
				features: this.snapableCollection,
			});

			app.map.addInteraction(this.draw);
			app.map.addInteraction(this.snap);

			// Register map interaction listener
			this.draw.on("drawend", (e) => {
				var feature = e.feature;
				app.plugins.LayerEditor.drawnFeature = feature;

				if (featureType === "linestring" && this._multiLineMode) {
					// Collect lines for multilinestring
					this._multiLineFeatures.push(feature);
					// Continue drawing lines
				} else if (featureType === "polygon" && this._multiPolygonMode) {
					// Collect polygons for multipolygon
					this._multiPolygonFeatures.push(feature);
					// Continue drawing polygons
				} else if (featureType === "point" && this._multiPointMode) {
					// Collect points for multipoint
					this._multiPointFeatures.push(feature);
					// Continue drawing points
				} else {
					// Normal single feature add
					this.executeWFSTransaction([feature], null, null, callback);
					// Only turn off editing tools for single feature add
					this.turnEditingOff();
					$("#le-digitize-toolbar-add-geometry .le-edit-btn").removeClass("active");
				}
			});

			// Clean up event on tool switch/off
			const cleanup = () => {
				window.removeEventListener("keydown", ctrlKeyHandler);
				this._multiPolygonMode = false;
				this._multiPolygonFeatures = [];
				// Reset polygon button color
				$polygonBtn.css("background-color", "");
			};
			// Attach cleanup to turnEditingOff
			const origTurnEditingOff = this.turnEditingOff.bind(this);
			this.turnEditingOff = function () {
				cleanup();
				origTurnEditingOff();
			};
		};

		/**
		 * Function: toggleModifyFeature
		 * @param () none
		 * @returns () nothing
		 * Function to toggle the modify feature tool
		 */
		const toggleModifyFeature = () => {
			// Prepare for new map interaction
			this.turnEditingOff();
			redirectMapSingleClickFunction("alias", null);

			// Show the layer editor tab
			activateSidebarTab(app.plugins.LayerEditor.tabNav);

			// Determine what can be modified (as configured)
			var allowGeometryModification = false;
			var allowAttributeModification = false;
			if (app.plugins.LayerEditor.editableLayer.get("allowedModifications")) {
				if (app.plugins.LayerEditor.editableLayer.get("allowedModifications").geometry === true)
					allowGeometryModification = true;
				if (app.plugins.LayerEditor.editableLayer.get("allowedModifications").attributes === true)
					allowAttributeModification = true;
			}

			// Define, register, and add the SELECT map interaction
			this.select = new ol.interaction.Select({
				layers: [app.plugins.LayerEditor.editableLayer],
				multi: true,
				style: app.plugins.LayerEditor.modifyStyle,
			});
			this.select.on("select", (e) => {
				// Prompt to deal with unsaved feature changes if they exist
				if (app.plugins.LayerEditor.checkForUnsavedChanges()) {
					return;
				}
				if (allowAttributeModification) {
					this.populateFeatureEditorSelector(this.select.getFeatures().getArray());
				}
				//If no features are selected, turn on add geometry and clear editableFeature
				if (this.select.getFeatures().getArray().length === 0) {
					$("#le-digitize-toolbar-add-geometry").show();
					app.plugins.LayerEditor.editableFeature = null;
				}
			});
			app.map.addInteraction(this.select);

			// Define, register, and add the MODIFY map interaction
			if (allowGeometryModification) {
				// Define the modify interaction
				this.modify = new ol.interaction.Modify({
					features: this.select.getFeatures(),
				});

				// Register geometry modify event handler
				this.modify.on("modifyend", (e) => {
					// Track a geometry change and update ux
					app.plugins.LayerEditor.editableFeatureGeometryHasChanged = true;

					// Run feature change watcher
					app.plugins.LayerEditor.featureChangeWatcher();
				});

				// Add it to the map
				app.map.addInteraction(this.modify);
			}

			// Define and add the SNAP map interaction
			if (allowGeometryModification) {
				this.snap = new ol.interaction.Snap({
					source: app.plugins.LayerEditor.editableLayer.getSource(),
				});
				app.map.addInteraction(this.snap);
			}
		};

		/**
		 * Function: toggleDeleteFeature
		 * @param () none
		 * @returns () nothing
		 * Function to toggle the delete feature tool
		 */
		const toggleDeleteFeature = () => {
			// Prepare for new map interaction
			this.turnEditingOff();
			redirectMapSingleClickFunction("alias", null);

			// Define and add new map interactions
			this.delete = new ol.interaction.Select({
				layers: [app.plugins.LayerEditor.editableLayer],
				multi: true,
				style: app.plugins.LayerEditor.deleteStyle,
			});
			app.map.addInteraction(this.delete);

			// Register map interaction listener
			this.delete.on("select", (e) => {
				app.plugins.LayerEditor.featureDeleteWatcher();
			});
			$("#le-attribute-form").hide();
		};

		// Toggle edit function based on passed action
		switch (action) {
			case "polygon": // Fall-through for all feature additions
			case "point":
			case "linestring":
			case "circle":
				toggleAddFeature(action);
				break;
			case "modify":
				toggleModifyFeature();
				break;
			case "delete":
				toggleDeleteFeature();

				break;
			case "copy":
				toggleCopyFeature();
				break;
			default:
				this.turnEditingOff(); // reset
				//Close Feature Attribute Window
				$("#le-editable-feature-input").val("");
				//remove content of select le-editable-feature-select
				$("#le-editable-feature-select").empty();
				$("#le-editable-feature-select-count").empty();
				$("#le-attribute-form").hide();
				//Clear editableFeature
				app.plugins.LayerEditor.editableFeature = null;
		}
	}

	/**
	 * Function: updateLayerCounter
	 * @param (int) layerCounter
	 * @param (int) layerArraySize
	 * @returns (int) new layer count
	 * Function that updates the layerCounter and spinner when populating the editable layer dropdown
	 */
	updateLayerCounter(layerCounter, layerArraySize) {
		layerCounter++;
		if (layerCounter == layerArraySize) {
			app.plugins.LayerEditor.showLayerEditorWorking(false);
			$("#le-editable-layer-select").prop("disabled", false);
		}
		return layerCounter;
	}

	/**
	 * Function: showLayerEditorWorking
	 * @param (boolean) show
	 * @returns () nothing
	 * Function that hides/shows the LayerEditor spinner
	 */
	showLayerEditorWorking(show) {
		if (show) {
			app.plugins.LayerEditor.spinner = new Spinner(app.spinnerOptionsMedium).spin(
				$(app.plugins.LayerEditor.tabContent)[0]
			);
		} else {
			if (app.plugins.LayerEditor.spinner) {
				setTimeout(function () {
					app.plugins.LayerEditor.spinner.stop();
				}, 250);
			}
		}
	}

	/**
	 * Function: populateEditableLayerSelect
	 * @param () none
	 * @returns () nothing
	 * Function that populates the editable layer select control with layers configured to be editable
	 */
	populateEditableLayerSelect() {
		// Empty the select control
		$("#le-editable-layer-select").empty();

		// Add default no editable layer option
		$("#le-editable-layer-select").append(new Option("No Editable Layer", -1));

		var editableLayers = [];
		var layerArray = app.map.getLayers().getArray();
		var ajaxPromises = [];

		// Start the spinner
		app.plugins.LayerEditor.showLayerEditorWorking(true);

		// Disable the layer editor selection dropdown
		$("#le-editable-layer-select").prop("disabled", true);

		// Loop through layers
		layerArray.forEach((layer) => {
			if (!layer.get("editable")) return;

			let typeName = null;
			let nameSpace = null;
			let primaryKey = null;

			// Find the corresponding layer config
			app.config.map.layers.forEach((l) => {
				if (l.get("title") === layer.get("title")) {
					typeName = l.getSource().layerNamespace + ":" + l.getSource().layerName;
					nameSpace = l.getSource().layerNamespace;
					primaryKey = l.getSource().primaryKey;
				}
			});

			if (!typeName) {
				return;
			}

			// Prepare XML request
			const xmlString = `
				<wfs:GetFeatureWithLock service='WFS' version='2.0.0' 
					handle='GetFeatureWithLock-tc1' expiry='1' lockaction='SOME' maxFeatures='1' resultType='results' count='1' valueReference='GEOMETRY' outputformat='JSON' 
					xmlns:wfs='http://www.opengis.net/wfs/2.0'
					xmlns:fes='http://www.opengis.net/fes/2.0'>
					<wfs:Query typeNames='${typeName}'>
						<fes:Filter>
							<fes:PropertyIsLessThan>
								<fes:ValueReference>
									${nameSpace}:${primaryKey}
								</fes:ValueReference>
								<fes:Literal>
									1
								</fes:Literal>
							</fes:PropertyIsLessThan>
						</fes:Filter>
					</wfs:Query>
				</wfs:GetFeatureWithLock>
			`;

			// Send AJAX request and store promise
			let ajaxRequest = $.ajax({
				type: "POST",
				contentType: "text/plain",
				xhrFields: { withCredentials: true },
				crossDomain: true,
				url: layer.getSource().layerUrl,
				data: xmlString,
				async: true,
			})
				.done(() => {
					editableLayers.push(layer);
					$("#le-editable-layer-select").append(new Option(layer.get("title"), ol.util.getUid(layer)));
				})
				.fail((data, settings, exception) => {
					console.error(`User could not validate permissions for ${layer.get("title")}: ${exception}`);
				});

			ajaxPromises.push(ajaxRequest);
		});

		// Wait for all AJAX requests to finish
		Promise.allSettled(ajaxPromises).then(() => {
			app.plugins.LayerEditor.updateLayerCounter(layerArray.length, layerArray.length);

			// Automatically select the only editable layer if there's exactly one
			if (editableLayers.length === 1) {
				//If autoEdit is toggled true, start edit session for the 1 editable layer
				if (this.autoEdit) {
					$("#le-editable-layer-input-group").hide();
					const singleLayerId = ol.util.getUid(editableLayers[0]);
					app.plugins.LayerEditor.setEditableLayer(singleLayerId);
					$("#le-editable-layer-select").val(singleLayerId);
					$("#le-digitize-toolbar").show();

					// Show the editable feature selector
					$("#le-editable-feature-select").parent().show();
					//app.plugins.LayerEditor.populateFeatureEditorSelector(editableLayers[0].getSource().getFeatures(), false);
				} else {
					$("#le-editable-layer-select").prop("disabled", false);
				}
			} else {
				$("#le-editable-layer-select").prop("disabled", false);
			}
			// Stop the spinner
			app.plugins.LayerEditor.showLayerEditorWorking(false);
		});
	}

	/**
	 * Function: setEditableLayer
	 * @param (integer) layerId
	 * @returns () nothing
	 * Function that sets the editable layer based on user selection
	 */
	setEditableLayer(layerId) {
		// Reset editable layer stuff
		this.editableLayer = null;

		// Unregister the click event for all edit buttons (if they exist)
		$(".le-edit-btn").off("click");

		// Set the editable layer according to the passed layerId
		$.each(app.map.getLayers().getArray(), function (index, layer) {
			if (ol.util.getUid(layer) == layerId) {
				// Set the editable layer
				app.plugins.LayerEditor.editableLayer = layer;

				// Handle dynamic style functions
				const originalStyleFunction = app.plugins.LayerEditor.editableLayer.getStyle();
				if (typeof originalStyleFunction === "function") {
					// Define the modify selection style
					app.plugins.LayerEditor.modifyStyle = function (feature) {
						const baseStyle = originalStyleFunction(feature);
						const modifiedStyle = baseStyle.clone();
						app.plugins.LayerEditor.alterStyle(
							modifiedStyle,
							"rgba(255, 196, 0, 0.7)",
							"rgba(255, 196, 0, 0.3)"
						);
						return modifiedStyle;
					};

					// Define the delete selection style
					app.plugins.LayerEditor.deleteStyle = function (feature) {
						const baseStyle = originalStyleFunction(feature);
						const deleteStyle = baseStyle.clone();
						app.plugins.LayerEditor.alterStyle(deleteStyle, "rgba(255, 0, 0, 0.7)", "rgba(255, 0, 0, 0.3)");
						return deleteStyle;
					};
				} else {
					// Handle static styles
					app.plugins.LayerEditor.modifyStyle = app.plugins.LayerEditor.editableLayer.getStyle().clone();
					app.plugins.LayerEditor.alterStyle(
						app.plugins.LayerEditor.modifyStyle,
						"rgba(255, 196, 0, 0.7)",
						"rgba(255, 196, 0, 0.3)"
					);

					app.plugins.LayerEditor.deleteStyle = app.plugins.LayerEditor.editableLayer.getStyle().clone();
					app.plugins.LayerEditor.alterStyle(
						app.plugins.LayerEditor.deleteStyle,
						"rgba(255, 0, 0, 0.7)",
						"rgba(255, 0, 0, 0.3)"
					);
				}

				// Attach additional event handlers onto the editable layer
				app.plugins.LayerEditor.editableLayer.getSource().on("featuresloadstart", function (e) {
					if (app.plugins.LayerEditor) app.plugins.LayerEditor.editableLayer.set("isLoading", true);
				});
				app.plugins.LayerEditor.editableLayer.getSource().on("featuresloadend", function (e) {
					if (app.plugins.LayerEditor) app.plugins.LayerEditor.editableLayer.set("isLoading", false);
				});
				app.plugins.LayerEditor.editableLayer.getSource().on("featuresloaderror", function (e) {
					if (app.plugins.LayerEditor) app.plugins.LayerEditor.editableLayer.set("isLoading", false);
				});
			}
		});

		// If editable layer is null, then cleanup and bail
		if (!app.plugins.LayerEditor.editableLayer) {
			this.toggleEditControls(null);
			$("#le-editable-feature-select").parent().hide();
			return;
		}

		// Make sure the editable layer is visible
		if (app.plugins.LayerEditor.editableLayer.getVisible() == false) {
			this.editableLayer.setVisible(true);

			// If layer controller plugin exists, then check on the layer there toolbar
			if (app.plugins.LayerController) {
				$(".lc-overlay-chkbox").each(function () {
					if ($(this).attr("layerId") == layerId) {
						$(this).prop("checked", true);
						rememberState();
					}
				});
			}
		}

		// Show the editing controls configured for this layer
		if (app.plugins.LayerEditor.editableLayer.get("controls")) {
			this.toggleEditControls(app.plugins.LayerEditor.editableLayer.get("controls"));
		} else {
			return;
		}

		// Show the editing toolbox
		$("#le-digitize-toolbar").show();
		$("#le-editable-feature-select").parent().show();

		// Register the click event for all edit buttons
		$(".le-edit-btn").on("click", (e) => {
			// Prompt to deal with unsaved feature changes if they exist
			if (app.plugins.LayerEditor.checkForUnsavedChanges()) {
				return;
			}

			// Get the button and it's intended action
			var btn;
			if ($(e.target).is("img")) {
				btn = $(e.target).parent();
			} else {
				btn = $(e.target);
			}
			var action = btn.data("action");

			// If there is a copy event, turn it off
			if (this.copy) {
				app.map.un("pointerup", this.copy);
			}

			// 1. If already active turn off and turn default map click function back on.
			// 2. Otherwise turn any other button off and turn the new button on.
			// 3. Don't highlight the attribute button. ?????????
			if (btn.hasClass("active")) {
				btn.removeClass("active");
				if (action === "snap") {
					// If turning off snapping clear the snapping collection
					this.snapableCollection.clear();
				} else {
					// Otherwise turn off all the buttons
					this.toggleEditorFunction("reset");
				}
				$("#le-digitize-toolbar-add-geometry").show();
			} else {
				if (action === "snap") {
					// If turning on the snapping button fill snapping collection
					// Fill the snapable array
					this.snapable(e);
				}

				$(".le-edit-btn").not('[data-action="snap"]').removeClass("active");
				if (action !== "attributes") btn.addClass("active");
				this.toggleEditorFunction(action);
			}
		});
	}

	/**
	 * Function: alterStyle
	 * @param (object) style
	 * @param (string) strokeColor
	 * @param (string) fillColor
	 * @returns () nothing
	 * Function that alters passed style with new fill and stroke colors
	 */
	alterStyle(style, strokeColor, fillColor) {
		// Add zIndex to ensure proper stacking
		style.setZIndex(1);

		// Alter fill color (if exists)
		if (style.fill_) {
			style.getFill().setColor(fillColor);
		}

		// Alter stroke color (if exists)
		if (style.stroke_) {
			style.getStroke().setColor(strokeColor);
			var newWidth = style.getStroke().getWidth() + 3;
			style.getStroke().setWidth(newWidth);
		}

		// Alter image (if exists)
		if (style.image_) {
			// Alter image fill color (if exists)
			if (style.getImage().fill_) {
				style.getImage().getFill().setColor(fillColor);
			}

			// Alter image stroke color (if exists)
			if (style.getImage().stroke_) {
				style.getImage().getStroke().setColor(strokeColor);
				var newWidth = style.getImage().getStroke().getWidth() + 3;
				style.getImage().getStroke().setWidth(newWidth);
			}

			// Alter image icon color (if exists)
			if (style.getImage().iconImage_) {
				style.setText(
					new ol.style.Text({
						text: "O",
						textBaseline: "middle",
						scale: 7,
						offsetY: 5,

						fill: new ol.style.Fill({
							color: strokeColor,
						}),
					})
				);
			}
		}
	}

	/**
	 * Function: toggleEditControls
	 * @param (object) controls
	 * @returns () nothing
	 * Function that hides or shows (toggles) the editing controls
	 */
	toggleEditControls(controls) {
		// Turn editing off by default
		this.turnEditingOff();

		// Deactivate and hide all controls
		$(".le-edit-btn").each(function () {
			var btn = $(this);
			if (btn.hasClass("active")) btn.removeClass("active");
			btn.hide();
		});

		// Hide all control set group containers
		$(".le-edit-btn-grp")
			.removeClass("in")
			.addClass("out")
			.on("animationend", (e) => {
				$(e.target).addClass("hidden");
			});

		// Bail if no controls were passed
		if (!controls) return;

		// Build the toolbar
		var keys = Object.keys(controls);
		keys.forEach((key) => {
			var btn = $("div[data-action='" + key + "']");
			if (controls[key]) {
				btn.show();
				if (btn.parent().hasClass("out")) {
					btn.parent()
						.removeClass("out")
						.addClass("in")
						.on("animationend", (e) => {
							$(e.target).removeClass("hidden");
						});
				}
			} else {
				btn.hide();
			}
		});
	}

	/**
	 * Function: snapable
	 * If the snapping tool is on, clear out the snapable features collection
	 * and repopulate according to what layers are visible.
	 * @param {*} e Zoom or button click event. The button click is fired
	 * 		when snapping is turned on. The zoom event happens on map move
	 * 		when snapping is turned on.
	 */
	snapable(e) {
		const active = $('#le-digitize-toolbar .le-edit-btn[data-action="snap"]').hasClass("active");

		// If turning on snapping button
		const snapClick = e.type === "click";

		if (!active && !snapClick) return; // Exit if tool isn't on

		// Clear the snapable collection
		app.plugins.LayerEditor.snapableCollection.clear();

		// Add the editiable layer features to the snapable collection
		app.plugins.LayerEditor.editableLayer
			.getSource()
			.getFeatures()
			.forEach((f) => {
				app.plugins.LayerEditor.snapableCollection.push(f);
			});

		// Loop thru each map layer
		app.map.getLayers().forEach((layer) => {
			// Bail if not an acceptable visible overlay layer
			if (
				layer.get("type") != "overlay" ||
				layer.get("visible") !== true ||
				typeof layer.getSource().getFeatureInfoUrl != "function"
			)
				return;

			// Define the layer url
			var layerUrl;
			if (layer.getSource() instanceof ol.source.TileWMS) {
				layerUrl = layer.getSource().getUrls()[0]; // TileWMS
			} else if (layer.getSource() instanceof ol.source.ImageWMS) {
				layerUrl = layer.getSource().getUrl(); // ImageWMS
			}
			layerUrl = layerUrl.replace(new RegExp("/ows", "ig"), "/wfs");
			layerUrl = layerUrl.replace(new RegExp("/wms", "ig"), "/wfs");

			// Get the typeName (layers) which will often be a combo of namespace and layer name (i.e. hwy:DSA_CONTRACT_AREA)
			var typeName = layer.getSource().getParams().LAYERS;

			// Define the request BBOX (from the current extent)
			const proj = app.map.getView().getProjection();
			const extent = app.map.getView().calculateExtent(app.map.getSize());
			const [x1, y1, x2, y2] = extent;
			const [lon1, lat1] = ol.proj.transform([x1, y1], proj, "EPSG:4326");
			const [lon2, lat2] = ol.proj.transform([x2, y2], proj, "EPSG:4326");
			const coords = `${lon1},${lat1},${lon2},${lat2}`;

			// Issue the GetFeature request
			$.ajax({
				type: "GET",
				url: layerUrl,
				timeout: 10000,
				dataType: "json",
				data: {
					service: "WFS",
					version: "1.1.0",
					request: "GetFeature",
					typeNames: typeName,
					outputFormat: "application/json",
					maxFeatures: 1000,
					srsName: app.map.getView().getProjection().getCode(),
					bbox: coords + ",EPSG:4326",
				},
				xhrFields: {
					withCredentials: layer.get("withCredentials") ? layer.get("withCredentials") : false,
				},
			})
				.done(function (response) {
					// Add the response (features) to the snapable collection
					var features = new ol.format.GeoJSON().readFeatures(response);
					features.forEach((feature) => {
						app.plugins.LayerEditor.snapableCollection.push(feature);
					});
				})
				.fail(function (jqxhr, settings, exception) {
					logger(
						"ERROR",
						app.plugins.LayerEditor.name +
							": Could not get features from " +
							layer.get("title") +
							" for snapping - " +
							exception
					);
				});
		});
	}

	/**
	 * Function: manageControls
	 * @param {Object} e OpenLayers zoom event
	 * @returns () nothing
	 * Some controls are only active a certain zoom levels.
	 * This function gets called after each movement of the map and
	 * toggle applicable controls.
	 */
	manageControls(e) {
		const zoom = app.map.getView().getZoom();
		if (zoom > 9) {
			$('#le-digitize-toolbar .le-edit-btn[data-action="snap"]').removeClass("disabled");
			app.plugins.LayerEditor.snapable(e);
		} else {
			$('#le-digitize-toolbar .le-edit-btn[data-action="snap"]').addClass("disabled");
		}
	}

	/**
	 * Function: convertTurfFeatureToOpenLayersFeature
	 * @param (object) turfFeature
	 * @param (object) projectionCode
	 * @returns () openlayer object
	 * Function to convert turf features back to openlayers
	 */
	convertTurfFeatureToOpenLayersFeature(turfFeature, projectionCode) {
		const format = new ol.format.GeoJSON();
		const geoJsonFeature = format.readFeature(turfFeature, {
			dataProjection: "EPSG:4326", // Turf.js works with WGS84 (EPSG:4326)
			featureProjection: projectionCode, // Convert to the map's projection
		});
		return geoJsonFeature;
	}

	/**
	 * Function: findClosestFeature
	 * @param (object) feature
	 * @param (object) inputElement
	 * @param (string) layerName
	 * @param (string) fieldName
	 * @returns () nothing
	 * Function to find the intersecting feature from the specified layer and update the input element
	 */
	findClosestFeature(feature, inputElement, layerName, fieldName) {
		const map = app.map; // Get OpenLayers map instance
		const layers = map.getLayers().getArray();
		let targetLayer = layers.find((layer) => layer.get("title") === layerName);

		if (!targetLayer) {
			return;
		}

		// Convert the OpenLayers feature to a Turf.js feature
		const turfSearchFeature = convertOpenLayersFeatureToTurfFeature(
			feature,
			map.getView().getProjection().getCode()
		);
		const featureType = turfSearchFeature.geometry.type; // Get the geometry type of the search feature

		// Apply a buffer if the feature is a Point or LineString
		let bufferedSearchFeature;
		if (featureType === "Point" || featureType === "LineString") {
			bufferedSearchFeature = turf.buffer(turfSearchFeature, 1, {
				units: "kilometers",
			});
		} else {
			bufferedSearchFeature = turfSearchFeature;
		}

		// ** Vector Layer Proximity Search **
		if (targetLayer instanceof ol.layer.Vector) {
			let features = targetLayer.getSource().getFeatures();
			let closestFeature = null;
			let minDistance = Infinity;

			var intersectedFeatures = [];
			//Scan for intersected features to find closest one
			features.forEach((layerFeature) => {
				let turfFeature = convertOpenLayersFeatureToTurfFeature(
					layerFeature,
					map.getView().getProjection().getCode()
				);
				var turfIntersect = turf.intersect(bufferedSearchFeature, turfFeature);
				//if intersected feature found, push to list
				if (turfIntersect) {
					intersectedFeatures.push(layerFeature);
				}
			});

			if (intersectedFeatures.length == 1) {
				intersectedFeatures.forEach((feature) => {
					const value = feature.get([fieldName]);
					// Update input element with the value
					inputElement.val(value);
					inputElement.trigger("input");
				});
			}
			if (intersectedFeatures.length > 1) {
				intersectedFeatures.sort((a, b) => {
					const valueA = a.get(fieldName)?.toString().toLowerCase() || "";
					const valueB = b.get(fieldName)?.toString().toLowerCase() || "";
					return valueA.localeCompare(valueB);
				});

				// Create a dropdown menu
				const dropdown = $(
					'<select class="le-form-input form-select form-select-sm le-attr-input-changed" style="display: flex;"></select>'
				)
					.addClass("dropdown-menu")
					.attr("key", inputElement.attr("key")); // Use the same key as the input being replaced

				// Populate the dropdown with values
				intersectedFeatures.forEach((feature) => {
					const value = feature.get([fieldName]);
					$("<option></option>").val(value).text(value).appendTo(dropdown);
				});

				// Replace input element with dropdown
				inputElement.replaceWith(dropdown);

				// Handle dropdown selection
				dropdown.on("change", function () {
					const selectedValue = $(this).val();
					dropdown.trigger("input"); // Trigger input event for change detection
				});
			}
			if (intersectedFeatures.length == 0) {
				showModalDialog("Attention", "No intersecting feature found.", "sm");
			}
		}

		// ** WMS Layer Proximity Search **
		if (typeof targetLayer.getSource().getFeatureInfoUrl === "function") {
			if (bufferedSearchFeature) {
				// Convert bufferedSearchFeature (Turf.js format) back to OpenLayers feature
				const olBufferedFeature = app.plugins.LayerEditor.convertTurfFeatureToOpenLayersFeature(
					bufferedSearchFeature,
					map.getView().getProjection().getCode()
				);

				var targetSRS = targetLayer.get("nativeProjection") || targetLayer.getSource().getParams().srsName;

				// Transform the buffered search feature to the layer's native projection
				const searchPolygonInLayerNativeProj = transformFeature(
					olBufferedFeature,
					app.map.getView().getProjection().getCode(),
					targetSRS
				);

				// Convert the transformed geometry to WKT
				const wktFormat = new ol.format.WKT();
				const searchPolygonWKT = wktFormat.writeGeometry(searchPolygonInLayerNativeProj.getGeometry());

				// Get the name of the geometry column
				var geometryField;
				$.each(targetLayer.get("attributes"), function (index, attribute) {
					if (attribute.type.startsWith("gml:")) {
						geometryField = attribute.name;
					}
				});

				// Build the CQL_FILTER statement using bufferedSearchFeature
				var cqlFilter = `INTERSECTS(${geometryField}, ${searchPolygonWKT})`;

				// Prepare the WFS request parameters
				const searchUrl = targetLayer.getSource().url_; // Ensure this is the correct URL for WFS requests
				const options = {
					service: "WFS",
					version: "2.0.0",
					request: "GetFeature",
					typeNames: targetLayer.getSource().params_.LAYERS,
					outputFormat: "application/json",
					count: 20,
					srsName: app.map.getView().getProjection().getCode(),
					cql_filter: cqlFilter,
				};

				// Issue the WFS request
				$.ajax({
					type: "GET",
					url: searchUrl,
					dataType: "json",
					data: options,
					xhrFields: {
						withCredentials: targetLayer.get("withCredentials")
							? targetLayer.get("withCredentials")
							: false,
					},
				})
					.done(function (data) {
						let closestFeature = null;
						let minDistance = Infinity;

						if (data.features.length == 1) {
							const searchFeatureCentroid = turf.centroid(turfSearchFeature);

							data.features.forEach((feature) => {
								const featureCentroid = turf.centroid(feature);
								const distance = turf.distance(searchFeatureCentroid, featureCentroid);
								if (distance < minDistance) {
									minDistance = distance;
									closestFeature = feature;
								}
							});

							const value = closestFeature.properties[fieldName];

							// Update input element with the value
							inputElement.val(value);
							inputElement.trigger("input");
						}
						if (data.features.length > 1) {
							// Sort features alphabetically by the specified field
							data.features.sort((a, b) => {
								const valueA = a.properties[fieldName]?.toLowerCase() || "";
								const valueB = b.properties[fieldName]?.toLowerCase() || "";
								return valueA.localeCompare(valueB);
							});

							// Remove duplicates and nulls based on the specified field
							data.features = data.features.filter((feature, index, self) => {
								const value = feature.properties[fieldName];
								if (!value || value.toString().trim() === "") {
									return false;
								}
								return index === self.findIndex((f) => f.properties[fieldName] === value);
							});

							// Create a dropdown menu
							const dropdown = $(
								'<select class="le-form-input form-select form-select-sm le-attr-input-changed" style="display: flex;"></select>'
							)
								.addClass("dropdown-menu")
								.attr("key", inputElement.attr("key")); // Use the same key as the input being replaced

							// Populate the dropdown with values
							data.features.forEach((feature) => {
								const value = feature.properties[fieldName];
								$("<option></option>").val(value).text(value).appendTo(dropdown);
							});

							// Replace input element with dropdown
							inputElement.replaceWith(dropdown);

							// Handle dropdown selection
							dropdown.on("change", function () {
								const selectedValue = $(this).val();
								dropdown.trigger("input"); // Trigger input event for change detection
							});
						}
						if (data.features.length == 0) {
							showModalDialog("Attention", "No intersecting feature found.", "sm");
						}
					})
					.fail(() => {});
			}
		}
	}

	/**
	 * Function: refreshEditableLayer
	 * @param () none
	 * @returns () nothing
	 * Function to refresh the editable layer.
	 */
	refreshEditableLayer() {
		resetLayerStatistics(app.plugins.LayerEditor.editableLayer);
		app.plugins.LayerEditor.editableLayer.getSource().refresh();
	}

	/**
	 * Function: emailFormContents
	 * @param () none
	 * @returns () nothing
	 * Function to create an email body from the contents of #le-attribute-form and open a mailto link with the body
	 */
	emailFormContents() {
		let emailBody = "";
		const subject = $("#le-editable-feature-select option:selected").text();
		$("#le-attribute-form .le-attr-input-div").each(function () {
			const label = $(this).find("span").text();
			const value = $(this).find("input, textarea, select").val();
			emailBody += `${label}: ${value}\n`;

			// Extract card values if present
			const cards = $(this).find(".le-comment-display .card");
			if (cards.length > 0) {
				cards.each(function () {
					const userID = $(this).find(".card-title").text();
					const date = $(this).find(".card-subtitle").text();
					const comment = $(this).find(".card-text").text();
					emailBody += `- ${userID} (${date}): ${comment}\n`;
				});
			}
		});
		const url = window.location.href;
		emailBody += `\nURL: ${url}`;
		const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
		window.location.href = mailtoLink;
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
				logger("ERROR", app.plugins.LayerEditor.name + ": Plugin failed to initialize");
				return;
			}

			// Set class variables
			app.plugins.LayerEditor.tabNav = tabNav;
			app.plugins.LayerEditor.tabContent = tabContent;

			// Handle editorLocation
			if (!app.plugins.LayerEditor.editorLocation) {
				// Logic for when editorLocation is undefined or "Map"
				// Populate the editable layer select
				app.plugins.LayerEditor.populateEditableLayerSelect();

				// Register the editable layer event handlers
				$("#le-editable-layer-select").on("change", function (e) {
					var selectedLayerId = $("#le-editable-layer-select option:selected").val();
					// If the selected layer is "No Editable Layer", hide the editing controls and return
					$("#le-digitize-toolbar-add-geometry").show();
					//Hide attribute form
					$("#le-attribute-form").css("display", "none");
					app.plugins.LayerEditor.setEditableLayer(selectedLayerId);
				});
				$("#le-editable-layer-select").on("keydown mousedown touchstart", function (e) {
					// Prompt to deal with unsaved feature changes if they exist
					if (app.plugins.LayerEditor.checkForUnsavedChanges()) {
						e.preventDefault();
						e.stopPropagation();
					}
				});

				// Register the editable feature event handlers
				$("#le-editable-feature-select").on("change", function (e) {
					var featureId = $("#le-editable-feature-select option:selected").val(); // Updated to get the value
					app.plugins.LayerEditor.showFeatureEditor(featureId);

					//get feature by featureID from editableLayer
					const feature = app.plugins.LayerEditor.editableLayer.getSource().getFeatureById(featureId);
					//get feature geometry
					const geometry = feature.getGeometry();
					// Zoom to feature (only if geometry is present)
					if (geometry) {
						const featureExtent = geometry.getExtent();
						app.map.getView().fit(featureExtent, { duration: 1000 });
					}
				});

				//Show create new record button (for null geometry) if configured
				if (app.plugins.LayerEditor.nullGeometryCreateFeature) {
					$("#le-add-feature-btn").show();
				}

				$("#le-editable-feature-select").on("keydown mousedown touchstart", function (e) {
					// Prompt to deal with unsaved feature changes if they exist
					if (app.plugins.LayerEditor.checkForUnsavedChanges()) {
						e.preventDefault();
						e.stopPropagation();
					}
				});

				// Register the editable feature event handlers
				$("#le-editable-feature-input").on("change", function (e) {
					$("#le-editable-feature-select").empty();
					var searchVal = $("#le-editable-feature-input").val();
					if (searchVal.length > 0) {
						app.plugins.LayerEditor.searchEditableLayer(searchVal);
					} else {
						$("#le-attribute-form").hide();
						$("#le-editable-feature-select").empty();
						$("#le-editable-feature-select-count").empty();
						$("#le-digitize-toolbar-add-geometry").show();
						$("#le-digitize-toolbar-modify").show();
						$("#le-digitize-toolbar-functions").show();
					}
				});

				// Copy the save/discard changes buttons to the content window
				$("#le-feature-action-btn-container").appendTo("body");

				// Register the save changes btn handler
				$("#le-save-changes-btn").on("click", function (e) {
					app.plugins.LayerEditor.saveFeature();
				});

				// Register the delete record btn handler
				$("#le-delete-button").on("click", function (e) {
					// Get the selected feature ID
					var featureId = $("#le-editable-feature-select option:selected").val(); // Updated to get the value

					// Get the feature from the editable layer
					const feature = app.plugins.LayerEditor.editableLayer.getSource().getFeatureById(featureId);

					// If the feature is not found, show an error message and return
					if (!feature) {
						alert("Feature not found in the editable layer.");
						return;
					}
					bootbox.confirm({
						title: "Delete Record?",
						message: "Are you sure you would like to delete?",
						buttons: {
							cancel: {
								label: "Cancel",
							},
							confirm: {
								label: "Delete",
								className: "btn-danger",
							},
						},
						callback: function (result) {
							if (result === true) {
								var callback = function (success, result) {
									var searchVal = $("#le-editable-feature-input").val();
									if (searchVal.length > 0) {
										app.plugins.LayerEditor.searchEditableLayer(searchVal);
									} else {
										$("#le-attribute-form").hide();
										$("#le-editable-feature-select").empty();
										$("#le-editable-feature-select-count").empty();
										$("#le-digitize-toolbar-add-geometry").show();
										$("#le-digitize-toolbar-modify").show();
										$("#le-digitize-toolbar-functions").show();

										app.plugins.LayerEditor.editableFeature = null;

										$("#le-digitize-toolbar-modify .le-edit-btn").removeClass("active");

										// Turn off any active buttons in the specified div
										$("#le-digitize-toolbar-add-geometry .le-edit-btn").removeClass("active");

										// Clear editable feature and reset the toolbar
										// Clear the feature delete selection and run the watcher
										//app.plugins.LayerEditor.delete.getFeatures().clear();

										app.plugins.LayerEditor.turnEditingOff();

										// Refresh the editable layer
										app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
										app.plugins.LayerEditor.editableLayer.getSource().refresh();
									}
									//Remove the feature from the editable layer

									// Refresh the editable layer
									app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
									app.plugins.LayerEditor.editableLayer.getSource().refresh();
								};
								app.plugins.LayerEditor.executeWFSTransaction(null, null, [feature], callback);
								$("#le-attribute-form").css("display", "none");
							}
						},
					});
				});

				// Register the create new record btn handler
				$("#le-add-feature-btn").on("click", function (e) {
					const emptyFeature = new ol.Feature({});

					// Define the callback
					var callback = function (success, result) {
						// Get the new feature ID
						var newlyInsertedFeatureId = result.insertIds[0];

						// Refresh the editable layer
						app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
						app.plugins.LayerEditor.editableLayer.getSource().refresh();

						// Define the function that will monitor the editable layer and do some actions after it has finished loading
						var attempt = 0;

						var waitForCompletedRefresh = function () {
							if (app.plugins.LayerEditor.editableLayer.get("isLoading") == false) {
								var newFeature = app.plugins.LayerEditor.editableLayer
									.getSource()
									.getFeatureById(newlyInsertedFeatureId);

								if (newFeature) {
									// Switch to the modify feature tool
									$(".le-edit-btn[data-action=modify]").trigger("click");

									// Edit the feature
									app.plugins.LayerEditor.populateFeatureEditorSelector([newFeature]);
									app.plugins.LayerEditor.showLayerEditorWorking(true);
								}
								app.plugins.LayerEditor.showLayerEditorWorking(false);
							} else {
								attempt++;
								if (attempt < 75) {
									setTimeout(waitForCompletedRefresh, 250);
								} else {
									logger("ERROR", "Gave up waiting for layer to reload after new insert");
									app.plugins.LayerEditor.showLayerEditorWorking(false);
								}
							}
						};
						waitForCompletedRefresh();
					};

					app.plugins.LayerEditor.executeWFSTransaction([emptyFeature], null, null, callback);
				});

				// Register the close feature attribution close btn handler
				$("#le-attribute-form-close-button").on("click", function (e) {
					//remove content of input le-editable-feature-input
					$("#le-editable-feature-input").val("");
					//remove content of select le-editable-feature-select
					$("#le-editable-feature-select").empty();
					$("#le-editable-feature-select-count").empty();

					// Deselect the selected feature on the map
					if (app.plugins.LayerEditor.select) {
						app.plugins.LayerEditor.select.getFeatures().clear();
					}

					// Turn off any active buttons in the specified div
					$("#le-digitize-toolbar-modify .le-edit-btn").removeClass("active");

					//Hide attribute form
					$("#le-attribute-form").css("display", "none");
					app.plugins.LayerEditor.turnEditingOff();
					// Clear editable feature and reset the toolbar
					app.plugins.LayerEditor.editableFeature = null;
				});

				// Register the discard changes btn handler
				$("#le-discard-changes-btn").on("click", function (e) {
					app.plugins.LayerEditor.editableFeature.setGeometry(
						app.plugins.LayerEditor.editableFeatureOriginalGeometry
					);
					app.plugins.LayerEditor.showFeatureEditor(app.plugins.LayerEditor.editableFeature.getId());

					if (app.plugins.LayerEditor.drawnFeature) {
						const source = app.plugins.LayerEditor.editableLayer.getSource();
						source.removeFeature(app.plugins.LayerEditor.drawnFeature);
						app.plugins.LayerEditor.drawnFeature = null; // Clear the reference
					}
					// Reset the drawnFeature variable
					app.plugins.LayerEditor.drawnFeature = null;
				});

				// Register the delete features btn handler
				$("#le-delete-features-btn").on("click", function (e) {
					app.plugins.LayerEditor.deleteFeatures();

					// Clear editable feature and reset the toolbar
					app.plugins.LayerEditor.editableFeature = null;
					$("#le-digitize-toolbar-add-geometry").show();
					$("#le-digitize-toolbar-modify").show();
					$("#le-digitize-toolbar-functions").show();

					// Turn off any active buttons in the specified div
					$("#le-digitize-toolbar-add-geometry .le-edit-btn").removeClass("active");
					$("#le-digitize-toolbar-modify .le-edit-btn").removeClass("active");

					// Reset the drawnFeature variable
					app.plugins.LayerEditor.drawnFeature = null;
					app.plugins.LayerEditor.editableLayer.set("isLoading", true); // trigger this toggle early
					app.plugins.LayerEditor.turnEditingOff();
				});

				// Register the email feature info btn handler
				$("#le-email-button").on("click", function (e) {
					app.plugins.LayerEditor.emailFormContents();
				});

				// Register the cancel delete features btn handler
				$("#le-canceldelete-features-btn").on("click", function (e) {
					app.plugins.LayerEditor.delete.getFeatures().clear();
					app.plugins.LayerEditor.featureDeleteWatcher();
				});

				// Copy the editing toolbar to the map viewport
				$("#le-digitize-toolbar").appendTo("#map .ol-viewport .ol-overlaycontainer-stopevent");

				//Register the click event for zoom to feaute
				$("#le-zoom-to-button").on("click", function () {
					var feature = app.plugins.LayerEditor.editableFeature;
					if (feature) {
						const geometry = feature.getGeometry();
						if (geometry) {
							const featureExtent = geometry.getExtent();
							app.map.getView().fit(featureExtent, { duration: 1000 });
						}
					}
				});

				// Listen to zoom event to toggle certain tools
				app.map.on("moveend", app.plugins.LayerEditor.manageControls);

				// Prevent map and OpenLayers click events from interfering with feature action buttons
				$(document).on(
					"mousedown mouseup click touchstart touchend",
					"#le-feature-action-btn-container button",
					function (e) {
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				);
			}
			// Log success
			logger("INFO", app.plugins.LayerEditor.name + ": Plugin successfully loaded");
		};

		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);
	}
}
