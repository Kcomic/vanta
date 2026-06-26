import { test, expect } from '@playwright/test';

test.describe('bilingual shell renders at /en and /th', () => {
  test('/en renders the shell with lang="en" and the EN display font', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('brand')).toHaveText('VANTA®');
    await expect(page.getByTestId('tagline')).toHaveText('Bangkok-born. Globally worn.');
    await expect(page.getByTestId('locale-stamp')).toHaveText('/en');

    // :lang(en) .display -> --font-display-en (Clash Display). Assert the resolved family contains it.
    const family = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Clash Display');

    // :lang(en) .display uppercases.
    const transform = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('uppercase');
  });

  test('/th renders the shell with lang="th" and the Thai display font (no all-caps)', async ({
    page,
  }) => {
    await page.goto('/th');

    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
    await expect(page.getByTestId('brand')).toHaveText('VANTA®');
    await expect(page.getByTestId('tagline')).toHaveText('เกิดที่กรุงเทพฯ ใส่ได้ทั่วโลก');
    await expect(page.getByTestId('locale-stamp')).toHaveText('/th');

    const family = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('Kanit');

    // :lang(th) .display does NOT uppercase.
    const transform = await page
      .getByTestId('brand')
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe('none');
  });

  test('the bare root redirects to the default locale (/en)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
  });
});
