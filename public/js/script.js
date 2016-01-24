(function() {
  var Socket = function() {
    var reference;

    return {
      // Connect to socket server
      connect: function() {
	reference = io(window.location.hostname);

	reference.on('connect_error', function() {
	  console.log('Socket server could not be contacted');
	});

	reference.on('connect', function() {
	  console.log('Connected to socket server');
	});

	reference.on('disconnect', function() {
	  console.log('Disconnected from socket server');
	});
      },

      // Send an event to socket server
      send: function(type, data) {
	reference.emit(type, data);
      },

      // Listen for event from socket server
      listen: function(type, callback) {
	reference.on(type, function(data) {
	  if(typeof callback === "function") {
	    callback(data);
	  }
	});
      },

      // Return a reference to socket session
      get: function() {
	return reference;
      }
    };
  }();

  Socket.connect();
}());
