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

  $('.posts-container').append('<strong>' + senderName + '</strong>&nbsp;&nbsp;&nbsp;' + chat + '<br>'); 
  
  // Lock scrollbar to bottom on send.
  $('.main').scrollTop(100000000000000000);

}

// Begin using socket.io
var username = checkCookie('username');
if (username === -1) {
  username = (new Date()).getTime();
}
socket.clientName = username;
username = null;
socket.emit('Set client name', socket.clientName);
socket.emit('Get all lobby users');

socket.on('Display client name', function (name) {
  $('.self-block input').val(name);
});

socket.on('Display new nearby name', function (name) {
  $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong>' + name + '</strong></div>');
});

socket.on('Display all lobby names', function (lobbyNames) {
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong>' + lobbyNames[i] + '</strong></div>');
  }
});

socket.on('Refresh all lobby names', function(lobbyNames) {
  $('.user-block').each(function() {
    $(this).remove();
  });
  for (var i=0; i<lobbyNames.length; i++){
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong>' + lobbyNames[i] + '</strong></div>');
  }
})

socket.on('Change nearby name', function(newName, oldName) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong>' + oldName + '</strong>'){
      $(this).html('<i class="icon-user"></i>&nbsp;&nbsp;<strong>' + newName + '</strong>');
    }
  });
});

socket.on('Delete name', function (name) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong>' + name + '</strong>'){
      $(this).remove();
    }
  });
});

socket.on('Display new file', function (fileURL, filename, senderName) {
  
  $('.posts-container').append('<strong>' + senderName + '</strong>&nbsp;&nbsp;&nbsp;<a href=' + fileURL + '>' + filename + '</a><br>'); 

  // Lock scrollbar to bottom on send.
  $('.main').scrollTop(100000000000000000);

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
  $('.posts-container').get(0).scrollTop = 1000000000;

});

$(document).ready(function() {

  // Enable file sender button
  $('.file-sender').click(function(){
    filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
      socket.emit('Send new file', fpfile.url, fpfile.filename, socket.clientName);
    });
  });

  // Enable chat
  $('.messenger .chat-sender input').keypress(function(event) {
    // Send chat when client presses enter (13)
    if (event.which == 13) {
        event.preventDefault();
        socket.emit('Send new chat', $(this).val(), socket.clientName);
        // Clear client input
        $(this).val('').focus();
    }
  });

  // Enable save to cookies for 1 day
  $('.sidebar .self-block input').keypress(function(event) {
    // Saves name to cookies when client presses enter (13)
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
      socket.emit('Change client name', newName, oldName);
      socket.clientName = newName;
      alert('Saved username.');
    }
  });

  // Default focus to .messenger input
  $('.messenger .chat-sender input').focus();

});

/*

// Below is code for the chat client!
socket.on('joinChat', function() {
  $('#chatClient').addClass('connected');
})

socket.on('announcement', function (msg) {
  $('#lines').append($('<p>').append($('<em>').text(msg)));
});

socket.on('allUsers', function(users) {
  $('#users').empty().append($('<span>Online: </span>'));
  for (var i in nicknames) 
    $('#users').append($('<b>').text(nicknames[i]));
});

socket.on('userMessage', message);

// System Messages!
socket.on('reconnected', function() {
  message('System', 'Reconnected to server.');
});
socket.on('reconnecting', function() {
  message('System', 'Reconnecting to server...');
});
socket.on('error', function(e) {
  message('System', e ? e : 'An unknown error occurred.');
});


function message (from, msg) {
  $('#lines').append($('<p>').append($('<b>').text(from), msg));
  $('#lines').get(0).scrollTop = 1000000000;
}

// DOM manipulation
$(function() {
  $('#send-message').submit(function() {
    //message('me', $('message').val());
    socket.emit('userMessage', $('#message').val(), function(msg) {
      message('me', msg);
    });
    clear();
    $('#lines').get(0).scrollTop = 1000000000;
    return false;
  });

  function clear() {
    $('#message').val('').focus();
  };
});

*/

/*
  
  // Enable user-block color change on hover over
  $(".user-block").hover(
    function(){
      $(this).css("background-color", "#f0f0f0");
    },
    function(){
      $(this).css("background-color", "#ffffff");
    }
  );

*/