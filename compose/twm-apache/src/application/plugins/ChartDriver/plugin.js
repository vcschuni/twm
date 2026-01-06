class ChartDriver {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "ChartDriver";
		this.version = 1.0;
		this.author = "Jas Dhaul";
		this.pcfg = getPluginConfig(this.name);
		this.tabName = (this.pcfg.tabName) ? this.pcfg.tabName : "Chart Plugin Driver";
		this.tabContentFile = "application/plugins/ChartDriver/home-tab-content.html";
		this.tabNav; // jQuery element
		this.tabContent // jQuery element
		this.addPlugin();
	}
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Define Callback
		var callback = function(success, tabNav, tabContent){
			// Bail if failed
			if (!success) {
				logger("ERROR", app.plugins.ChartDriver.name + ": Plugin failed to initialize");
				return;
			}
			
			// Log success
			logger("INFO", app.plugins.ChartDriver.name + ": Plugin successfully loaded");


			function openChart(event) { // Open the new Chart window 
		
				

				event.preventDefault();
		
				
				function printPoint(label, value) {
					  console.log(label, value);
				}
		
				// Split the comma separated values into an array
				var labels = $("#labels").val().split(',');
				var data =  $("#data").val().split(',');
				const title = $("#cdp-chart-title").text();
				const id = app.plugins.ChartPlugin.open(title,labels,data, printPoint);
				console.log(id);
				
			}

			// Add the event listener to the button
			$("#openChart").on("click", openChart);
		}

		

		

		
		// Add the tab
		addSideBarTab(this.tabName, this.tabContentFile, callback);


	}
}