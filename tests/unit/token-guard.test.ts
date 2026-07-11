import { describe, it, expect } from 'vitest';
import { isColorAllowedOnSurface, assertColorOnSurface } from '@/lib/motion/token-guard';

describe('token guard', () => {
  it('forbids lime on paper (1.05:1 contrast)', () => {
    expect(isColorAllowedOnSurface('lime', 'paper')).toBe(false);
    expect(() => assertColorOnSurface('lime', 'paper')).toThrow(/lime.*paper/i);
  });

  it('allows lime on dark (lime-on-dark ONLY)', () => {
    expect(isColorAllowedOnSurface('lime', 'dark')).toBe(true);
    expect(() => assertColorOnSurface('lime', 'dark')).not.toThrow();
  });

  it('forbids raw blaze on paper (3.23:1 fails AA)', () => {
    expect(isColorAllowedOnSurface('blaze', 'paper')).toBe(false);
  });

  it('allows blaze-on-light on paper (AA-safe darker variant)', () => {
    expect(isColorAllowedOnSurface('blaze-on-light', 'paper')).toBe(true);
  });

  it('allows blaze on dark', () => {
    expect(isColorAllowedOnSurface('blaze', 'dark')).toBe(true);
  });
});
