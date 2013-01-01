/*

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

function checkCookie()
{
  var username = getCookie("username");
  if (username != null && username != "")
  {
    return username;
  }
  else 
  {
    username = prompt("Please enter your name:", "");
    if (username != null && username != "")
    {
      // default 5 days
      setCookie("username", username, 1);
      return username;
    }
  }
}

 var name = checkCookie();

*/

// Begin using socket.io
var socket = io.connect(window.location.hostname);
socket.clientName = prompt("Please enter your name:", "");
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

socket.on('Delete name', function (name) {
  $('.user-block').each(function(){
    if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong>' + name + '</strong>'){
      $(this).remove();
    }
  });
});

socket.on('Display new file', function (fileURL, filename, senderName) {
  $('.posts-container').append('<strong>' + senderName + '</strong>&nbsp;&nbsp;&nbsp;<a href=' + fileURL + '>' + filename + '</a><br>'); 
});

socket.on('Display new chat', function (chat, senderName){
  $('.posts-container').append('<strong>' + senderName + '</strong>&nbsp;&nbsp;&nbsp;' + chat + '<br>'); 
});

$(document).ready(function() {
  
  // Enable file sender button
  $('.file-sender').click(function(){
    filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
      socket.emit('Send new file', fpfile.url, fpfile.filename, socket.clientName);
    });
  });

  // Enable chat
  $(".messenger input").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        socket.emit('Send new chat', $(this).val(), socket.clientName);
        $(this).val('');
    }
  });

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