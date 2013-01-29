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
  if (senderName == "" || senderName == null) {
    senderName = 'System';
  }
  $('.posts-container').append('<strong>' + senderName + '</strong>:&nbsp;&nbsp;' + chat + '<br>'); 
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
}

function messageAlert(message, alertClass) {
  $('.posts-container').append('<div class ="' + alertClass + '"><strong>System</strong>:&nbsp;&nbsp;' + message + '</div><br>'); 
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop($('.main').prop('scrollHeight'));
}

// Sanitizes user input before adding it to DOM
// NOTE: This is not a _____?
function encodeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function decodeHTML(s) {
  if (typeof s === "string")
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  else
    return s;
}

// Begin using socket.io
var username = checkCookie('username');
var datetime = (new Date()).getTime();
if (username === -1) {
  username = datetime;
}

/*
  Variables in socket:
  clientName, clientId, roomId, roomName, 
  */

// Initialize socket variables
socket.clientName = username;
socket.clientId = datetime;
username = null;
message('Please allow location services for the best experience!', 'System');
message('nere first uses location to determine peers around you, and falls back on IP address if that\'s unavailable!', 'System');

// Does the same as 'Display client', 'Display all lobby users', 'Join room'
socket.on('Initialize room', function(name, roomId, roomName, lobbyNames, lobbyIDs) {
  dismissGSModal();
  $('.self-block input').val(decodeHTML(name));
  $('.room-block input').val(decodeHTML(roomName));
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
  }
  socket.roomId = roomId;
  socket.roomName = roomName;
  $('.posts-container').empty();
  message('You have joined the ' + roomName + ' room!');
});

// This updates the client's input box, and the input box only.
socket.on('Update client name', function (name) {
  socket.clientName = name;
  $('.self-block input').val(decodeHTML(name));
});

socket.on('Update room name', function(roomName, clientName) {
  socket.roomName = roomName;
  $('.room-block input').val(decodeHTML(roomName));
  message(clientName + ' has changed the room name to ' + decodeHTML(roomName) + '!');
});

socket.on('Display new nearby user', function (clientName, clientId) {
  $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + clientName + '</strong></div>');
  message(clientName + ' connected.');
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

socket.on('Change nearby client name', function(newName, oldName, clientId) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + oldName + '</strong>'){
      $(this).html('<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + newName + '</strong>');
    }
  });
  message(oldName + ' changed his/her name to ' + newName);
});

socket.on('Delete user', function (name, id) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong>'){
      $(this).remove();
    }
  });
  message(name + ' disconnected a minute ago.');
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

socket.on('Join room', function(roomName, roomId) {
  socket.roomId = roomId;
  socket.roomName = roomName;
  $('.posts-container').empty();
  message('You\'ve joined the ' + roomName + ' room!', 'System');
});

socket.on('Display new chat', function (chat, senderName){
  message(chat, senderName);
});

