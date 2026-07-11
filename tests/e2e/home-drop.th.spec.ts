import { test, expect } from '@playwright/test';

test.describe('Home LIVE DROP — th', () => {
  test('renders Thai hero but English marquee word', async ({ page }) => {
    await page.goto('/th');
    await expect(page.getByTestId('hero')).toBeVisible();
    const marquee = page.getByTestId('drop-marquee');
    // Constraint: marquee is English DROP/SOLD OUT in BOTH locales.
    await expect(marquee).toHaveAttribute('data-word', /DROP|SOLD OUT/);
    await expect(page.getByTestId('live-drop')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/__screenshots__/home-drop.th.png', fullPage: true });
  });

  test('low-stock badge shows a Western-digit count in Thai locale', async ({ page }) => {
    await page.goto('/th');
    const low = page.getByTestId('badge-low-stock');
    if (await low.count()) {
      // Western digits in both locales -> the rendered count contains an ASCII digit.
      await expect(low.first()).toHaveText(/[0-9]/);
    }
  });
});
