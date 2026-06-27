import { test, expect } from '@playwright/test';

test.describe('auth (en)', () => {
  test('demo creds are visible on /login', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByTestId('demo-email')).toHaveText('member@vanta.shop');
    await expect(page.getByTestId('demo-password')).toHaveText('vanta-demo');
  });

  test('bad credentials show an inline error and stay on /login', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill('member@vanta.shop');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test('valid demo creds log in and land on the member dashboard', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill('member@vanta.shop');
    await page.getByLabel('Password').fill('vanta-demo');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/account$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ploy');
  });

  test('a guest hitting /account is redirected to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
  });
});
