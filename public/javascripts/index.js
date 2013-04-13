/*
 * File: index.js
 * ----------------------------------------
 * FILE DESCRIPTION HERE
 * 
 */

 /* -------------------- Socket Initialization -------------------- */

// Retrieve user and datetime information
var username = checkCookie('username');
var datetime = (new Date()).getTime();
if (username === -1) username = datetime;

// Initialize socket variables
socket.clientName = username;
socket.clientId = datetime;
username = null;

// Broadcast introductory messages
messageAlert('Please allow location services for the best experience!', 'alert');
messageAlert('nere first uses location to determine peers around you, and falls back on IP address if that\'s unavailable.', 'alert');

// Initialize socket event listeners
initializeSocket(socket);

/* -------------------- Modal Configuration -------------------- */

// Configure "Get Started" modal
$('#gsModal').modal({backdrop: 'static'});
$('#gsModal .modal-footer .btn').click(function() {
  if (answeredLocQues === false) { 
    answeredLocQues = true;
    dismissAllModals();
    useIPAddr();
  }
});

// Initialize VARIABLE DESCRIPTION HERE
var watchId = null;

/* -------------------- $(document).ready() Handlers -------------------- */

$(document).ready(function() {

  // Initialize tooltips!
  $('.self-block input').tooltip({placement: 'left'});
  $('.room-block input').tooltip({placement: 'left'});

  // Display "Get Started" modal
  $('#gsModal').modal('show');

  // Prompt client for geolocation, the assign client to appropriate room
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      positionSuccess, 
      positionError, 
      {
        enableHighAccuracy: true
      }
      ); 
  };

  // Generate list of all nearby rooms, appending them to modal
  $('.navbar .nav #nav-rooms').click(function() {
    socket.emit('Get nearby rooms');
  });

  /* --------------- DOM Event Handlers --------------- */

  /*
   * Listener: $('.file-sender').click()
   * Enables filesharing button
   * Checks roomId first, in case user has neither confirmed nor denied location
   * 
   */
   $('.file-sender').click(function(){
    if (socket.roomId != null) {
      filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
        socket.emit('Send new file', fpfile, socket.clientName);
      });
    }
  });

  /*
   * Listener: $('.messenger .chat-sender input').keypress()
   * Enables client to chat
   * 
   */
   $('.messenger .chat-sender input').keypress(function(event) {
    // Send chat when client presses enter (13)
    // Check roomId in case user neither confirmed NOR denied location
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      socket.emit('Send new chat', {
        time: (new Date()).getTime(),
        chat: $(this).val()
      }, socket.clientName);
        // Clear client input
        $(this).val('').focus();
      }
    });

  /*
   * Listener: $('.room-block input').keypress()
   * Enables client to change current room name
   * 
   */
   $('.room-block input').keypress(function(event) {
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      var newRoomName = $(this).val().trim();
      $(this).blur();
      if (newRoomName == null || newRoomName === socket.roomName) {
        console.log('New name is empty, null, or unchanged!');
        messageAlert('You didn\'t change the room name!', 'alert alert-info');
        return;
      }
      socket.emit('Change room name', newRoomName, socket.clientName);
      dismissAllModals();
    }
  });

  /*
   * Listener: $('.self-block input').keypress()
   * Enables saving to cookies for 1 day
   * 
   */
   $('.self-block input').keypress(function(event) {
    // Saves name to cookies when client presses enter (13)
    // Check roomId in case user neither confirmed NOR denied location
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      var newName = $(this).val().trim();
      $(this).blur();
      var un = checkCookie();
      if (newName == null || newName === socket.clientName){
        console.log('New name is empty or null or unchanged!');
        messageAlert('You didn\'t change your name!', 'alert alert-info');
        return;
      }
      if (un != -1) {
        // Non-blank cookie
        setCookie('username', '', -1);
      }
      setCookie('username', newName, 1);
      socket.emit('Change client name', newName, socket.clientName, socket.clientId);
    }
    dismissAllModals();
  });

 });