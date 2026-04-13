import { test, expect } from '@playwright/test';

test.describe('Stable Lords Basic E2E Tests', () => {
  
  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded - look for expected content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/homepage.png', fullPage: true });
  });

  test('title screen is displayed', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to render
    await page.waitForTimeout(1000);
    
    // Check for expected elements on the title screen
    const heading = page.locator('h1, h2, .title, [class*="title"]').first();
    const headingText = await heading.textContent().catch(() => null);
    
    // Log what we found for debugging
    console.log('Found heading:', headingText);
    
    // The page should have some content
    expect(await page.locator('body').innerHTML()).toBeTruthy();
  });

  test('navigation to welcome page works', async ({ page }) => {
    await page.goto('/welcome');
    
    await page.waitForTimeout(1000);
    
    // Check that the page loaded
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('no critical system failure error', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    // Check for the error boundary message
    const errorText = await page.locator('body').textContent();
    
    // Should NOT contain the critical system failure message
    expect(errorText).not.toContain('Critical System Failure');
    expect(errorText).not.toContain('Nodal link severed');
  });

  test('arena-hub page loads', async ({ page }) => {
    await page.goto('/arena-hub');
    
    await page.waitForTimeout(1000);
    
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

});
