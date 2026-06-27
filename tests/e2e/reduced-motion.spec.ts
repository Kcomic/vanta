import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// reduced motion = a real second experience
// All tests in this file run exclusively in the `reduced-motion` Playwright
// project (prefers-reduced-motion: reduce emulated).
// ---------------------------------------------------------------------------

test.describe('reduced motion = a real second experience', () => {
  test('no content element is stranded at opacity:0 on Home (visible-by-default)', async ({
    page,
  }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    const strandedCount = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll(
          'main h1, main h2, main p, main img, main a, main [data-reveal]',
        ),
      );
      return candidates.filter((el) => {
        const style = window.getComputedStyle(el as Element);
        // visibility check: rendered, not display:none, but opacity pinned to 0
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return parseFloat(style.opacity) === 0;
      }).length;
    });

    expect(strandedCount).toBe(0);
  });

  test('hero magnetic CTA does not translate on hover under reduced motion', async ({ page }) => {
    await page.goto('/en');
    // The magnetic CTA is a real link (MagneticLink renders an <a>), not a <button>.
    const cta = page.getByRole('link', { name: /shop|drop/i }).first();
    await cta.hover();
    const transform = await cta.evaluate((el) => window.getComputedStyle(el).transform);
    // identity / none — magnetic effect is inert
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });

  test('card to PDP is an instant cut (no running view-transition animation)', async ({
    page,
  }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('a[href*="/product/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/en\/product\//);

    const running = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    );
    // hard cut => no animations driving the transition
    expect(running).toBe(0);
  });

  test('Thai locale also keeps content visible-by-default', async ({ page }) => {
    await page.goto('/th');
    await page.waitForLoadState('networkidle');
    const stranded = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('main h1, main h2, main p, main img'));
      return els.filter((el) => {
        const s = window.getComputedStyle(el as Element);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        return parseFloat(s.opacity) === 0;
      }).length;
    });
    expect(stranded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PDP View Transition — locale-stable name + reduced-motion hard cut
// ---------------------------------------------------------------------------
test.describe('PDP View Transition — locale-stable + reduced-motion hard cut', () => {
  test('view-transition-name is keyed on product id in both locales', async ({ page }) => {
    await page.goto('/en/product/void-tee');
    const enName = await page
      .locator('[style*="view-transition-name"]')
      .first()
      .evaluate((el) => getComputedStyle(el).viewTransitionName);

    await page.goto('/th/product/void-tee');
    const thName = await page
      .locator('[style*="view-transition-name"]')
      .first()
      .evaluate((el) => getComputedStyle(el).viewTransitionName);

    expect(enName).toMatch(/^product-/);
    expect(thName).toEqual(enName); // identical regardless of locale
  });

  test('reduced motion does not stick content at opacity 0 on PDP', async ({ page }) => {
    await page.goto('/en/product/void-tee');
    // The gallery hero container (carries view-transition-name) must be visible.
    const hero = page.locator('[style*="view-transition-name"]').first();
    await expect(hero).toBeVisible();
    const opacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.99);
  });
});

// ---------------------------------------------------------------------------
// Home — reduced motion supplemental checks
// ---------------------------------------------------------------------------
test.describe('Home — reduced motion', () => {
  test('hero content is visible by default and marquee is static', async ({
    page,
  }) => {
    await page.goto('/en');

    const hero = page.getByTestId('hero');
    await expect(hero).toBeVisible();
    const heroOpacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(heroOpacity)).toBeGreaterThan(0);

    // Countdown still shows a value (static frame) — either ticking node or done node.
    const hasCountdown = await page.getByTestId('countdown').isVisible();
    const hasDone = await page.getByTestId('countdown-done').isVisible();
    expect(hasCountdown || hasDone).toBeTruthy();

    // Marquee strip has no running CSS animation under reduced-motion.
    const strip = page.getByTestId('drop-marquee').locator('> div');
    const animName = await strip.evaluate((el) => getComputedStyle(el).animationName);
    expect(animName).toBe('none');

    await page.screenshot({
      path: 'tests/e2e/__screenshots__/home-drop.reduced.png',
      fullPage: true,
    });
  });
});
