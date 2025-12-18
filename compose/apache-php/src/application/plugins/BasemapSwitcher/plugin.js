class BasemapSwitcher {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "BasemapSwitcher";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.intervalProcessId;
		this.isVisible = false;
		this.addPlugin();
	}
	/**
	 * Function: changeBaseMap
	 * @param () (string) title - basemap title to activate 
	 * @returns () nothing
	 * This function activates the new basemap layer and disables the current one.
	*/
	changeBaseMap(title) {
		app.map.getLayers().forEach(function(layer) {
			if (layer.get("type") == "base" && layer.get("title") == title){
				layer.setVisible(true);
			}else if (layer.get("type") == "base" && layer.get("visible") == true){
				layer.setVisible(false);
			}
		});
	}

	/**
	 * Function: getCurrentBaseLayer
	 * @param () nothing
	 * @returns () nothing
	 * The following function retrieves the name of the current activated base layer
	*/
	getCurrentBaseLayer() {
		var baselayer = "";
		app.map.getLayers().forEach(function(layer) {
			if (layer.get("type") == "base" && layer.get("visible") == true){
				baselayer = layer.get("title");
			}
		});

		return baselayer
	}

	/**
	 * Function: getBaseLayers
	 * @param () nothing
	 * @returns () an array containing the base layers
	 * The following function gets a list of base layers from the app's map.
	*/
	getBaseLayers() {
		const baselayers = [];
		app.map.getLayers().forEach(function(layer) {
			if (layer.get("type") == "base"){
				baselayers.push(layer.get("title"));
			}
		});
	
		return baselayers;
	}

	/**
	 * Function: changeActiveBaseLayer
	 * @param () string, new base layer
	 * @returns () nothing
	 * The following function disables the css selection effects on the current base layer option
	 * and enables the css selection effects on the new base layer option.
	*/
	changeActiveBaseLayer(newBaseLayer) {
		$(".card-item").each(function(){
			if ($(this).attr("id") == newBaseLayer){
				$(this).css("border","1.5px solid rgba(0,60,136,.5)");
			}else{
				$(this).css("border","none");
			}
		});
	}

	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	*/
	addPlugin() {
		
		// Add a custom style sheet.
		$('head').append('<link rel="stylesheet" href="./application/plugins/BasemapSwitcher/styles.css" type="text/css" />');
		
		var basemap = this;
		const baselayers = this.getBaseLayers();
		
		// Reverse the list of basemap layers to match the order shown in the Layers plugin
		baselayers.reverse(); 

		var iconSrc = '<img src="./application/plugins/BasemapSwitcher/img/icon.svg" width="20" height="20">';
		
		var button = document.createElement('button');
		button.innerHTML = iconSrc;
		button.id = "popover-target";
		
		var buttonDiv = document.createElement('div');
		buttonDiv.title = "Select basemap";
		buttonDiv.id = "basemap-switch-btn";
		buttonDiv.className = 'basemap-switch-btn ol-control';
		buttonDiv.style.bottom = '3em';
		buttonDiv.style.right = '0.5em';
		buttonDiv.appendChild(button);

		var basemapControl = new ol.control.Control({
			element: buttonDiv
		});
		
		app.map.addControl(basemapControl);
		
		var cardContainer = document.createElement('div');
		cardContainer.id = 'card-container';
		cardContainer.className = 'card-container';

		// Loop through the baselayers and add them to the popover
		baselayers.forEach(baselayer => {
			var card = document.createElement('figure');
		 	var title = document.createElement('figcaption');
		 	var pic = document.createElement('img');
		 	pic.src = `./application/plugins/BasemapSwitcher/img/${baselayer}.PNG`;
		 	pic.className = "card-item-pic";
			
			 // If image fails to load, then use the default image instead.
			pic.addEventListener("error", function(e){
				e.target.src = "./application/plugins/BasemapSwitcher/img/default.svg";
				e.target.style.opacity = "80%";
				e.onerror = null;
			});
			
			title.innerHTML = baselayer;
			title.id = baselayer + " title";
			title.title = baselayer;
			title.className = "card-item-title";
		
			card.className = "card-item";
			card.id = baselayer;
			card.appendChild(pic)
			card.appendChild(title);
			card.onclick = function(){
				basemap.changeActiveBaseLayer(baselayer);
				basemap.changeBaseMap(baselayer);
				
				// Update the basemap checkbox on the left tab
				$(".form-check.lc-baselayer-control").each(function(i,layerDiv){
					var title = $(this).find(".title").html();
					if (title == baselayer) {
						$(this).find(".form-check-input.lc-baselayer-radio").prop('checked', true);
					}else{
						$(this).find(".form-check-input.lc-baselayer-radio").prop('checked', false);
					}
				});
			};
			
			cardContainer.appendChild(card);
		
		});
		
		// Activate popover on click
		$('#popover-target').popover({
			title: 'Basemap Selection',
			content: cardContainer,
			html: true,
			placement: 'left',
			sanitize: false,
			
		});

		// Update button and popover on click
		$('#popover-target').click(function (e) {
			e.stopPropagation();
			if (!app.plugins.BasemapSwitcher.isVisible){
				var currentBaseLayerTitle = basemap.getCurrentBaseLayer();
				basemap.changeActiveBaseLayer(currentBaseLayerTitle);
				button.innerHTML = "»";
				$("#card-container").css("visibility","visible");
				app.plugins.BasemapSwitcher.isVisible = true;
			}else{
				app.plugins.BasemapSwitcher.isVisible = false;
				button.innerHTML = iconSrc;
			}
		});


		// Hide basemap popup on outside click
		$(document).click(function (e) {
			if (($('.popover').has(e.target).length == 0) || $(e.target).is('.close')) {
				$('#popover-target').popover('hide');
				app.plugins.BasemapSwitcher.isVisible = false;
				button.innerHTML = iconSrc;
			}
		});
		
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}