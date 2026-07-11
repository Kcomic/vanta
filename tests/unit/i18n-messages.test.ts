import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import th from '@/messages/th.json';

/** Recursively collect dotted key paths so we compare structure, not values. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return keyPaths(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('i18n message catalogs', () => {
  it('th.json mirrors the exact keyset of en.json', () => {
    const enKeys = keyPaths(en as Record<string, unknown>).sort();
    const thKeys = keyPaths(th as Record<string, unknown>).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it('has the shell namespace used by the [locale] layout', () => {
    expect(en).toHaveProperty('Shell.tagline');
    expect(th).toHaveProperty('Shell.tagline');
  });
});
