class AttributeTableViewer {
  /**
   * Function: constructor
   * @param () none
   * @returns () nothing
   * Function that initializes the class
   */
  constructor() {
    this.name = "AttributeTableViewer";
    this.version = 1.0;
    this.author = "Stephen Schmuland";
    this.pcfg = getPluginConfig(this.name);
    this.contentFile =
      "application/plugins/AttributeTableViewer/tab-content.html";
    this.selectedIndices = new Set(); // Persist selection across table rebuilds
    this.pageSize = this.pcfg.pageSize ? this.pcfg.pageSize : 50;
    this.maxTextLength = this.pcfg.maxTextLength ? this.pcfg.maxTextLength : 40;
    this.addPlugin();
    this.toggledLayers;
  }

  /**
   * Function: getConfiguredLayers
   * @param () none
   * @returns (array) results
   * Function that executes the search
   */
  getConfiguredLayers() {
    // Clear content of layer list and feature table
    $("#ATV-layer-list").empty();
    $("#ATV-feature-table").html("");

    const toggledTitle = app.plugins.AttributeTableViewer.toggledLayers;

    // Iterate over map layers
    $.each(app.map.getLayers().getArray(), function (index, layer) {
      if (
        layer.get("attributeViewer") === true &&
        layer.getVisible() === true
      ) {
        const title = layer.get("title");

        // Create the button
        var appButton = $(
          "<button type='button' class='ATV-layer-button btn btn-outline-secondary toggle-btn' style='margin-right: 4px;' id='attribute-table-button-" +
            title +
            "'>" +
            title +
            "</button>"
        );
        $("#ATV-layer-list").append(appButton);

        // Attach click handler
        appButton.on("click", function () {
          $(".ATV-layer-button").removeClass("active");
          $(this).addClass("active");
          app.plugins.AttributeTableViewer.toggledLayers = title;

          let editableLayer = false;

          // Check if editable
          for (var i = 0; i < app.config.plugins.length; i++) {
            if (app.config.plugins[i].name == "LayerEditor") {
              const currentEditable = app.plugins.LayerEditor.editableLayer;
              if (currentEditable && title === currentEditable.get("title")) {
                editableLayer = true;
              }
            }
          }

          if (layer.get("editable") === true) {
            $(".ATV-editing-toolbar").show();
          }

          const layerFields = layer.get("fields");
          const features = layer.getSource().getFeatures();

          app.plugins.AttributeTableViewer.buildAttributionTable(
            features,
            layerFields,
            editableLayer
          );
        });

        // Auto-click the button if it's the toggled one
        if (title === toggledTitle) {
          appButton.trigger("click");
        }
      }
    });
  }

