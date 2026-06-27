import { test, expect } from '@playwright/test';

test.describe('EN checkout → confirmation', () => {
  test('declining card shows error, succeeding card reaches confirmation', async ({ page }) => {
    // Seed the cart by adding a buyable variant from a PDP.
    await page.goto('/en/shop');
    await page.getByTestId('product-card').first().click();
    // Select the first in-stock size — add-to-cart is disabled until a size is chosen.
    await page.locator('[data-testid^="size-"]:not([disabled])').first().click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count-value')).not.toHaveText('0');

    await page.goto('/en/checkout');
    await expect(page.getByTestId('order-summary')).toBeVisible();
    await expect(page.getByTestId('summary-total')).toContainText('฿');

    // Fill the form.
    await page.getByTestId('field-email').fill('shopper@vanta.shop');
    await page.getByTestId('field-fullName').fill('Somchai Jaidee');
    await page.getByTestId('field-line1').fill('99 Sukhumvit Rd');
    await page.getByTestId('field-city').fill('Bangkok');
    await page.getByTestId('field-postalCode').fill('10110');
    await page.getByTestId('field-country').fill('TH');

    // Declining card first.
    await page.getByTestId('pay-token-decline').check();
    await page.getByTestId('checkout-pay').click();
    await expect(page.getByTestId('checkout-error')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/checkout$/);

    // Succeeding card → confirmation.
    await page.getByTestId('pay-token-ok').check();
    await page.getByTestId('checkout-pay').click();
    await expect(page).toHaveURL(/\/en\/checkout\/ord_/);
    await expect(page.getByTestId('confirm-total')).toContainText('฿');
    await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
  });

  test('seeded order renders instantly with gregory date', async ({ page }) => {
    await page.goto('/en/checkout/ord_seed_demo');
    await expect(page.getByTestId('confirm-order-id')).toHaveText('ord_seed_demo');
    await expect(page.getByTestId('confirm-placed-at')).toHaveText(/\b20\d{2}\b/);
    await expect(page.getByTestId('confirm-placed-at')).not.toHaveText(/25\d{2}/);
  });
});
