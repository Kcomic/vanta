import { describe, expect, it } from 'vitest';
import type { LocalizedText } from '@/lib/domain';
import { getLocalizedText } from '@/lib/i18n/localized-text';

const sample: LocalizedText = { en: 'Void Hoodie', th: 'ฮู้ดดี้วอยด์' };

describe('getLocalizedText', () => {
  it('returns the English string for the en locale', () => {
    expect(getLocalizedText(sample, 'en')).toBe('Void Hoodie');
  });

  it('returns the Thai string for the th locale', () => {
    expect(getLocalizedText(sample, 'th')).toBe('ฮู้ดดี้วอยด์');
  });

  it('returns a string for the active locale', () => {
    expect(typeof getLocalizedText(sample, 'en')).toBe('string');
    expect(typeof getLocalizedText(sample, 'th')).toBe('string');
  });
});
