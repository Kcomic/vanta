import type { Money, Locale } from '@/lib/domain';
import { formatMoney } from '@/lib/format/money';
import { getTranslations } from 'next-intl/server';

export type OrderSummaryLine = {
  title: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
};

export type OrderSummaryProps = {
  items: OrderSummaryLine[];
  subtotal: Money;
  shipping: Money;
  total: Money;
  locale: Locale;
};

export async function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  locale,
}: OrderSummaryProps) {
  const t = await getTranslations('checkout');
  return (
    <aside
      data-testid="order-summary"
      className="rounded-lg bg-smoke-900 p-6 text-paper lg:sticky lg:top-24"
    >
      <h2 className="display text-xl">{t('summaryTitle')}</h2>
      <ul className="mt-6 space-y-4">
        {items.map((line) => (
          <li key={line.sku} className="flex items-baseline justify-between gap-4">
            <span className="text-sm">
              {line.title}
              <span className="ml-2 font-mono text-xs text-smoke-300">×{line.quantity}</span>
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatMoney(
                { amount: line.unitPrice.amount * line.quantity, currency: 'THB' },
                locale,
              )}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-smoke-700 pt-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-smoke-300">{t('subtotal')}</dt>
          <dd data-testid="summary-subtotal" className="font-mono tabular-nums">
            {formatMoney(subtotal, locale)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-smoke-300">{t('shipping')}</dt>
          <dd data-testid="summary-shipping" className="font-mono tabular-nums">
            {formatMoney(shipping, locale)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-smoke-700 pt-2 text-base">
          <dt className="display">{t('total')}</dt>
          <dd data-testid="summary-total" className="font-mono tabular-nums text-lime">
            {formatMoney(total, locale)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
