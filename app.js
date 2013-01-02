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

var rooms = [];

// Room class
function Room (name) {
  this.name = name;
  this.radius = -1;
  this.numUsers = 0;
  this.cenLat = 0;
  this.cenLong = 0;
  this.geohashMean = [];
  this.geohashes = [];    // could be bst, but each room won't be that big!
  this.ips = [];        // " " "
}

// for plusMinus: 1 if adding user, -1 if removing users
function reCalcCenter(plusMinus, ip, latitude, longitude) {
  this.cenLat = (this.cenLat * this.numUsers  + latitude) / (this.numUsers + plusMinus);
  this.cenLong = (this.cenLong * this.numUsers  + longitude) / (this.numUsers + plusMinus);
}

// uGH of -1 if we can't use it
Room.prototype.addUser = function (uIP, latitude, longitude) {
  reCalcCenter(1, uIP, latitude, longitude);
  this.numUsers++;
  var ip = false; gh = false;
  for (var i = 0; i < this.ips.length; i++) {
    if (this.ips[i] === null) {
      this.ips[i] = uIP;
      ip = true;
    }
    if (this.geohashes[i] === null) {
      this.geohashes[i] = {
        latitude: latitude,
        longitude: longitude
      };
      gh = true;
    }
  }
  if (ip === false) {
    this.ips[this.ips.length] = uIP;
  }
  if (gh === false) {
    this.geohashes[this.geohashes.length] = {
      latitude: latitude,
      longitude: longitude
    };
  }
}

// -1 reserved for global unused. 0 used as unused.
Room.prototype.removeUser = function(uIP, latitude, longitude) {
  reCalcCenter(-1, uIP, latitude, longitude);
  this.numUsers--;
  var empty = true;
  for (var i = 0; i < this.ips.length; i++) {
    if (empty === false && (this.ips[i] != null || this.geohashes[i] != null)) {
      empty = false;
    }
    if (this.ips[i] === uIP) {
      this.ips[i] = null;
    }
    if (this.geohashes[i] === uGH) {
      this.geohashes[i] = null;
    }
  }
  if (empty === true) {
    removeRoom(this.name);
  }
}


// Might as well convert this to a binary search tree sometime..
function addRoom(roomName) {
  var exists = false;
  var nullVal = -1;
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name === roomName) {
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


function removeRoom(roomName) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name === roomName) {
      rooms[i] = null;
    }
  }
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


  
  socket.on('Join room with ip', function(roomId) {
    console.log('Joining room ' + roomId);
    socket.roomId = roomId;
    socket.ip = roomId;
    socket.join(socket.roomId);
  })


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
    socket.leave(socket.roomId);
    socket.roomId = roomId;
    socket.join(socket.roomId);
    // CODE
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
    // CODE
  });

  socket.on('disconnect', function () {
    console.log('Leaving room ' + socket.ip);
    socket.broadcast.to(socket.ip).emit('Delete name', socket.clientName);
    socket.leave(socket.ip);
    checkRoomEmpty(socket.ip);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function(){
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});