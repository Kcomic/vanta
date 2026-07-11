import type { Locale } from '@/lib/domain';

/**
 * Forces calendar: 'gregory' so the Thai locale never renders the Buddhist
 * era (e.g. 2569 instead of 2026), and `latn` numbering so digits stay
 * Western in both locales.
 */
export function formatDate(iso: string, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-gregory-nu-latn`, {
    calendar: 'gregory',
    numberingSystem: 'latn',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(new Date(iso));
}
