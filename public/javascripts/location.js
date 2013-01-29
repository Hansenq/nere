var desiredLocAccuracy = 100; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answeredLocQues = false;

// Runs when location cannot be obtained.
function useIpAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientId, ipAddress);
}

function positionSuccess(position) {
  if (answeredLocQues === false) {
    changeGSToLoading();
    answeredLocQues = true;
    socket.coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    }
    console.log('Location: ' + socket.coords.latitude + ', ' + socket.coords.longitude);
    console.log('Accuracy: ' + socket.coords.accuracy);
    if (socket.coords.accuracy <= desiredLocAccuracy) {
      socket.emit('Use loc info', socket.clientName, socket.clientId, socket.coords, ipAddress);
    } else {
      useIpAddr();
      messageAlert('Your location was not accurate enough; your IP Address was instead.', 'alert alert-info');
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
    useIpAddr();
  }
}