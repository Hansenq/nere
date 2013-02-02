/*
 * constants.js
 * ----------------------------------------
 * Defines constants for room assignment, geolocation, and other computations.
 * 
 */

// Desired location accuracy (in meters)
var desiredLocAccuracy = 100;

// Time allotted (in seconds) for client to provide geolocation
var positionTimeout = 15000;

// Tracks whether client has decided between using geolocation or using IP
var answeredLocQues = false;

// VARIABLE DESCRIPTION HERE
var numFuncCalls1 = 0;

// VARIABLE DESCRIPTION HERE
var numFuncCalls2 = 0;

// VARIABLE DESCRIPTION HERE
var timeForAccuracy = 3000;
var position = null;

// Radius (in meters) of room searches
var searchRadius = 500;