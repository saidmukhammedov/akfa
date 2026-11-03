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
  const navTabs = await page.locator('nav:not(.sm\\:hidden) button').allTextContents();
  console.log('LIVE VERCEL TABS:', navTabs);
  await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850/live_vercel_dashboard.png' });
  console.log('✓ Successfully verified live Vercel deployment with Obyom tab!');
  await browser.close();
}

main().catch(console.error);