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

// Begin use of socket.io
var socket = io.connect(window.location.hostname);

socket.on('this', function (data) {
  //$('.welcome').append(data);     no .welcome found
  socket.emit('join room');
  var name = checkCookie();
  socket.emit('setname', name);
  socket.emit('get all nearby');
});

socket.on('gotname', function (data){
  $('.yourname').append('Your name is: ' + data);
});

socket.on('allnearby', function (data){
  jQuery('.allusers').html('');
  for (var i=0; i<data.length; i++){
    $('.allusers').append('<a onclick="sendFile(this.id, socket.clientName)" id="' + data[i] + '">Send file to ' + data[i] + '</a><br>');
  }
});

socket.on('file received', function (data, senderName){
  $('.allfiles').append('<a href="' + data + '" target="_blank">New link from ' + senderName + '!</a><br>');
  message('System', senderName + ' has send you a <a href="' + data + '" target="_blank">file</a>!<br>');
});


function sendFile(recId, sendId){
  filepicker.pick({mimetypes:['image/*', 'text/*']}, function(fpfile){
    socket.emit('file sent', fpfile.url, recId, sendId);
  });
}


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

$(".user-block").hover(
  function(){
    $(this).css("background-color", "#f0f0f0");
  },
  function(){
    $(this).css("background-color", "#ffffff");
  }
);
