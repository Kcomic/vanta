import type { Locale } from '@/lib/domain';

/**
 * Grapheme-safe text splitting. NEVER use `.split('')` — it cuts on code points
 * and shatters Thai combining marks (vowel/tone signs) off their base consonant.
 * `Intl.Segmenter` with grapheme granularity returns user-perceived characters,
 * so Thai (and emoji/ZWJ sequences) stay intact for per-character animation.
 */
export function splitGraphemes(text: string, locale: Locale = 'en'): string[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' });
  const result: string[] = [];
  for (const { segment } of segmenter.segment(text)) {
    result.push(segment);
  }
  return result;
}
