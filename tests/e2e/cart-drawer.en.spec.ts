import { test, expect } from '@playwright/test';

// Verifies: add-to-cart opens the drawer, the drawer is a modal dialog,
// Escape closes it and returns focus, and the subtotal shows the THB baht sign.
//
// NOTE: These specs depend on the PDP `add-to-cart` button (Phase 4).
// Marked test.fixme until Phase 4 has landed.
test.describe('cart drawer (en)', () => {
  test.fixme(
    true,
    'Requires Phase 4 PDP add-to-cart button (data-testid="add-to-cart")',
  );

  test('add to cart opens the drawer with the line and THB subtotal', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');

    const addButton = page.getByTestId('add-to-cart');
    await addButton.click();

    const drawer = page.getByTestId('cart-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    // Money is rendered through formatMoney => baht sign, no decimals.
    await expect(drawer.getByText(/฿[\d,]+/)).toBeVisible();

    // At least one cart line is present.
    await expect(drawer.locator('li[data-variant-id]')).toHaveCount(1);
  });

  test('Escape closes the drawer and returns focus to the trigger', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');
    const addButton = page.getByTestId('add-to-cart');
    await addButton.click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('cart-drawer')).toBeHidden();
    await expect(addButton).toBeFocused();
  });

  test('overlay click closes the drawer', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    // The Dialog backdrop is a button with aria-label="Close"
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByTestId('cart-drawer')).toBeHidden();
  });
});
