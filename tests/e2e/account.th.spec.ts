import { test, expect } from '@playwright/test';

async function loginAsMember(page: import('@playwright/test').Page) {
  await page.goto('/th/login');
  await page.getByLabel('อีเมล').fill('member@vanta.shop');
  await page.getByLabel('รหัสผ่าน').fill('vanta-demo');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).toHaveURL(/\/th\/account$/);
}

test.describe('account (th)', () => {
  test('saved address renders country-first with no US State/ZIP labels', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/th/account/addresses');

    const card = page.getByRole('group').or(page.locator('address')).first();
    const text = await page.locator('address').innerText();

    // country-first: ISO country code precedes the postal code in the DOM order
    const countryIdx = text.indexOf('TH');
    const postalIdx = text.indexOf('10110');
    expect(countryIdx).toBeGreaterThanOrEqual(0);
    expect(postalIdx).toBeGreaterThan(countryIdx);

    // no US labels leak into the rendered address
    await expect(page.locator('address')).not.toContainText(/State/i);
    await expect(page.locator('address')).not.toContainText(/ZIP/i);
    expect(card).toBeTruthy();
  });

  test('settings shows the member profile correctly', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/th/account/settings');
    await expect(page.getByText('member@vanta.shop')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ตั้งค่า');
  });
});
