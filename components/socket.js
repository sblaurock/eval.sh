var logger = require("../utils/logger");

var clients = {};

// Handle socket interactions
var start = function(http, options) {
  var io = require('socket.io')(http, options.socket);

  io.on('connection', function(socket) {
    var id = socket.id;

    console.log("Socket client '" + id + "' connected");
    clients[id] = socket;

    socket.on('disconnect', function(socket) {
      console.log("Socket client '" + id + "' disconnected");
      delete clients[id];
    });
  });
};

module.exports = {
  start: start
};
