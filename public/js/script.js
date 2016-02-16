(() => {
  const OPTIONS = {
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

  let elements = {
    document: $(document),
    screen: $('.screen')
  };

  // Log to console
  let Log = {
    // Write log entry
    write: (string) => {
      if(OPTIONS.debug) {
	console.log(string);
      }
    }
  };

  // Handle "screen"
  let Output = (() => {
    // Format output string
    let format = (string = null) => {
      if(!string || typeof string !== "string") {
	return '';
      }

      return string.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    };

    return {
      // Clear "screen"
      clear: () => {
	elements.screen.html('');
	Output.write('');
      },

      // Write text to "screen"
      write: (string, command) => {
	string = format(string);

	let date = (new Date()).toLocaleTimeString();
	let timestamp = (command ? `<div class="${OPTIONS.classes.timestamp} ${OPTIONS.classes.text.comment$}">${date}</div>` : '');
	let contents = $(`<div class="${OPTIONS.classes.line} ${command ? ' ' + OPTIONS.classes.command : ''}">${string} ${timestamp}</div>`);
	let input = $(`<div class="${OPTIONS.classes.input}"></div>`);

	$('.' + OPTIONS.classes.input).remove();
	elements.screen.append(contents);
	elements.screen.append(input);
	elements.screen.scrollTop(elements.screen[0].scrollHeight);
      }
    };
  })();

  // Handle socket related events
  let Socket = (() => {
    let reference;

    return {
      // Connect to socket server
      connect: () => {
	reference = io(window.location.origin);

	reference.on('connect_error', () => {
	  Log.write('Socket server could not be contacted');
	});

	reference.on('connect', () => {
	  Log.write('Connected to socket server');
	});

	reference.on('disconnect', () => {
	  Log.write('Disconnected from socket server');
	});
      },

      // Send an event to socket server
      send: (type, data) => {
	reference.emit(type, data);
      },

      // Listen for event from socket server
      listen: (type, callback) => {
	reference.on(type, (data) => {
	  if(typeof callback === "function") {
	    callback(data);
	  }
	});
      },

      // Return a reference to socket session
      get: () => {
	return reference;
      }
    };
  })();

  // Command stack
  let Stack = (() => {
    let stack = [];
    let current = null;

    return {
      // Push a command to stack
      push: (string = null) => {
	current++;
	stack.push(string);
      },

      // Reset current stack value
      reset: () => {
	current = stack.length;
      },

      // Get previous stack value
      prev: () => {
	if(current === null) {
	  current = stack.length - 1;
	} else if(current) {
	  current--;
	}

	return stack[current];
      },

      // Get next stack value
      next: () => {
	if(current < stack.length) {
	  current++;
	}

	return stack[current];
      }
    };
  })();

  // Handle "shell"
  let Shell = (() => {
    let map = {
      'clear': () => {
	Output.clear();
      },
      'help': () => {
	Socket.send('command', 'cat help');
      },
      '?': () => {
	Socket.send('command', 'cat help');
      },
      'whoami': () => {
	if(window.app && window.app.user) {
	  Output.write(`${window.app.user.name}@${window.app.user.ip} / ${window.app.user.location}`);
	}
      }
    };

    return {
      // Process command
      process: (command) => {
	if(!map[command]) {
	  Socket.send('command', command);
	} else {
	  map[command]();
	}
      }
    };
  })();

  // Handle events
  let Events = (() => {
    let typing = null;
    let typingBuffer = 500;
    let lineHeight = 36;

    return {
      // Bind events
      bind: () => {
	// Listen for screen scroll
	elements.screen.bind('mousewheel', (e) => {
	  if(e.originalEvent.wheelDelta / 120 > 0) {
	    elements.screen.scrollTop(elements.screen.scrollTop() - lineHeight);
	  } else {
	    elements.screen.scrollTop(elements.screen.scrollTop() + lineHeight);
	  }
	});

	// Listen for keypress, write to input
	elements.document.keypress((e) => {
	  let charCode = e.which;
	  let input = $('.' + OPTIONS.classes.input);
	  let command = input.text();
	  let commandCharCount = command.length;
	  let contents = $(`<span class="${OPTIONS.classes.character}">${String.fromCharCode(charCode)}</span>`);

	  // Debounce typing animation pause
	  clearTimeout(typing);
	  typing = setTimeout(() => {
	    input.removeClass(OPTIONS.classes.active);
	  }, typingBuffer);

	  input.addClass(OPTIONS.classes.active);
	  input.append(contents);

	  // Enter - submit command
	  if(charCode === 13) {
	    Output.write(`<span class="${OPTIONS.classes.text.highlight}">${command}</span>`, true);

	    if(commandCharCount) {
	      Shell.process(command);
	    }

	    Stack.push(command);
	    Stack.reset();
	  }

	  // Ctrl-c - submit empty command
	  if(e.ctrlKey && charCode === 3) {
	    Output.write(`<span class="${OPTIONS.classes.text.highlight}">${command}</span>`, true);
	  }
	});

	elements.document.keydown((e) => {
	  let nodeName = e.target.nodeName.toLowerCase();
	  let charCode = e.which;

	  // Up - recall command
	  if(e.which === 38) {
	    let prevCommand = Stack.prev().split('').join(`</span><span class="${OPTIONS.classes.character}">`);

	    if(prevCommand) {
	      $('.' + OPTIONS.classes.input).html(`<span class="${OPTIONS.classes.character}">${prevCommand}</span>`);
	    }
	  }

	  // Down - recall command
	  if(e.which === 40) {
	    let nextCommand = Stack.next().split('').join(`</span><span class="${OPTIONS.classes.character}">`);

	    if(nextCommand) {
	      $('.' + OPTIONS.classes.input).html(`<span class="${OPTIONS.classes.character}">${nextCommand}</span>`);
	    }
	  }

	  // Tab and backspace - prevent default actions
	  if(e.which === 8 || e.which === 9) {
	    if((nodeName === 'input' && e.target.type === 'text') || nodeName === 'textarea') {
	    } else {
	      // Backspace
	      if(e.which === 8) {
		$('.' + OPTIONS.classes.character).last().remove();
	      }

	      e.preventDefault();
	    }
	  }
	});
      }
    };
  })();

  // Initialize
  Events.bind();
  Output.write('Type "help" to get started');
  Socket.connect();
  Socket.listen('response', (data) => {
    if(data.response === null) {
      Output.write(`${data.command}: command not found`);
    } else {
      Output.write(data.response);
    }
  });
})();
