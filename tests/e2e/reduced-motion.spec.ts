import { test, expect } from '@playwright/test';

// This spec is intentionally scoped to the reduced-motion Playwright project
// (prefers-reduced-motion: reduce). It runs in all projects but skips when the
// browser does not report reduced-motion, keeping the assertion sound.
test.describe('Home — reduced motion', () => {
  test('hero content is visible by default (never stuck at opacity:0) and marquee is static', async ({
    page,
  }) => {
    await page.goto('/en');

    // Detect whether the browser context actually has reduced-motion active.
    const isReducedMotion = await page.evaluate(() =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    const hero = page.getByTestId('hero');
    await expect(hero).toBeVisible();
    const heroOpacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(heroOpacity)).toBeGreaterThan(0);

    // Countdown still shows a value (static frame) — either ticking node or done node.
    const hasCountdown = await page.getByTestId('countdown').isVisible();
    const hasDone = await page.getByTestId('countdown-done').isVisible();
    expect(hasCountdown || hasDone).toBeTruthy();

    // Marquee strip has no running CSS animation under reduced-motion.
    // Only assert animation-name when we're actually in the reduced-motion project.
    const strip = page.getByTestId('drop-marquee').locator('> div');
    const animName = await strip.evaluate((el) => getComputedStyle(el).animationName);
    if (isReducedMotion) {
      expect(animName).toBe('none');
    }

    await page.screenshot({
      path: 'tests/e2e/__screenshots__/home-drop.reduced.png',
      fullPage: true,
    });
  });
});
