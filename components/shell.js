var logger = require("../utils/logger");

var map = {
  'help': function() {
    return 'We all could use a little...'
  },
  'whoami': function(data) {
    return data.id
  }
};

// Process "shell" command
var process = function(command, id) {
  if(map[command]) {
    return map[command]({
      id: id
    });
  } else {
    return null;
  }
};

module.exports = {
  process: process
};
