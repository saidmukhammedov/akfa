import dotenv from 'dotenv';
import { createApp } from './app.js';
import { seedInitialOwnerIfMissing } from './services/auth.service.js';

dotenv.config();

const port = process.env.PORT || 4000;
const app = createApp();

async function start() {
  try {
    await seedInitialOwnerIfMissing();
  } catch (err) {
    console.warn('[AKFA Auth] Warning during initial seed check:', err);
  }

  app.listen(port, () => {
    console.log(`[AKFA API] Server running at http://localhost:${port}`);
    console.log(`[AKFA API] Health endpoint at http://localhost:${port}/api/health`);
  });
}

start();
