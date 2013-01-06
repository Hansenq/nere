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
  io.set("polling duration", 3); 
  //io.set('close timeout', 7);
});

// 
var rooms = [];

// Misc Calculation Functions
function calcDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1,  2));
}

// Room class
function Room (id) {
  this.id = id;
  this.name = null;
  this.radius = 100;     // default radius to 100m
  this.numUsers = 0;
  this.cenLat = 0.0;
  this.cenLong = 0.0;
  this.sockets = [];
}

Room.prototype.addSocket = function (socket) {
  var plusMinus = 1;
  this.cenLat = (this.cenLat * this.numUsers  + socket.latitude * plusMinus) / (this.numUsers + plusMinus);
  this.cenLong = (this.cenLong * this.numUsers  + socket.longitude * plusMinus) / (this.numUsers + plusMinus);
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
  console.log('Added socket of position: ' + socket.latitude + ', ' + socket.longitude);
  console.log('New center: ' + this.cenLat + ', ' + this.cenLong);
}

Room.prototype.removeSocket = function(socket) {
  var plusMinus = -1;
  this.cenLat = (this.cenLat * this.numUsers  + socket.latitude * plusMinus) / (this.numUsers + plusMinus);
  this.cenLong = (this.cenLong * this.numUsers  + socket.longitude * plusMinus) / (this.numUsers + plusMinus);
  this.numUsers--;
  var empty = true;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i].clientId === socket.clientId) {
      this.sockets[i] = null;
    }
    if (empty === false && this.sockets[i] != null) {
      empty = false;
    }
  }
  if (empty === true) {
    removeRoom(this.id);
  }
}

// Might as well convert this to a binary search tree sometime..
function addRoom(roomName) {
  var exists = false;
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomName) {
      exists = true;
    }
    if (rooms[i] === null && nullVal = -1) {
      nullVal = i;
    }
  }
  if (exists === false) {
    if (nullVal === -1) {
      rooms[nullVal] = new Room(roomName);
    } else {
      rooms[rooms.length] = new Room(roomName);
    }
  }
}

function removeRoom(roomId) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] != null && rooms[i].id === roomId) {
      rooms[i] = null;
    }
  }
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
    console.log(latitude + ', ' + longitude + ' near ' + rooms[i].cenLat + ', ' + rooms[i].cenLong);
    dist = calcDistance(latitude, longitude, room.cenLat, room.cenLong);
    if (dist < room.radius) {
      if (dist < closestDist) {
        closestDist = dist;
        closestRoom = i;
      }
    }
  }
  if (closestRoom != -1) {
    return rooms[closestRoom];
  }
  var room = new Room((new Date()).getTime());
  if (nullVal != -1) {
    rooms[nullVal] = room;
  } else {
    rooms[rooms.length] = room;
  }
  return room;
}

// Also creates a room if there is not one already
function getRoomFromId(roomId) {
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i] != null && rooms[i].id === roomId) {
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
    socket.emit('Change room', newRoom.id);
    socket.emit('Refresh all lobby users', getLobbyNames(), getLobbyIDs());
    socket.broadcast.to(socket.roomId).emit('Display new nearby user', socket.clientName, socket.clientId);
  }

  function message(message) {
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

  socket.on('Send loc info', function(latitude, longitude, accuracy) {
    socket.latitude = latitude;
    socket.longitude = longitude;
    socket.accuracy = accuracy;
    var room = findNearestRoomLoc(latitude, longitude);
    if (room.id != socket.roomId) {
      changeRooms(room);
    }
  });

  socket.on('Use roomId info', function() {
    // No change (yet!)
  });

  socket.on('disconnect', function () {
    socket.room.removeSocket(this);
    console.log('Leaving room ' + socket.roomId);
    socket.broadcast.to(socket.roomId).emit('Delete user', socket.clientName, socket.clientId);
    socket.room = null;
    socket.leave(socket.roomId);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function() {
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});