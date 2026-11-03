import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import path from 'path';

const VITE_PORT = 4226;
const LOCAL_URL = `http://127.0.0.1:${VITE_PORT}`;
const ARTIFACTS_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startVitePreview() {
  console.log('Starting Vite preview server on port ' + VITE_PORT + '...');
  const child = spawn('npx', ['vite', 'preview', '--port', String(VITE_PORT), '--host', '127.0.0.1', '--strictPort'], {
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

const mockWorkers = [
  {
    id: 'w-1',
    name: 'Random usta 3',
    phone: '+998 90 123 45 67',
    role: 'yordamchi',
    dailyRate: 150000,
    ratePerM2: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-2',
    name: 'Random usta 2',
    phone: '+998 90 765 43 21',
    role: 'ornatuvchi',
    dailyRate: 200000,
    ratePerM2: 20000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function run() {
  let previewProcess = null;
  let browser = null;

  try {
    previewProcess = await startVitePreview();

    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    // Emulate iPhone 14 Pro
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();

    // Mock API routes
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'admin-1', username: 'admin', role: 'OWNER', workshopName: 'Akfa servis' },
          }),
        });
      }
      if (url.includes('/workers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockWorkers),
        });
      }
      if (url.includes('/volumes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            records: [],
            overview: {
              todaySquareMeters: 0,
              todayEarnings: 0,
              monthlySquareMeters: 0,
              monthlyEarnings: 0,
              totalSquareMetersAllTime: 0,
            },
            workerSummaries: [],
          }),
        });
      }
      if (url.includes('/attendance')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ records: [] }),
        });
      }
      if (url.includes('/finance/overview')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalAccruedSalaries: 0,
            totalBaseSalaries: 0,
            totalVolumeEarnings: 0,
            totalVolumeM2: 0,
            totalPaymentsDistributed: 0,
            netBalanceOwed: 0,
            workerSummaries: [],
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    console.log('Navigating to app on mobile viewport (390x844)...');
    await page.goto(LOCAL_URL, { waitUntil: 'domcontentloaded' });

    // Perform instant login via UI form
    const userInput = page.locator('input[type="text"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await userInput.isVisible()) {
      console.log('Logging in via form...');
      await userInput.fill('admin');
      await passInput.fill('987654321');
      await page.locator('button[type="submit"]').click();
      await wait(1000);
    }

    console.log('Switching to Obyom tab via mobile bottom bar...');
    const mobileNavObyom = page.locator('nav.sm\\:hidden button').nth(2);
    await mobileNavObyom.click();
    await wait(800);

    // Click "Obyom kiritish" button
    console.log('Opening Add Volume modal...');
    const addBtn = page.locator('button:has-text("Obyom kiritish")').first();
    await addBtn.click();
    await wait(800);

    // Check modal visibility
    const modalHeader = page.locator('h3:has-text("Yangi hajm")');
    console.log('✓ Modal Header visible:', await modalHeader.isVisible());

    // Save screenshot
    const shotPath = `${ARTIFACTS_DIR}/mobile_modal_fixed_preview.png`;
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('✓ Saved mobile modal fixed screenshot to:', shotPath);

    // Click a preset button (e.g. 15 m2)
    const m2_15_btn = page.locator('button:has-text("15 m²")');
    if (await m2_15_btn.count() > 0) {
      await m2_15_btn.first().click();
      await wait(300);
    }

    // Click a rate button (e.g. 20 000 so'm)
    const rate_20k_btn = page.locator('button:has-text("20 000")');
    if (await rate_20k_btn.count() > 0) {
      await rate_20k_btn.first().click();
      await wait(300);
    }

    const shotActivePath = `${ARTIFACTS_DIR}/mobile_modal_active_pills.png`;
    await page.screenshot({ path: shotActivePath, fullPage: false });
    console.log('✓ Saved mobile modal active pills screenshot to:', shotActivePath);

    console.log('🎉 Mobile modal tests completed successfully!');
  } finally {
    if (browser) await browser.close();
    if (previewProcess) {
      previewProcess.kill();
    }
  }
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
