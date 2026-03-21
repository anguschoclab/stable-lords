import { test, expect } from '@playwright/test';

test('verify sort header', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Let's print out what text is on the page
  const text = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT:", text);
});
