var winston = require('winston');

// Define logger configuration
var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true
    })
  ],
  exitOnError: false
});

// Use logger in favor of native
console.log = logger.info;

module.exports = logger;
