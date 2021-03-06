/*
 * location.js
 * ----------------------------------------
 * FILE DESCRIPTION HERE
 * 
 */

/*
 * Function: useIpAddr()
 * FUNCTION DESCRIPTION HERE
 * 
 */
function useIpAddr() {
  socket.emit('Use ip info', socket.clientName, socket.clientId, ipAddress);
  alert('Your service may be affected because your location could not be determined accurately enough.')
}

/*
 * Function: useLocInfo()
 * FUNCTION DESCRIPTION HERE
 * 
 */
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

/*
 * Function: positionSuccess()
 * FUNCTION DESCRIPTION HERE
 * 
 */
function positionSuccess(pos) {
  changeGSToLoading();
  numFuncCalls1++;
  position = pos
  console.log('Your position became more accurate!');
  setTimeout(function() {
    numFuncCalls2++;
    if (numFuncCalls1 == numFuncCalls2) {
      useLocInfo();
      navigator.geolocation.clearWatch(watchId);
    }
  }, timeForAccuracy);
}

/*
 * Function: positionError()
 * FUNCTION DESCRIPTION HERE
 * 
 */
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