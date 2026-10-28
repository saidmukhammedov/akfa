import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import path from 'path';

const VITE_PORT = 4173;
const LOCAL_URL = `http://localhost:${VITE_PORT}`;
const ARTIFACTS_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startVitePreview() {
  console.log('Starting Vite preview server on port ' + VITE_PORT + '...');
  const child = spawn('npx', ['vite', 'preview', '--port', String(VITE_PORT), '--strictPort'], {
    cwd: path.resolve('apps/web'),
    shell: true,
    stdio: 'pipe',
  });

  child.stdout.on('data', (d) => process.stdout.write(`[vite-preview] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[vite-preview] ${d}`));

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(LOCAL_URL);
      if (res.ok) {
        console.log('✓ Vite preview server is ready!');
        return child;
      }
    } catch {
      // wait
    }
    await wait(500);
  }
  throw new Error('Vite preview failed to start in time');
}

async function main() {
  let previewProcess;
  try {
    previewProcess = await startVitePreview();

    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
    });

    try {
      // 1. Desktop Viewport (1280x800)
      console.log('Taking Desktop screenshot...');
      const desktopContext = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      });
      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto(LOCAL_URL, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(1000);

      const desktopScreenshot = `${ARTIFACTS_DIR}/glass_clay_desktop.png`;
      await desktopPage.screenshot({ path: desktopScreenshot });
      console.log(`✓ Desktop GlassClay screenshot saved to ${desktopScreenshot}`);

      // Navigate to Davomat on Desktop
      console.log('Navigating to Davomat on Desktop...');
      await desktopPage.getByRole('button', { name: 'Davomat', exact: true }).first().click();
      await desktopPage.waitForTimeout(600);
      const davomatScreenshot = `${ARTIFACTS_DIR}/glass_clay_davomat_desktop.png`;
      await desktopPage.screenshot({ path: davomatScreenshot });
      console.log(`✓ Desktop Davomat screenshot saved to ${davomatScreenshot}`);

      // 2. Mobile Viewport (390x844)
      console.log('Taking Mobile screenshot...');
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(LOCAL_URL, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(1000);

      const mobileScreenshot = `${ARTIFACTS_DIR}/glass_clay_mobile.png`;
      await mobilePage.screenshot({ path: mobileScreenshot });
      console.log(`✓ Mobile GlassClay screenshot saved to ${mobileScreenshot}`);

      // Navigate to Davomat on Mobile
      console.log('Navigating to Davomat on Mobile...');
      await mobilePage.getByRole('button', { name: 'Davomat', exact: true }).first().click();
      await mobilePage.waitForTimeout(600);
      const mobileDavomatScreenshot = `${ARTIFACTS_DIR}/glass_clay_davomat_mobile.png`;
      await mobilePage.screenshot({ path: mobileDavomatScreenshot });
      console.log(`✓ Mobile Davomat screenshot saved to ${mobileDavomatScreenshot}`);

      console.log('\n======================================================');
      console.log('🎉 ALL GLASSCLAY VISUAL VERIFICATIONS COMPLETED! 🎉');
      console.log('======================================================\n');
    } finally {
      await browser.close();
    }
  } finally {
    if (previewProcess) {
      previewProcess.kill();
    }
  }
}

main().catch((err) => {
  console.error('Visual verification error:', err);
  process.exit(1);
});
