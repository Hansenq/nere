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

// gives X amount of time to reopen connection
io.configure(function() {
  io.set('close timeout', 5);
});

// App Routes
app.get('/', routes.index);
app.get('/users', user.list);


// Code for Heroku socket.io compatibility; default 10 seconds
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 3); 
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
  this.radius = 25;     // default radius to 25m
  this.numUsers = 0;
  this.cenLat = 0;
  this.cenLong = 0;
  this.sockets = [];
}

// for plusMinus: 1 if adding user, -1 if removing users
function reCalcCenter(plusMinus, latitude, longitude) {
  this.cenLat = (this.cenLat * this.numUsers  + latitude) / (this.numUsers + plusMinus);
  this.cenLong = (this.cenLong * this.numUsers  + longitude) / (this.numUsers + plusMinus);
}

// uGH of -1 if we can't use it
Room.prototype.addSocket = function (socket) {
  reCalcCenter(1, socket.latitude, socket.longitude);
  this.numUsers++;
  var hasSpace = false;
  for (var i = 0; i < this.sockets.length; i++) {
    if (this.sockets[i] === null) {
      this.sockets[i] = socket;
      hasSpace = true;
    }
  }
  if (ip === false) {
    this.sockets[this.sockets.length] = socket;
  }
  return this;
}

// -1 reserved for global unused. 0 used as unused.
Room.prototype.removeSocket = function(socket) {
  reCalcCenter(-1, socket.latitude, socket.longitude);
  this.numUsers--;
  var empty = true;
  for (var i = 0; i < this.ips.length; i++) {
    if (this.ips[i] === uIP) {
      this.ips[i] = null;
    }
    if (empty === false && this.ips[i] != null) {
      empty = false;
    }
  }
  if (empty === true) {
    removeRoom(this.id);
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
    if (rooms[i].id === roomId) {
      rooms[i] = null;
    }
  }
}

// Calculates and returns the room closest to the given point.
// Creates new room if point is far away from other rooms
function findNearestRoomLoc(latitude, longitude) {
  var closestDist = 10000, closestRoom = -1;
  var dist = 100000, room = null;
  for (var i = 0; i < rooms.length; i++) {
    room = rooms[i];
    dist = calcDistance(latitude, longitude, room.cenLat, room.cenLong);
    if (dist < room.radius) {
      if (dist < closestDist) {
        closestDist = dist;
        closestRoom = i;
      }
    }
  }
  if (closestRoom = -1) {
    room = new Room((new Date()).getTime());
    rooms[rooms.length] = room;
    return room;
  }
  return closestRoom;
}

// Also creates a room if there is not one already
function getRoomFromId(roomId) {
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id === roomId) {
      return rooms[i];
    }
    if (rooms[i] === null && nullVal = -1) {
      nullVal = i;
    }
  }
  if (nullVal === -1) {
    rooms[nullVal] = new Room(roomName);
  } else {
    rooms[rooms.length] = new Room(roomName);
  }
}

// Socket managerial functions
function changeRooms(newRoom) {
  io.sockets.in(socket.roomId).emit('Delete name', socket.clientName);
  socket.room.removeSocket(this);
  socket.leave(socket.roomId);
  socket.roomId = newRoom.id;
  socket.join(socket.roomId);
  socket.room = newRoom;
  newRoom.addSocket(this);
  socket.emit('Change room', newRoom.id);
  socket.emit('Refresh all lobby names', getLobbyNames());
  sockets.broadcast.to(socket.roomId).emit('Display new nearby name', socket.name);
}




io.sockets.on('connection', function (socket) {
  function getLobbyNames() {
    // Returns array of socket variables
    var lobby = io.sockets.clients(socket.ip);
    var lobbyNames = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyNames[lobbyNames.length] = lobby[i].clientName;
    }
    return lobbyNames;
  };


  // roomId = ip
  socket.on('Join room with ip', function(roomId) {
    console.log('Joining room ' + roomId);
    socket.roomId = roomId;
    socket.ip = roomId;
    socket.room = getRoomFromId(roomId);
    socket.join(socket.roomId);
  });


  socket.on('Set client name', function (name) {
    socket.clientName = name;
    socket.emit('Display client name', name);
    socket.broadcast.to(socket.ip).emit('Display new nearby name', name);
  });

  socket.on('Change client name', function(newName, oldName) {
    socket.clientName = newName;
    socket.emit('Display client name', newName);
    io.sockets.in(socket.ip).emit('Change nearby name', newName, oldName);
  });

  socket.on('Change rooms', function(newRoomId) {
    if (socket.room.id != newRoomId) {
      changeRooms(getRoomFromId(newRoomId));
    }
  });

  socket.on('Get all lobby users', function () {
    socket.emit('Display all lobby names', getLobbyNames());
  });

  socket.on('Refresh all lobby users', function() {
    socket.emit('Refresh all lobby names', getLobbyNames());
  });

  socket.on('Send new file', function (fileURL, filename, senderName) {
    io.sockets.in(socket.ip).emit('Display new file', fileURL, filename, senderName);
  });

  socket.on('Send new chat', function (chat, senderName) {
    io.sockets.in(socket.ip).emit('Display new chat', chat, senderName);
  });

  socket.on('Send loc info', function(latitude, longitude) {
    socket.latitude = latitude;
    socket.longitude = longitude;
    var room = rooms[findNearestRoomLoc(latitude, longitude)].addSocket(socket);
    if (room.id != socket.roomId) {
      changeRooms(room);
    }
  });

  socket.on('Use ip info', function() {
    // No change (yet!)
  });

  socket.on('disconnect', function () {
    console.log('Leaving room ' + socket.ip);
    socket.broadcast.to(socket.ip).emit('Delete name', socket.clientName);
    socket.leave(socket.ip);
    checkRoomEmpty(socket.ip);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function() {
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});