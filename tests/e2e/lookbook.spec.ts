import { test, expect } from '@playwright/test';

// Assumes the seed has a collection with slug 'nightfall' (added in Task 6.5).
const SLUG = 'nightfall';

test.describe('lookbook editorial @ /collections/[slug]', () => {
  test('renders hero + product sequence (EN)', async ({ page }) => {
    await page.goto(`/en/collections/${SLUG}`);
    await expect(page.getByTestId('lookbook-hero')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });

  test('unknown slug 404s', async ({ page }) => {
    const res = await page.goto('/en/collections/does-not-exist');
    expect(res?.status()).toBe(404);
  });

  test('renders in TH', async ({ page }) => {
    await page.goto(`/th/collections/${SLUG}`);
    await expect(page.getByTestId('lookbook-hero')).toBeVisible();
  });
});

test.describe('lookbook reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('hero falls back to a static image (no canvas)', async ({ page }) => {
    await page.goto(`/en/collections/${SLUG}`);
    const hero = page.getByTestId('lookbook-hero');
    await expect(hero.getByTestId('lookbook-hero-fallback')).toBeVisible();
    await expect(hero.locator('canvas')).toHaveCount(0);
  });
});
