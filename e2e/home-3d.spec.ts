import { test, expect } from '@playwright/test';

test.describe('Architectural sketch background', () => {
  test('homepage should render visible sketch canvas background', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/home-sketch-background.png', fullPage: true });
  });
});
