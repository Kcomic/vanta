import { test, expect } from '@playwright/test';

test.describe('collections index @ /collections', () => {
  test('lists collection tiles linking into editorial pages (EN)', async ({ page }) => {
    await page.goto('/en/collections');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Collections');
    const tiles = page.getByTestId('collection-tile');
    await expect(tiles.first()).toBeVisible();
    const href = await tiles.first().getByRole('link').first().getAttribute('href');
    expect(href).toMatch(/^\/en\/collections\/[\w-]+$/);
  });

  test('renders localized heading in TH', async ({ page }) => {
    await page.goto('/th/collections');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('คอลเลกชัน');
  });
});
