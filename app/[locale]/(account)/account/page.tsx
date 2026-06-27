import { getLocale, getTranslations } from 'next-intl/server';
import { requireMember } from '@/lib/services/auth-service';
import { orders } from '@/lib/data';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { Locale } from '@/lib/domain';
import { Link } from '@/lib/i18n/navigation';

export default async function AccountDashboardPage() {
  const user = await requireMember();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Account');

  const userOrders = await orders.listByUser(user.id);
  const recent = userOrders.slice().sort((a, b) => b.placedAt.localeCompare(a.placedAt))[0];

  return (
    <main className="flex flex-col gap-8">
      <h1 className="display font-display text-3xl text-paper">
        {t('dashTitle', { name: user.name })}
      </h1>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-body text-sm text-paper">
        <dt className="text-smoke-500">{t('dashRole')}</dt>
        <dd className="font-mono uppercase tracking-tight text-lime">{user.role}</dd>
      </dl>

      {recent && (
        <section className="border border-smoke-700 p-4">
          <h2 className="font-mono text-xs uppercase tracking-tight text-smoke-300">
            {t('dashRecentOrder')}
          </h2>
          <Link
            href={`/account/orders`}
            className="mt-2 inline-block font-display text-xl text-paper hover:text-blaze"
          >
            {recent.id}
          </Link>
          <p className="mt-1 font-mono text-sm text-smoke-300">
            {formatDate(recent.placedAt, locale)} · {formatMoney(recent.totals.total, locale)}
          </p>
        </section>
      )}
    </main>
  );
}
