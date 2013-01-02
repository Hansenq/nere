
var socket.posLatitude = -1, 
    socket.posLongitude = -1, 
    socket.posAccuracy = -1;
var desiredLocAccuracy = 100, 
    posIntervalTime = 10000, 
    geohashDigitAccuracy = 8;   // 6 = 610m, 7 = 76m, 8 = 19m

function positionSuccess(position) {
  socket.posLatitude = position.coords.latitude;
  socket.posLongitude = position.coords.longitude;
  socket.posAccuracy = position.coords.accuracy;
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
    socket.emit('Send loc info', socket.posLatitude, socket.posLongitude);
  }

}

// Runs when location cannot be obtained.
function useIPAddr() {

}



if (navigator.geolocation) {
  var watchId = navigator.geolocation.watchPosition(
    positionSuccess, 
    positionError,
    {
      enableHighAccuracy: true;
    }
  );
  while (socket.posAccuracy != -1 && socket.posAccuracy < desiredLocAccuracy) {
    navigator.geolocation.clearWatch(watchId);
  }
  setTimeout(function() {
    navigator.geolocation.clearWatch(watchId);
    usePosition();
  }, 5000);
};