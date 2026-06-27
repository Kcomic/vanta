import { test, expect } from '@playwright/test';

test.describe('TH checkout → confirmation', () => {
  test('declining card shows error, succeeding card reaches confirmation', async ({ page }) => {
    await page.goto('/th/shop');
    await page.getByTestId('product-card').first().click();
    // Select the first in-stock size — add-to-cart is disabled until a size is chosen.
    await page.locator('[data-testid^="size-"]:not([disabled])').first().click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count-value')).not.toHaveText('0');

    await page.goto('/th/checkout');
    await expect(page.getByTestId('order-summary')).toBeVisible();
    await expect(page.getByTestId('summary-total')).toContainText('฿');

    await page.getByTestId('field-email').fill('shopper@vanta.shop');
    await page.getByTestId('field-fullName').fill('สมชาย ใจดี');
    await page.getByTestId('field-line1').fill('99 ถนนสุขุมวิท');
    await page.getByTestId('field-city').fill('กรุงเทพมหานคร');
    await page.getByTestId('field-postalCode').fill('10110');
    await page.getByTestId('field-country').fill('TH');

    await page.getByTestId('pay-token-decline').check();
    await page.getByTestId('checkout-pay').click();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
    await expect(page).toHaveURL(/\/th\/checkout$/);

    await page.getByTestId('pay-token-ok').check();
    await page.getByTestId('checkout-pay').click();
    await expect(page).toHaveURL(/\/th\/checkout\/ord_/);
    await expect(page.getByTestId('confirm-total')).toContainText('฿');
    // Gregory year, never Buddhist-era 2567.
    await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
    await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/2567/);
  });

  test('seeded order renders instantly with gregory date in Thai', async ({ page }) => {
    await page.goto('/th/checkout/ord_seed_demo');
    await expect(page.getByTestId('confirm-order-id')).toHaveText('ord_seed_demo');
    await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
    await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/2567/);
  });
});
