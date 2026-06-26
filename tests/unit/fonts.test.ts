import { describe, expect, it } from 'vitest';
import { fontClassNames } from '@/lib/fonts';

describe('fontClassNames', () => {
  it('is a non-empty space-joined class string', () => {
    expect(typeof fontClassNames).toBe('string');
    expect(fontClassNames.trim().length).toBeGreaterThan(0);
  });

  it('binds all five font CSS variables', () => {
    expect(fontClassNames).toContain('--font-display-en');
    expect(fontClassNames).toContain('--font-display-th');
    expect(fontClassNames).toContain('--font-geist-sans'); // -> aliased to --font-body in globals.css
    expect(fontClassNames).toContain('--font-body-th');
    expect(fontClassNames).toContain('--font-geist-mono'); // -> aliased to --font-mono in globals.css
  });
});
