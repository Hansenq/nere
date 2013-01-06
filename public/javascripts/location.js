
socket.posLatitude = -1;
socket.posLongitude = -1;
socket.posAccuracy = -1;
var desiredLocAccuracy = 100; // meters

function positionSuccess(position) {
  socket.posLatitude = position.coords.latitude;
  socket.posLongitude = position.coords.longitude;
  socket.posAccuracy = position.coords.accuracy;
  console.log('Accuracy: ' + position.coords.accuracy);
  usePosition();
}

function positionError(error) {
  var errors = { 
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout'
  };
  console.log('Position error: ' + errors[error.code]);
  useIPAddr();
}

function usePosition() {
  if (socket.posLatitude != -1 && socket.posLongitude != -1) {
    socket.emit('Send loc info', socket.posLatitude, socket.posLongitude, socket.posAccuracy);
  }
}

// Runs when location cannot be obtained.
function useIPAddr() {
  socket.emit('Use ip info');
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