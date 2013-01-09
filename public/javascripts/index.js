// Functions to store, get, and check cookies of usernames
function setCookie(c_name, value, exdays)
{
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name)
{
  var i, x, y, ARRcookies = document.cookie.split(";");
  for (i = 0; i < ARRcookies.length; i++)
  {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x == c_name)
    {
      return unescape(y);
    }
  }
}

function checkCookie(c_name)
{
  var username = getCookie(c_name);
  if (username != null && username != "")
  {
    return username;
  }
  else 
  {
    return -1;
  }
}

function message(chat, senderName) {
  $('.posts-container').append('<strong>' + senderName + '</strong>:&nbsp;&nbsp;' + chat + '<br>'); 
  
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
}

function changeRooms(roomId) {
  socket.emit('Change rooms', roomId);
  message('Leaving room...', 'System');
  socket.roomId = roomId;
}

// Begin using socket.io
var username = checkCookie('username');
var datetime = (new Date()).getTime();
if (username === -1) {
  username = datetime;
}

// Initialize socket variables
socket.clientName = username;
socket.clientID = datetime;
username = null;
message('Please allow location services for the best experience!', 'System');
message('nere first uses location to determine peers around you, and falls back on IP address if that\'s unavailable!', 'System');

// Does the same as 'Display client', 'Display all lobby users', 'Join room'
socket.on('Initialize room', function(name, roomName, lobbyNames, lobbyIDs) {
  $('.self-block input').val(decodeHTML(name));
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
  }
  socket.roomId = roomName;
  $('.posts-container').empty();
  message('You have joined the ' + roomName + ' room!', 'System');
});

// This updates the client's input box, and the input box only.
socket.on('Display client', function (name) {
  $('.self-block input').val(decodeHTML(name));
});

socket.on('Display new nearby user', function (name, id) {
  $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong></div>');
  message(name + ' connected.', 'System');
});

socket.on('Refresh all lobby users', function (lobbyNames, lobbyIDs) {
  $('.users').empty();
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
  }
});

socket.on('Display all lobby users', function (lobbyNames, lobbyIDs) {
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
  }
});

socket.on('Change nearby name', function(newName, oldName, id) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + oldName + '</strong>'){
      $(this).html('<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + newName + '</strong>');
    }
  });
  message(oldName + ' changed his/her name to ' + newName, 'System');
});

socket.on('Delete user', function (name, id) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong>'){
      $(this).remove();
    }
  });
  message(name + ' disconnected a minute ago.', 'System');
});

socket.on('Display new file', function (fpfile, senderName) {

  $('.posts-container').append(
    '<strong>System:</strong>&nbsp;&nbsp;' +
    'New file shared by <strong>' + senderName + '</strong>.' + 
    '<br><br>' +
    '<table class="table table-bordered">' +
    '<tbody>' +
    '<tr>' +
    '<td><strong>Sender</strong></th>' +
    '<td><strong>Filename</strong></th>' +
    '<td><strong>Sharable Filepicker URL</strong></th>' +
    '<td><strong>File Download</strong></th>' +
    '</tr>' +
    '<tr>' +
    '<td>' + senderName + '</td>' +
    '<td>' + fpfile.filename + '</td>' +
    '<td>' + fpfile.url + '</td>' +
    '<td><a class="btn btn-primary btn-block" href="' + fpfile.url + '" target="_blank">Download</a></th>' +
    '</tr>' +
    '</tbody>' +
    '</table>'
    ); 
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
});

socket.on('Join room', function(roomName) {
  socket.roomId = roomName;
  $('.posts-container').empty();
  message('You\'ve joined the ' + roomName + ' room!', 'System');
});

socket.on('Display new chat', function (chat, senderName){
  message(chat, senderName);
});

// System Messages for chat!
socket.on('reconnected', function() {
  message('Reconnected to server.', 'System');
});
socket.on('reconnecting', function() {
  message('Reconnecting to server...', 'System');
});
socket.on('error', function(e) {
  message(e ? e : 'An unknown error occurred.', 'System');
});
socket.on('announcement', function (msg) {
  $('.posts-container').append($('<p>').append($('<em>').text(msg)));
  $('.main').scrollTop($('.main').prop('scrollHeight'));
});

// Other JQuery calls

function dismissGSModal() {
  $('#gsModal').modal('hide');
  //$('#gsModal .modal-footer .btn span').prop('value', 'Close');
}

// Configuring Get Started modal
$('#gsModal').modal({backdrop: 'static'});
$('#gsModal .modal-footer .btn').click(function() {
  if (answeredLocQues === false) { 
    answeredLocQues = true;
    dismissGSModal();
    useIPAddr();
  }
});

// Sanitizes user input before adding it to DOM
// NOTE: This is not a 
function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function decodeHTML(s) {
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

$(document).ready(function() {

  // Shows Get Started page
  $('#gsModal').modal('show');

  if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    positionSuccess, 
    positionError, 
    {
      enableHighAccuracy: true
    }
    );
  };

  // Enable file sender button
  // Check roomId in case user neither confirmed NOR denied location
  $('.file-sender').click(function(){
    if (socket.roomId != null) {
      filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
        socket.emit('Send new file', fpfile, socket.clientName);
      });
    }
  });

  // Enable chat
  $('.messenger .chat-sender input').keypress(function(event) {
    // Send chat when client presses enter (13)
    // Check roomId in case user neither confirmed NOR denied location
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      socket.emit('Send new chat', encodeHTML($(this).val()), socket.clientName);
        // Clear client input
        $(this).val('').focus();
      }
    });

  // Enable save to cookies for 1 day
  $('.sidebar .self-block input').keypress(function(event) {
    // Saves name to cookies when client presses enter (13)
    // Check roomId in case user neither confirmed NOR denied location
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      var newName = encodeHTML($(this).val());
      $(this).blur();
      var oldName = socket.clientName;
      var un = checkCookie();
      if (newName === '' || newName === null || newName === un){
        console.log('New name is empty or null or unchanged!');
        return;
      }
      if (un != -1) {
        // Non-blank cookie
        setCookie('username', '', -1);
      }
      setCookie('username', newName, 1);
      socket.emit('Change client name', newName, oldName, socket.clientID);
      socket.clientName = newName;
    }
  });

  // Default focus to .messenger input
  $('.messenger .chat-sender input').focus();
});
