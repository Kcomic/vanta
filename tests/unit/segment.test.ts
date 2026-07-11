import { describe, expect, it } from 'vitest';
import { splitGraphemes } from '@/lib/motion/segment';

// U+0E01 ก (THAI CHARACTER KO KAI) + U+0E34 ิ (THAI CHARACTER SARA I, a combining
// mark) + U+0E19 น (THAI CHARACTER NO NU). The mark ิ MUST stay welded to ก.
const THAI = 'กิน';

describe('splitGraphemes', () => {
  it('keeps Thai combining marks welded to their base consonant', () => {
    const graphemes = splitGraphemes(THAI, 'th');
    // 3 code points collapse into 2 user-perceived characters: "กิ" and "น".
    expect(graphemes).toEqual(['กิ', 'น']);
    // The combining mark is never a standalone element.
    expect(graphemes).not.toContain('ิ');
  });

  it('is lossless — joining the segments reproduces the input', () => {
    expect(splitGraphemes(THAI, 'th').join('')).toBe(THAI);
    expect(splitGraphemes('DROP', 'en').join('')).toBe('DROP');
  });

  it('proves the forbidden naive split would break the same string', () => {
    // This is the bug splitGraphemes exists to prevent: .split('') cuts on
    // code points, orphaning the combining mark as its own element.
    const naive = THAI.split('');
    expect(naive).toEqual(['ก', 'ิ', 'น']);
    expect(naive).toContain('ิ'); // orphaned mark — a Thai reviewer catches this instantly
    // splitGraphemes must NOT reproduce that orphaning.
    expect(splitGraphemes(THAI, 'th')).not.toEqual(naive);
  });

  it('splits plain Latin into single characters', () => {
    expect(splitGraphemes('VANTA', 'en')).toEqual(['V', 'A', 'N', 'T', 'A']);
  });
});
