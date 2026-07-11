import { test, expect } from '@playwright/test';

test.describe('catalog @ /shop', () => {
  test('renders product cards in EN', async ({ page }) => {
    await page.goto('/en/shop');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(1);
  });

  test('filtering by size narrows the grid and updates the URL', async ({ page }) => {
    await page.goto('/en/shop');
    const cards = page.getByTestId('product-card');
    const before = await cards.count();
    await page.getByTestId('filter-size-S').click();
    await expect(page).toHaveURL(/[?&]size=S\b/);
    await expect(async () => {
      expect(await cards.count()).toBeLessThanOrEqual(before);
    }).toPass();
  });

  test('sort=price_asc orders cards by ascending price', async ({ page }) => {
    await page.goto('/en/shop?sort=price_asc');
    const prices = await page.getByTestId('card-price').allInnerTexts();
    const numbers = prices.map((t) => Number(t.replace(/[^\d]/g, '')));
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });

  test('renders in TH with localized sort label', async ({ page }) => {
    await page.goto('/th/shop');
    await expect(page.getByTestId('sort-label')).toHaveText('เรียงตาม');
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });
});

test.describe('catalog reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('cards are visible immediately (no opacity:0 trap)', async ({ page }) => {
    await page.goto('/en/shop');
    const firstCard = page.getByTestId('product-card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveCSS('opacity', '1');
  });
});
