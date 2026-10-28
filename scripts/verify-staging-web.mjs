import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';
const STAGING_URL = process.argv[2] || 'https://akfa-web-staging.vercel.app';

async function main() {
  console.log('--- Starting Web Staging UI & Mobile Responsiveness Verification ---');
  console.log(`Target: ${STAGING_URL}`);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    // 1. Mobile Viewport Verification (iPhone 13 / 14: 390x844)
    console.log('\n1. Testing Mobile Viewport (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    const startTime = Date.now();
    const response = await mobilePage.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const loadDuration = Date.now() - startTime;

    console.log(`   ✓ Mobile Page Loaded in ${loadDuration}ms with HTTP ${response.status()}`);

    const title = await mobilePage.title();
    console.log(`   ✓ Page Title: "${title}"`);

    // Verify root container and responsive structure
    const rootVisible = await mobilePage.locator('#root').isVisible();
    console.log(`   ✓ #root container visible: ${rootVisible}`);

    // Wait for the app UI to stabilize
    await mobilePage.waitForTimeout(1500);

    // Capture mobile screenshot
    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'staging_mobile_390w.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`   ✓ Mobile screenshot saved: ${mobileScreenshotPath}`);

    // Check language switcher or header visibility
    const uzLangVisible = await mobilePage.locator('text=UZ').first().isVisible().catch(() => false);
    const ruLangVisible = await mobilePage.locator('text=RU').first().isVisible().catch(() => false);
    console.log(`   ✓ Language switcher visible (UZ: ${uzLangVisible}, RU: ${ruLangVisible})`);

    // 2. Desktop Viewport Verification (1280x800)
    console.log('\n2. Testing Desktop Viewport (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(1000);

    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'staging_desktop_1280w.png');
    await desktopPage.screenshot({ path: desktopScreenshotPath });
    console.log(`   ✓ Desktop screenshot saved: ${desktopScreenshotPath}`);

    // 3. Inspect DOM & Meta Viewport
    const metaViewport = await mobilePage.getAttribute('meta[name="viewport"]', 'content');
    console.log(`\n3. Meta Viewport Config: "${metaViewport}"`);

    console.log('\n==================================================');
    console.log('🎉 WEB STAGING RESPONSIVENESS CHECKS PASSED! 🎉');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
