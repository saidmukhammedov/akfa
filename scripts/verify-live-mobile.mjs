import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';

const LIVE_URL = 'https://akfa-web-staging.vercel.app';
const ARTIFACTS_DIR = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();
    console.log('Navigating to live Vercel mobile app...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const userInput = page.locator('input[type="text"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await userInput.isVisible()) {
      await userInput.fill('admin');
      await passInput.fill('987654321');
      await page.locator('button[type="submit"]').click();
      await wait(1200);
    }

    console.log('Switching to Obyom tab via mobile bottom bar...');
    const mobileNavObyom = page.locator('nav.sm\\:hidden button').nth(2);
    await mobileNavObyom.click();
    await wait(1000);

    console.log('Opening Add Volume modal...');
    const addBtn = page.locator('button:has-text("Obyom kiritish")').first();
    await addBtn.click();
    await wait(1000);

    // Click 15 m² and 20 000 so'm
    const m2_15_btn = page.locator('button:has-text("15 m²")');
    if (await m2_15_btn.count() > 0) {
      await m2_15_btn.first().click();
    }
    const rate_20k_btn = page.locator('button:has-text("20 000")');
    if (await rate_20k_btn.count() > 0) {
      await rate_20k_btn.first().click();
    }
    await wait(500);

    const shotPath = `${ARTIFACTS_DIR}/live_staging_mobile_modal_verified.png`;
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('✓ Successfully saved live mobile screenshot to:', shotPath);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
