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
function calcDistance(x1, y1, x2, y2) {
  // http://www.movable-type.co.uk/scripts/latlong.html
  // Equirectangular approximation and pythagorean theorem
  x1 = x1 / 180 * Math.PI;
  x2 = x2 / 180 * Math.PI;
  y1 = y1 / 180 * Math.PI;
  y2 = y2 / 180 * Math.PI;
  var x = (y2 - y1) * Math.cos((x1 + x2) / 2);
  var y = (x2 - x1);
  return Math.sqrt(x * x + y * y) * 6378.1 * 1000;   // change to meters
}

// Room class
function Room (id) {
  this.id = id;
  this.name = id;
  this.radius = 70;     // default radius to 70m
  this.numUsers = 0;
  this.cenLat = 0;
  this.cenLong = 0;
  this.sockets = [];
}

Room.prototype.addSocket = function (socket) {
  if (isNaN(socket.latitude) === false && isNaN(socket.longitude) === false) {
    var plusMinus = 1;
    this.cenLat = (this.cenLat * this.numUsers  + socket.latitude * plusMinus) / (this.numUsers + plusMinus);
    this.cenLong = (this.cenLong * this.numUsers  + socket.longitude * plusMinus) / (this.numUsers + plusMinus);
  }
  this.numUsers++;
  var hasSpace = false;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i] === null) {
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
  if (isNaN(socket.latitude) === false && isNaN(socket.longitude) === false) {
    var plusMinus = -1;
    this.cenLat = (this.cenLat * this.numUsers  + socket.latitude * plusMinus) / (this.numUsers + plusMinus);
    this.cenLong = (this.cenLong * this.numUsers  + socket.longitude * plusMinus) / (this.numUsers + plusMinus);
  }
  this.numUsers--;
  var empty = true;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i] != null && this.sockets[i].clientId === socket.clientId) {
      this.sockets[i] = null;
    }
    if (empty === true && this.sockets[i] != null) {
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
    if (rooms[i].id === roomId) {
      exists = true;
    }
    if (rooms[i] === null && nullVal = -1) {
      nullVal = i;
    }
  }
  var room = new Room(roomId);
  if (exists === false) {
    if (nullVal === -1) {
      rooms[nullVal] = room;
    } else {
      rooms[rooms.length] = room;
    }
  }
  console.log('Added a new room ' + roomId);
  //console.log(room);
}

function removeRoom(roomId) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] != null && rooms[i].id === roomId) {
      console.log('ALERT! Room ' + rooms[i].id + ' has been set to NULL!');
      rooms[i] = null;
    }
  }
  console.log('Removed room ' + roomId);
}

// Calculates and returns the room closest to the given point.
// Creates new room if point is far away from other rooms
function findNearestRoomLoc(latitude, longitude) {
  var closestDist = 10000, closestRoom = -1, nullVal = -1;
  var dist = 100000, room = null;
  for (var i = 0; i < rooms.length; i++) {
    room = rooms[i];
    if (room === null) {
      nullVal = i;
      continue;
    }
    if (isNaN(room.cenLat) === true || isNaN(room.cenLong) === true) {
      continue;
    }
    dist = calcDistance(latitude, longitude, room.cenLat, room.cenLong);
    console.log('Calculating Distances:=============(' + latitude + ', ' + longitude + ') to (' + room.cenLat + ', ' + room.cenLong + ')===========' + dist);
    if (dist < room.radius) {
      if (dist < closestDist) {
        closestDist = dist;
        closestRoom = i;
      }
    }
  }
  if (closestRoom != -1) {
    console.log('Found nearby room ' + rooms[closestRoom].id);
    //console.log(rooms[closestRoom]);
    return rooms[closestRoom];
  }
  var room = new Room((new Date()).getTime());
  if (nullVal != -1) {
    rooms[nullVal] = room;
  } else {
    rooms[rooms.length] = room;
  }
  console.log('Found no nearby room, so created one ' + room.id);
  //console.log(room);
  return room;
}

// Also creates a room if there is not one already
function getRoomFromId(roomId) {
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] != null && rooms[i].id === roomId) {
      console.log('Found this room from the following id: ' + roomId);
      //console.log(rooms[i]);
      return rooms[i];
    }
    if (rooms[i] === null && nullVal === -1) {
      nullVal = i;
    }
  }
  var room = new Room(roomId);
  if (nullVal != -1) {
    rooms[nullVal] = room;
  } else {
    rooms[rooms.length] = room;
  }
  console.log('Found no room corresponding to id ' + roomId + ' so created one.');
  //console.log(room);
  return room;
}





