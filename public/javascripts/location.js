
socket.posLatitude = -1;
socket.posLongitude = -1;
socket.posAccuracy = -1;
var desiredLocAccuracy = 70; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answered = false;

function positionSuccess(position) {
  if (answered === false) {
    answered = true;
    socket.posLatitude = position.coords.latitude;
    socket.posLongitude = position.coords.longitude;
    socket.posAccuracy = position.coords.accuracy;
    console.log('Accuracy: ' + position.coords.accuracy);
    usePosition();
  }
}

function positionError(error) {
  var errors = { 
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout'
  };
  console.log('Position error: ' + errors[error.code]);
  if (answered === false) {
    answered = true;
    useIPAddr();
  }
}

function usePosition() {
  if (socket.posLatitude != -1 && socket.posLongitude != -1) {
    socket.emit('Use loc info', socket.clientName, socket.clientID, socket.posLatitude, socket.posLongitude, socket.posAccuracy, ipAddress);
  }
}

// Runs when location cannot be obtained.
function useIPAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientID, ipAddress);
  socket.roomId = ipAddress;
  // 'Use ip info' does the same as the below two calls
  //socket.emit('Set client name and id', socket.clientName, socket.clientID);
  //socket.emit('Get all lobby users');
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    positionSuccess, 
    positionError, 
    {
      enableHighAccuracy: true
    }
    );
};

setTimeout(function() {
  if (answered === false) {
    answered = true;
    useIPAddr();
  }
}, positionTimeout);