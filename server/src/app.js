import cors from 'cors';
import express from 'express';

import { fileRoutes } from './routes/files.js';

export function createApp({ storage } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/files', fileRoutes({ storage }));

  // Fallback for unknown routes.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler: keeps every thrown error out of the client's way.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    const message = status >= 500 ? 'Something went wrong on the server' : err.message;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: message });
  });

  return app;
}