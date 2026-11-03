import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import path from 'path';

const VITE_PORT = 4227;
const LOCAL_URL = `http://127.0.0.1:${VITE_PORT}`;
const ARTIFACTS_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startVitePreview() {
  const child = spawn('npx', ['vite', 'preview', '--port', String(VITE_PORT), '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve('apps/web'),
    shell: true,
    stdio: 'pipe',
  });

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(LOCAL_URL);
      if (res.ok) {
        return child;
      }
    } catch {}
    await wait(500);
  }
  throw new Error('Vite preview failed to start in time');
}

async function run() {
  let previewProcess = null;
  let browser = null;

  try {
    previewProcess = await startVitePreview();

    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();
    await page.goto(LOCAL_URL, { waitUntil: 'domcontentloaded' });

    // Login via UI form
    const userInput = page.locator('input[type="text"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await userInput.isVisible()) {
      await userInput.fill('admin');
      await passInput.fill('987654321');
      await page.locator('button[type="submit"]').click();
      await wait(1000);
    }

    const shotPath = `${ARTIFACTS_DIR}/mobile_compact_navbar_preview.png`;
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('✓ Successfully captured compact navbar screenshot to:', shotPath);
  } finally {
    if (browser) await browser.close();
    if (previewProcess) previewProcess.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
