import { test, expect } from '@playwright/test';

test.describe('open graph image', () => {
  test('home emits exactly one og:image meta tag whose content contains opengraph-image', async ({
    page,
  }) => {
    await page.goto('/en');
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveCount(1);
    const content = await og.getAttribute('content');
    expect(content).toContain('opengraph-image');
  });
});
