class ChartPlugin {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ChartPlugin";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.addPlugin();
		this.chartData = [];
		this.chartLabels = [];
	}
	
	/**
	* Function: saveChart
	* @param nothing
	* @returns nothing
	* Function to save the chart canvas as an image
	*/
	saveChart(id) {
		var srcCanvas = document.getElementById(id);
		
		//create a dummy CANVAS		
		var destinationCanvas = document.createElement("canvas");
		destinationCanvas.width = srcCanvas.width;
		destinationCanvas.height = srcCanvas.height;		
		var destCtx = destinationCanvas.getContext('2d');
		
		//create a rectangle with the desired color
		destCtx.fillStyle = "#FFFFFF";
		destCtx.fillRect(0,0,srcCanvas.width,srcCanvas.height);
		
		//draw the original canvas onto the destination canvas
		destCtx.drawImage(srcCanvas, 0, 0);
			
		var link = document.createElement('a');
		link.setAttribute('download', 'chart.png');
		link.setAttribute('href', destinationCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
		link.click();		
	}	
	
	/**
	 * 
	 * @param {*} canvas 
	 * @param {*} labels 
	 * @param {*} data 
	 * @param {*} title 
	 * @param {*} chartColours 
	 * @param {*} type 
	 * @returns 
	 * Function that creates a new chart given the chart parameters
	 */
	createChart(canvas, labels, data, title, chartColours, type, clickedFunction){
		

		// Create a new chart with the specificed label and data values
		var newChart = new Chart(canvas, {
			type: type,
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: chartColours,
					borderWidth: 1
				}]
			},
			options: {
				onClick(e) {
					const activePoints = newChart.getElementsAtEventForMode(e, 'nearest', {
					  intersect: true
					}, false)
					if (activePoints.length && clickedFunction) {
						const firstPoint = activePoints[0];
						const label = newChart.data.labels[firstPoint.index];
						const value = newChart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
						clickedFunction(label, value);
					}
				  
				},	
				plugins:{	
					legend: {
						display: (type == "pie" || type =="doughnut") ? true : false,
					},
					title: {
						display: true,
						text: title
					},
					subtitle: {
						display: true,
						text: ''
					},
					datalabels: {
						anchor: 'end',
						align: 'end',
						offset: 2,
						display: 'auto',
						
					}
				},
				
			},
			
		});

		return newChart
	}

	/**
	 * Function: open
	 * @param (string) title
	 * @param ([string]) labels
	 * @param ([number]) data
	 * @param (function) clicked Data Point callback - OPTIONAL
	 * @param (integer) width - OPTIONAL - DEFAULT 300px
	 * @param (integer) height - IGNORED
	 * @param (string) location ('left', 'right', 'middle')- OPTIONAL - DEFAULT 'left'
	 * @param (function) openCallback - OPTIONAL
	 * @param (function) closeCallback - OPTIONAL
	 * @param ([string]) chartTypes - OPTIONAL
	 * @param ([object]) summarizeOptions - OPTIONAL
	 * @param ([string]) summarizeOptionDefault - OPTIONAL
	 * @returns (string) div id of floating window
	 * Function that opens the chart in a floating window to a specified width, height is calculated 
	 */
	open(title, labels, data, clickedFunction, width, height, location, summarizeOptions,summarizeOptionDefault, openCallback, closeCallback, chartTypes ) {
		
		//add labels to global variable
		app.plugins.ChartPlugin.chartLabels = labels

		//add data to global variable
		app.plugins.ChartPlugin.chartData = data
		

		// Check for multi floating window plugin
		if (!app.plugins.MultiFloatingWindow) {
			logger("ERROR", app.plugins.ChartPlugin.name + ": Plugin failed to initialize. MultiFloatingWindow plugin dependency not found.");
			return;
		}

		// Optional parameters (set default if not specified)
		openCallback = openCallback || function () {};

		// Create a new div element
		var div = document.createElement("div");
		div.className = "chart-container";
		div.style.display = "inline";

		// Create a "Summarize By" dropdown
		const summarizeDiv = document.createElement("div");
		summarizeDiv.className = "chart-summarize-div";
		summarizeDiv.style.display = "flex";
		summarizeDiv.style.justifyContent = "flex-start";
		summarizeDiv.style.marginBottom = "10px";

		const summarizeLabel = document.createElement("label");
		summarizeLabel.innerHTML = "Summarize By: ";
		summarizeLabel.style.marginRight = "10px";

		const summarizeSelect = document.createElement("select");
		summarizeSelect.className = "form-select form-select-sm chart-summarize-select";
		summarizeSelect.style = "width: max-content;margin-right: 10px;";

		
		// Populate the dropdown with summarize options
		if (summarizeOptions && summarizeOptions.length > 0) {
			summarizeOptions.forEach(option => {
				const opt = document.createElement("option");
				opt.value = option.name;
				opt.text = option.nameTransform;
				summarizeSelect.appendChild(opt);
			});
		} else {
			// Hide the "Summarize By" dropdown if no options are provided
			summarizeDiv.style.display = "none";
		}

		// Append the dropdown to the summarize div
		summarizeDiv.appendChild(summarizeLabel);
		summarizeDiv.appendChild(summarizeSelect);
		div.appendChild(summarizeDiv);

		//if summarizeOptionDefault is not null take that value passed and set the Summarize By dropdown
		if (summarizeOptionDefault) {
			summarizeSelect.value = summarizeOptionDefault;
		} else {
			summarizeOptionDefault = summarizeSelect.value;
		}

		// Create a new canvas element
		var canvas = document.createElement("canvas");

		// Set the class of the canvas to "chart-canvas"
		canvas.className = "chart-canvas";

		// Get the number of canvas elements
		var canvasNumber = document.getElementsByClassName("chart-canvas").length + 1;

		// Set the id of the canvas to "chart-canvas" + the number of canvas elements
		canvas.id = "chart-canvas-" + canvasNumber;
		
		// Append a canvas element to the div
		div.appendChild(canvas);
		var chartColours = [];
		data.forEach(function(row,i) {
			chartColours.push("#"+Math.floor(Math.random()*16777215).toString(16)); // random colour assigment
		}); 

		// Create a control div
		var controlDiv = document.createElement("div");
		controlDiv.className = "chart-control-div";
		controlDiv.style.display = "flex";
		controlDiv.style.justifyContent = "center";
		controlDiv.style.alignItems = "center";
		controlDiv.style.gap = "15px";
		controlDiv.style.marginTop = "5px";

		// Add a dropdown to the bottom of the div so that user's can select
		// between bar, line, and pie charts
		var select = document.createElement("select");
		select.className = "form-select form-select-sm chart-select"; // Updated to use Bootstrap classes
		select.id = "chart-select-" + canvasNumber;
		
		// determine chart types
		var types = ["bar","line","pie","doughnut","radar"];
		if (chartTypes !== undefined) {
			types = chartTypes;
		}
		
		// Create chart options
		types.forEach(function(type){
			var option = document.createElement("option");
			option.value = type;
			option.text = type.charAt(0).toUpperCase() + type.slice(1) + " Chart";
			select.appendChild(option);
		});
		select.selectedIndex = 0; // default to first in list

		select.onchange = function() {
			var chartType = select.options[select.selectedIndex].value;
			myChart.destroy();
			myChart = app.plugins.ChartPlugin.createChart(canvas, app.plugins.ChartPlugin.chartLabels, app.plugins.ChartPlugin.chartData, title, chartColours, chartType, clickedFunction);
			fixChartSize();
		}

		// Append the select element to the div
		controlDiv.appendChild(select);
		
		// Add a button to the bottom of the div that will allow user's to download the chart as an image
		var button = document.createElement("button");
		button.className = "btn btn-outline-secondary btn-sm";
		button.id = "chart-button-" + canvasNumber;
		button.innerHTML = "Download";
		button.onclick = function() {
			app.plugins.ChartPlugin.saveChart(canvas.id);
		}

		// Append the button to the div
		controlDiv.appendChild(button);
		div.appendChild(controlDiv);

		// If the width and height are not specified, add some default values
		if (width == null) {
			width = "300px";
		}

		// Define the canvas ID
		const canvasId = "chart-"+canvasNumber;



		
		// Define the function that fixes the chart size
		function fixChartSize() {
			app.plugins.MultiFloatingWindow.resetHeight(canvasId);
		}

		// Create a new chart with the specificed label and data values
		
		var myChart = app.plugins.ChartPlugin.createChart(canvas, labels, data, title, chartColours, types[0], clickedFunction);

		// Refresh the chart when the summarize option changes


		summarizeSelect.onchange = function () {
			const selectedSummarizeBy = summarizeSelect.value;

			// Summarize the data by count based on the selected field
			const summarizedData = {};
			data.forEach(item => {
				const key = item[selectedSummarizeBy] || "Unknown";
				summarizedData[key] = (summarizedData[key] || 0) + 1;
			});

			// Extract new labels and data
			const newLabels = Object.keys(summarizedData);
			this.chartLabels = newLabels
			const newData = Object.values(summarizedData);
			this.chartData = newData

			// Update the chart with the summarized data
			myChart.destroy();
			myChart = app.plugins.ChartPlugin.createChart(
				canvas,
				newLabels,
				newData,
				title,
				chartColours,
				types[0],
				clickedFunction
			);
		};

		

		// If summarizeOptionDefault is not null, summarize data on load
		if (summarizeOptionDefault) {
			summarizeSelect.value = summarizeOptionDefault;

			// Trigger summarizeSelect.onchange logic
			const selectedSummarizeBy = summarizeSelect.value;

			// Summarize the data by count based on the selected field
			const summarizedData = {};
			data.forEach(item => {
				const key = item[selectedSummarizeBy] || "Unknown";
				summarizedData[key] = (summarizedData[key] || 0) + 1;
			});

			// Extract new labels and data
			const newLabels = Object.keys(summarizedData);
			this.chartLabels = newLabels
			const newData = Object.values(summarizedData);
			this.chartData = newData

			// Update the chart with the summarized data
			myChart.destroy();
			myChart = app.plugins.ChartPlugin.createChart(
				canvas,
				newLabels,
				newData,
				title,
				chartColours,
				types[0],
				clickedFunction
			);
		}

		// Create a new multifloating window
		app.plugins.MultiFloatingWindow.open(canvasId, title, div, width, null, location, fixChartSize, closeCallback);

		// Close the sidebar panel if the user is on mobile
		if (isMobile()) hideSidebar();
		
		// Run the callback function (after short delay)
		setTimeout(openCallback, 250);

		// Return the the Id value created by the MultiFloatingWindow function
		return "#mfw-"+canvasId;
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		
		// Log success
		logger("INFO", "ChartPlugin: Plugin successfully loaded");
			
	}
}