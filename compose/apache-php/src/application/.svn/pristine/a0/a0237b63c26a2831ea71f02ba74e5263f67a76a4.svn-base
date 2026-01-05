class Disclaimer {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "Disclaimer";
		this.version = 1.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.title = (this.pcfg.title) ? this.pcfg.title : "Disclaimer";
		this.acceptButtonText = (this.pcfg.acceptButtonText) ? this.pcfg.acceptButtonText : "Continue";
		this.hideButtons = (this.pcfg.hideButtons) ? this.pcfg.hideButtons : false;
		this.contentFile = "configuration/" + app.config.name + "/disclaimer-content.html";
		this.addPlugin();
	}
	
	/**
	 * Function: show
	 * @param () none
	 * @returns () nothing
	 * Function that opens a modal dialog and displays the disclaimer
	 */
	show() {
        $.ajax({
            url: this.contentFile,
            dataType: "html"
        })
        .done(function(content) {
            var dialogOptions = {
                title: app.plugins.Disclaimer.title,
                message: content,
                size: "extra-large",
                closeButton: false,
                centerVertical: true
            };

            if (!app.plugins.Disclaimer.hideButtons) {
                dialogOptions.buttons = {
                    acceptButton: {
                        label: app.plugins.Disclaimer.acceptButtonText,
                        className: 'btn-success',
                        callback: function() {
                            // Add your callback code here
                        }
                    }
                };
            }

            bootbox.dialog(dialogOptions);
        })
        .fail(function(jqxhr, settings, exception) {
            bootbox.dialog({
                title: app.plugins.Disclaimer.title,
                message: "<br><center>" + exception + "<br><br>Please contact the System Administrator</center><br>",
                size: "extra-large",
                closeButton: false,
                centerVertical: true
            });
        });
    }
	
	/**
	 * Function: addPlugin
	 * @param () none
	 * @returns () nothing
	 * Function that adds the plugin tab to the sidebar
	 */
	addPlugin() {
		// Show the disclaimer
		this.show()
		
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}