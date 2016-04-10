(($, io) => {
  const options = {
    debug: false,
    space: '&nbsp;',
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

  // Menu items
  const menu = [
    {
      type: 'action',
      title: 'About',
      action: 'cat about'
    },
    {
      type: 'link',
      title: 'Github',
      link: 'https://github.com/sblaurock'
    },
    {
      type: 'link',
      title: 'Twitter',
      link: 'https://twitter.com/sblaurock'
    },
    {
      type: 'link',
      title: 'LinkedIn',
      link: 'https://www.linkedin.com/in/sblaurock'
    }
  ];

  const elements = {
    document: $(document),
    screen: $('.screen')
  };

  // Log to console
  const Log = {
    // Write log entry
    write: (string) => {
      if (options.debug) {
        console.log(string);
      }
    }
  };

  // Handle "screen"
  const Output = (() => {
    // Format output string
    const format = (string = null) => {
      if (!string || typeof string !== 'string') {
        return '';
      }

      return string.replace(/\n/g, '<br>').replace(/\t/g, options.space.repeat(4));
    };

    return {
      // Clear "screen"
      clear: () => {
        elements.screen.html('');
        Output.write('');
      },

      // Write text to "screen"
      write: (string, command) => {
        const formatted = format(string);
        const date = (new Date()).toLocaleTimeString();
        const timestamp = (command ? `<div class="${options.classes.timestamp} ${options.classes.text.comment}">${date}</div>` : '');
        const contents = $(`<div class="${options.classes.line} ${command ? ` ${options.classes.command} ` : ''}">${formatted} ${timestamp}</div>`);
        const input = $(`<div class="${options.classes.input}"></div>`);

        $(`.${options.classes.input}`).remove();
        elements.screen.append(contents);
        elements.screen.append(input);
        elements.screen.scrollTop(elements.screen[0].scrollHeight);
      }
    };
  })();

  // Handle socket related events
  const Socket = (() => {
    let reference;

    return {
      // Connect to socket server
      connect() {
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
      send(type, data) {
        reference.emit(type, data);
      },

      // Listen for event from socket server
      listen: (type, callback) => {
        reference.on(type, (data) => {
          if (typeof callback === 'function') {
            callback(data);
          }
        });
      },

      // Return a reference to socket session
      get() {
        return reference;
      }
    };
  })();

  // Command stack
  const Stack = (() => {
    const stack = [];
    let current = null;

    return {
      // Push a command to stack
      push(string = null) {
        current++;
        stack.push(string);
      },

      // Reset current stack value
      reset: () => {
        current = stack.length;
      },

      // Get previous stack value
      prev: () => {
        if (current === null) {
          current = stack.length - 1;
        } else if (current) {
          current--;
        }

        return stack[current];
      },

      // Get next stack value
      next: () => {
        if (current < stack.length) {
          current++;
        }

        return stack[current];
      }
    };
  })();

  // Handle "shell"
  const Shell = (() => {
    const map = {
      // Clear "screen"
      clear() {
        Output.clear();
      },

      // Retrieve contents of "help" file
      help() {
        Socket.send('command', 'cat help');
      },

      // Retrieve contents of "help" file
      '?'() {
        Socket.send('command', 'cat help');
      },

      // Print user information to "screen"
      whoami() {
        if (window.app && window.app.user) {
          Output.write(`${window.app.user.name}@${window.app.user.ip} / ${window.app.user.location}`);
        }
      },

      // Print application menu to screen
      menu() {
        let markup = '';

        menu.forEach((item) => {
          markup += `<a href="${item.link || '#'}" data-action="${item.action || ''}" rel="nofollow" target="_blank">${item.title}</a>\t`;
        });

        Output.write(markup);
      }
    };

    return {
      // Process command
      process: (command) => {
        if (!map[command]) {
          Socket.send('command', command);
        } else {
          map[command]();
        }
      }
    };
  })();

  // Handle events
  const Events = (() => {
    let typing = null;
    const typingBuffer = 500;
    const lineHeight = 36;

    return {
      // Bind events
      bind: () => {
        // Listen for screen scroll
        elements.screen.bind('mousewheel', (e) => {
          if (e.originalEvent.wheelDelta / 120 > 0) {
            elements.screen.scrollTop(elements.screen.scrollTop() - lineHeight);
          } else {
            elements.screen.scrollTop(elements.screen.scrollTop() + lineHeight);
          }
        });

        // Listen for keypress, write to input
        elements.document.keypress((e) => {
          const charCode = e.which;
          const input = $(`.${options.classes.input}`);
          const command = input.text().replace(/\s/g, ' ');
          const commandCharCount = command.length;
          const character = (charCode === 32 ? options.space : String.fromCharCode(charCode));
          const contents = $(`<span class="${options.classes.character}">${character}</span>`);

          // Debounce typing animation pause
          clearTimeout(typing);
          typing = setTimeout(() => {
            input.removeClass(options.classes.active);
          }, typingBuffer);

          input.addClass(options.classes.active);
          input.append(contents);

          // Enter - submit command
          if (charCode === 13) {
            Output.write(`<span class="${options.classes.text.highlight}">${command}</span>`, true);

            if (commandCharCount) {
              Shell.process(command);
            }

            Stack.push(command);
            Stack.reset();
          }

          // Ctrl-c - submit empty command
          if (e.ctrlKey && charCode === 3) {
            Output.write(`<span class="${options.classes.text.highlight}">${command}</span>`, true);
          }
        });

        elements.document.keydown((e) => {
          const nodeName = e.target.nodeName.toLowerCase();
          const charCode = e.which;

          $('a').blur();

          // Up and down - recall command from history
          if (charCode === 38 || charCode === 40) {
            let command = '';

            if (charCode === 38) {
              command = Stack.prev();
            } else if (charCode === 40) {
              command = Stack.next();
            }

            if (command) {
              const formatted = command.split('').join(`</span><span class="${options.classes.character}">`);

              $(`.${options.classes.input}`).html(`<span class="${options.classes.character}">${formatted}</span>`);
            }
          }

          // Tab and backspace - prevent default actions
          if (e.which === 8 || e.which === 9) {
            if (!(nodeName === 'input' && e.target.type === 'text') && nodeName !== 'textarea') {
              // Backspace
              if (e.which === 8) {
                $(`.${options.classes.character}`).last().remove();
              }

              e.preventDefault();
            }
          }
        });

        elements.document.on('click', 'a', function click(event) {
          const element = $(this);
          const action = element.data('action');

          if(action) {
            event.preventDefault();

            Shell.process(action);
          }
        });
      }
    };
  })();

  // Initialize
  Events.bind();
  Shell.process('menu');
  Output.write('');
  Socket.connect();
  Socket.listen('response', (data) => {
    if (data.response === null) {
      Output.write(`${data.command}: command not found`);
    } else {
      Output.write(data.response);
    }
  });
})(window.jQuery, window.io);
