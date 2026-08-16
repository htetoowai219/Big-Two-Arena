import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { NODE_ENV, PORT } from './config/env';

async function startServer() {
  const { app, server } = createApp();

  if (NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Attempt Mongo; on failure the server keeps running in-memory only.
  await connectDatabase();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Big Two server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown for container lifecycles (Render/Railway/Fly send
  // SIGTERM on deploy/stop). Close the WebSocket and HTTP servers so in-flight
  // connections are released cleanly; Mongo snapshots already persist rooms.
  const shutdown = () => {
    console.log('Shutting down...');
    server.close(() => process.exit(0));
    // Force-exit if sockets refuse to close (e.g. idle WS connections).
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
