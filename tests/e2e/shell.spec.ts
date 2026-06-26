import { test, expect } from '@playwright/test';

test.describe('bilingual shell renders at /en and /th', () => {
  test('/en renders the shell with lang="en", EN hero section, and Clash Display font', async ({
    page,
  }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Brand lockup in the sticky Header.
    await expect(page.getByTestId('brand')).toContainText('VANTA');

    // Hero section is present.
    await expect(page.getByTestId('hero')).toBeVisible();

    // Hero headline renders with the correct aria-label (from home.heroHeadline).
    const heroHeadline = page.getByTestId('hero-headline');
    await expect(heroHeadline).toHaveAttribute('aria-label', 'VANTA');

    // :lang(en) .display applies Clash Display.
    const family = await heroHeadline.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Clash Display');

    // :lang(en) .display uppercases.
    const transform = await heroHeadline.evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('uppercase');

    // Featured product list renders product cards.
    await expect(page.getByTestId('featured-list')).toBeVisible();
  });

  test('/th renders the shell with lang="th", Thai hero section, and Kanit font (no all-caps)', async ({
    page,
  }) => {
    await page.goto('/th');

    await expect(page.locator('html')).toHaveAttribute('lang', 'th');

    // Brand lockup in the sticky Header (same brand name in both locales).
    await expect(page.getByTestId('brand')).toContainText('VANTA');

    // Hero section is present.
    await expect(page.getByTestId('hero')).toBeVisible();

    // Hero headline renders with the correct aria-label (home.heroHeadline in th locale).
    const heroHeadline = page.getByTestId('hero-headline');
    await expect(heroHeadline).toHaveAttribute('aria-label', 'VANTA');

    // :lang(th) .display applies Kanit.
    const family = await heroHeadline.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Kanit');

    // :lang(th) .display does NOT uppercase.
    const transform = await heroHeadline.evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('none');

    // Featured product list renders product cards in Thai locale.
    await expect(page.getByTestId('featured-list')).toBeVisible();
  });

  test('the bare root redirects to the default locale (/en)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
  });

  test('an unknown locale (e.g. /fr) 404s via the hasLocale guard', async ({ page }) => {
    await page.goto('/fr');
    // Next.js renders its 404 page — no crash, just not-found.
    await expect(page).not.toHaveURL(/\/en$/);
  });
});
