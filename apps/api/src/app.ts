import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  const rawClientUrl = process.env.CLIENT_URL || '';
  const configuredOrigins = rawClientUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ...configuredOrigins,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // Mount API routes
  app.use('/api', routes);

  // 404 handler for unmatched API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint topilmadi',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
