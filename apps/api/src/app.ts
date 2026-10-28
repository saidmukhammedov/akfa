import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API routes
  app.use('/api', routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
