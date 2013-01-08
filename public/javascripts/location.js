socket.posLatitude = -1;
socket.posLongitude = -1;
socket.posAccuracy = -1;
var desiredLocAccuracy = 70; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answeredLocQues = false;

function positionSuccess(position) {
  if (answeredLocQues === false) {
    dismissGSModal();
    answeredLocQues = true;
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
  if (answeredLocQues === false) {
    dismissGSModal();
    answeredLocQues = true;
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
}