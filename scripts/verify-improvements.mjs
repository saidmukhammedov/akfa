import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import { spawn, execSync } from 'child_process';
import path from 'path';

const VITE_PORT = 4175;
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

const mockWorkers = [
  {
    id: 'w-1',
    name: 'Alisher Usta',
    phone: '+998 90 123 45 67',
    role: 'usta',
    dailyRate: 300000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-2',
    name: 'Jasur Shogird',
    phone: '+998 93 987 65 43',
    role: 'shogird',
    dailyRate: 200000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-3',
    name: 'Bobur O\'rnatuvchi',
    phone: '+998 97 555 44 33',
    role: 'ornatuvchi',
    dailyRate: 250000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAttendanceRecords = [
  {
    workerId: 'w-1',
    workerName: 'Alisher Usta',
    workerRole: 'usta',
    dailyRate: 300000,
    status: 'PRESENT',
    rateSnapshot: 300000,
    isHalfDay: false,
    notes: 'Kechikmasdan keldi',
    isMarked: true,
  },
  {
    workerId: 'w-2',
    workerName: 'Jasur Shogird',
    workerRole: 'shogird',
    dailyRate: 200000,
    status: 'PRESENT',
    rateSnapshot: 100000,
    isHalfDay: true,
    notes: '0.5 kun ishladi (tushgacha)',
    isMarked: true,
  },
  {
    workerId: 'w-3',
    workerName: 'Bobur O\'rnatuvchi',
    workerRole: 'ornatuvchi',
    dailyRate: 250000,
    status: 'ABSENT',
    rateSnapshot: 250000,
    isHalfDay: false,
    notes: null,
    isMarked: true,
  },
];

const mockFinanceSummaries = [
  {
    workerId: 'w-1',
    name: 'Alisher Usta',
    role: 'usta',
    status: 'ACTIVE',
    currentDailyRate: 300000,
    daysWorked: 5,
    totalAccruedSalary: 1500000,
    totalPaid: 500000,
    balanceOwed: 1000000,
  },
  {
    workerId: 'w-2',
    name: 'Jasur Shogird',
    role: 'shogird',
    status: 'ACTIVE',
    currentDailyRate: 200000,
    daysWorked: 4.5,
    totalAccruedSalary: 900000,
    totalPaid: 300000,
    balanceOwed: 600000,
  },
  {
    workerId: 'w-3',
    name: 'Bobur O\'rnatuvchi',
    role: 'ornatuvchi',
    status: 'ACTIVE',
    currentDailyRate: 250000,
    daysWorked: 3,
    totalAccruedSalary: 750000,
    totalPaid: 800000,
    balanceOwed: -50000,
  },
];

const mockPayments = [
  {
    id: 'pay-1',
    workerId: 'w-1',
    workerName: 'wwa',
    amount: 100000,
    paymentDate: '2026-10-28',
    paymentMethod: 'CASH',
    notes: 'Avans berildi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pay-2',
    workerId: 'w-2',
    workerName: 'Jasur Shogird',
    amount: 250000,
    paymentDate: '2026-10-27',
    paymentMethod: 'CARD',
    notes: 'Karta orqali to\'liq hisob-kitob',
    createdAt: new Date().toISOString(),
  },
];

async function setupMockRoutes(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/session') || url.includes('/auth/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isInitialized: true,
          data: {
            accessToken: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            owner: {
              id: 'owner-1',
              username: 'admin',
              fullName: 'Alisher Qodirov',
              workshopName: 'AKFA Ustaxonasi',
              language: 'uz',
            },
          },
        }),
      });
    }

    if (url.includes('/workers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockWorkers,
        }),
      });
    }

    if (url.includes('/attendance')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            date: '2026-10-28',
            totalActiveWorkers: 3,
            presentCount: 2,
            absentCount: 1,
            records: mockAttendanceRecords,
          },
        }),
      });
    }

    if (url.includes('/finance/overview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalAccruedSalaries: 3150000,
            totalPaymentsDistributed: 1600000,
            totalPendingBalance: 1600000,
            activeWorkerCount: 3,
          },
        }),
      });
    }

    if (url.includes('/finance/summaries')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockFinanceSummaries,
        }),
      });
    }

    if (url.includes('/payments')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockPayments,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
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
      // 1. Mobile Context (390x844)
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      });
      const page = await mobileContext.newPage();
      await setupMockRoutes(page);
      await page.goto(LOCAL_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Verify Moliya Responsive on Mobile
      console.log('1. Capturing Moliya on Mobile (showing 2x2 metric cards)...');
      await page.getByRole('button', { name: 'Moliya' }).last().click();
      await page.waitForTimeout(600);
      const moliyaScreenshot = `${ARTIFACTS_DIR}/moliya_responsive_mobile.png`;
      await page.screenshot({ path: moliyaScreenshot });
      console.log(`✓ Moliya mobile screenshot saved to ${moliyaScreenshot}`);

      // Verify Sozlamalar Worker Cards on Mobile
      console.log('2. Capturing Sozlamalar on Mobile (showing enlarged card & 3 action buttons)...');
      await page.getByRole('button', { name: 'Sozlamalar' }).last().click();
      await page.waitForTimeout(600);
      const sozlamalarScreenshot = `${ARTIFACTS_DIR}/sozlamalar_worker_card_mobile.png`;
      await page.screenshot({ path: sozlamalarScreenshot });
      console.log(`✓ Sozlamalar worker card mobile screenshot saved to ${sozlamalarScreenshot}`);

      // Verify Davomat with 0.5 kun Toggle on Mobile
      console.log('3. Capturing Davomat on Mobile (showing 0.5 kun toggle and badge)...');
      await page.getByRole('button', { name: 'Davomat' }).last().click();
      await page.waitForTimeout(600);
      const davomatScreenshot = `${ARTIFACTS_DIR}/davomat_half_day_mobile.png`;
      await page.screenshot({ path: davomatScreenshot });
      console.log(`✓ Davomat half-day mobile screenshot saved to ${davomatScreenshot}`);

      // 4. Dark Mode Verification
      console.log('4. Enabling Dark Mode...');
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('akfa_theme', 'dark');
      });
      await page.waitForTimeout(600);

      // Dark Mode Davomat
      const darkDavomatScreenshot = `${ARTIFACTS_DIR}/dark_mode_davomat.png`;
      await page.screenshot({ path: darkDavomatScreenshot });
      console.log(`✓ Dark mode Davomat screenshot saved to ${darkDavomatScreenshot}`);

      // Dark Mode Moliya
      await page.getByRole('button', { name: 'Moliya' }).last().click();
      await page.waitForTimeout(600);
      const darkMoliyaScreenshot = `${ARTIFACTS_DIR}/dark_mode_moliya.png`;
      await page.screenshot({ path: darkMoliyaScreenshot });
      console.log(`✓ Dark mode Moliya screenshot saved to ${darkMoliyaScreenshot}`);

      // Scroll down to Recent Payments in Moliya to inspect the exact area from user screenshot
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const darkMoliyaPaymentsScreenshot = `${ARTIFACTS_DIR}/dark_mode_moliya_payments.png`;
      await page.screenshot({ path: darkMoliyaPaymentsScreenshot });
      console.log(`✓ Dark mode Moliya payments screenshot saved to ${darkMoliyaPaymentsScreenshot}`);

      // Dark Mode Sozlamalar
      await page.getByRole('button', { name: 'Sozlamalar' }).last().click();
      await page.waitForTimeout(600);
      const darkSozlamalarScreenshot = `${ARTIFACTS_DIR}/dark_mode_sozlamalar.png`;
      await page.screenshot({ path: darkSozlamalarScreenshot });
      console.log(`✓ Dark mode Sozlamalar screenshot saved to ${darkSozlamalarScreenshot}`);

      // 5. Desktop Viewport (1280x800) Dark Mode Dashboard
      console.log('5. Capturing Desktop Dark Mode Dashboard...');
      const desktopContext = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      });
      const desktopPage = await desktopContext.newPage();
      await setupMockRoutes(desktopPage);
      await desktopPage.goto(LOCAL_URL, { waitUntil: 'networkidle' });
      await desktopPage.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('akfa_theme', 'dark');
      });
      await desktopPage.waitForTimeout(600);
      const darkDashboardScreenshot = `${ARTIFACTS_DIR}/dark_mode_dashboard_desktop.png`;
      await desktopPage.screenshot({ path: darkDashboardScreenshot });
      console.log(`✓ Dark mode Dashboard desktop screenshot saved to ${darkDashboardScreenshot}`);

      console.log('\n======================================================');
      console.log('🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED! 🎉');
      console.log('======================================================\n');
    } finally {
      await browser.close();
    }
  } finally {
    if (previewProcess && previewProcess.pid) {
      console.log('Terminating preview process tree...');
      try {
        execSync(`taskkill /pid ${previewProcess.pid} /T /F`, { stdio: 'ignore' });
      } catch {
        // Ignore
      }
    }
  }
}

main().catch((err) => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
