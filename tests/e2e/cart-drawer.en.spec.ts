import { test, expect } from '@playwright/test';

// Verifies: add-to-cart opens the drawer, the drawer is a modal dialog,
// Escape closes it and returns focus, and the subtotal shows the THB baht sign.
//
// NOTE: These specs depend on the PDP `add-to-cart` button (Phase 5+).
// Marked test.fixme until the PDP add-to-cart has landed.
test.describe('cart drawer (en)', () => {
  test.fixme(
    true,
    'Requires PDP add-to-cart button (data-testid="add-to-cart") — Phase 5+',
  );

  test('add to cart opens the drawer with the line and THB subtotal', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');

    const addButton = page.getByTestId('add-to-cart');
    await addButton.click();

    // role="dialog" is on the Dialog panel element, not the inner cart-drawer div.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // The cart content wrapper is nested inside the dialog.
    const drawerContent = dialog.getByTestId('cart-drawer');
    await expect(drawerContent).toBeVisible();

    // Money is rendered through formatMoney => baht sign, no decimals.
    await expect(dialog.getByText(/฿[\d,]+/)).toBeVisible();

    // At least one cart line is present.
    await expect(dialog.locator('li[data-variant-id]')).toHaveCount(1);
  });

  test('Escape closes the drawer and returns focus to the trigger', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');
    const addButton = page.getByTestId('add-to-cart');
    await addButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(addButton).toBeFocused();
  });

  test('overlay click closes the drawer', async ({ page }) => {
    await page.goto('/en/product/vanta-core-tee');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // The Dialog backdrop is a button with aria-label="Close"
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
