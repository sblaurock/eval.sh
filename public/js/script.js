(function() {
  var options = {
    debug: false,
    classes: {
      input: 'input',
      line: 'line',
      character: 'character',
      command: 'command',
      active: 'active',
      timestamp: 'timestamp',
      text: {
	comment: 'text-comment',
	highlight: 'text-highlight'
      }
    }
  };

  var elements = {
    document: $(document),
    screen: $('.screen')
  };

  // Log to console
  var Log = {
    // Write log entry
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
      // Push a command to stack
      push: function(string) {
	current++;
	stack.push(string);
      },

      // Reset current stack value
      reset: function() {
	current = stack.length;
      },

      // Get previous stack value
      prev: function() {
	if(current === null) {
	  current = stack.length - 1;
	} else if(current) {
	  current--;
	}

	return stack[current];
      },

      // Get next stack value
      next: function() {
	if(current < stack.length) {
	  current++;
	}

	return stack[current];
      }
    }
  }();

  // Handle "shell"
  var Shell = function() {
    var map = {
      'clear': function() {
	Output.clear();
      }
    };

    return {
      // Process command
      process: function(command) {
	if(!map[command]) {
	  Output.write(command + ': command not found');
	} else {
	  map[command]();
	}
      }
    }
  }();

  // Handle events
  var Events = function() {
    var typing = null;
    var typingBuffer = 500;

    return {
      // Bind events
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

	  // Debounce typing animation pause
	  clearTimeout(typing);
	  typing = setTimeout(function() {
	    input.removeClass(options.classes.active);
	  }, typingBuffer);

	  input.addClass(options.classes.active);
	  input.append(contents);

	  // Enter - submit command
	  if(charCode === 13) {
	    Output.write('<span class="' + options.classes.text.highlight + '">' + command + '</span>', true);

	    if(commandCharCount) {
	      Shell.process(command);
	    }

	    Stack.push(command);
	    Stack.reset();
	  }

	  // Ctrl-c - submit empty command
	  if(e.ctrlKey && charCode === 3) {
	    Output.write('<span class="' + options.classes.text.highlight + '">' + command + '</span>', true);
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

  // Handle "screen"
  var Output = function() {
    return {
      // Clear "screen"
      clear: function() {
	elements.screen.html('');
	Output.write('');
      },

      // Write text to "screen"
      write: function(string, command) {
	var date = (new Date()).toLocaleTimeString();
	var timestamp = (command ? '<div class="' + options.classes.timestamp + ' ' + options.classes.text.comment + '">' + date + '</div>' : '');
	var contents = $('<div class="' + options.classes.line + (command ? ' ' + options.classes.command : '') + '">' + string + timestamp + '</div>');
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
  Output.write('');
}());
