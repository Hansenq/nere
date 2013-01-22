[nere](http://www.nereby.com/)
====

A location-based chat application written with node.js and socket.io.
----

# Use
nere is a web application that automatically creates chatrooms based on your physical location. 

The client's location is given by the browsers using the `navigator.geolocation` HTML 5 specification. Thus this app will not work in all browers (especially non-modern ones). However, it is designed to revert to using IP address if the location cannot be accurately determined to be within 100 m.

# Development
nere was developed with node.js and socket.io using the Express 3 and Jade frameworks. The application is hosted on Heroku.

# Authors
nere was developed by Ray Zhou and Hansen Qian over winter break 2012!