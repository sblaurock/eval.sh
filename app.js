// Initialize New Relic
require('newrelic');

// Application configuration
var options = {
  port: 8080,
  socket: {
    serveClient: false
  }
};

// Dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var nunjucks = require('nunjucks');
var system = require('./utils/system');
var logger = require('./utils/logger');
var socket = require('./components/socket');
var geoip = require('geoip-lite');

system.guardUID();
socket.start(http, options);
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set('port', (process.env.PORT || options.port));

// Setup Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});

app.get('/', function(req, res) {
  var ip = (req.ip === '::1' ? null : req.ip);
  var name = (req.ip === '::1' ? 'developer' : 'guest');
  var geo = (ip ? geoip.lookup(ip) : null);

  res.render('index.html', {
    user: {
      ip: (req.ip === '::1' ? 'localhost' : req.ip),
      name: 'user',
      location: geo && geo.region + ' ' + geo.country
    }
  });
});

http.listen(app.get('port'), function() {
  logger.info('Server listening on port ' + app.get('port'));
});
