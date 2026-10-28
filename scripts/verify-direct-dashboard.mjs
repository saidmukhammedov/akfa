import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';

const TARGET_URL = process.argv[2] || 'https://akfa-web-staging.vercel.app';

async function main() {
  console.log(`Connecting to ${TARGET_URL} with a fresh context (no cookies, no localStorage)...`);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Wait for Dashboard
    console.log('Waiting for Dashboard to load directly...');
    try {
      await page.waitForSelector('text=Xush kelibsiz', { timeout: 10000 });
      console.log('✓ SUCCESS: Dashboard loaded directly without any login form!');
    } catch {
      console.log('Could not find "Xush kelibsiz". Current page HTML:');
      const html = await page.content();
      console.log(html.slice(0, 1000));
      await page.screenshot({ path: 'verify-direct-debug.png' });
      throw new Error('Failed to find Xush kelibsiz');
    }

    // Verify login form elements are NOT present
    const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    console.log(`✓ Password input visible: ${passwordInput} (Must be false)`);
    if (passwordInput) {
      throw new Error('FAIL: Password input is still visible!');
    }

    // Take screenshot of dashboard
    const screenshotPath = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850/direct_dashboard_no_login.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot saved: ${screenshotPath}`);

    // Verify navigation works
    console.log('Navigating to Davomat...');
    await page.getByRole('button', { name: 'Davomat', exact: true }).click();
    await page.waitForTimeout(1000);
    const davomatTitle = await page.locator('text=Davomat jurnali').isVisible();
    console.log(`✓ Davomat page accessible: ${davomatTitle}`);

    console.log('\n======================================================');
    console.log('🎉 DIRECT DASHBOARD ACCESS VERIFIED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
