/**
 * Module dependencies.
 */

 var express = require('express')
 , app = express()
 , routes = require('./routes')
 , user = require('./routes/user')
 , http = require('http')
 , server = http.createServer(app)
 , path = require('path')
 , io = require('socket.io').listen(server);

 app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

 app.configure('development', function(){
  app.use(express.errorHandler());
});

 app.configure('production', function() {
  app.use(express.errorHandler());
});

 app.get('/', routes.index);
 app.get('/users', user.list);

// Code for Heroku socket.io compatibility
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10); 
  //io.set('close timeout', 30);
});

// 
var rooms = [];

// Misc Calculation Functions

// Returns the distance between two latitudes and longitudes using the equirectangular and pythagorean approximation
// takes in decimal lats and longs, returns distance between them in meters
function calcDistSq(x1, y1, x2, y2) {
  // http://www.movable-type.co.uk/scripts/latlong.html
  // Equirectangular approximation and pythagorean theorem
  x1 = x1 / 180 * Math.PI;
  x2 = x2 / 180 * Math.PI;
  y1 = y1 / 180 * Math.PI;
  y2 = y2 / 180 * Math.PI;
  var x = (y2 - y1) * Math.cos((x1 + x2) / 2);
  var y = (x2 - x1);
  return (x * x + y * y) * 40680159610000;   // change to meters 40680159610000 = (6378.1 * 1000)^2
}

// Room class
function Room (id) {
  this.id = id;
  this.name = id;
  this.desc = 'Default Public Room';
  this.purpose = 'default public';
  this.radiusSq = 4900;     // default radiusSq to 70m
  this.numUsers = 0;
  this.latitude = 0;
  this.longitude = 0;
  this.sockets = [];
  this.chats = [];
}

Room.prototype.addSocket = function (socket) {
  if (socket.coords !== null && isNaN(socket.coords.latitude) === false && isNaN(socket.coords.longitude) === false) {
    var plusMinus = 1;
    this.latitude = (this.latitude * this.numUsers  + socket.coords.latitude * plusMinus) / (this.numUsers + plusMinus);
    this.longitude = (this.longitude * this.numUsers  + socket.coords.longitude * plusMinus) / (this.numUsers + plusMinus);
  }
  this.numUsers++;
  var hasSpace = false;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i] == null) {
      this.sockets[i] = socket;
      hasSpace = true;
    }
  }
  if (hasSpace === false) {
    this.sockets[this.sockets.length] = socket;
  }
  console.log('Added socket to room ' + this.id);
  //console.log(socket);
  //console.log(this);
}

Room.prototype.removeSocket = function(socket) {
  if (socket.coords !== null && isNaN(socket.coords.latitude) === false && isNaN(socket.coords.longitude) === false) {
    var plusMinus = -1;
    this.latitude = (this.latitude * this.numUsers  + socket.coords.latitude * plusMinus) / (this.numUsers + plusMinus);
    this.longitude = (this.longitude * this.numUsers  + socket.coords.longitude * plusMinus) / (this.numUsers + plusMinus);
  }
  this.numUsers--;
  var empty = true;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i] !== null && this.sockets[i].clientId === socket.clientId) {
      this.sockets[i] = null;
    }
    if (empty === true && this.sockets[i] !== null) {
      empty = false;
    }
  }
  if (empty === true) {
    removeRoom(this.id);
  }
  console.log('Removed socket from room ' + this.id);
  //console.log(socket);
  //console.log(this);
}

// Might as well convert this to a binary search tree sometime..
function addRoom(roomId) {
  var exists = false;
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] != null &&  rooms[i].id === roomId) {
      exists = true;
      return rooms[i];
    }
    if (rooms[i] == null && nullVal === -1) {
      nullVal = i;
    }
  }
  var room = new Room(roomId);
  if (exists === false) {
    if (nullVal !== -1) {
      rooms[nullVal] = room;
    } else {
      rooms[rooms.length] = room;
    }
  }
  return room;
  console.log('Added a new room ' + roomId);
  //console.log(room);
}

function removeRoom(roomId) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] !== null && rooms[i].id === roomId) {
      console.log('ALERT! Room ' + rooms[i].id + ' has been set to NULL!');
      rooms[i] = null;
    }
  }
  console.log('Removed room ' + roomId);
}

