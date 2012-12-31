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
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {

  function getNearbyNames() {
    var nearby = io.sockets.clients(socket.ip);
    var nearbyNames = [];
    for (var i = 0; i < nearby.length; i++){
      nearbyNames[nearbyNames.length] = nearby[i].clientName;
    }
    return nearbyNames;
  };
  
  console.log('Joining room ' + socket.handshake.address.address);
  socket.ip = socket.handshake.address.address;
  socket.join(socket.ip);

  socket.on('Set client name', function (name) {
    socket.clientName = name;
    var nearbyNames = getNearbyNames();
    socket.emit('Display client name', name);
    socket.broadcast.to(socket.ip).emit('Display new nearby name', name);
  });

  socket.on('Get all nearby users', function () {
    io.sockets.in(socket.ip).emit('Display all lobby names', getNearbyNames());
  });

  /*

  socket.on('file sent', function (fileURL, receiverName, senderName) {
    var nearby = io.sockets.clients(socket.ip);
    for (var i = 0; i < nearby.length; i++){
      console.log(nearby[i].clientName);
      if (nearby[i].clientName === receiverName){
        nearby[i].emit('file received', fileURL, senderName);
      }
    }
  });

  */

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