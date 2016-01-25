var logger = require('../utils/logger');
var shell = require('./shell');

var clients = {};

// Handle socket interactions
var start = function(http, options) {
  var io = require('socket.io')(http, options.socket);

  // Handle connection
  io.on('connection', function(socket) {
    var id = socket.id;

    logger.info("[socket] %s connected", id);
    clients[id] = socket;

    // Process "shell" command
    socket.on('command', function(command) {
      logger.info("[socket] %s sent command '%s'", id, command);
      clients[id] && clients[id].emit('response', {
        command: command,
        response: shell.process(command, id)
      })
    });

    // Handle disconnenct
    socket.on('disconnect', function(socket) {
      logger.info("[socket] %s disconnected", id);
      delete clients[id];
    });
  });
};

module.exports = {
  start: start
};
