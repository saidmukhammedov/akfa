import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  console.log('Navigating to live Vercel staging...');
  await page.goto('https://akfa-web-staging.vercel.app');
  await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Xush kelibsiz', { timeout: 8000 });

  // Check voice button in header
  const voiceBtn = page.locator('header button[aria-label="Ovozli buyruqlar"], header button:has-text("Ovozli buyruq")').first();
  await voiceBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Found voice button in Header!');

  // Click voice button to open modal
  await voiceBtn.click();
  await page.waitForSelector('text=O‘zbekcha ovozli buyruq', { timeout: 5000 });
  console.log('✓ Voice modal opened successfully on live Vercel staging!');

  await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850/live_voice_modal_verified.png' });
  console.log('✓ Screenshot saved to live_voice_modal_verified.png');

  await browser.close();
}

main().catch(console.error);