  /**
   * Function: highlightFeaturesById
   * @param (array) features - array of ol.Feature objects to highlight and select
   * @returns () nothing
   * Function that highlights and selects features in the attribute table
   */
  highlightFeaturesById(layerName, features, select) {
    if (!Array.isArray(features)) return;

    const $activeBtn = $("#ATV-layer-list .ATV-layer-button.active");
    if ($activeBtn.length === 0) return;

    const activeLayerTitle = $activeBtn.text();
    if (layerName !== activeLayerTitle) return; // Only proceed if layerName matches the active layer title

    if (select) {
      // Add each feature ID to the selected set
      features.forEach((feature) => {
        highlightFeature(feature, true);
        if (feature && feature.getId) {
          const id = feature.getId();
          if (id !== undefined && id !== null) {
            this.selectedIndices.add(id);
          }
        }
      });

      const layer = app.map
        .getLayers()
        .getArray()
        .find((l) => l.get("title") === activeLayerTitle);
      if (layer) {
        const editableLayer =
          layer.get("title") ===
          app.plugins.LayerEditor.editableLayer?.get("title");
        const layerAttributes = layer.get("attributes");
        const layerFeatures = layer.getSource().getFeatures();
        const layerFields = layer.get("fields");

        this.buildAttributionTable(layerFeatures, layerFields, editableLayer);
      }
    } else {
      clearHighlightedFeatures();
    }
  }
  /**
   * Function: buildAttributionTable
   * @param () features
   * @param () layerFields
   * @param () editable
   * Function builds the attribution table from the selected layers features
   */
  buildAttributionTable(features, layerFields, editable) {
  const pageSize = this.pageSize;
  const maxTextLength = this.maxTextLength;
  let currentPage = 1;
  let filteredFeatures = features.slice();
  let totalPages = Math.ceil(filteredFeatures.length / pageSize);
  let selectedIndices = this.selectedIndices;

  function truncateText(text, maxLength) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  function renderTablePage(page) {
    let start = (page - 1) * pageSize;
    let end = start + pageSize;
    let pageFeatures = filteredFeatures.slice(start, end);

    const searchableFields = layerFields.filter(f => f.searchable !== false);

    // Build table header
    let tableHTML = "<thead><tr>";
    tableHTML += '<th><span id="ATV-selected-count" title="Selected Record Count" class="badge text-bg-warning">0</span></th>';

    if (editable) {
      tableHTML += "<th>Edit</th>";
    }

    searchableFields.forEach((field) => {
      let fieldName = field.name;
      if (field.nameTransform) {
        fieldName = field.nameTransform(fieldName);
      }
      tableHTML += `<th style="width: 150px;">${fieldName}</th>`;
    });

    tableHTML += "</tr></thead><tbody>";

    // Build table body
    pageFeatures.forEach((feature, idx) => {
      let rowClass = selectedIndices.has(feature.getId()) ? "table-primary" : "";
      tableHTML += `<tr data-feature-index="${idx}" class="${rowClass}">`;

      let checked = selectedIndices.has(feature.getId()) ? "checked" : "";
      tableHTML += `<td><input type="checkbox" class="ATV-select-checkbox" data-feature-index="${idx}" ${checked}></td>`;

      if (editable) {
        tableHTML += `<td>
          <button type="button" class="btn btn-primary btn-sm ATV-edit-button" title="Edit" data-feature-index="${idx}">
              <span class="oi oi-pencil"></span>
          </button>
        </td>`;
      }

      searchableFields.forEach((field) => {
        let fieldValue = feature.values_[field.name];
        if (field.valueTransform) {
          fieldValue = field.valueTransform(fieldValue, feature);
        }
        if (fieldValue === null || fieldValue === undefined) {
          fieldValue = "";
        }

        //let rawText = fieldValue.toString();
       // let value = truncateText(rawText, maxTextLength);
       
        tableHTML += `<td title="${fieldValue}">${fieldValue}</td>`;
      });

      tableHTML += "</tr>";
    });

    tableHTML += "</tbody>";

    $("#ATV-feature-table").html(tableHTML);

    // Bind checkbox click
    $("#ATV-feature-table")
      .find(".ATV-select-checkbox")
      .on("click", function (event) {
        event.stopPropagation();
        let $checkbox = $(this);
        let idx = $(this).data("feature-index");
        let $row = $checkbox.closest("tr");
        let feature = pageFeatures[idx];

        if ($checkbox.is(":checked")) {
          $row.addClass("table-primary");
          selectedIndices.add(feature.getId());
          highlightFeature(feature, true);
        } else {
          $row.removeClass("table-primary");
          selectedIndices.delete(feature.getId());
          clearHighlightedFeatures(feature);
        }
        updateSelectedCount();
      });

    // Bind row double-click to zoom
    $("#ATV-feature-table tbody tr")
      .off("dblclick")
      .on("dblclick", function () {
        let idx = $(this).data("feature-index");
        let feature = pageFeatures[idx];
        zoomToFeature(feature);
      });

    // Hover to highlight
    $("#ATV-feature-table tbody tr").hover(
      function () {
        let idx = $(this).data("feature-index");
        let feature = pageFeatures[idx];
        highlightFeature(feature);
      },
      function () {
        clearHighlightedFeatures();
      }
    );

    // Edit button
    if (editable) {
      $("#ATV-feature-table")
        .find(".ATV-edit-button")
        .on("click", function (event) {
          let idx = $(this).data("feature-index");
          let feature = pageFeatures[idx];
          activateSidebarTab(app.plugins.LayerEditor.tabNav);
          app.plugins.LayerEditor.populateFeatureEditorSelector([feature]);
        });
    }

    updateSelectedCount();
  }

  function renderPagination() {
    totalPages = Math.max(1, Math.ceil(filteredFeatures.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    $("#ATV-pagination-info").text(`${currentPage} of ${totalPages}`);
    const prevBtn = $("#ATV-pagination-prev");
    const nextBtn = $("#ATV-pagination-next");
    prevBtn.prop("disabled", currentPage <= 1);
    nextBtn.prop("disabled", currentPage >= totalPages);
    prevBtn.off("click").on("click", function () {
      if (currentPage > 1) {
        currentPage--;
        renderTablePage(currentPage);
        renderPagination();
      }
    });
    nextBtn.off("click").on("click", function () {
      if (currentPage < totalPages) {
        currentPage++;
        renderTablePage(currentPage);
        renderPagination();
      }
    });
  }

  function applyFilter() {
    const filter = $("#ATV-search-input").val().toLowerCase();
    if (!filter) {
      filteredFeatures = features.slice();
    } else {
      filteredFeatures = features.filter((feature) => {
        return layerFields.some((field) => {
          if (field.searchable === false) return false;
          let fieldValue = feature.values_[field.name];
          if (field.valueTransform) {
            fieldValue = field.valueTransform(fieldValue, feature);
          }
          if (fieldValue === null || fieldValue === undefined) return false;
          let rawText = fieldValue.toString().toLowerCase();
          return rawText.includes(filter);
        });
      });
    }

    currentPage = 1;
    renderTablePage(currentPage);
    renderPagination();
  }

  function updateSelectedCount() {
    $("#ATV-selected-count").text(selectedIndices.size);
  }

  function showOnlySelected() {
    filteredFeatures = features.filter((feature) =>
      selectedIndices.has(feature.getId())
    );
    currentPage = 1;
    renderTablePage(currentPage);
    renderPagination();
  }

  // Initial render
  renderTablePage(currentPage);
  renderPagination();

  // Bind search input
  $("#ATV-search-input")
    .off("keyup")
    .on("keyup", function () {
      applyFilter();
    });

  // Bind "show selected" button
  $("#ATV-show-selected").on("click", function () {
    showOnlySelected();
  });
}

  /**
   * Function: addPlugin
   * @param () none
   * @returns () nothing
   * Function that adds the plugin
   */

  addPlugin() {
    // Load the floating window template
    $.ajax({
      url: this.contentFile,
      cache: false,
      dataType: "html",
    })
      .done(function (content) {
        //Set CSS for map to accomidate for bottom bar
        $("#map").css("height", "98%");

        //Show bottom bar expander
        $("#bottom-bar-expander").show();

        // Append the template to the body
        $("#bottom-bar").append(content);

        app.plugins.AttributeTableViewer.getConfiguredLayers();

        $(document).on("change", ".lc-overlay-chkbox", function () {
          var $container = $(this).closest(".lc-overlay-control");
          var layerId = $container.attr("layerid");
          var isChecked = $(this).is(":checked");
          app.plugins.AttributeTableViewer.getConfiguredLayers();
          // Your logic here
        });

        // Add event listener for the search input
        $("#ATV-search-input").on("keyup", function () {
          var filter = $(this).val().toLowerCase();
          $("#ATV-feature-table tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(filter) > -1);
          });
        });

        // Add event listener for the clear search button
        $("#ATV-search-clear-btn").on("click", function () {
          //clear the selection
          app.plugins.AttributeTableViewer.selectedIndices.clear();
          $("#ATV-search-input").val("");
          $("#ATV-search-input").trigger("keyup"); // Triggers the filter logic
        });

        // Add event listener for the attribute table refresh button
        $("#ATV-attribute-refresh").on("click", function () {
          var $activeBtn = $("#ATV-layer-list .ATV-layer-button.active");
          if ($activeBtn.length > 0) {
            $("#ATV-search-input").val("");
            // Clear all selected checkboxes across all pages
            app.plugins.AttributeTableViewer.selectedIndices.clear();
            var layerTitle = $activeBtn.text();
            var layer = app.map
              .getLayers()
              .getArray()
              .find(function (l) {
                return l.get("title") === layerTitle;
              });
            if (layer) {
              var editableLayer = false;
              if (
                layer.get("title") ===
                app.plugins.LayerEditor.editableLayer.get("title")
              ) {
                editableLayer = true;
              }
              var layerAttributes = layer.get("attributes");
              var features = layer.getSource().getFeatures();
              var layerFields = layer.get("fields");
              app.plugins.AttributeTableViewer.buildAttributionTable(
                features,
                layerFields,
                editableLayer
              );
            }
          }
        });

        // Log success
        logger(
          "INFO",
          app.plugins.AttributeTableViewer.name + ": Plugin successfully loaded"
        );
      })
      .fail(function (jqxhr, settings, exception) {
        logger(
          "ERROR",
          app.plugins.AttributeTableViewer.name +
            ": Could not load template - " +
            exception
        );
      });

    //if ATV-layer-button is clicked and active, remove active class

    $(document).on("click", ".ATV-layer-button", function () {
      if ($(this).hasClass("active")) {
        //clear ATV-feature-table
      } else {
        //clear ATV-feature-table
        $("#ATV-feature-table").html("");
        $(".ATV-editing-toolbar").hide();
        //clear ATV-pagination

        //disable ATV-pagination-controls
        $("#ATV-pagination-prev").prop("disabled", true);
        $("#ATV-pagination-next").prop("disabled", true);
        //Reset ATV-pagination-info
        $("#ATV-pagination-info").text("1 of 1");
        $("#ATV-pagination").remove();
        //$(this).addClass("active");
      }
    });
  }
}
