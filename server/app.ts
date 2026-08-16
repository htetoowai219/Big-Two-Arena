import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import apiRoutes from './routes';
import { onSocketConnection } from './sockets/connection';

export interface AppHandle {
  app: express.Express;
  server: http.Server;
}

// Creates the Express app, HTTP server, and WebSocket server. The Vite
// middleware / static file serving is attached by the entrypoint so it only
// loads in the right mode.
export function createApp(): AppHandle {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());
  app.use('/api', apiRoutes);

  wss.on('connection', onSocketConnection);

  return { app, server };
}
