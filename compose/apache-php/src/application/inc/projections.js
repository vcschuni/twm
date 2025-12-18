/**
 * ##############################################################################
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 *
 *          File: projections.js
 *       Creator: Volker Schunicht
 *       Purpose: 
 *	    Required: 
 *       Changes: 2024-10-29 Peter Spry, Adding BC's UTM zones.
 *		   Notes: Houses the EPSG's not commonly defined within proj4.
 *
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------
 * ##############################################################################
 */

/**
 * Define all of the additional projections required for TWM
 */
proj4.defs([["EPSG:3005", "+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],["EPSG:26907", "+proj=utm +zone=7 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],["EPSG:26908", "+proj=utm +zone=8 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],["EPSG:26909", "+proj=utm +zone=9 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],["EPSG:26910", "+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],["EPSG:26911", "+proj=utm +zone=11 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"]]);

/**
 * Register the above projections with OpenLayers
 */
ol.proj.proj4.register(proj4);