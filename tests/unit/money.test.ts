import { describe, it, expect } from 'vitest';
import { formatMoney } from '@/lib/format/money';
import type { Money } from '@/lib/domain';

const thb = (amount: number): Money => ({ amount, currency: 'THB' });

/** Fold NBSP (U+00A0) and NARROW NBSP (U+202F) to a regular space. */
const norm = (s: string) => s.replace(/[  ]/g, ' ');

describe('formatMoney (THB, no decimals)', () => {
  it('groups integer baht and shows the ฿ sign — en locale (space/symbol-tolerant)', () => {
    const out = norm(formatMoney(thb(199000), 'en'));
    expect(out).toContain('฿'); // baht sign present
    expect(out).toMatch(/1[,\s]?990/); // grouped 1,990 baht (199000 satang / 100)
    expect(out).not.toMatch(/\.\d/); // NO decimals for THB
  });

  it('groups integer baht and shows the ฿ sign — th locale (Western digits via latn)', () => {
    const out = norm(formatMoney(thb(199000), 'th'));
    expect(out).toMatch(/1[,\s]?990/);
    expect(out).toContain('฿');
    expect(out).not.toMatch(/\.\d/);
  });

  it('produces identical digit output in both locales for the same amount', () => {
    const en = norm(formatMoney(thb(199000), 'en'));
    const th = norm(formatMoney(thb(199000), 'th'));
    // Both should have the same digit grouping (Western digits enforced via -u-nu-latn)
    expect(en.replace(/[^\d,]/g, '')).toBe(th.replace(/[^\d,]/g, ''));
  });

  it('groups thousands for larger amounts', () => {
    const out = norm(formatMoney(thb(1299000), 'en'));
    expect(out).toContain('฿');
    expect(out).toMatch(/12[,\s]?990/);
    expect(out).not.toMatch(/\.\d/);
  });

  it('renders zero baht without decimals', () => {
    const out = norm(formatMoney(thb(0), 'en'));
    expect(out).toContain('฿');
    expect(out).toContain('0');
    expect(out).not.toMatch(/\.\d/);
  });

  it('converts integer minor units (satang) to whole baht without decimals', () => {
    // 4900 satang = 49 baht exactly
    const out = norm(formatMoney(thb(4900), 'en'));
    expect(out).toContain('฿');
    expect(out).toContain('49');
    expect(out).not.toMatch(/\.\d/);
  });
});
