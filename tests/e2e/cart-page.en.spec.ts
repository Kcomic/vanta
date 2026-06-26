import { test, expect } from '@playwright/test';

// Verifies the /cart page renders server-truth rows, a THB subtotal, and that
// updating quantity reconciles from the action return value.
test.describe('cart page (en)', () => {
  test('shows empty state with no items', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/cart');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  // Phase 4 dependency: add-to-cart button on PDP does not exist yet.
  test.fixme('add via PDP then /cart shows the line with a THB subtotal', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    await page.goto('/en/cart');
    await expect(page.getByTestId('cart-list').locator('li[data-variant-id]')).toHaveCount(1);
    await expect(page.getByTestId('cart-subtotal')).toHaveText(/฿[\d,]+/);
  });

  // Phase 4 dependency: add-to-cart button on PDP does not exist yet.
  test.fixme(
    'increasing quantity updates the subtotal from server truth',
    async ({ page }) => {
      await page.goto('/en/product/vanta-core-tee');
      await page.getByTestId('add-to-cart').click();
      await page.goto('/en/cart');

      const subtotal = page.getByTestId('cart-subtotal');
      const before = await subtotal.textContent();
      await page.getByRole('button', { name: 'Increase quantity' }).first().click();
      await expect(subtotal).not.toHaveText(before ?? '');
    },
  );
});
