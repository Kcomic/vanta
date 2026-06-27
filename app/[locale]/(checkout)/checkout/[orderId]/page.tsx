import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/domain';
import { orders } from '@/lib/data';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import { Link } from '@/lib/i18n/navigation';

type Params = { locale: Locale; orderId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { orderId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'confirmation' });
  return {
    title: `${t('orderNumber')} ${orderId} — VANTA®`,
    openGraph: {
      title: t('shareTitle'),
      description: t('ogTagline'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('shareTitle'),
      description: t('ogTagline'),
    },
  };
}

export default async function ConfirmationPage({ params }: { params: Promise<Params> }) {
  const { orderId, locale } = await params;
  const order = await orders.getById(orderId);
  if (!order) notFound();

  const t = await getTranslations('confirmation');
  const addr = order.shippingAddress;

  return (
    <main className="mx-auto max-w-shell px-6 py-20">
      <div className="mx-auto max-w-2xl rounded-xl bg-ink p-10 text-paper">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime">VANTA®</p>
        <h1 className="display mt-4 text-4xl">{t('heading')}</h1>
        <p className="mt-3 text-smoke-300">{t('thanks')}</p>

        <dl className="mt-8 grid grid-cols-2 gap-y-3 border-y border-smoke-700 py-6 text-sm">
          <dt className="text-smoke-300">{t('orderNumber')}</dt>
          <dd data-testid="confirm-order-id" className="text-right font-mono">
            {order.id}
          </dd>
          <dt className="text-smoke-300">{t('placedOn')}</dt>
          <dd data-testid="confirm-placed-at" className="text-right font-mono">
            {formatDate(order.placedAt, locale)}
          </dd>
        </dl>

        <ul className="mt-6 space-y-4">
          {order.lineItems.map((li) => (
            <li key={li.variantId} className="flex items-center gap-4">
              {li.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={li.imageUrl}
                  alt={li.title[locale]}
                  width={56}
                  height={70}
                  className="rounded object-cover"
                />
              )}
              <span className="flex-1 text-sm">
                {li.title[locale]}
                <span className="ml-2 font-mono text-xs text-smoke-300">
                  {li.optionValues.size} · {li.optionValues.color} · ×{li.quantity}
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {formatMoney(
                  { amount: li.unitPrice.amount * li.quantity, currency: 'THB' },
                  locale,
                )}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 border-t border-smoke-700 pt-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-smoke-300">{t('subtotal')}</dt>
            <dd className="font-mono tabular-nums">
              {formatMoney(order.totals.subtotal, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-smoke-300">{t('shipping')}</dt>
            <dd className="font-mono tabular-nums">
              {formatMoney(order.totals.shipping, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-smoke-700 pt-2 text-base">
            <dt className="display">{t('total')}</dt>
            <dd data-testid="confirm-total" className="font-mono tabular-nums text-lime">
              {formatMoney(order.totals.total, locale)}
            </dd>
          </div>
        </dl>

        <div className="mt-8 text-sm">
          <p className="text-smoke-300">{t('shipTo')}</p>
          <address className="mt-1 not-italic">
            {addr.fullName}
            <br />
            {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ''}
            <br />
            {addr.city} {addr.postalCode}
            <br />
            {addr.country}
          </address>
        </div>

        <Link
          href="/shop"
          className="mt-10 inline-block rounded-md bg-paper px-6 py-3 font-mono uppercase tracking-widest text-ink"
        >
          {t('continue')}
        </Link>
      </div>
    </main>
  );
}
