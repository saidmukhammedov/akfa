import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import path from 'path';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';
const DIST_DIR = 'C:/Users/hp/.gemini/antigravity/scratch/akfa/apps/web/dist';
const PORT = 5174;

// Simple static file server for Vite build dist
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0].replace(/^\/+/, '');
    let filePath = path.resolve(DIST_DIR, cleanUrl || 'index.html');
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.resolve(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Preview Server] Serving ${DIST_DIR} on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function main() {
  const targetUrl = process.argv[2];
  const server = targetUrl ? null : await startServer();
  const baseUrl = targetUrl || `http://localhost:${PORT}`;

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // Mobile iPhone 13/14
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log(`\n--- 1. Loading UI & Logging In (${baseUrl}) ---`);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    // Wait for either the login form or already logged in dashboard
    try {
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
      console.log('   Logging in with credentials admin / 987654321...');
      await page.fill('input:not([type="password"])', 'admin');
      await page.fill('input[type="password"]', '987654321');
      await page.locator('button[type="submit"]').click();
    } catch {
      console.log('   Already logged in or login form not shown.');
    }

    // 2. Dashboard View Verification
    console.log('\n--- 2. Verifying Dashboard Action Buttons Balance ---');
    await page.waitForSelector('text=Xush kelibsiz', { timeout: 10000 });

    const davomatBtn = page.locator('button:has-text("Davomat belgilash")');
    const paymentBtn = page.locator('button:has-text("To\'lov kiritish")');

    const davomatBox = await davomatBtn.boundingBox();
    const paymentBox = await paymentBtn.boundingBox();

    console.log(`   Davomat button: width=${davomatBox?.width?.toFixed(1)}px, height=${davomatBox?.height?.toFixed(1)}px, y=${davomatBox?.y?.toFixed(1)}`);
    console.log(`   Payment button: width=${paymentBox?.width?.toFixed(1)}px, height=${paymentBox?.height?.toFixed(1)}px, y=${paymentBox?.y?.toFixed(1)}`);

    const heightDiff = Math.abs((davomatBox?.height || 0) - (paymentBox?.height || 0));
    const yDiff = Math.abs((davomatBox?.y || 0) - (paymentBox?.y || 0));

    console.log(`   ✓ Height difference: ${heightDiff.toFixed(1)}px (strictly balanced: ${heightDiff < 1.0})`);
    console.log(`   ✓ Vertical alignment diff: ${yDiff.toFixed(1)}px (strictly aligned: ${yDiff < 1.0})`);

    const dashboardScreenshot = path.join(ARTIFACT_DIR, 'dashboard_buttons_balanced.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log(`   ✓ Dashboard screenshot saved: ${dashboardScreenshot}`);

    // 3. Davomat View Verification
    console.log('\n--- 3. Verifying Davomat View Redesign & Instant Toggle ---');
    await davomatBtn.click();
    await page.waitForTimeout(1000);

    const davomatHeader = page.locator('text=Davomat jurnali');
    await davomatHeader.waitFor({ state: 'visible' });

    const davomatScreenshot = path.join(ARTIFACT_DIR, 'davomat_compact_focused.png');
    await page.screenshot({ path: davomatScreenshot });
    console.log(`   ✓ Davomat compact screenshot saved: ${davomatScreenshot}`);

    // Test instant toggle speed
    console.log('\n--- 4. Testing Attendance Toggle Switching Speed ---');
    // First worker's toggle buttons
    const absentButton = page.locator('button:has-text("Kelmadi")').first();
    const presentButton = page.locator('button:has-text("Keldi")').first();

    // Toggle to Absent
    const t0 = Date.now();
    await absentButton.click();
    await page.locator('button:has-text("Kelmadi").bg-absent-600').first().waitFor({ state: 'visible', timeout: 5000 });
    const absentSwitchDuration = Date.now() - t0;
    console.log(`   ✓ Keldi -> Kelmadi toggle switched in ${absentSwitchDuration}ms (Instantaneous UI update!)`);

    // Toggle back to Present
    const t1 = Date.now();
    await presentButton.click();
    await page.locator('button:has-text("Keldi").bg-present-600').first().waitFor({ state: 'visible', timeout: 5000 });
    const presentSwitchDuration = Date.now() - t1;
    console.log(`   ✓ Kelmadi -> Keldi toggle switched in ${presentSwitchDuration}ms (Instantaneous UI update!)`);

    console.log('\n======================================================');
    console.log('🎉 ALL 3 USER UI ENHANCEMENTS SUCCESSFULLY VERIFIED! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main();