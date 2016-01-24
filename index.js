// Initialize New Relic
require('newrelic');

// Application configuration
var options = {
  port: 8080
};

// Dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var system = require('./utils/system');
var nunjucks = require('nunjucks');

system.guardUID();
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
  res.render('index.html');
});

app.listen(app.get('port'), function() {
  console.log('Server listening on port', app.get('port'));
});
