var desiredLocAccuracy = 70; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answeredLocQues = false;

function positionSuccess(position) {
  if (answeredLocQues === false) {
    dismissGSModal();
    answeredLocQues = true;
    socket.position = position;
    console.log('Location: ' + position.coords.latitude + ', ' + position.coords.longitude);
    console.log('Accuracy: ' + position.coords.accuracy);
    if (position.coords.accuracy <= desiredLocAccuracy) {
      usePosition();
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
    dismissGSModal();
    answeredLocQues = true;
    useIPAddr();
  }
}

function usePosition() {
  if (socket.position != null) {
    socket.emit('Use loc info', socket.clientName, socket.clientId, socket.position, ipAddress);
  }
}

// Runs when location cannot be obtained.
function useIPAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientId, ipAddress);
}