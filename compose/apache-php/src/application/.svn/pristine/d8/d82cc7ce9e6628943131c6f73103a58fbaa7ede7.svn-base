<?php
/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: functions.php
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 
 *		   Notes: Houses reusable PHP functions.
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * Function: sanitize_output
 * @param (object) $buffer
 * @return (string) $buffered content
 * Function to minify php output
 */	
function sanitize_output($buffer) {
    $search = array(
        '/\>[^\S ]+/s', //strip whitespaces after tags, except space
        '/[^\S ]+\</s', //strip whitespaces before tags, except space
        '/(\s)+/s',  // shorten multiple whitespace sequences,
        '/<!--(.*)-->/Uis', // strips html comments
        '/[\t\s]+/' // replaces tabs with spaces
        );
    $replace = array(
        '>',
        '<',
        '\\1',
        '',
        ' '
        );
	$buffer = preg_replace($search, $replace, $buffer);
	return $buffer;
}

/**
 * Function: convertPostedContentToJavaScriptObject
 * @param () none
 * @return (string) $stringJson
 * Function to convert posted content to JavaScript object
 */	
function convertPostedContentToJavaScriptObject() {
	$rawPostData = file_get_contents("php://input");
	if (!empty($rawPostData)) {
		if (json_decode($rawPostData) !== null) {
			return json_encode((is_object(json_decode($rawPostData))) ? array(json_decode($rawPostData)) : json_decode($rawPostData));
		} else {
			$obj = new stdClass();
			foreach($_POST as $key => $value) {
				$obj->$key = (json_decode($value)) ? json_decode($value): $value;
			}
			return json_encode($obj);
		}
	}
	return null;
}

/**
 * Function: extractValueFromConfig
 * @param (string) $regexPattern
 * @return (string) $title
 * Function to extract an app setting/value from config file
 */
function extractValueFromConfig($regexPattern) {
	if (!isset($_GET["c"])) return null;
    $configFile = "configuration/".$_GET["c"]."/app-config.js";
	if (!file_exists($configFile)) return null;
	$configContent = file_get_contents($configFile);
	if ($configContent === false) return null;
    if (preg_match($regexPattern, $configContent, $matches)) {
        return $matches[1];
    }
    return null;
}

?>