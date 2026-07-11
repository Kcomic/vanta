import { test, expect } from '@playwright/test';

// Verifies the /cart page renders server-truth rows, a THB subtotal, and that
// updating quantity reconciles from the action return value.
test.describe('cart page (en)', () => {
  test('shows empty state with no items', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/cart');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('add via PDP then /cart shows the line with a THB subtotal', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/product/void-tee');
    // Add-to-cart is size-gated: pick the first selectable size first.
    await page.locator('[data-testid^="size-"]:not([disabled])').first().click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    await page.goto('/en/cart');
    await expect(page.getByTestId('cart-list').locator('li[data-variant-id]')).toHaveCount(1);
    await expect(page.getByTestId('cart-subtotal')).toHaveText(/฿[\d,]+/);
  });

  test('increasing quantity updates the subtotal from server truth', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/product/void-tee');
    await page.locator('[data-testid^="size-"]:not([disabled])').first().click();
    await page.getByTestId('add-to-cart').click();
    // Wait for the add Server Action to complete (drawer opens) so the cart cookie is set
    // before we navigate — otherwise /cart can render the empty state.
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    await page.goto('/en/cart');

    const subtotal = page.getByTestId('cart-subtotal');
    const before = await subtotal.textContent();
    await page.getByRole('button', { name: 'Increase quantity' }).first().click();
    await expect(subtotal).not.toHaveText(before ?? '');
  });
});
