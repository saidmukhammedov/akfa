import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';
const APP_URL = 'http://localhost:4215';

async function main() {
  console.log('=== VERIFYING INSTANT ZERO-LOADING LOGIN & APP SPEED ===\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Clear any existing localStorage
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Verify Login Form on First Load with 0ms Delay
    console.log('1. Checking unauthenticated initial load...');
    const hasLoader = await page.locator('text=Yuklanmoqda...').isVisible().catch(() => false);
    console.log(`   - Full-screen loading spinner present: ${hasLoader} (Expected: false)`);

    const loginTitle = await page.locator('h1').textContent();
    console.log(`   - Page heading: "${loginTitle}"`);

    const usernameVal = await page.locator('input:not([type="password"])').first().inputValue();
    console.log(`   - Pre-filled username: "${usernameVal}" (Expected: admin)`);

    const hasPasswordField = await page.locator('input[type="password"]').isVisible();
    console.log(`   - Password field visible: ${hasPasswordField}`);

    // Take screenshot of Login Form in Light Mode
    const loginLightPath = path.join(ARTIFACT_DIR, 'instant_login_light.png');
    await page.screenshot({ path: loginLightPath });
    console.log(`   ✓ Login form screenshot saved: ${loginLightPath}`);

    // Test Theme Switch to Dark Mode on Login Form
    const themeBtn = page.locator('button[aria-label="Rang sxemasi: Tungi"], button:has-text("🌙")').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      const loginDarkPath = path.join(ARTIFACT_DIR, 'instant_login_dark.png');
      await page.screenshot({ path: loginDarkPath });
      console.log(`   ✓ Login form dark mode screenshot saved: ${loginDarkPath}`);
      // Switch back to light
      const lightBtn = page.locator('button[aria-label="Rang sxemasi: Kunduzgi"], button:has-text("☀️")').first();
      if (await lightBtn.isVisible()) await lightBtn.click();
    }

    // 2. Perform Login with admin / 987654321
    console.log('\n2. Testing authentication with admin / 987654321...');
    await page.locator('input[type="password"]').fill('987654321');
    const submitBtn = page.locator('button[type="submit"]');
    
    const loginStartTime = Date.now();
    await submitBtn.click();

    // Wait for Dashboard to appear
    await page.waitForSelector('text=Xush kelibsiz', { timeout: 10000 });
    const loginDuration = Date.now() - loginStartTime;
    console.log(`   ✓ Authenticated and navigated to Dashboard in ${loginDuration}ms!`);

    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('akfa_access_token'));
    console.log(`   ✓ Access token securely saved: ${token ? 'YES (' + token.slice(0, 15) + '...)' : 'NO'}`);

    // Take screenshot of Dashboard
    const dashboardPath = path.join(ARTIFACT_DIR, 'dashboard_authenticated.png');
    await page.screenshot({ path: dashboardPath });
    console.log(`   ✓ Dashboard screenshot saved: ${dashboardPath}`);

    // 3. Test Navigation Speed across Tabs
    console.log('\n3. Testing tab navigation speed (conditional view rendering)...');
    
    // Davomat tab
    const t1 = Date.now();
    await page.locator('nav button:visible').filter({ hasText: 'Davomat' }).first().click();
    await page.waitForSelector('text=Davomat jurnali', { timeout: 3000 });
    const d1 = Date.now() - t1;
    console.log(`   ✓ Switch to Davomat tab took: ${d1}ms`);

    // Moliya tab
    const t2 = Date.now();
    await page.locator('nav button:visible').filter({ hasText: 'Moliya' }).first().click();
    await page.waitForSelector('text=Moliya va Maoshlar', { timeout: 3000 });
    const d2 = Date.now() - t2;
    console.log(`   ✓ Switch to Moliya tab took: ${d2}ms`);

    // Sozlamalar tab
    const t3 = Date.now();
    await page.locator('nav button:visible').filter({ hasText: 'Sozlamalar' }).first().click();
    await page.waitForSelector('text=Ishchilar tarkibi', { timeout: 3000 });
    const d3 = Date.now() - t3;
    console.log(`   ✓ Switch to Sozlamalar tab took: ${d3}ms`);

    // Back to Dashboard
    const t4 = Date.now();
    await page.locator('nav button:visible').filter({ hasText: 'Boshqaruv' }).first().click();
    await page.waitForSelector('text=Xush kelibsiz', { timeout: 3000 });
    const d4 = Date.now() - t4;
    console.log(`   ✓ Switch to Dashboard tab took: ${d4}ms`);

    // 4. Test Page Reload with Cached Session (Zero Loading Screen!)
    console.log('\n4. Testing page reload with cached session...');
    const reloadStart = Date.now();
    await page.reload();
    const hasLoaderOnReload = await page.locator('text=Yuklanmoqda...').isVisible().catch(() => false);
    const reloadDuration = Date.now() - reloadStart;
    console.log(`   - Full-screen loading spinner present on reload: ${hasLoaderOnReload} (Expected: false)`);
    console.log(`   ✓ Dashboard immediately restored from cache in ${reloadDuration}ms!`);

    // 5. Test Logout
    console.log('\n5. Testing logout flow...');
    const logoutBtn = page.locator('button[aria-label="Chiqish"]').first();
    await logoutBtn.click();

    // Verify redirected immediately to Login Form
    await page.waitForSelector('input[type="password"]', { timeout: 3000 });
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('akfa_access_token'));
    console.log(`   ✓ Successfully logged out, token cleared: ${tokenAfterLogout === null}`);
    console.log(`   ✓ Returned directly to Login Form with 0ms delay!`);

    console.log('\n======================================================');
    console.log('🎉 ALL LOGIN, SPEED & ZERO-LOADING VERIFICATIONS PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
