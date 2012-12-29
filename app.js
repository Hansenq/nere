
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
  io.set("polling duration", 1); 
});

io.sockets.on('connection', function (socket) {

  socket.emit('this', 'Number of users looking at this site: ');
  
  socket.on('join room', function (ipaddress) {
    console.log('Joining room ' + ipaddress);
    socket.ip = ipaddress;
    socket.join(ipaddress);
  });
  
  socket.on('setname', function (name) {
    socket.emit('gotname', name);
    socket.clientName = name;

    // We're using the same function in 3 different instances.
    // Create and name a separate function for this...
    var nearby = io.sockets.clients(socket.ip);
    var nearbyNames = [];
    for (var i=0; i<nearby.length; i++){
      nearbyNames[nearbyNames.length] = nearby[i].clientName;
    }
    io.sockets.in(socket.ip).emit('allnearby', nearbyNames);

  });

  socket.on('get all nearby', function () {
    var nearby = io.sockets.clients(socket.ip);
    var nearbyNames = [];
    for (var i=0; i<nearby.length; i++){
      nearbyNames[nearbyNames.length] = nearby[i].clientName;
    }
    socket.emit('allnearby', nearbyNames);
  });

  socket.on('file sent', function (fileURL, receiverName) {
    var nearby = io.sockets.clients(socket.ip);
    for (var i=0; i<nearby.length; i++){
      console.log(nearby[i].clientName);
      if (nearby[i].clientName === receiverName){
        nearby[i].emit('file received', fileURL);
      }
    }
  });

  socket.on('disconnect', function () {
    console.log('Leaving room ' + socket.ip);

    var nearby = io.sockets.clients(socket.ip);
    var nearbyNames = [];
    for (var i=0; i<nearby.length; i++){
      if (nearby[i].clientName != socket.clientName){
        nearbyNames[nearbyNames.length] = nearby[i].clientName;
      }
    }
    io.sockets.in(socket.ip).emit('allnearby', nearbyNames);
  });
});

var port = process.env.PORT || app.get('port');

server.listen(port, function(){
  console.log("Express server listening on port " + port + " in " + app.settings.env + " mode");
});