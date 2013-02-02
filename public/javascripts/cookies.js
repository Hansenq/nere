/*
 * File: cookies.js
 * ----------------------------------------
 * Handles retrieval, modification, and checking of cookies.
 * 
 */

/*
 * Function: setCookie()
 * Sets name, value, and expiration date of cookies
 * 
 */
function setCookie(c_name, value, exdays){
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = c_name + "=" + c_value;
}

/*
 * Function: getCookie()
 * Returns client's existing cookies
 * 
 */
function getCookie(c_name){
  var i, x, y, ARRcookies = document.cookie.split(";");
  for (i = 0; i < ARRcookies.length; i++){
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x === c_name){
      return unescape(y);
    }
  }
}

/*
 * Function: checkCookie()
 * Checks whether browser already contains relevant cookies
 * 
 */
function checkCookie(c_name){
  var username = getCookie(c_name);
  if (username != null && username != ""){
    return username;
  }
  else {
    return -1;
  }
}