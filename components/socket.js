import logger from '../utils/logger';
import * as Shell from './shell';

const clients = {};

// Handle socket interactions
export function start(http, options) {
  const io = require('socket.io')(http, options.socket);

  // Handle connection
  io.on('connection', (socket) => {
    const id = socket.id;

    logger.info(`[socket] ${id} connected`);
    clients[id] = socket;

    // Process "shell" command
    socket.on('command', (command) => {
      logger.info(`[socket] ${id} sent command '${command}'`);
      clients[id].emit('response', {
        command,
        response: Shell.process(command, id)
      });
    });

    // Handle disconnenct
    socket.on('disconnect', () => {
      logger.info(`[socket] ${id} disconnected`);
      delete clients[id];
    });
  });
}
