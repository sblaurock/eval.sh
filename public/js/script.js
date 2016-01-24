(function() {
  var options = {
    debug: false,
    classes: {
      input: 'input',
      line: 'line',
      character: 'character',
      command: 'command'
    }
  };

  var elements = {
    document: $(document),
    screen: $('.screen')
  };

  // Log to console
  var Log = {
    write: function(string) {
      if(options.debug) {
	console.log(string);
      }
    }
  };

  // Handle socket related events
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
	  Output.write('Connected to socket');
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

  // Bind events
  var Events = function() {
    return {
      bind: function() {
	// Listen for keypress, write to input
	elements.document.keypress(function(event) {
	  var contents = null;

	  // Enter
	  if(event.which === 13) {
	    var command = $('.' + options.classes.input).html();

	    Output.write(command, true);
	    Output.write(command + ': command not found');
	  }

	  contents = $('<span class="' + options.classes.character + '">' + String.fromCharCode(event.which) + '</span>');

	  $('.' + options.classes.input).append(contents);
	});

	// Prevent backspace key from navigating to previous page
	elements.document.keydown(function(e) {
	  var nodeName = e.target.nodeName.toLowerCase();

	  if (e.which === 8) {
	    if ((nodeName === 'input' && e.target.type === 'text') || nodeName === 'textarea') {
	    } else {
	      $('.' + options.classes.character).last().remove();
	      e.preventDefault();
	    }
	  }
	});
      }
    };
  }();

  // Write text to "screen"
  var Output = function() {
    return {
      write: function(string, command) {
	var contents = $('<div class="' + options.classes.line + (command ? ' ' + options.classes.command : '') + '">' + string + '</div>');
	var input = $('<div class="' + options.classes.input + '"></div>');

	$('.' + options.classes.input).remove();
	elements.screen.append(contents);
	elements.screen.append(input);
	elements.screen.scrollTop(elements.screen[0].scrollHeight);
      }
    };
  }();

  Socket.connect();
  Events.bind();
}());
