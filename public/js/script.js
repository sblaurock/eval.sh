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

  // Command stack
  var Stack = function() {
    var stack = [];
    var current = null;

    return {
      push: function(string) {
	current++;
	stack.push(string);
      },
      reset: function() {
	current = stack.length;
      },
      prev: function() {
	if(current === null) {
	  current = stack.length - 1;
	} else if(current) {
	  current--;
	}

	return stack[current];
      },
      next: function() {
	if(current < stack.length) {
	  current++;
	}

	return stack[current];
      }
    }
  }();

  var Shell = function() {
    var map = {
      'clear': function() {
	Output.clear();
      }
    };

    return {
      process: function(command) {
	if(!map[command]) {
	  Output.write(command + ': command not found');
	} else {
	  map[command]();
	}
      }
    }
  }();

  // Bind events
  var Events = function() {
    return {
      bind: function() {
	// Listen for screen scroll
	elements.screen.bind('mousewheel', function(e) {
	  var lineHeight = 36;

	  if(e.originalEvent.wheelDelta / 120 > 0) {
	    elements.screen.scrollTop(elements.screen.scrollTop() - lineHeight);
	  } else {
	    elements.screen.scrollTop(elements.screen.scrollTop() + lineHeight);
	  }
	});

	// Listen for keypress, write to input
	elements.document.keypress(function(e) {
	  var charCode = e.which;
	  var input = $('.' + options.classes.input);
	  var command = input.text();
	  var commandCharCount = command.length;
	  var contents = $('<span class="' + options.classes.character + '">' + String.fromCharCode(charCode) + '</span>');

	  $('.' + options.classes.input).append(contents);

	  // Enter - submit command
	  if(charCode === 13) {
	    Output.write(command, true);

	    if(commandCharCount) {
	      Shell.process(command);
	    }

	    Stack.push(command);
	    Stack.reset();
	  }

	  // Ctrl-c - submit empty command
	  if(e.ctrlKey && charCode === 3) {
	    Output.write(command, true);
	  }
	});

	elements.document.keydown(function(e) {
	  var nodeName = e.target.nodeName.toLowerCase();
	  var charCode = e.which;

	  // Up - recall command
	  if(e.which === 38) {
	    $('.' + options.classes.input).html(Stack.prev());
	  }

	  // Down - recall command
	  if(e.which === 40) {
	    $('.' + options.classes.input).html(Stack.next());
	  }

	  // Tab and backspace - prevent default actions
	  if(e.which === 8 || e.which === 9) {
	    if((nodeName === 'input' && e.target.type === 'text') || nodeName === 'textarea') {
	    } else {
	      // Backspace
	      if(e.which === 8) {
		$('.' + options.classes.character).last().remove();
	      }

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
      clear: function() {
	elements.screen.html('');
	Output.write('');
      },
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