// Calculates and returns the room closest to the given point.
// Creates new room if point is far away from other rooms
function findNearestRoomLoc(latitude, longitude) {
  var closestDist = 1000000000, closestRoom = -1, nullVal = -1;
  var distSq = 1000000000, room = null;
  for (var i = 0; i < rooms.length; i++) {
    room = rooms[i];
    if (room == null) {
      nullVal = i;
      continue;
    }
    if (isNaN(room.latitude) === true || isNaN(room.longitude) === true) {
      continue;
    }
    distSq = calcDistSq(latitude, longitude, room.latitude, room.longitude);
    console.log('Calculating Distances:=============(' + latitude + ', ' + longitude + ') to (' + room.latitude + ', ' + room.longitude + ')============Distance Squared: ' + distSq);
    if (distSq < room.radiusSq && room.purpose === 'default public') {
      if (distSq < closestDist) {
        closestDist = distSq;
        closestRoom = i;
      }
    }
  }
  if (closestRoom !== -1) {
    console.log('Found nearby room ' + rooms[closestRoom].id);
    return rooms[closestRoom];
  }
  var room = new Room((new Date()).getTime());
  if (nullVal !== -1) {
    rooms[nullVal] = room;
  } else {
    rooms[rooms.length] = room;
  }
  console.log('Found no nearby room, so created one ' + room.id);
  return room;
}

// Also creates a room if there is not one already
function getRoomFromId(roomId) {
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] !== null && rooms[i].id == roomId) {
      console.log('Found this room from the following id: ' + roomId);
      //console.log(rooms[i]);
      return rooms[i];
    }
    if (rooms[i] == null && nullVal === -1) {
      nullVal = i;
    }
  }
  console.log('==========No fitting room found!==========');
  return null;
}

