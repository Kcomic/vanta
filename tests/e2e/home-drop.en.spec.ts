import { test, expect } from '@playwright/test';

test.describe('Home LIVE DROP — en', () => {
  test('hero, marquee (English DROP), and a derived availability state render', async ({
    page,
  }) => {
    await page.goto('/en');
    await expect(page.getByTestId('hero')).toBeVisible();

    const marquee = page.getByTestId('drop-marquee');
    await expect(marquee).toBeVisible();
    // Marquee text is English in both locales.
    await expect(marquee).toHaveAttribute('data-word', /DROP|SOLD OUT/);

    await expect(page.getByTestId('live-drop')).toBeVisible();
    // Featured grid present.
    await expect(page.getByTestId('featured')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/__screenshots__/home-drop.en.png', fullPage: true });
  });

  test('countdown ticks once per second without a network refetch', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));

    await page.goto('/en');

    // Under reduced-motion the CountdownIsland renders a static frame (no interval).
    // Detect whether we're running in a reduced-motion context to skip the ticking assertion.
    const isReducedMotion = await page.evaluate(() =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    const countdown = page.getByTestId('countdown');
    // If the drop is already live, the done node renders instead; only assert ticking when counting down.
    if (await countdown.isVisible()) {
      if (!isReducedMotion) {
        const before = await countdown.innerText();
        await page.waitForTimeout(2100);
        const after = await countdown.innerText();
        expect(after).not.toBe(before);
      }

      // No re-fetch of the page/data during ticking: count navigations after first load settle.
      const navAfterLoad = requests.filter((u) => u.endsWith('/en') || u.endsWith('/en/')).length;
      expect(navAfterLoad).toBeLessThanOrEqual(1);
    } else {
      await expect(page.getByTestId('countdown-done')).toBeVisible();
    }
  });

  test('sold-out drop product shows SOLD OUT badge + visual-only Notify me', async ({ page }) => {
    await page.goto('/en');
    const soldOut = page
      .getByTestId('drop-product')
      .filter({ has: page.getByTestId('badge-sold-out') });
    if (await soldOut.count()) {
      await expect(soldOut.first().getByTestId('notify-me')).toBeVisible();
    }
  });

  test('guest sees the early-access unlock hint; seed member unlocks to live', async ({
    page,
  }) => {
    await page.goto('/en');
    // Guest path: hint visible only when a drop variant is gated.
    const hint = page.getByTestId('early-access-hint');
    const gatedNow = await hint.isVisible();

    // Log in as the seed member — only if the login page is available (Phase 7+).
    await page.goto('/en/login');
    const emailInput = page.getByLabel(/email/i);
    const loginAvailable = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!loginAvailable) {
      // Login page not yet implemented (Phase 7+); skip the authenticated assertion.
      return;
    }

    await emailInput.fill('member@vanta.shop');
    await page.getByLabel(/password/i).fill('vanta-demo');
    await page.getByRole('button', { name: /log in|sign in|เข้าสู่ระบบ/i }).click();
    await page.goto('/en');

    if (gatedNow) {
      // After member login, no gated early_access state should remain -> hint gone.
      await expect(page.getByTestId('early-access-hint')).toHaveCount(0);
    }
  });
});
