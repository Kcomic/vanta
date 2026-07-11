import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import th from '@/messages/th.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object'
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('message catalogs', () => {
  it('en and th have an identical keyset (no drift)', () => {
    const enKeys = flattenKeys(en).sort();
    const thKeys = flattenKeys(th).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it('every leaf value is a non-empty string in both locales', () => {
    for (const catalog of [en, th]) {
      for (const key of flattenKeys(catalog)) {
        const value = key
          .split('.')
          .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], catalog);
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the marquee words English in both locales (literal Thai reads as "a droplet")', () => {
    expect(en.Drop.marqueeDrop).toBe('DROP');
    expect(th.Drop.marqueeDrop).toBe('DROP');
    expect(en.Drop.marqueeSoldOut).toBe('SOLD OUT');
    expect(th.Drop.marqueeSoldOut).toBe('SOLD OUT');
  });
});