// Deals with changing rooms
// Replace with a linked list!
socket.on('Display nearby rooms', function(roomNames, roomIds, roomDescs) {
  // Given Room name, room id, room description, 
  // Displays current room first, then other rooms by increasing distance
  if (roomNames.length == 0 || roomIds.length == 0 || roomDescs.length == 0 || roomNames.length === roomIds.length || roomIds.length === roomDescs.length || roomNames.length || roomDescs.length) {
    return;
  }
  var count = 1;
  var html = '<div class="tabbable tabs-left">'
  + '<ul class="nav nav-tabs">'
  + '<li class="active"><a href="#tab' + count + '" data-toggle="tab">' + roomNames[0] + '</a></li>';
  for (var i = 1; i < roomNames.length; i++) {
    count = i + 1;
    html += '<li><a href="#tab' + count + '" data-toggle="tab">' + roomNames[i] + '</a></li>';
  }
  count++;
  html += '<li><a href="#tab' + count + '" data-toggle="tab">Create a room!</a></li>';
  + '</ul>'
  + '<div class="tab-content">'
  + '<div class="tab-pane active" id="tab1">'
  + '<p class="lead">' + roomNames[0] + '</p><br>'
  + '<dl><dt>Description</dt><dd>' + roomDescs[0] + '</dd></dl>'
  + '<div class="row-fluid"><div class="span2 offset9"><button id="' + roomIds[0] + '" class="btn btn-primary">Switch room!</button></div></div>'
  + '</div>';
  for (i = 1; i < roomDescs.length; i++) {
    count = i + 1;
    html += '<div class="tab-pane" id="tab' + count + '">'
    + '<p class="lead">' + roomNames[i] + '</p><br>'
    + '<dl><dt>Description</dt><dd>' + roomDescs[i] + '</dd></dl>'
    + '<div class="row-fluid"><div class="span2 offset9"><button id="' + roomIds[i] + '" class="btn btn-primary">Switch room!</button></div></div>'
    + '</div>';
  }
  count++;
  html += '<div class="tab-pane" id="tab' + count + '">'
  + '<form><fieldset><legend>Create a room!</legend>'
  + '<label>Room Name:</label><input type="text" id="title" placeholder="Title">'
  + '<label>Room Description:</label><textarea id="description" rows="5" placeholder="Description"></textarea>'
  + '<div class="row-fluid"><div class="span2 offset9"><button type="submit" class="btn btn-primary">Create Room!</button></div></div>'
  + '</fieldset></form>'
  + '</div>'
  + '</div>'
  + '</div>';
  $('#roomsModal .modal-body .rooms').html(html);
});



// System Messages for chat!
var shownError = false;

socket.on('reconnected', function() {
  message('Reconnected to server.', 'System');
});
socket.on('reconnecting', function() {
  if (!shownError) {
    messageAlert('Uh oh, we\'re reconnecting to the server. Try refreshing the page!', 'alert alert-error system-message');
    shownError = true;
  }
});
socket.on('error', function(e) {
  if (!shownError) {
    messageAlert(e ? e : 'An unknown error occurred. Try refreshing the page!', 'alert alert-error system-message');
    shownError = true;
  }
});
socket.on('announcement', function (msg) {
  $('.posts-container').append($('<p>').append($('<em>').text(msg)));
  $('.main').scrollTop($('.main').prop('scrollHeight'));
});

// Other JQuery calls

function dismissGSModal() {
  $('#gsModal').modal('hide');
}

function changeGSToLoading() {
  $('#gsModal .modal-body').html('<div class="img-center"><img src="/images/loading.gif" class="center" /></div><br><p style="text-align: center">Please wait...</p>');
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

$(document).ready(function() {

  // Shows Get Started page
  $('#gsModal').modal('show');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      positionSuccess, 
      positionError, 
      {
        enableHighAccuracy: true, 
        timeout: 10000
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
      var newName = encodeHTML($(this).val().trim());
      $(this).blur();
      var un = checkCookie();
      if (newName === '' || newName === null || newName === socket.clientName){
        console.log('New name is empty or null or unchanged!');
        message('You didn\'t change your name!');
        return;
      }
      if (un != -1) {
        // Non-blank cookie
        setCookie('username', '', -1);
      }
      setCookie('username', newName, 1);
      socket.emit('Change client name', newName, socket.clientName, socket.clientId);
    }
  });

  $('.sidebar .room-block input').keypress(function(event) {
    if (event.which === 13 && $(this).val() !== "" && socket.roomId != null) {
      event.preventDefault();
      var newRoomName = encodeHTML($(this).val().trim());
      $(this).blur();
      if (newRoomName === '' || newRoomName === null || newRoomName === socket.roomName) {
        console.log('New name is empty, null, or unchanged!');
        message('You didn\'t change the room name!');
        return;
      }
      socket.emit('Change room name', newRoomName, socket.clientName);
    }
  });

  $('.navbar .nav #nav-rooms').click(function() {
    socket.emit('Get nearby rooms');
  });

  // Default focus to .messenger input
  $('.messenger .chat-sender input').focus();
});
