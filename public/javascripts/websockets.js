/*
 * websockets.js
 * ----------------------------------------
 * Initializes all event listeners for connected websockets.
 * Each socket contains 4 variables: 
 *   clientName, clientId, roomId, roomName
 * 
 */

function initializeSocket(socket){

  /* -------------------- General Room Event Listeners -------------------- */

  /*
	 * Listener: 'Initialize room'
	 * LISTENER DESCRIPTION HERE
	 * Same as 'Display client', 'Display all lobby users', and 'Join room'
	 * 
	 */
  socket.on('Initialize room', function(name, roomId, roomName, lobbyNames, lobbyIds, ipCheck) {
    dismissAllModals();
    $('.self-block input').val(decodeHTML(name));
    $('.room-block input').val(decodeHTML(roomName));
    for (var i=0; i<lobbyNames.length; i++){
      $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIds[i] + '">' + lobbyNames[i] + '</strong></div>');
    }
    socket.roomId = roomId;
    socket.roomName = roomName;
    $('.posts-container').empty();
    messageAlert('You have joined the <em>' + roomName + '</em> room!', 'alert alert-success');

    if (ipCheck == true) {
      messageAlert('Your location could not be used. For the best experience, please refresh the page and enable location on your browser.', 'alert alert-error');
    }

    // Default focus to .messenger input
    $('.messenger .chat-sender input').focus();
  });

  /*
   * Listener: 'Join room'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Join room', function(roomName, roomId) {
    socket.roomId = roomId;
    socket.roomName = roomName;
    $('.posts-container').empty();
    messageAlert('You\'ve joined the <em>' + roomName + '</em> room!', 'alert alert-success');
  });

  /*
   * Listener: 'Display all lobby users'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Display all lobby users', function (lobbyNames, lobbyIDs) {
    for (var i=0; i<lobbyNames.length; i++){
      $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
    }
  });

  /*
	 * Listener: 'Change room'
	 * Changes client's current room to new room
	 * 
	 */
  socket.on('Change room', function(roomId, roomName, lobbyNames, lobbyIds) {
    dismissAllModals();
    socket.roomId = roomId;
    socket.roomName = roomName;
    $('.room-block input').val(decodeHTML(roomName));
    $('.users').empty();
    for (var i=0; i<lobbyNames.length; i++){
      $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIds[i] + '">' + lobbyNames[i] + '</strong></div>');
    }
    $('.posts-container').empty();
    messageAlert('You have changed to the <em>' + roomName + '</em> room!', 'alert alert-success');

    // Default focus to .messenger input
    $('.messenger .chat-sender input').focus();
  });

  /*
	 * Listener: 'Update room name'
	 * Updates client's room name
	 * 
	 */
  socket.on('Update room name', function(roomName, clientName) {
    socket.roomName = roomName;
    $('.room-block input').val(decodeHTML(roomName));
    messageAlert('<em>' + clientName + '</em> has changed the room name to <em>' + decodeHTML(roomName) + '</em>!', 'alert alert-info');
  });

  /* -------------------- Client Event Listeners -------------------- */

  /*
   * Listener: 'Update client name'
   * Updates client's input box with new name
   * 
   */
  socket.on('Update client name', function (name) {
    socket.clientName = name;
    $('.self-block input').val(decodeHTML(name));
  });

  /* -------------------- Room Members Event Listeners -------------------- */

  /*
   * Listener: 'Display new nearby user'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Display new nearby user', function (clientName, clientId) {
    $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + clientName + '</strong></div>');
    messageAlert('<em>' + clientName + '</em> connected.', 'System');
  });

  /*
   * Listener: 'Change nearby client name'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Change nearby client name', function(newName, oldName, clientId) {
    $('.user-block').each(function(){
      if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + oldName + '</strong>'){
        $(this).html('<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + clientId + '">' + newName + '</strong>');
      }
    });
    messageAlert('<em>' + oldName + '</em> changed his/her name to <em>' + newName + '</em>', 'System');
  });

  /*
   * Listener: 'Refresh all lobby users'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Refresh all lobby users', function (lobbyNames, lobbyIDs) {
    $('.users').empty();
    for (var i=0; i<lobbyNames.length; i++){
      $('.users').append('<div class="user-block"><i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + lobbyIDs[i] + '">' + lobbyNames[i] + '</strong></div>');
    }
  });

  /*
   * Listener: 'Delete user'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Delete user', function (name, id) {
    $('.user-block').each(function(){
      if ($(this).html() === '<i class="icon-user"></i>&nbsp;&nbsp;<strong id="' + id + '">' + name + '</strong>'){
        $(this).remove();
      }
    });
    messageAlert('<em>' + name + '</em> disconnected a minute ago.', 'System');
  });

  /* -------------------- Chat & Filesharing Event Listeners -------------------- */

  /*
   * Listener: 'Display new file'
   * LISTENER DESCRIPTION HERE
   * 
   */
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

  /*
   * Listener: 'Display new chat'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('Display new chat', function (chat, senderName){
    message(chat, senderName);
  });

  /* -------------------- Nearby Rooms Event Listeners -------------------- */

  /*
   * Listener: 'Display nearby rooms'
   * LISTENER DESCRIPTION HERE
   * Deals with changing rooms. Replace this with a linked list!
   * 
   */
  socket.on('Display nearby rooms', function (roomNames, roomIds, roomDescs, roomCents) {
    if (roomNames.length === 0 || roomIds.length === 0 || roomDescs.length === 0 || roomNames.length != roomIds.length || roomIds.length != roomDescs.length || roomNames.length != roomDescs.length) {
      console.log('Kicked out of Display nearby rooms!');
      console.log(roomNames.length);
      console.log(roomIds.length);
      console.log(roomDescs.length);
      console.log(roomCents.length);
      $('#roomsModal .modal-body .rooms').html('Error: Unable to retrieve Rooms. Please refresh the page.');
      return;
    }

    // Displays Rooms only within searchRadius
    var roomDists = [];
    for (var i = 0; i < roomCents.length; i++) {
      roomDists[i] = calcDist(socket.coords.latitude, socket.coords.longitude, roomCents[i].latitude, roomCents[i].longitude);
      console.log(socket.coords.latitude + ', ' + socket.coords.longitude + '; ' + roomCents[i].latitude + ', ' + roomCents[i].longitude + ': ' + roomDists[i]);
      if (roomDists[i] > searchRadius) {
        roomDists[i] = -1;
      }
    }
    var count = 0;
    var html = '<ul class="nav nav-tabs">';
    for (i = 0; i < roomNames.length; i++) {
      if (roomDists[i] != -1) {
        count = i + 1;
        html += '<li';
        if (i === 0) {
          html += ' class="active"';
        }
        html += '><a href="#tab' + count + '" data-toggle="tab">' + roomNames[i] + '</a></li>';
      }
    }
    count++;
    html += '<li';
    if (i === 0) {
      html += ' class="active"';
    }
    html += '><a href="#tab' + count + '" data-toggle="tab">Create a room!</a></li>'
    + '</ul>'
    + '<div class="tab-content">'
    for (i = 0; i < roomDescs.length; i++) {
      if (roomDists[i] != -1) {
        count = i + 1;
        html += '<div class="tab-pane change-room';
        if (i === 0) {
          html += ' active';
        }
        html += '" id="tab' + count + '">'
        + '<p class="lead">' + roomNames[i] + ' (<em>' + roomDists[i] + 'm</em>)</p>'
        + '<dl><dt>Description</dt><dd>' + roomDescs[i] + '</dd></dl>'
        + '<div class="row-fluid"><div class="span4 offset8"><button id="' + roomIds[i] + '" class="btn btn-primary change-room">Switch room!</button></div></div>'
        + '</div>';
      }
    }
    count++;
    html += '<div class="tab-pane create-room';
    if (i === 0) {
      html += ' active';
    }
    html += '" id="tab' + count + '">'
    + '<p class="lead">Create a room!</p>'
    + '<div class="control-group" id="title"><label class="control-label">Name:</label><input type="text" placeholder="Title"></div>'
    + '<div class="control-group" id="desc"><label class="control-label">Description:</label><textarea rows="5" placeholder="Description"></textarea></div>'
    //+ '<label>Radius:</label><input type="text" id="radius" placeholder="Room Radius">'
    + '<div class="row-fluid"><div class="span4 offset8"><button class="btn btn-primary create-room">Create Room!</button></div></div>'
    + '</div>'
    + '</div>';
    $('#roomsModal .modal-body .rooms').html(html);

    // Bind change room event handler after html actually changes!
    for (i = 0; i < roomIds.length; i++) {
      $('#roomsModal .modal-body .rooms .tab-content .change-room .row-fluid button.change-room#' + roomIds[i]).on('click', function() {
        // Change to Loading screen
        console.log('Clicked Change Room');
        if (parseInt(this.id, 10) == socket.roomId) {
          messageAlert('You are already in this room!', 'alert');
        }
        socket.emit('Change room', parseInt(this.id, 10));
        $('#roomsModal .modal-body .rooms').html('<div class="img-center loading"><img src="/images/loading.gif" /><p>Loading...</p></div>');
      });
    }

    // Bind create room event handler after html changes!
    $('#roomsModal .modal-body .rooms .tab-content .create-room .row-fluid button.create-room').on('click', function() {
      var newRoomName = $('#roomsModal .modal-body .create-room .control-group#title input').val().trim();
      var newRoomDesc = $('#roomsModal .modal-body .create-room .control-group#desc textarea').val().trim(); 
      if (newRoomName == null || newRoomName == '') {
        $('#roomsModal .modal-body .rooms .tab-content .create-room .control-group#title').html('<div class="control-group error" id="title"><label class="control-label">Name:</label><input type="text" placeholder="Title"><span class="help-inline">Please type a valid Title!</span></div>');
        return;
      }
      if (newRoomDesc == null || newRoomDesc == '') {
        $('#roomsModal .modal-body .rooms .tab-content .create-room .control-group#desc').html('<div class="control-group error" id="desc"><label class="control-label">Description:</label><textarea id="desc" rows="5" placeholder="Description"></textarea><span class="help-inline">Please type a valid Description!</span></div>');
        return;
      }
      socket.emit('Create room', encodeHTML(newRoomName), encodeHTML(newRoomDesc));
      $('#roomsModal .modal-body .rooms').html('<div class="img-center loading"><img src="/images/loading.gif" /><p>Loading...</p></div>');
    });
  });

  /* -------------------- System Messages Event Listeners -------------------- */

  var shownError = false;

  /*
   * Listener: 'reconnected'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('reconnected', function() {
    messageAlert('Reconnected to server.', 'alert alert-success');
  });

  /*
   * Listener: 'reconnecting'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('reconnecting', function() {
    if (!shownError) {
      messageAlert('Uh oh, we can\'t connect to the server. Try refreshing the page!', 'alert alert-error');
      shownError = true;
    }
    dismissAllModals();
  });

  /*
   * Listener: 'error'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('error', function(e) {
    if (!shownError) {
      messageAlert(e ? e : 'An unknown error occurred. Try refreshing the page!', 'alert alert-error');
      messageAlert('An error occurred. Try refreshing the page!', 'alert alert-error');
      shownError = true;
    }
    dismissAllModals();
  });

  /*
   * Listener: 'announcement'
   * LISTENER DESCRIPTION HERE
   * 
   */
  socket.on('announcement', function (msg) {
    $('.posts-container').append($('<p>').append($('<em>').text(msg)));
    $('.main').scrollTop($('.main').prop('scrollHeight'));
  });

}