var desiredLocAccuracy = 70; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answeredLocQues = false;

function positionSuccess(position) {
  if (answeredLocQues === false) {
    changeGSToLoading();
    answeredLocQues = true;
    socket.coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    }
    message('Location: ' + socket.coords.latitude + ', ' + socket.coords.longitude);
    message('Accuracy: ' + socket.coords.accuracy);
    if (socket.coords.accuracy <= desiredLocAccuracy) {
      socket.emit('Use loc info', socket.clientName, socket.clientId, socket.coords, ipAddress);
    } else {
      useIPAddr();
      console.log('Location was not accurate enough; used IP Address instead');
    }
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
    changeGSToLoading();
    answeredLocQues = true;
    useIPAddr();
  }
}

// Runs when location cannot be obtained.
function useIPAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientId, ipAddress);
}