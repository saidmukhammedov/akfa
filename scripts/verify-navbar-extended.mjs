import { chromium } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/UniTrack/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  console.log('Navigating to live Vercel staging...');
  await page.goto('https://akfa-web-staging.vercel.app');
  
  // Wait for login or dashboard
  await page.waitForTimeout(1500);
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) {
    console.log('Logging in...');
    await loginBtn.click();
    await page.waitForTimeout(3000);
  }

  const screenshotPath = 'C:/Users/hp/.gemini/antigravity/brain/8e4ae944-ffd0-41c7-b476-39b058d75850/live_navbar_extended.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);
  await browser.close();
}

main().catch(console.error);
