(function() {
  var options = {
    debug: false
  };

  var elements = {
    screen: $('.screen')
  };

  var Log = {
    write: function(string) {
      if(options.debug) {
	console.log(string);
      }
    }
  };

  var Socket = function() {
    var reference;

    return {
      // Connect to socket server
      connect: function() {
	reference = io(window.location.origin);

	reference.on('connect_error', function() {
	  Log.write('Socket server could not be contacted');
	});

	reference.on('connect', function() {
	  Log.write('Connected to socket server');
	  Output.write.line('Connected to socket');
	});

	reference.on('disconnect', function() {
	  Log.write('Disconnected from socket server');
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

  var Output = function() {
    return {
      write: {
	line: function(string) {
	  var contents = $('<div>' + string + '</div>');

	  elements.screen.append(contents);
	  elements.screen.scrollTop(elements.screen[0].scrollHeight);
	}
      }
    }
  }();

  Socket.connect();
}());
