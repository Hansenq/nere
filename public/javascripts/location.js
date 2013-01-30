var desiredLocAccuracy = 100; // meters
var positionTimeout = 15000; // time to wait for location response before defaulting.
var answeredLocQues = false;
var numFuncCalls1 = 0;
var numFuncCalls2 = 0;
var timeForAccuracy = 3000;
var position = null;

// Runs when location cannot be obtained.
function useIpAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientId, ipAddress);
  alert('Your service may be affected because your location could not be determined accurately enough.')
}

function useLocInfo() {
  if (answeredLocQues === false) {
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

function positionSuccess(pos) {
  changeGSToLoading();
  numFuncCalls1++;
  position = pos
  console.log('Your position became more accurate!');
  setTimeout(function() {
    numFuncCalls2++;
    if (numFuncCalls1 === numFuncCalls2) {
      useLocInfo();
      navigator.geolocation.clearWatch(watchId);
    }
  }, timeForAccuracy);
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