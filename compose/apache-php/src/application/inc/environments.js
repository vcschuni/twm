/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: environments.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Contains helper functions to aid in determining environment 
 * 				  URLs.  THIS WILL NEED TO BE MOVED TO A SERVERSIDE CONFIG
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */
 
 /**
 * Function: isSmProtectedDomain
 * @param () none
 * @returns (boolean) true if a SM protected domain, false otherwise
 * Function that [loosely] determines if the domain from which TWM was called 
 * is a SM protected domain
 */
function isSmProtectedDomain() {
	// Set default
	var isSmProtected = false;
	
	// Define the list of valid domains
	var smProtectedDomains = [
		"dev-motigeo.th.gov.bc.ca",
		"tst-motigeo.th.gov.bc.ca",
		"prd-motigeo.th.gov.bc.ca",
		"motigeo.th.gov.bc.ca"
	];
	
	// Test if current hostname falls with domain list
	$.each(smProtectedDomains, function(index, domain) {
		if (window.location.hostname.toLowerCase().includes(domain.toLowerCase())) isSmProtected = true;
	});

	// Return result
	return isSmProtected;
}
 
 /**
 * Function: isValidTwmDomain
 * @param () none
 * @returns (boolean) true if is a valid TWM domain, false otherwise
 * Function that [loosely] determines if the domain from which TWM was called is valid.
 * Sub-domains of these are automatically accepted
 */
function isValidTwmDomain() {
	// Set default
	var isValid = false;
	
	// Define the list of valid domains
	var validTwmDomains = [
		"localhost",
		"127.0.0.1",
		"gov.bc.ca",
		"drivebc.ca"
	];
	
	// Test if current hostname falls with domain list
	$.each(validTwmDomains, function(index, domain) {
		if (window.location.hostname.toLowerCase().includes(domain.toLowerCase())) isValid = true;
	});

	// Return result
	return isValid;
}

/**
 * Function: getAppInstance
 * @param () none
 * @returns (string) "Internal" or "Public"
 * Function that determines if the current app instance is Internal or Public based on the domain
 */
function getAppInstance() {
    // Define the list of internal domains
    var internalDomains = [
        "dev-motigeo.th.gov.bc.ca",
        "tst-motigeo.th.gov.bc.ca",
        "motigeo.th.gov.bc.ca",
        "devoas4.apps.th.gov.bc.ca",
        "tstoas5.apps.th.gov.bc.ca",
        "prdoas5.apps.th.gov.bc.ca"
    ];
    
    // Test if current hostname is in the internal domains list
    for (let i = 0; i < internalDomains.length; i++) {
        if (window.location.host === internalDomains[i]) {
            return "Internal";
        }
    }
    
    // Default to Public
    return "Public";
}

/**
 * Function: returnEnvironment
 * @param () none
 * @returns (string) environment
 * Function that returns an environment based on requesting URL
 */
function returnEnvironment() {
	// Define the environments based on domain
	var domainEnvironmentMatrix = {
		"DEV": [
			"localhost",
			"127.0.0.1",
			"dev-motigeo.th.gov.bc.ca",
			"dev-rdm.th.gov.bc.ca",
			"dev-twm.th.gov.bc.ca",
			"devoas4.apps.th.gov.bc.ca",
			"dev.apps.silver.devops.gov.bc.ca"
		],
		"TST": [
			"tst-motigeo.th.gov.bc.ca",
			"tst-rdm.th.gov.bc.ca",
			"tst-twm.th.gov.bc.ca",
			"tstoas5.apps.th.gov.bc.ca",
			"test.apps.silver.devops.gov.bc.ca"
		],
		"STG": [
			"stg-motigeo.th.gov.bc.ca",
			"stg-rdm.th.gov.bc.ca",
			"stg-twm.th.gov.bc.ca"
		]
	};
	
	// Set the default environment
	var environment = "PRD"; // default
	
	// Iterate over the domainEnvironmentMatrix object to determine the current environment
	$.each(domainEnvironmentMatrix, function(environmentName, environmentDomains) {
		$.each(environmentDomains, function(index, environmentDomain) {
			if (window.location.hostname.toLowerCase().includes(environmentDomain.toLowerCase())) environment = environmentName;
		});
	});

	// Return environment
	return environment;
}

/**
 * Function: returnEnvironmentUrl
 * @param (string) endPoint
 * @returns (string) substituted url
 * Function that returns a url substitution based on detected environment.  Some day we need
 * to make this solution more elegant (i.e. requires maintenance often).
 */
