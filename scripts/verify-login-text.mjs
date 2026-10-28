import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';

async function verify() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://akfa-web-staging.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const textVisible = await page.locator('text=Maxsus himoyalangan tizim').isVisible();
  console.log('✓ "Maxsus himoyalangan tizim" text is visible:', textVisible);

  await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850/login_maxsus_himoyalangan.png' });
  console.log('✓ Screenshot saved to login_maxsus_himoyalangan.png');

  await browser.close();
}

verify().catch(console.error);
