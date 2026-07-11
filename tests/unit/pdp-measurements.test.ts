import { describe, it, expect } from 'vitest';
import { toUnit, formatMeasure } from '@/lib/pdp/measurements';

describe('toUnit', () => {
  it('returns rounded integer cm unchanged', () => {
    expect(toUnit(52, 'cm')).toBe(52);
    expect(toUnit(52.4, 'cm')).toBe(52);
  });
  it('converts cm to inches at 1 decimal place', () => {
    expect(toUnit(52, 'in')).toBe(20.5); // 52 / 2.54 = 20.47 -> 20.5
    expect(toUnit(71, 'in')).toBe(28); // 71 / 2.54 = 27.95 -> 28.0
  });
});

describe('formatMeasure', () => {
  it('suffixes the unit (Western digits, no Buddhist era concerns)', () => {
    expect(formatMeasure(52, 'cm')).toBe('52 cm');
    expect(formatMeasure(52, 'in')).toBe('20.5 in');
  });
});
