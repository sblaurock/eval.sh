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
var requestIp = require('request-ip');

system.guardUID();
socket.start(http, options);
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(requestIp.mw())
app.set('port', (process.env.PORT || options.port));

// Setup Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});

app.get('/', function(req, res) {
  var ipv4 = req.clientIp;
  var name = (req.ip === '::1' ? 'developer' : 'guest');
  var geo = (ipv4 ? geoip.lookup(ipv4) : null);

  res.render('index.html', {
    user: {
      ip: (req.ip === '::1' ? 'localhost' : ipv4),
      name: 'user',
      location: geo && geo.region + ' ' + geo.country
    }
  });
});

http.listen(app.get('port'), function() {
  logger.info('Server listening on port ' + app.get('port'));
});
