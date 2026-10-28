import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = process.env.PORT || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`[AKFA API] Server running at http://localhost:${port}`);
  console.log(`[AKFA API] Health endpoint at http://localhost:${port}/api/health`);
});
