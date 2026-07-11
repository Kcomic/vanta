import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireMember } from '@/lib/services/auth-service';
import { orders } from '@/lib/data';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { Locale } from '@/lib/domain';

export default async function AccountOrdersPage() {
  const user = await requireMember();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Account');

  const userOrders = (await orders.listByUser(user.id))
    .slice()
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));

  return (
    <main className="flex flex-col gap-8">
      <h1 className="display font-display text-3xl text-paper">{t('ordersTitle')}</h1>

      {userOrders.length === 0 && <p className="font-body text-smoke-300">{t('ordersEmpty')}</p>}

      {userOrders.map((order) => (
        <article key={order.id} className="border border-smoke-700 p-4">
          <header className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm">
            <span className="text-paper">{order.id}</span>
            <span className="text-smoke-300">
              {t('orderPlaced')}: {formatDate(order.placedAt, locale)}
            </span>
            <span className="uppercase tracking-tight text-blaze">
              {t('orderStatus')}: {order.status}
            </span>
          </header>

          <ul className="mt-4 flex flex-col gap-4">
            {order.lineItems.map((li) => (
              <li key={li.variantId} className="flex items-center gap-4">
                <Image
                  src={li.imageUrl}
                  alt={li.title[locale]}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-cover"
                />
                <div className="flex flex-col">
                  <span className="font-body text-paper">{li.title[locale]}</span>
                  <span className="font-mono text-xs text-smoke-300">
                    {li.optionValues.color} / {li.optionValues.size} · {li.sku}
                  </span>
                </div>
                <span className="ml-auto font-mono text-sm text-paper">
                  {li.quantity} × {formatMoney(li.unitPrice, locale)}
                </span>
              </li>
            ))}
          </ul>

          <footer className="mt-4 flex justify-end font-mono text-sm text-paper">
            {t('orderTotal')}: {formatMoney(order.totals.total, locale)}
          </footer>
        </article>
      ))}
    </main>
  );
}