io.sockets.on('connection', function (socket) {
  // Socket managerial functions
  function changeRooms(newRoom) {
    io.sockets.in(socket.roomId).emit('Delete user', socket.clientName, socket.clientId);
    socket.room.removeSocket(socket);
    socket.leave(socket.roomId);
    socket.roomId = newRoom.id;
    socket.room = newRoom;
    console.log(newRoom);
    socket.join(socket.roomId);
    newRoom.addSocket(socket);
    socket.emit('Join room', newRoom.id);
    socket.emit('Refresh all lobby users', getLobbyNames(), getLobbyIDs());
    socket.broadcast.to(socket.roomId).emit('Display new nearby user', socket.clientName, socket.clientId);
  }

  // Emits a message to everyone!
  function messageAll(message) {
    io.sockets.in(socket.roomId).emit('announcement', message);
  }

  function getLobbyNames() {
    var lobby = io.sockets.clients(socket.roomId);
    var lobbyNames = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyNames[lobbyNames.length] = lobby[i].clientName;
    }
    return lobbyNames;
  };

  function getLobbyIDs() {
    var lobby = io.sockets.clients(socket.roomId);
    var lobbyIDs = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyIDs[lobbyIDs.length] = lobby[i].clientId;
    }
    return lobbyIDs;
  };

  // roomId = ip
  socket.on('Join room with ip', function(roomId) {
    console.log('Joining room ' + roomId);
    socket.roomId = roomId;
    socket.ip = roomId;
    socket.room = getRoomFromId(roomId);
    socket.room.addSocket(socket);
    socket.join(socket.roomId);
  });

  socket.on('Set client name and id', function (name, id) {
    socket.clientName = name;
    socket.clientId = id;
    socket.emit('Display client', socket.clientName);
    socket.broadcast.to(socket.roomId).emit('Display new nearby user', socket.clientName, socket.clientId);
  });

  socket.on('Change client name', function (newName, oldName, id) {
    socket.clientName = newName;
    socket.emit('Display client', newName);
    io.sockets.in(socket.roomId).emit('Change nearby name', newName, oldName, id);
  });

  // For future use
  socket.on('Change rooms', function(newRoomId) {
    if (socket.room.id != newRoomId) {
      changeRooms(getRoomFromId(newRoomId));
    }
  });

  socket.on('Get all lobby users', function () {
    socket.emit('Display all lobby users', getLobbyNames(), getLobbyIDs());
  });

  socket.on('Send new file', function (fpfile, senderName) {
    io.sockets.in(socket.roomId).emit('Display new file', fpfile, senderName);
  });

  socket.on('Send new chat', function (chat, senderName) {
    io.sockets.in(socket.roomId).emit('Display new chat', chat, senderName);
  });

  // Runs on connection, with location info
  socket.on('Use loc info', function(name, id, latitude, longitude, accuracy, ip) {
    socket.latitude = latitude;
    socket.longitude = longitude;
    socket.accuracy = accuracy;
    socket.clientName = name;
    socket.clientId = id;

    var room = findNearestRoomLoc(latitude, longitude);
    socket.roomId = room.id;
    socket.ip = ip;
    socket.room = room;
    console.log('Joining room ' + room.id);
    socket.room.addSocket(socket);
    socket.join(socket.roomId);

    socket.emit('Initialize room', socket.clientName, socket.room.name, getLobbyNames(), getLobbyIDs());
    //socket.emit('Join room', socket.room.name);
    //socket.emit('Display client', socket.clientName);
    socket.broadcast.to(socket.roomId).emit('Display new nearby user', socket.clientName, socket.clientId);
    //socket.emit('Display all lobby users', getLobbyNames(), getLobbyIDs());
  });

  // Runs on connection, without location info
  socket.on('Use ip info', function(name, id, ip) {
    socket.roomId = ip;
    socket.ip = ip;
    socket.clientName = name;
    socket.clientId = id;

    socket.room = getRoomFromId(ip);
    socket.room.addSocket(socket);
    socket.join(socket.roomId);
    console.log('Joining room ' + ip);

    socket.emit('Initialize room', socket.clientName, socket.room.name, getLobbyNames(), getLobbyIDs());
    //socket.emit('Join room', socket.room.name);
    //socket.emit('Display client', socket.clientName);
    socket.broadcast.to(socket.roomId).emit('Display new nearby user', socket.clientName, socket.clientId);
    //socket.emit('Display all lobby users', getLobbyNames(), getLobbyIDs());
  });

  socket.on('disconnect', function () {
    if (socket.room != null)
      socket.room.removeSocket(this);
    console.log('Leaving room: ' + socket);
    socket.broadcast.to(socket.roomId).emit('Delete user', socket.clientName, socket.clientId);
    socket.room = null;
    socket.leave(socket.roomId);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function() {
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});