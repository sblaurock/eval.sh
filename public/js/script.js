(($, io, _) => {
  const options = {
    debug: false,
    space: '&nbsp;',
    classes: {
      input: 'input',
      line: 'line',
      character: 'character',
      animated: 'animated',
      animatedIn: 'in',
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
      title: 'about',
      action: 'cat about'
    },
    {
      type: 'action',
      title: 'experience',
      action: 'cat experience'
    },
    {
      type: 'action',
      title: 'projects',
      action: 'cat projects'
    },
    {
      type: 'action',
      title: 'photography',
      action: 'cat photography'
    },
    {
      type: 'link',
      title: 'github',
      link: 'https://github.com/sblaurock'
    },
    {
      type: 'link',
      title: 'linkedin',
      link: 'https://www.linkedin.com/in/sblaurock'
    },
    {
      type: 'link',
      title: 'resume',
      link: 'https://drive.google.com/open?id=1DnoYmlobyD3qwJvoTdXqKSE1TIFYnZoN'
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

      const spaced = string.replace(/\n/g, '<br>').replace(/\t/g, options.space.repeat(4));
      const spacedNode = $(`<span>${spaced}</span>`).get(0);

      // Recursively wrap all text nodes characters in a class so they can be animated
      const recursiveReplace = (node) => {
        if (node.nodeType === 3) {
          const value = node.nodeValue.split('').join(`</span><span class="${options.classes.animated}">`);
          const classified = $(`<span><span class="${options.classes.animated}">${value}</span></span>`);

          node.parentNode.replaceChild(classified.get(0), node);
        } else if (node.nodeType === 1) {
          $(node).contents().each(function each() {
            recursiveReplace(this);
          });
        }
      };

      recursiveReplace(spacedNode);

      return spacedNode.outerHTML;
    };

    return {
      // Clear "screen"
      clear: () => {
        elements.screen.html('');
        Output.write('');
      },

      // Write text to "screen"
      write: (string, command, animate = true) => {
        let index = 0;
        const formatted = format(string);
        const date = (new Date()).toLocaleTimeString();
        const timestamp = (command ? `<div class="${options.classes.timestamp} ${options.classes.text.comment}">${date}</div>` : '');
        const contents = $(`<div class="${options.classes.line} ${command ? ` ${options.classes.command} ` : ''}">${formatted} ${timestamp}</div>`);
        const input = $(`<div class="${options.classes.input}"></div>`);

        $(`.${options.classes.input}`).remove();

        if (animate) {
          elements.screen.append(contents);

          const animated = contents.find(`.${options.classes.animated}`);

          (function loop() {
            setTimeout(() => {
              $(animated[index]).addClass(options.classes.animatedIn);

              index++;

              if (index !== animated.length) {
                loop();
              }
            }, 0);
          }());
        } else {
          contents.find(`.${options.classes.animated}`).addClass(options.classes.animatedIn);
          elements.screen.append(contents);
        }

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
          markup += `<a href="${item.link || '#'}" data-action="${item.action || ''}" data-title="${item.title || ''}" rel="nofollow" target="_blank">${item.title}</a>\t`;
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

    return {
      // Bind events
      bind: () => {
        // Listen for screen scroll
        elements.screen.bind('mousewheel', _.throttle(function(e) {
          const lineHeight = $('.' + options.classes.line).last().height();

          if (e.originalEvent.wheelDelta / 120 > 0) {
            elements.screen.scrollTop(elements.screen.scrollTop() - lineHeight);
          } else {
            elements.screen.scrollTop(elements.screen.scrollTop() + lineHeight);
          }
        }, 30));

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
            Output.write(`<span class="${options.classes.text.highlight}">${command}</span>`, true, false);

            if (commandCharCount) {
              Shell.process(command);
            }

            Stack.push(command);
            Stack.reset();
          }

          // Ctrl-c - submit empty command
          if (e.ctrlKey && charCode === 3) {
            Output.write(`<span class="${options.classes.text.highlight}">${command}</span>`, true, false);
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
          const title = element.data('title');

          if (action) {
            event.preventDefault();
            Output.write(`<span class="${options.classes.text.highlight}">${action}</span>`, true, false);
            Shell.process(action);

            window.history.replaceState({}, title, `/${title}`);
          }
        });
      }
    };
  })();

  // Handle window location
  const Location = {
    process: () => {
      if (window.app && window.app.directive) {
        const match = _.find(menu, {
          type: 'action',
          title: window.app.directive
        });

        if (match && match.action) {
          Output.write(`<span class="${options.classes.text.highlight}">${match.action}</span>`, true, false);
          Shell.process(match.action);
        } else {
          Shell.process('menu');
        }
      } else {
        Shell.process('menu');
      }
    }
  };

  // Initialize
  Events.bind();
  Output.write('');
  Socket.connect();
  Location.process();
  Socket.listen('response', (data) => {
    if (data.response === null) {
      Output.write(`<strong>${data.command}</strong>: command not found`);
    } else {
      Output.write(data.response);
    }
  });
})(window.jQuery, window.io, window._);
