class SessionMinder {
	
	/**
	 * Function: constructor
	 * @param () none
	 * @returns () nothing
	 * Function that initializes the class
	 */
	constructor() {
		this.name = "SessionMinder";
		this.version = 2.0;
		this.author = "Volker Schunicht";
		this.pcfg = getPluginConfig(this.name);
		this.failureCount = 0;
		this.maxFailureCount = 2;
		this.addPlugin();
	}
	
	/**
	 * Function: notifyUserOfExpiredSession
	 * @param () none
	 * @returns () nothing
	 * Function that notifies user that the SM Session has expired
	 */
	notifyUserOfExpiredSession() {
		logger("INFO", this.name + ": Session Expired");
		bootbox.dialog({
			title: "Session Expired",
			message: "<br><center><span style='color:red;'>Your "+app.config.title.desktop+" session has expired.</span></center><br>",
			size: "medium",
			closeButton: false,
			centerVertical: true,
			buttons: {
				acceptButton: {
					label: "Restart",
					className: 'btn-success',
					callback: function(){
						location.reload();
					}
				}
			}
		});
	}
	
	/**
	 * Function: validateSiteMinderSession
	 * @param () none
	 * @returns () nothing
	 * Function that validates the SiteMinder session
	 */
	validateSiteMinderSession() {
		// Validate SiteMinder session
		$.ajax({
			type: "GET",
			url: "api/sm/session",
			xhrFields: {
				withCredentials: true
			}
		}).done(function(response, textStatus, jqXHR) {
			// Determine if session is valid
			var sessionIsValid = false;
			if (jqXHR.status == 200) {
				if (typeof response === "object") {
					if (response.hasOwnProperty("isValidSession")) {
						if (response.isValidSession === true) {
							sessionIsValid = true;
							$.each(response, function(key, property) {
								app.plugins.SessionMinder[key] = property;
							});
						}
					}
				}
			}

			// Handle valid/invalid session
			if (sessionIsValid) {
				app.plugins.SessionMinder.failureCount = 0; // reset failure counter
			} else {
				app.plugins.SessionMinder.failureCount++; // Increment failure counter
			}

			// If too many failures, throw error to user, otherwise rerun validator after short timeout
			if (app.plugins.SessionMinder.failureCount >= app.plugins.SessionMinder.maxFailureCount) {
				app.plugins.SessionMinder.notifyUserOfExpiredSession();
			} else {
				setTimeout(app.plugins.SessionMinder.validateSiteMinderSession, 15000);
			}
			
		}).fail(function(jqXHR, settings, exception) {
			app.plugins.SessionMinder.failureCount++;
			if (app.plugins.SessionMinder.failureCount >= app.plugins.SessionMinder.maxFailureCount) {
				app.plugins.SessionMinder.notifyUserOfExpiredSession();
			} else {
				setTimeout(app.plugins.SessionMinder.validateSiteMinderSession, 15000);
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
		// Start the SiteMinder session monitor
		if (isSmProtectedDomain()) {
			this.validateSiteMinderSession();
		}
		
		// Log success
		logger("INFO", this.name + ": Plugin successfully loaded");
	}
}