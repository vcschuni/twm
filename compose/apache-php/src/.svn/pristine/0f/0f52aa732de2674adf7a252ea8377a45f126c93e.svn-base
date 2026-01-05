<?php

// Includes
include_once("application/inc/functions.php");

// Get revision from file
$revision = trim(file_get_contents("application/revision.txt"));

// Define Application title, description, & author at the PHP level if possible. 
// This is for indexing robots cuz they don't execute JavaScript.
$title = extractValueFromConfig('/title:\s*{[^}]*desktop:\s*"([^"]+)"/');
$description = extractValueFromConfig('/meta:\s*{[^}]*description:\s*"([^"]+)"/');
$author = extractValueFromConfig('/meta:\s*{[^}]*author:\s*"([^"]+)"/');
if (empty($title)) $title = "Transportation Web Map";
if (empty($description)) $description = "A configurable and quickly deployable webmap framework that provides spatial data visualization and discovery.";
if (empty($author)) $author = "BC Ministry of Transportation and Transit";

// Minify the php output
ob_start("sanitize_output");

?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<!-- Meta -->
		<meta charset="utf-8" />
		<meta name="description" content="<?php echo $description; ?>">
		<meta name="author" content="<?php echo $author; ?>">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, user-scalable=no">
				
		<!-- Title -->
		<title><?php echo $title; ?></title>
		
		<!-- Favicon -->
		<link rel="icon" type="image/png" href="application/img/favicon.png?v=<?php echo $revision; ?>">
		
		<!-- 3rd Party CSS -->
		<link rel="stylesheet" href="application/lib/jquery-ui-1.13.2/jquery-ui.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/jquery-scrolling-tabs-2.6.1/jquery.scrolling-tabs.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/bootstrap-5.3.3/css/bootstrap.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/bs5treeview-1.2.0/dist/css/bstreeview.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/open-iconic-1.1.1/font/css/open-iconic-bootstrap.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/openlayers-8.2.0/ol.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/spin.js/spin.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/jquery-color-pick/colorPick.min.css?v=<?php echo $revision; ?>">
		<link rel="stylesheet" href="application/lib/bootstrap-select-1.14.0-beta3/bootstrap-select.min.css?v=<?php echo $revision; ?>">
				
		<!-- Custom CSS -->
		<link rel="stylesheet" href="application/css/styles.css?v=<?php echo $revision; ?>">
		
		<!-- Global -->
		<script type="text/javascript">
			var app = new Object();
			app.revision = <?php echo $revision; ?>;
		</script>
		
		<!-- 3rd Party JS -->
		<script type="text/javascript" src="application/lib/jquery/jquery-3.7.1.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/jquery-ui-1.13.2/jquery-ui.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/jquery-scrolling-tabs-2.6.1/jquery.scrolling-tabs.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/md5.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/moment-with-locales.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bootstrap-5.3.3/js/bootstrap.bundle.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bs5treeview-1.2.0/dist/js/bstreeview.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bootbox-6.0.0/bootbox.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bootbox-6.0.0/bootbox.locales.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/openlayers-8.2.0/ol.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/ol-mapbox-style-12.2.0/dist/olms.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/proj4js-2.9.2/proj4.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/turf-6.5.0/turf.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/spin.js/spin.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/jquery-color-pick/colorPick.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bootstrap-input-spinner-2.1.2/src/bootstrap-input-spinner.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/chartjs-4.4.1/chart.umd.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/chartjs-plugin-datalabels-2.2.0/chartjs-plugin-datalabels.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/d3-7.8.5/d3.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/bootstrap-select-1.14.0-beta3/bootstrap-select.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/isdark-1.4.0/isdark-min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/filesaver-2.0.4/dist/FileSaver.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/tinymce-7.4.1/tinymce.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/togeojson-5.8.1/togeojson.umd.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/jszip-3.10.1/jszip.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/shpjs-4.0.4/shp.min.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/lib/shpwrite-0.4.3/shpwrite.js?v=<?php echo $revision; ?>"></script>
		
		<!-- Custom JS -->
		<script type="text/javascript" src="application/inc/environments.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/inc/common.js?v=<?php echo $revision; ?>"></script>
		<script type="text/javascript" src="application/inc/init.js?v=<?php echo $revision; ?>"></script>
		
		<?php if (!empty(convertPostedContentToJavaScriptObject())) { ?><script type="text/javascript">var post = <?php echo convertPostedContentToJavaScriptObject(); ?>;</script><?php } ?>
		
	</head>
	<body>
		<!-- Header -->
		<nav class="navbar navbar-expand-md navbar-dark fixed-top twm-header">
			<div class="container-fluid">
				<img id="appImage" class="d-inline-block align-top">
				<a class="navbar-brand" href="#" tabindex=-1>
					<span id="appTitle" class="menu-collapsed"><?php echo $title; ?></span>
				</a>
				<div id="headerToolbox" class="ms-auto d-flex flex-nowrap">
					<!-- UberSearch -->
					<form id="frmUberSearch" class="form-inline mt-1 ms-2 me-2" style="display:none;">
						<div class="input-group input-group-sm">
							<input id="uberSearch" class="form-control" type="text" placeholder="Search" aria-label="Search">
							<button id="uberSearchClearBtn" class="btn btn-secondary" type="button" title="Clear"><span class="oi oi-x"></span></button>
						</div>
					</form>
				
					<!-- Menu -->
					<div id="mainMenu" class="dropdown" style="display:none;">
						<button type="button" class="btn" data-bs-toggle="dropdown" aria-expanded="false">
							<span class="navbar-toggler-icon"></span>
						</button>
						<div id="mainMenuOptions" class="dropdown-menu dropdown-menu-end">
							<!-- Menu items get inserted here -->
						</div>
					</div>
					<div id="notificationCenter" class="dropdown" style="display:none;">
						<button type="button" class="btn position-relative" id="notificationToggle" data-bs-toggle="dropdown" aria-expanded="false">
							<img src="application/img/oi--bell.png" alt="Notifications" style="width: 18px; height: 18px;">
						</button>
						<div id="notificationMenuOptions" class="dropdown-menu dropdown-menu-end">
							<!-- Notification items will be dynamically inserted here -->
						</div>
					</div>
				</div>
			</div>
		</nav>

		<!-- Main -->
		<div class="container-fluid h-100">
			<div id="twm-content" class="h-100">
			
				<!-- Sidebar -->
				<div id="sidebar" class="sidebar">
					<!-- Sidebar Collapser -->
					<div class="sidebar-collapse-btn">
						<span class="oi oi-x"></span>
					</div>
				
					<!-- Tab Container -->
					<div class="sidebar-tab-container">
						<ul id="sidebar-tab-navs" class="nav nav-tabs sidebar-tabs" role="tablist"></ul>
						<div id="sidebar-tab-content" class="tab-content card"></div>
						<div id="appVersion" class="app-version">TWM Version 2.2 (<?php echo $revision; ?>)</div>
					</div>
				</div>
				
				<!-- Sidebar Expander -->
				<div id="sidebar-expander" class="sidebar-expander">
					<div class="sidebar-expand-btn">
						<span class="oi oi-media-play"></span>
						<span class="oi oi-media-play"></span>
						<span class="oi oi-media-play"></span>
						<span class="oi oi-media-play"></span>
					</div>
				</div>

				<!-- Content -->
				<div id="content" class="content">
					<!-- Map -->
					<div id="map" class="map"></div>

					<!-- Bottom Bar -->
					<div id="bottom-bar" class="bottom-bar" style="display:none;">
						<!-- Close button for the content window -->
						<div class="bottom-bar-controls">
							<button type="button" class="btn btn-light btn-sm" id="bottom-bar-close">
								<span class="oi oi-caret-bottom"></span>
							</button>
						</div>
						<!-- Add bottom bar content here -->
					</div>
					<div id="bottom-bar-expander" class="bottom-bar-expander" style="display:none;">
						<div class="bottom-bar-expand-btn">
							<span class="oi oi-media-play" style="transform: rotate(-90deg); display: inline-block;"></span>
							<span class="oi oi-media-play" style="transform: rotate(-90deg); display: inline-block;"></span>
							<span class="oi oi-media-play" style="transform: rotate(-90deg); display: inline-block;"></span>
							<span class="oi oi-media-play" style="transform: rotate(-90deg); display: inline-block;"></span>
						</div>
					</div>
				</div>
				
			</div>
		</div>

		<!-- Popup (moved outside of main container) -->
		<div id="popup" class="ol-popup">
			<div id="popup-closer" class="ol-popup-closer"><span class="oi oi-x"></span></div>
			<div id="popup-content" class="ol-popup-content"></div>
		</div>
		
	</body>
</html>