io.sockets.on('connection', function (socket) {
  // Socket managerial functions

  function changeRoom(newRoom) {
    io.sockets.in(socket.room.id).emit('Delete user', socket.clientName, socket.clientId);
    socket.room.removeSocket(socket);
    socket.leave(socket.room.id);
    socket.room = newRoom;
    socket.join(newRoom.id);
    socket.room.addSocket(socket);
    socket.emit('Change room', newRoom.id, newRoom.name, getLobbyNames(), getLobbyIds());
    for (var i = 0; i < socket.room.chats.length; i++) {
      socket.emit('Display new chat', socket.room.chats[i].chatObj, socket.room.chats[i].senderName);
    }
    socket.broadcast.to(newRoom.id).emit('Display new nearby user', socket.clientName, socket.clientId);
  } 


  // Emits a message to everyone!
  function messageAll(message) {
    io.sockets.in(socket.room.id).emit('announcement', message);
  }

  function getLobbyNames() {
    var lobby = io.sockets.clients(socket.room.id);
    var lobbyNames = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyNames[lobbyNames.length] = lobby[i].clientName;
    }
    return lobbyNames;
  };

  function getLobbyIds() {
    var lobby = io.sockets.clients(socket.room.id);
    var lobbyIDs = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyIDs[lobbyIDs.length] = lobby[i].clientId;
    }
    return lobbyIDs;
  };

  socket.on('Set client name and id', function (name, id) {
    socket.clientName = name;
    socket.clientId = id;
    socket.emit('Update client name', socket.clientName);
    socket.broadcast.to(socket.room.id).emit('Display new nearby user', socket.clientName, socket.clientId);
  });

  socket.on('Change client name', function (newName, oldName, clientId) {
    socket.clientName = newName;
    socket.emit('Update client name', newName);
    io.sockets.in(socket.room.id).emit('Change nearby client name', newName, oldName, clientId);
  });

  socket.on('Change room name', function(newRoomName, clientName) {
    socket.room.name = newRoomName;
    io.sockets.in(socket.room.id).emit('Update room name', newRoomName, clientName)
  });

  // Change to returning rooms in distance from the socket position
  socket.on('Get nearby rooms', function() {
    // Stash names, IDs, and descriptions of rooms in separate arrays.
    var roomNames = [];
    var roomIds = [];
    var roomDescs = [];
    var roomCents = [];

    for (var i = 0; i < rooms.length; i++){
      if (rooms[i] != null) {
        roomNames[roomNames.length] = rooms[i].name;
        roomIds[roomIds.length] = rooms[i].id;
        roomDescs[roomDescs.length] = rooms[i].desc;
        roomCents[roomCents.length] = {
          latitude: rooms[i].latitude,
          longitude: rooms[i].longitude
        };
      }
    }

    // Send arrays to index.js for display in Bootstrap modal
    socket.emit('Display nearby rooms', roomNames, roomIds, roomDescs, roomCents);
  });

  socket.on('Change room', function(newRoomId) {
    if (socket.room.id !== newRoomId) {
      var newRoom = getRoomFromId(newRoomId);
      if (newRoom == null) {
        changeRoom(addRoom(newRoomId));
      } else {
        changeRoom(newRoom);
      }
    }
  });

  socket.on('Create room', function(newRoomName, newRoomDesc){
    var newRoom = addRoom(new Date().getTime());
    newRoom.name = newRoomName;
    newRoom.desc = newRoomDesc;
    newRoom.purpose = 'private room';
    changeRoom(newRoom);
  });

  socket.on('Get all lobby users', function () {
    socket.emit('Display all lobby users', getLobbyNames(), getLobbyIds());
  });

  socket.on('Send new file', function (fpfile, senderName) {
    io.sockets.in(socket.room.id).emit('Display new file', fpfile, senderName);
  });

  socket.on('Send new chat', function (inChatObj, inSenderName) {
    io.sockets.in(socket.room.id).emit('Display new chat', inChatObj, inSenderName);
    socket.room.chats[socket.room.chats.length] = {
      senderName: inSenderName,
      chatObj: inChatObj
    };
  });

  // Runs on connection, with location info
  socket.on('Use loc info', function(name, id, coords, ip) {
    socket.coords = coords;
    socket.clientName = name;
    socket.clientId = id;

    var room = findNearestRoomLoc(socket.coords.latitude, socket.coords.longitude);
    socket.ip = ip;
    socket.room = room;
    console.log('Joining room ' + room.id);
    socket.room.addSocket(socket);
    socket.join(socket.room.id);

    socket.emit('Initialize room', socket.clientName, socket.room.id, socket.room.name, getLobbyNames(), getLobbyIds(), false);
    for (var i = 0; i < socket.room.chats.length; i++) {
      socket.emit('Display new chat', socket.room.chats[i].chatObj, socket.room.chats[i].senderName);
    }
    //socket.emit('Join room', socket.room.name);
    //socket.emit('Update client name', socket.clientName);
    socket.broadcast.to(socket.room.id).emit('Display new nearby user', socket.clientName, socket.clientId);
    //socket.emit('Display all lobby users', getLobbyNames(), getLobbyIds());
  });

  // Runs on connection, without location info
  socket.on('Use ip info', function(name, id, ip) {
    socket.coords = null;
    socket.ip = ip;
    socket.clientName = name;
    socket.clientId = id;

    socket.room = getRoomFromId(ip);
    if (socket.room == null) {
      socket.room = addRoom(ip);
    }
    socket.room.addSocket(socket);
    socket.join(socket.room.id);
    console.log('Joining room ' + ip);

    socket.emit('Initialize room', socket.clientName, socket.room.id, socket.room.name, getLobbyNames(), getLobbyIds(), true);
    for (var i = 0; i < socket.room.chats.length; i++) {
      socket.emit('Display new chat', socket.room.chats[i].chatObj, socket.room.chats[i].senderName);
    }
    //socket.emit('Join room', socket.room.name);
    //socket.emit('Update client name', socket.clientName);
    socket.broadcast.to(socket.room.id).emit('Display new nearby user', socket.clientName, socket.clientId);
    //socket.emit('Display all lobby users', getLobbyNames(), getLobbyIds());
  });

  socket.on('disconnect', function () {
    if (socket.room != null){
      socket.room.removeSocket(this);
      console.log('Leaving room: ' + socket);
      socket.broadcast.to(socket.room.id).emit('Delete user', socket.clientName, socket.clientId);
      socket.leave(socket.room.id);
      socket.room = null;
    }
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function() {
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});