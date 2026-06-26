import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/format/date';

const ISO = '2026-06-27T09:30:00.000Z';

describe('formatDate', () => {
  it('formats with the gregory calendar in English (Western year 2026)', () => {
    const out = formatDate(ISO, 'en');
    expect(out).toContain('2026');
    expect(out).not.toContain('2569'); // Buddhist-era trap
  });

  it('uses the gregory calendar in Thai — NEVER the Buddhist era 2569', () => {
    const out = formatDate(ISO, 'th');
    expect(out).toContain('2026');
    expect(out).not.toContain('2569');
  });

  it('uses Western digits in the Thai locale (no Thai numerals)', () => {
    const out = formatDate(ISO, 'th');
    // No Thai digit characters U+0E50–U+0E59 anywhere in the output.
    expect(/[๐-๙]/.test(out)).toBe(false);
    expect(/\d/.test(out)).toBe(true);
  });
});
