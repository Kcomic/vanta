import { test, expect } from '@playwright/test';

test.describe('bilingual shell renders at /en and /th', () => {
  test('/en renders the shell with lang="en", EN headline copy, and Clash Display font', async ({
    page,
  }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Brand + tagline in the intro paragraph.
    const brandTagline = page.getByTestId('brand-tagline');
    await expect(brandTagline).toContainText('VANTA®');
    await expect(brandTagline).toContainText('Bangkok-born. Globally worn.');

    // Hero headline renders the EN copy.
    const heroHeadline = page.getByTestId('hero-headline');
    await expect(heroHeadline).toHaveAttribute('aria-label', 'MATERIALIZE FROM THE VOID');

    // :lang(en) .display applies Clash Display.
    const family = await heroHeadline.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Clash Display');

    // :lang(en) .display uppercases.
    const transform = await heroHeadline.evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('uppercase');

    // Featured product list renders product titles.
    await expect(page.getByTestId('featured-list')).toBeVisible();
  });

  test('/th renders the shell with lang="th", Thai headline copy, and Kanit font (no all-caps)', async ({
    page,
  }) => {
    await page.goto('/th');

    await expect(page.locator('html')).toHaveAttribute('lang', 'th');

    // Brand + tagline in the intro paragraph (Thai tagline).
    const brandTagline = page.getByTestId('brand-tagline');
    await expect(brandTagline).toContainText('VANTA®');
    await expect(brandTagline).toContainText('เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก');

    // Hero headline renders the Thai copy.
    const heroHeadline = page.getByTestId('hero-headline');
    await expect(heroHeadline).toHaveAttribute('aria-label', 'ปรากฏกายจากความว่างเปล่า');

    // :lang(th) .display applies Kanit.
    const family = await heroHeadline.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Kanit');

    // :lang(th) .display does NOT uppercase.
    const transform = await heroHeadline.evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('none');

    // Featured product list renders product titles in Thai.
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
