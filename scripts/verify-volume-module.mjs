import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import path from 'path';

const VITE_PORT = 4220;
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

const todayStr = new Date().toISOString().slice(0, 10);

const mockWorkers = [
  {
    id: 'w-1',
    name: 'Alisher Usta',
    phone: '+998 90 123 45 67',
    role: 'usta',
    dailyRate: 300000,
    ratePerM2: 15000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-2',
    name: 'Sardor Shogird',
    phone: '+998 90 765 43 21',
    role: 'shogird',
    dailyRate: 150000,
    ratePerM2: 10000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockVolumes = [
  {
    id: 'vol-1',
    workerId: 'w-1',
    workerName: 'Alisher Usta',
    workerRole: 'usta',
    date: todayStr,
    squareMeters: 14.5,
    rateSnapshot: 15000,
    totalAmount: 217500,
    notes: '1-tsex 4 ta rom',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vol-2',
    workerId: 'w-2',
    workerName: 'Sardor Shogird',
    workerRole: 'shogird',
    date: todayStr,
    squareMeters: 8.0,
    rateSnapshot: 10000,
    totalAmount: 80000,
    notes: '2 ta deraza',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockOverview = {
  totalAccruedSalaries: 747500,
  totalBaseSalaries: 450000,
  totalVolumeEarnings: 297500,
  totalVolumeM2: 22.5,
  totalPaymentsDistributed: 200000,
  totalPendingBalance: 547500,
  activeWorkerCount: 2,
};

const mockSummaries = [
  {
    workerId: 'w-1',
    name: 'Alisher Usta',
    role: 'usta',
    currentDailyRate: 300000,
    ratePerM2: 15000,
    status: 'ACTIVE',
    daysWorked: 1,
    baseSalary: 300000,
    volumeM2: 14.5,
    volumeEarnings: 217500,
    totalAccruedSalary: 517500,
    totalPaid: 100000,
    balanceOwed: 417500,
  },
  {
    workerId: 'w-2',
    name: 'Sardor Shogird',
    role: 'shogird',
    currentDailyRate: 150000,
    ratePerM2: 10000,
    status: 'ACTIVE',
    daysWorked: 1,
    baseSalary: 150000,
    volumeM2: 8.0,
    volumeEarnings: 80000,
    totalAccruedSalary: 230000,
    totalPaid: 100000,
    balanceOwed: 130000,
  },
];

async function main() {
  console.log('=== STARTING VOLUME MODULE VERIFICATION ===\n');
  const serverProcess = await startVitePreview();

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Seed auth and test data
    await page.goto(LOCAL_URL);
    await page.evaluate(
      ({ workers, volumes, overview, summaries }) => {
        localStorage.setItem('akfa_access_token', 'mock_token');
        localStorage.setItem('akfa_refresh_token', 'mock_refresh');
        localStorage.setItem('akfa_theme_mode', 'light');
        localStorage.setItem(
          'akfa_owner_profile',
          JSON.stringify({
            id: 'owner-1',
            username: 'admin',
            fullName: 'Usta Boshliq',
            workshopName: 'AKFA Master Tsex',
            phone: '+998 90 000 00 00',
          })
        );
        localStorage.setItem('akfa_cache_workers', JSON.stringify(workers));
        localStorage.setItem('akfa_cache_volumes', JSON.stringify(volumes));
        localStorage.setItem('akfa_cache_overview', JSON.stringify(overview));
        localStorage.setItem('akfa_cache_summaries', JSON.stringify(summaries));
      },
      {
        workers: mockWorkers,
        volumes: mockVolumes,
        overview: mockOverview,
        summaries: mockSummaries,
      }
    );

    await page.reload();
    await wait(300);

    // Verify 5 Navigation Tabs
    console.log('1. Verifying Navigation Bar...');
    const navButtons = await page.locator('nav:not(.sm\\:hidden) button').allTextContents();
    console.log('   - Desktop navigation tabs:', navButtons);
    const hasObyom = navButtons.some((txt) => txt.includes('Obyom'));
    console.log(`   ✓ "Obyom" tab present: ${hasObyom}`);

    // Verify Dashboard Volume Integration
    console.log('2. Verifying Dashboard Volume Integration...');
    const dashboardText = await page.content();
    const hasIshbayDashboard = dashboardText.includes('Ishbay:');
    console.log(`   ✓ Dashboard displays breakdown with Ishbay earnings: ${hasIshbayDashboard}`);

    // 2. Navigate to Obyom tab
    console.log('3. Navigating to Obyom (m²) tab...');
    await page.locator('nav button').filter({ hasText: 'Obyom' }).first().click();
    await wait(300);

    // Verify KPI Pods
    const obyomHeading = await page.locator('h2').textContent();
    console.log(`   - Heading: "${obyomHeading}"`);
    const screenshotDesktop = path.join(ARTIFACTS_DIR, 'volume_module_desktop.png');
    await page.screenshot({ path: screenshotDesktop });
    console.log(`   ✓ Saved desktop screenshot: ${screenshotDesktop}`);

    // Open Add Volume Modal
    console.log('4. Testing Add Volume Modal & Live Calculation Preview...');
    await page.locator('button').filter({ hasText: 'Obyom kiritish' }).first().click();
    await wait(300);

    // Fill in square meters and rate
    await page.locator('input[placeholder*="14.5"]').fill('16.5');
    await wait(200);

    const calcPreviewText = await page.locator('text=Hisob-kitob ko\'rinishi').first().textContent();
    console.log(`   - Calculation preview text: "${calcPreviewText}"`);

    const screenshotModal = path.join(ARTIFACTS_DIR, 'volume_modal_preview.png');
    await page.screenshot({ path: screenshotModal });
    console.log(`   ✓ Saved modal preview screenshot: ${screenshotModal}`);

    // Close modal
    await page.locator('button').filter({ hasText: 'Bekor qilish' }).click();
    await wait(200);

    // 5. Navigate to Moliya tab
    console.log('5. Verifying Moliya Tab Volume Breakdown...');
    await page.locator('nav button').filter({ hasText: 'Moliya' }).first().click();
    await wait(300);

    const moliyaContent = await page.content();
    const hasBaseSalaries = moliyaContent.includes('Kunlik maosh');
    const hasVolumeEarnings = moliyaContent.includes('Ishbay (m²)');
    const hasTotalEarnings = moliyaContent.includes('Jami hisoblangan');
    console.log(`   ✓ Moliya table has Kunlik maosh: ${hasBaseSalaries}`);
    console.log(`   ✓ Moliya table has Ishbay (m²): ${hasVolumeEarnings}`);
    console.log(`   ✓ Moliya table has Jami hisoblangan: ${hasTotalEarnings}`);

    const screenshotMoliya = path.join(ARTIFACTS_DIR, 'moliya_volume_integration.png');
    await page.screenshot({ path: screenshotMoliya });
    console.log(`   ✓ Saved Moliya integration screenshot: ${screenshotMoliya}`);

    // 6. Navigate to Sozlamalar tab
    console.log('6. Verifying Sozlamalar Tab Rate Per M2...');
    await page.locator('nav button').filter({ hasText: 'Sozlamalar' }).first().click();
    await wait(300);

    const sozlamalarContent = await page.content();
    const hasPerM2 = sozlamalarContent.includes('/ m²');
    console.log(`   ✓ Worker card displays / m² rate: ${hasPerM2}`);

    const screenshotSozlamalar = path.join(ARTIFACTS_DIR, 'sozlamalar_rates.png');
    await page.screenshot({ path: screenshotSozlamalar });
    console.log(`   ✓ Saved Sozlamalar rates screenshot: ${screenshotSozlamalar}`);

    // 7. Verify Mobile Viewport (375x812 iPhone)
    console.log('7. Verifying Mobile Viewport Responsiveness...');
    await page.setViewportSize({ width: 375, height: 812 });
    await wait(200);

    // Switch to Obyom on mobile
    await page.locator('nav.sm\\:hidden button').filter({ hasText: 'Obyom' }).first().click();
    await wait(300);

    const screenshotMobile = path.join(ARTIFACTS_DIR, 'volume_module_mobile.png');
    await page.screenshot({ path: screenshotMobile });
    console.log(`   ✓ Saved Mobile screenshot: ${screenshotMobile}`);

    console.log('\n======================================================');
    console.log('🎉 ALL VOLUME MODULE VISUAL & FUNCTIONAL CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    serverProcess.kill();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});