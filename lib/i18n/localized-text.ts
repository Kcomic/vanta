import type { LocalizedText, Locale } from '@/lib/domain';

/**
 * Resolve a bilingual domain string to the active locale. Use this everywhere a
 * `LocalizedText` is rendered — never index `text[locale]` ad hoc, so the `Locale`
 * type and the en/th keyset stay the single enforced contract.
 */
export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