function returnEnvironmentUrl(endPoint) {
	// Determine environment
	var environment = returnEnvironment();
	
	// Return respective url based on endpoint request and environment
	switch (endPoint) {
			
		// MoTT Public GeoServer
		case "ogs-public": 
			switch(environment) {
				case "DEV":
					return "https://dev-maps.th.gov.bc.ca/geoV05";
				case "TST":
					return "https://tst-maps.th.gov.bc.ca/geoV05";
				case "STG":
				case "PRD":
					return "https://maps.th.gov.bc.ca/geoV05";
			}
			break;
			
		// MoTT Internal GeoServer
		case "ogs-internal": 
			switch(environment) {
				case "DEV":
					return "https://devoas4.apps.th.gov.bc.ca/ogs-geoV06";
				case "TST":
					return "https://tstoas5.apps.th.gov.bc.ca/ogs-geoV06";
				case "STG":
				case "PRD":
					return "https://prdoas5.apps.th.gov.bc.ca/ogs-geoV06";
			}
			break;
			
		// BCGW Internal MapServer
		case "bcgw-internal": 
			switch(environment) {
				case "DEV":
				case "TST":
					return "https://delivery.apps.gov.bc.ca/ext/sgw/geo.allgov";
				case "STG":
				case "PRD":
					return "https://apps.gov.bc.ca/ext/sgw/geo.allgov";
			}
			break;
			
		// BCGW Public
		case "bcgw-public": 
			switch(environment) {
				case "DEV":
				case "TST":
				case "STG":
				case "PRD":
					return "https://openmaps.gov.bc.ca/geo/pub";
			}
			break;
			
		// ILRR REST API
		case "ilrr-rest": 
			switch(environment) {
				case "DEV":
					return "https://delivery.a100.gov.bc.ca/ext/ilrrws/rest";
				case "TST":
					return "https://test.a100.gov.bc.ca/ext/ilrrws/rest";
				case "STG":
				case "PRD":
					return "https://a100.gov.bc.ca/ext/ilrrws/rest";
			}
			break;
						
		// MoTT Internal Oracle Application Server
		case "oas": 
			switch(environment) {
				case "DEV":
					return "https://devoas4.apps.th.gov.bc.ca";
				case "TST":
					return "https://tstoas5.apps.th.gov.bc.ca";
				case "STG":
				case "PRD":
					return "https://prdoas5.apps.th.gov.bc.ca";
			}
			break;
			
		// MoTT Public Oracle Application Server
		case "pub-oas": 
			switch(environment) {
				case "DEV":
					return "https://devoas5.pub-apps.th.gov.bc.ca";
				case "TST":
					return "https://tstoas6.pub-apps.th.gov.bc.ca";
				case "STG":
				case "PRD":
					return "https://prdoas6.pub-apps.th.gov.bc.ca";
			}
			break;
			
		// MoTT TRADAS Application Server
		case "tradas": 
			switch(environment) {
				case "DEV":
				case "TST":
					return "https://tst-tradas.th.gov.bc.ca";
				case "STG":
				case "PRD":
					return "https://tradas.th.gov.bc.ca";
			}
			break;

		// MoTT CaRT Application Server
		case "crt": 
			switch(environment) {
				case "DEV":
//					return "https://dev-crt.th.gov.bc.ca";
				case "TST":
					return "https://uat-crt.th.gov.bc.ca";
				case "UAT":
				case "PRD":
					return "https://crt.th.gov.bc.ca";
			}
			break;
			
		// eDAS 
		case "dag": 
			switch(environment) {
				case "DEV":
					return "https://dev-edas.posse.th.gov.bc.ca/DAP/Default.aspx";
				case "TST":
					return "https://tst-edas.posse.th.gov.bc.ca/DAP/Default.aspx";
				case "UAT":
				case "PRD":
					return "https://posse.th.gov.bc.ca/DAP/Default.aspx/";
			}
			break;
			
		// RDM API
		case "rdm-api": 
			switch(environment) {
				case "DEV":
					return "https://dev-rdm.th.gov.bc.ca/api";
				case "TST":
					return "https://tst-rdm.th.gov.bc.ca/api";
				case "STG":
					return "https://stg-rdm.th.gov.bc.ca/api";
				case "PRD":
					return "https://rdm.th.gov.bc.ca/api";
			}
			break;
		
		// RDM API-Public
		case "rdm-api-public": 
			switch(environment) {
				case "DEV":
					return "https://dev-rdm-public.th.gov.bc.ca/api";
				case "TST":
					return "https://tst-rdm-public.th.gov.bc.ca/api";
				case "STG":
					return "https://stg-rdm-public.th.gov.bc.ca/api";
				case "PRD":
					return "https://rdm-public.th.gov.bc.ca/api";
			}
			break;

		// RAAD API
		case "raad": 
			switch(environment) {
				case "DEV":
					return "https://delivery.apps.gov.bc.ca/ext/sgw/geo.archaeology";
				case "TST":
					return "https://test.apps.gov.bc.ca/ext/sgw/geo.archaeology";
				case "STG":
				case "PRD":
					return "https://apps.gov.bc.ca/ext/sgw/geo.archaeology";
			}
			break;
		
		// AWP API
		case "awp": 
			switch(environment) {
				case "DEV":
					return "http://th.gov.bc.ca/awp_dev";
				case "TST":
					return "http://th.gov.bc.ca/awp_tst";
				case "STG":
				case "PRD":
					return "http://th.gov.bc.ca/awp_prd";
			}
			break;
						
			
		// Default: UNKNOWN ENDPOINT REQUESTED
		default:
			return "../../ows"; //???
	}
}
