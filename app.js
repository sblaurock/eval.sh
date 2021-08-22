// Application configuration
const options = {
  port: 8080,
  socket: {
    serveClient: false
  }
};

// Dependencies
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import nunjucks from 'nunjucks';
import logger from './utils/logger';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';
import * as Socket from './components/socket';
import * as System from './utils/system';
import enforce from 'express-sslify';

const app = express();
const server = new http.Server(app);

System.guardUID();
Socket.start(server, options);
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/public`));
app.use(requestIp.mw());
app.set('port', (process.env.PORT || options.port));

if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Setup Nunjucks
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});

app.get('/:directive*?', (req, res) => {
  const ipv4 = req.clientIp;
  const geo = (ipv4 ? geoip.lookup(ipv4) : null);

  res.render('index.html', {
    user: {
      ip: (req.ip === '::1' ? 'localhost' : ipv4),
      name: 'user',
      location: geo && `${geo.region} ${geo.country}`
    },
    directive: req.params.directive || ''
  });
});

server.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`);
});
