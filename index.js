// Application configuration
var options = {
  port: 8080
};

// Dependencies
var app = require('express')();
var bodyParser = require('body-parser');
var system = require("./utils/system");
var newrelic = require('newrelic');

system.guardUID();
app.use(bodyParser.json());

app.set('port', (process.env.PORT || options.port));

app.get('/', function(req, res) {
  res.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log('Server listening on port', app.get('port'));
});
