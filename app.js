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
});

io.sockets.on('connection', function (socket) {

  function getLobbyNames() {
    var lobby = io.sockets.clients(socket.ip);
    var lobbyNames = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyNames[lobbyNames.length] = lobby[i].clientName;
    }
    return lobbyNames;
  };

  function getLobbyIDs() {
    var lobby = io.sockets.clients(socket.ip);
    var lobbyIDs = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyIDs[lobbyIDs.length] = lobby[i].clientID;
    }
    return lobbyIDs;
  };
  
  socket.on('Initialize IP', function(ip) {
    console.log('Joining room ' + ip);
    socket.ip = ip;
    socket.join(socket.ip);
  })

  socket.on('Set client name and ID', function (name, id) {
    socket.clientName = name;
    socket.clientID = id;
    socket.emit('Display client', socket.clientName);
    socket.broadcast.to(socket.ip).emit('Display new nearby user', socket.clientName, socket.clientID);
  });

  socket.on('Change client name', function (newName, oldName, id) {
    socket.clientName = newName;
    socket.emit('Display client', newName);
    io.sockets.in(socket.ip).emit('Change nearby name', newName, oldName, id);
  })

  socket.on('Get all lobby users', function () {
    socket.emit('Display all lobby users', getLobbyNames(), getLobbyIDs());
  });

  socket.on('Send new file', function (fpfile, senderName) {
    io.sockets.in(socket.ip).emit('Display new file', fpfile, senderName);
  });

  socket.on('Send new chat', function (chat, senderName) {
    io.sockets.in(socket.ip).emit('Display new chat', chat, senderName);
  });

  socket.on('disconnect', function () {
    console.log('Leaving room ' + socket.ip);
    socket.broadcast.to(socket.ip).emit('Delete user', socket.clientName, socket.clientID);
    socket.leave(socket.ip);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function(){
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});