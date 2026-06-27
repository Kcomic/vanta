import { test, expect } from '@playwright/test';

test.describe('search @ /search', () => {
  test('prompts when no query (EN)', async ({ page }) => {
    await page.goto('/en/search');
    await expect(page.getByTestId('search-prompt')).toBeVisible();
  });

  test('submitting a query shows results and reflects it in the URL', async ({ page }) => {
    await page.goto('/en/search');
    await page.getByTestId('search-input').fill('tee');
    await page.getByTestId('search-submit').click();
    await expect(page).toHaveURL(/[?&]q=tee\b/);
    await expect(page.getByTestId('search-results-heading')).toContainText('tee');
  });

  test('renders no-results state for nonsense query', async ({ page }) => {
    await page.goto('/en/search?q=zzzznomatch');
    await expect(page.getByTestId('search-empty')).toBeVisible();
  });

  test('renders in TH', async ({ page }) => {
    await page.goto('/th/search');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ค้นหา');
  });
});
