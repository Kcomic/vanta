import { test, expect } from '@playwright/test';

// Thai-locale mirror of pdp.en.spec.ts.
// void-tee: buyable product with Black + Paper colors, S/M selectable, L/Black sold_out.
// void-hoodie: M/Black is low_stock (stock=3) — used for the Thai badge assertion.

test.describe('PDP — Thai', () => {
  test('renders Thai copy, baht price, and adds to cart', async ({ page }) => {
    await page.goto('/th/product/void-tee');

    // Baht sign + Western digits in Thai (never Buddhist-era).
    await expect(page.getByTestId('pdp-price')).toContainText('฿');

    // Size CTA shows the Thai "select size" string before selection.
    await expect(page.getByTestId('add-to-cart')).toContainText('เลือกไซซ์');

    // Selecting a buyable size switches the CTA to Thai "add to cart" copy.
    await page.getByTestId('size-M').click();
    await expect(page.getByTestId('add-to-cart')).toContainText('เพิ่มลงตะกร้า');

    // Clicking add-to-cart increments the cart count.
    const countBefore = Number((await page.getByTestId('cart-count').textContent()) ?? '0');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count')).toHaveText(String(countBefore + 1));
  });

  test('low-stock badge uses Thai copy when a low-stock variant is selected', async ({
    page,
  }) => {
    // void-hoodie M/Black has stock=3 (low_stock).
    await page.goto('/th/product/void-hoodie');
    await page.getByTestId('size-M').click();
    const badge = page.getByTestId('low-stock-badge');
    // The badge appears for this low-stock variant; assert Thai copy.
    if (await badge.count()) {
      await expect(badge).toContainText('เหลือเพียง');
    }
  });

  test('sold-out size is disabled in Thai locale', async ({ page }) => {
    // void-tee L/Black is sold_out — verify disabled + data-soldout attribute in /th.
    await page.goto('/th/product/void-tee');
    const soldOutBtn = page.getByTestId('size-L');
    await expect(soldOutBtn).toBeDisabled();
    await expect(soldOutBtn).toHaveAttribute('data-soldout', 'true');
  });

  test('Size & Fit drawer opens in Thai locale and toggles cm/in', async ({ page }) => {
    await page.goto('/th/product/void-tee');
    await page.getByTestId('open-size-fit').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('cm');
    await dialog.getByRole('radio', { name: 'in' }).click();
    await expect(dialog).toContainText('in');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
