import { test } from '@playwright/test';

test('snapshot reference background from v0', async ({ page }) => {
  await page.goto('https://v0.app/fabicalle-6745/chat/real-estate-search-hero-fXxHOUnxYz2', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'e2e/reference-v0.png', fullPage: true });
});
