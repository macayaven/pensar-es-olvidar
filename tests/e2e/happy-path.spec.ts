import { expect, test } from '@playwright/test';

test('prologue → reel: clicking Begin mounts the reel', async ({ page }) => {
  await page.goto('/');

  const beginButton = page.locator('#begin-button');
  await expect(beginButton).toBeVisible();
  await beginButton.click();

  const reelCenter = page.getByTestId('reel-center');
  await expect(reelCenter).toBeVisible();
});
