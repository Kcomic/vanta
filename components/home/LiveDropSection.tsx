import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { CountdownIsland } from '@/components/drop/CountdownIsland';
import { AvailabilityBadge } from '@/components/drop/AvailabilityBadge';
import { StockMeter } from '@/components/drop/StockMeter';
import { FormattedDate } from '@/components/ui/FormattedDate';
import type { HomeView } from '@/lib/services/home-view';
import type { Locale } from '@/lib/domain';

export async function LiveDropSection({
  view,
  locale,
}: {
  view: HomeView;
  locale: Locale;
}): Promise<React.JSX.Element | null> {
  const t = await getTranslations('drop');
  const { drop, dropProducts, anyEarlyAccessGated } = view;
  if (!drop || dropProducts.length === 0) return null;

  // Server picks the LIVE-flip deadline: coming_soon counts down to earlyAccessAt;
  // members/guests count down to releaseAt. The island never refetches — it only ticks.
  const anyComingSoon = dropProducts.some((p) => p.leadVariant.availability === 'coming_soon');
  const deadlineIso = anyComingSoon ? drop.earlyAccessAt : drop.releaseAt;

  return (
    <section data-testid="live-drop" className="bg-ink px-6 py-20 text-paper">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-blaze">
              {t('label')}
            </p>
            <h2 className="display mt-2 text-5xl text-paper">{drop.name[locale]}</h2>
            <p className="mt-3 text-sm text-smoke-300">
              {t('releaseAtLabel')}:{' '}
              <FormattedDate value={drop.releaseAt} locale={locale} />
            </p>
          </div>
          <div data-testid="live-drop-countdown" className="min-w-[18rem]">
            <CountdownIsland deadlineIso={deadlineIso} />
          </div>
        </header>

        {anyEarlyAccessGated && (
          <p
            data-testid="early-access-hint"
            className="font-mono text-xs uppercase tracking-[0.18em] text-smoke-300"
          >
            {t('unlockHint')}
          </p>
        )}

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {dropProducts.map((p) => {
            const a = p.leadVariant.availability;
            return (
              <li
                key={p.productId}
                data-testid="drop-product"
                data-product-id={p.productId}
                data-availability={a}
                className="flex flex-col gap-4 border border-smoke-700 p-6"
                style={{ viewTransitionName: `product-${p.productId}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-smoke-500">{p.leadVariant.sku}</span>
                  <AvailabilityBadge availability={a} stock={p.leadVariant.stock} />
                </div>
                <StockMeter stock={p.leadVariant.stock} />
                {a === 'sold_out' ? (
                  <button
                    type="button"
                    data-testid="notify-me"
                    className="mt-2 border border-smoke-500 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-paper"
                  >
                    {t('notifyMe')}
                  </button>
                ) : (
                  <Link
                    href={`/product/${p.slug}`}
                    className="mt-2 inline-block font-mono text-xs uppercase tracking-[0.18em] text-blaze underline-offset-4 hover:underline"
                  >
                    {t('live')}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
