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
socket.emit('Set client name and ID', socket.clientName, socket.clientID);
socket.emit('Get all lobby users');

// This updates the client's input box, and the input box only.
socket.on('Display client', function (name) {
  $('.self-block input').val(name);
});

socket.on('Display new nearby user', function (name, id) {
  $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong></div>');
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
});

socket.on('Delete user', function (name, id) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong>'){
      $(this).remove();
    }
  });
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

$(document).ready(function() {

  // Enable file sender button
  $('.file-sender').click(function(){
    filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
      socket.emit('Send new file', fpfile, socket.clientName);
    });
  });

  // Enable chat
  $('.messenger .chat-sender input').keypress(function(event) {
    // Send chat when client presses enter (13), and only if input is not empty
    if (event.which == 13 && $(this).val() !== "") {
        event.preventDefault();
        socket.emit('Send new chat', $(this).val(), socket.clientName);
        // Clear client input
        $(this).val('').focus();
    }
  });

  // Enable save to cookies for 1 day
  $('.sidebar .self-block input').keypress(function(event) {
    // Saves name to cookies when client presses enter (13)
    // NOTE: We should ask trigger this when they input box loses focus.
    if (event.which == 13) {
      event.preventDefault();
      var newName = $(this).val();
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