// Correct height of users div (so that scrollbar works correctly)
function setUsersHeight() {

  // Initialize height to 100%
  $('.sidebar .users').height($(document).height());

  // Correct height
  $('.sidebar .users').height($('.sidebar .users').height() - 232);

}

// Set users height right when the page begins loading.
setUsersHeight();

// Recompute users height whenever client changes window size
// Use clearTimeout to prevent multiple firings of resize()
var id;
$(window).resize(function() {
  clearTimeout(id);
  id = setTimeout(setUsersHeight, 500);
});
