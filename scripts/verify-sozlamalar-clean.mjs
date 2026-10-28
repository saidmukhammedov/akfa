import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';
const TARGET_URL = process.argv[2] || 'https://akfa-web-staging.vercel.app';

async function main() {
  console.log(`Connecting to ${TARGET_URL}...`);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Wait for login form
    try {
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
      console.log('Logging in with admin / 987654321...');
      await page.fill('input:not([type="password"])', 'admin');
      await page.fill('input[type="password"]', '987654321');
      await page.locator('button[type="submit"]').click();
    } catch {
      console.log('Already logged in or login not shown');
    }

    await page.waitForSelector('text=Xush kelibsiz', { timeout: 15000 });
    console.log('✓ Successfully logged into Dashboard');

    // Navigate to Sozlamalar
    console.log('Navigating to Sozlamalar tab...');
    await page.locator('button:has-text("Sozlamalar"):visible').click();
    await page.waitForTimeout(1500);

    // Verify tabs in Sozlamalar
    const workersTabVisible = await page.getByRole('button', { name: 'Ishchilar tarkibi' }).isVisible();
    const profileTabVisible = await page.getByRole('button', { name: 'Ustaxona va Profil' }).isVisible();
    const systemTabVisible = await page.getByRole('button', { name: /Tizim/i }).isVisible().catch(() => false);
    const neonTextVisible = await page.locator('text=Neon PostgreSQL').isVisible().catch(() => false);

    console.log(`✓ "Ishchilar tarkibi" tab visible: ${workersTabVisible}`);
    console.log(`✓ "Ustaxona va Profil" tab visible: ${profileTabVisible}`);
    console.log(`✓ "Tizim va ma'lumotlar" tab visible: ${systemTabVisible} (Must be FALSE)`);
    console.log(`✓ "Neon PostgreSQL" internal info visible: ${neonTextVisible} (Must be FALSE)`);

    if (systemTabVisible || neonTextVisible) {
      throw new Error('FAIL: System info is still visible in Sozlamalar!');
    }

    const screenshotPath = path.join(ARTIFACT_DIR, 'sozlamalar_clean_no_system_tab.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot saved: ${screenshotPath}`);

    console.log('\n======================================================');
    console.log('🎉 SOZLAMALAR VERIFICATION PASSED: NO SYSTEM TAB! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
