import type { Money, Locale } from '@/lib/domain';

/**
 * Format a Money value (integer minor units / satang) to a localised price string.
 *
 * THB is displayed with NO fraction digits: ฿1,990 (not ฿19.90 or ฿1990.00).
 * Division by 100 converts satang to baht.
 *
 * Both locales force `nu-latn` (Western/Latin digits) so `th` never produces
 * Thai numerals — output is locale-stable for display and test assertions.
 *
 * `currencyDisplay: 'narrowSymbol'` emits the compact ฿ sign on both locales.
 */
export function formatMoney(money: Money, locale: Locale): string {
  const baht = money.amount / 100;
  const formatter = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    style: 'currency',
    currency: money.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(baht);
}
