'use client';

import { useTranslations } from 'next-intl';
import type { Variant, Availability, Locale, Money } from '@/lib/domain';
import type { PdpView } from '@/lib/pdp/selection';
import { formatMoney } from '@/lib/format/money';
import { SizeGrid } from '@/components/pdp/SizeGrid';
import { AddToCartButton } from '@/components/pdp/AddToCartButton';

export function StickyBuyPanel({
  title,
  view,
  locale,
  selectedSize,
  onSelectSize,
  variant,
  availability,
  displayPrice,
  onOpenSizeFit,
}: {
  title: string;
  view: PdpView;
  locale: Locale;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  variant: Variant | null;
  availability: Availability | null;
  displayPrice: Money;
  onOpenSizeFit: () => void;
}) {
  const t = useTranslations('pdp');
  // Show selected variant's price when a size is chosen; fall back to the product representative price.
  const price = variant?.price ?? displayPrice;

  return (
    <aside className="lg:sticky lg:top-24 flex flex-col gap-6 self-start">
      <div className="flex flex-col gap-2">
        <h1 className="display text-3xl text-paper">{title}</h1>
        <p className="font-mono text-lg text-paper" data-testid="pdp-price">
          {formatMoney(price, locale)}
        </p>
      </div>

      {view.lowStockRemaining !== null ? (
        <p
          data-testid="low-stock-badge"
          className="w-fit bg-blaze px-3 py-1 font-mono text-xs uppercase tracking-wide text-ink"
        >
          {t('onlyNLeft', { count: view.lowStockRemaining })}
        </p>
      ) : null}

      <SizeGrid view={view} selectedSize={selectedSize} onSelectSize={onSelectSize} />

      <AddToCartButton variant={variant} availability={availability} />

      <button
        type="button"
        onClick={onOpenSizeFit}
        data-testid="open-size-fit"
        className="w-fit font-mono text-xs uppercase tracking-wide text-smoke-300 underline underline-offset-4 hover:text-paper"
      >
        {t('sizeFit.openButton')}
      </button>
    </aside>
  );
}
