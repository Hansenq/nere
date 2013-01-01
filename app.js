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

io.sockets.on('connection', function (socket) {

  function getLobbyNames() {
    var lobby = io.sockets.clients(socket.ip);
    var lobbyNames = [];
    for (var i = 0; i < lobby.length; i++){
      lobbyNames[lobbyNames.length] = lobby[i].clientName;
    }
    return lobbyNames;
  };
  
  socket.on('Initialize IP', function(ip) {
    console.log('Joining room ' + ip);
    socket.ip = ip;
    socket.join(socket.ip);
  })


  socket.on('Set client name', function (name) {
    socket.clientName = name;
    socket.emit('Display client name', name);
    socket.broadcast.to(socket.ip).emit('Display new nearby name', name);
  });

  socket.on('Get all lobby users', function () {
    socket.emit('Display all lobby names', getLobbyNames());
  });

  socket.on('Send new file', function (fileURL, filename, senderName) {
    io.sockets.in(socket.ip).emit('Display new file', fileURL, filename, senderName);
  });

  socket.on('Send new chat', function (chat, senderName) {
    io.sockets.in(socket.ip).emit('Display new chat', chat, senderName);
  });

  socket.on('disconnect', function () {
    console.log('Leaving room ' + socket.ip);
    socket.broadcast.to(socket.ip).emit('Delete name', socket.clientName);
    socket.leave(socket.ip);
  });

  /*

  // Below runs the chat client!
  socket.on('userMessage', function(msg, func) {
    func(msg);
    socket.to(socket.ip).broadcast.emit('userMessage', socket.clientName, msg);
  });

  */

});

var port = process.env.PORT || app.get('port');

server.listen(port, function(){
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});