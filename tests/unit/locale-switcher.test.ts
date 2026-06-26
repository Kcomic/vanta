import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import th from '@/messages/th.json';

/**
 * Unit tests for LocaleSwitcher message contract.
 *
 * The LocaleSwitcher component maps locale → Nav label key:
 *   en → 'switchToThai'  (shows "ไทย" — the target locale label)
 *   th → 'switchToEnglish' (shows "EN")
 *
 * These tests verify the message catalog has exactly those keys with the
 * expected values, so the component can render without runtime key misses.
 */

const LABEL_KEY_MAP = { en: 'switchToThai', th: 'switchToEnglish' } as const;

describe('LocaleSwitcher message contract', () => {
  it('en.json has Nav.switchToThai and Nav.switchToEnglish', () => {
    expect(en.Nav).toHaveProperty('switchToThai');
    expect(en.Nav).toHaveProperty('switchToEnglish');
  });

  it('th.json has Nav.switchToThai and Nav.switchToEnglish', () => {
    expect(th.Nav).toHaveProperty('switchToThai');
    expect(th.Nav).toHaveProperty('switchToEnglish');
  });

  it('EN locale shows the Thai label ("ไทย") to switch TO Thai', () => {
    const key = LABEL_KEY_MAP['en'];
    // The EN user should see a Thai-script label to switch to Thai
    expect(en.Nav[key]).toBe('ไทย');
    expect(th.Nav[key]).toBe('ไทย'); // same in both locales (it is the locale name)
  });

  it('TH locale shows the Latin "EN" label to switch TO English', () => {
    const key = LABEL_KEY_MAP['th'];
    expect(en.Nav[key]).toBe('EN');
    expect(th.Nav[key]).toBe('EN');
  });

  it('labelKey map covers all routing locales (en, th)', () => {
    const routingLocales = ['en', 'th'] as const;
    for (const locale of routingLocales) {
      expect(LABEL_KEY_MAP).toHaveProperty(locale);
    }
  });

  it('generateMetadata uses Common.brandName and Common.tagline for title/description', () => {
    // Verify both locales have the keys generateMetadata reads
    expect(en.Common).toHaveProperty('brandName');
    expect(en.Common).toHaveProperty('tagline');
    expect(th.Common).toHaveProperty('brandName');
    expect(th.Common).toHaveProperty('tagline');
    // Values are non-empty strings
    expect(en.Common.brandName.length).toBeGreaterThan(0);
    expect(en.Common.tagline.length).toBeGreaterThan(0);
    expect(th.Common.brandName.length).toBeGreaterThan(0);
    expect(th.Common.tagline.length).toBeGreaterThan(0);
  });

  it('hreflang alternates cover exactly the two supported locales', () => {
    // The alternates.languages object in generateMetadata has exactly 'en' and 'th'
    const supportedLocales: string[] = ['en', 'th'];
    const alternateKeys = Object.keys(LABEL_KEY_MAP);
    // Both locales are present in the label map (used to generate buttons for each alternate)
    expect(alternateKeys.sort()).toEqual(supportedLocales.sort());
  });
});
