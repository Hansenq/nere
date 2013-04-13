/*
 * File: misc-functions.js
 * ----------------------------------------
 * Miscellaneous functions for distance computations, messaging,
 * DOM manipulation, and more.
 * 
 */

 /* -------------------- Distance Computation Functions -------------------- */

/*
 * Function: calcDist
 * FUNCTION DESCRIPTION HERE
 * Uses equirectangular approximation and Pythagorean theorem
 * http://www.movable-type.co.uk/scripts/latlong.html
 * 
 */
 function calcDist(x1, y1, x2, y2) {
  x1 = x1 / 180 * Math.PI;
  x2 = x2 / 180 * Math.PI;
  y1 = y1 / 180 * Math.PI;
  y2 = y2 / 180 * Math.PI;
  var x = (y2 - y1) * Math.cos((x1 + x2) / 2);
  var y = (x2 - x1);
  return Math.sqrt(x * x + y * y) * 6378.1 * 1000;   // change to meters 40680159610000 = (6378.1 * 1000)^2
}

/* -------------------- Chatroom & Filesharing Functions -------------------- */

/*
 * Function: message
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function message(chat, senderName) {
  if (senderName == null) {
    $('.posts-container').append('<emph><strong>System</strong>:&nbsp;&nbsp;' + chat + '</emph><br>');     
  } else {
    $('.posts-container').append('<strong>' + senderName + '</strong>:&nbsp;&nbsp;' + chat + '<br>'); 
  }
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
}

/*
 * Function: messageAlert
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function messageAlert(chat, alertClass) {
  if (alertClass == "" || alertClass === 'System') {
    message(chat, 'System');
    return;
  }
  $('.posts-container').append('<div class ="' + alertClass + ' system-message"><strong>System</strong>:&nbsp;&nbsp;' + chat + '</div><br>'); 
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
}

/* -------------------- Input Sanitization Functions -------------------- */

/*
 * Function: encodeHTML
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function encodeHTML(s) {
  if (typeof s === "string")
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  else
    return s;
}

/*
 * Function: decodeHTML
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function decodeHTML(s) {
  if (typeof s === "string")
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  else
    return s;
}

/* -------------------- DOM Manipulation Functions -------------------- */

/*
 * Function: dismissAllModals
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function dismissAllModals() {
  $('#gsModal').modal('hide');
  $('#roomsModal').modal('hide');
  $('#aboutModal').modal('hide');
  console.log('Closing all modals!');
}

/*
 * Function: changeGSToLoading
 * FUNCTION DESCRIPTION HERE
 * 
 */
 function changeGSToLoading() {
  $('#gsModal .modal-body').html('<div class="img-center loading"><img src="/images/loading.gif" /><p>Loading...</p></div>');
}