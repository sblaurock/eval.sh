var logger = require('../utils/logger');
var fs = require('fs');

var options = {
  filesystem: './files'
};

// Prevent exploits
var sanitize = function(string) {
  // Poision null byte
  if(string.indexOf('\0') !== -1) {
    return '';
  }

  // Force alphanumerics
  return string.replace(/\W+/g, " ");
};

// Commands
var map = {
  'whoami': function(data) {
    return data.id
  },
  'ls': function() {
    return fs.readdirSync(options.filesystem).join('\n');
  },
  'cat': function(data) {
    var file = data.args && data.args[0];

    // Ensure a file was passed as an argument
    if(!file) {
      return '';
    }

    file = sanitize(file);

    // Ensure file exists
    try {
      fs.statSync(options.filesystem + '/' + file);

      return fs.readFileSync(options.filesystem + '/' + file, 'utf8');
    } catch (e) {
      return file + ': No such file or directory';
    }
  }
};

// Process "shell" command
var process = function(command, id) {
  var pieces = command.split(' ');
  var args = [];

  command = pieces[0];
  args = pieces.slice(1);

  if(map[command]) {
    return map[command]({
      id: id,
      args: args
    });
  } else {
    return null;
  }
};

module.exports = {
  process: process
};
