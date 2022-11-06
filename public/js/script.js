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

  const welcomeContent = `<span class="text-comment">// 👋 welcome to the 🏠 of @sblaurock\n\n</span>`;

  // Menu items
  const menu = [
    {
      type: 'action',
      title: 'about',
      action: 'cat about',
      showInMobile: true
    },
    {
      type: 'action',
      title: 'experience',
      action: 'cat experience',
      showInMobile: false
    },
    {
      type: 'action',
      title: 'projects',
      action: 'cat projects',
      showInMobile: true
    },
    {
      type: 'link',
      title: 'travels',
      link: 'https://www.flickr.com/sblaurock',
      showInMobile: true
    },
    {
      type: 'link',
      title: 'github',
      link: 'https://github.com/sblaurock',
      showInMobile: true
    },
    {
      type: 'link',
      title: 'linkedin',
      link: 'https://www.linkedin.com/in/sblaurock',
      showInMobile: true
    },
    {
      type: 'link',
      title: 'resume',
      link: 'https://drive.google.com/open?id=156WOQOj_Oatt_Of_skoIPd1KlMaREPM7',
      showInMobile: true
    }
  ];

  const elements = {
    document: $(document),
    screen: $('.screen'),
    body: $('body'),
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
    let isCurrentlyAnimating = false;

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
        Output.write('', false, false);
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

          isCurrentlyAnimating = true;

          (function loop() {
            setTimeout(() => {
              $(animated[index]).addClass(options.classes.animatedIn);

              index++;

              if (index !== animated.length) {
                loop();
              } else {
                isCurrentlyAnimating = false;
              }
            }, 0);
          }());
        } else {
          contents.find(`.${options.classes.animated}`).addClass(options.classes.animatedIn);
          elements.screen.append(contents);
        }

        elements.screen.append(input);
        elements.screen.scrollTop(elements.screen[0].scrollHeight);
      },

      // Get status of current animation
      isCurrentlyAnimating: () => isCurrentlyAnimating,
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

      // Print application menu to "screen"
      menu() {
        const isMobile = Mobile.isMobile();
        let markup = '';
        let delimiter = isMobile ? '\n' : '\t';

        menu.forEach((item) => {
          if (!isMobile || (isMobile && item.showInMobile)) {
            markup += `<a href="${item.link || '#'}" data-action="${item.action || ''}" data-title="${item.title || ''}" rel="nofollow" target="_blank">${item.title}</a>${delimiter}`;
          }
        });

        if (isMobile) {
          markup += '\n';
        }

        Output.write(markup, false, false);
      },

      // "Deny access" and print message to "screen"
      'sudo'() {
          Output.write(`${window.app.user.name} is not in the sudoers file. This incident will be reported.`);
      },

      // "Deny access" and print message to "screen"
      'sudo su'() {
          Output.write(`${window.app.user.name} is not in the sudoers file. This incident will be reported.`);
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
          const lineHeight = $('.' + options.classes.input).last().outerHeight();

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

            if (!Output.isCurrentlyAnimating()) {
              if (Mobile.isMobile()) {
                Output.clear();
                Shell.process('menu');
              }

              Output.write(`<span class="${options.classes.text.highlight}">${action}</span>`, true, false);
              Shell.process(action);

              window.history.replaceState({}, title, `/${title}`);
            }
          }
        });
      }
    };
  })();

  // Handle window location
  const Location = {
    process: () => {
      if (window.app && window.app.directive && !Mobile.isMobile()) {
        const match = _.find(menu, {
          type: 'action',
          title: window.app.directive
        });

        if (match && match.action) {
          Output.write(welcomeContent, false, false);
          Shell.process('menu');
          Output.write(`<span class="${options.classes.text.highlight}">${match.action}</span>`, true, false);
          Shell.process(match.action);
        } else {
          Output.write(welcomeContent, false, false);
          Shell.process('menu');
        }
      } else {
        Output.write(welcomeContent, false, false);
        Shell.process('menu');
      }
    }
  };

  // Handle mobile detection
  const Mobile = (() => {
    let isMobile = false;

    // Add class name to body to apply mobile styling
    return {
      process: () => {
        if ((window.navigator && window.navigator.userAgentData && window.navigator.userAgentData.mobile) || /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
          isMobile = true;

          elements.body.addClass('mobile');
        }
      },

      // Return boolean indicating if browser is operating in mobile environment
      isMobile: () => isMobile,
    };
  })();

  // Initialize
  Events.bind();
  Output.write('', false, false);
  Socket.connect();
  Mobile.process();
  Location.process();
  Socket.listen('response', (data) => {
    if (data.response === null) {
      Output.write(`<strong>${data.command}</strong>: command not found`);
    } else {
      Output.write(data.response);
    }
  });
})(window.jQuery, window.io, window._);
