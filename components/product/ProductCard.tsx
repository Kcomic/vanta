'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product, Locale, Availability, Money } from '@/lib/domain';
import { formatMoney } from '@/lib/format/money';
import { CARD_ROLLUP_ORDER } from '@/lib/services/availability';
import { Link } from '@/lib/i18n/navigation';
import { useMotionCapability } from '@/lib/motion/capability';

export type CatalogCard = {
  productId: string; // stable id (View Transition key origin)
  slug: string;
  fromPrice: Money; // lowest variant price among matching variants
  compareAtFromPrice: Money | null; // present => on sale
  availability: Availability; // most-buyable across matching variants (CARD_ROLLUP_ORDER)
  matchedColors: string[]; // colors that survived the filter (swatch dots)
  imageUrl: string; // first image for the first matchedColor
};

/** PURE. Build a card from a product: lowest price, sale flag, most-buyable availability. */
export function toCatalogCard(product: Product, _locale: Locale): CatalogCard {
  const variants = product.variants;

  // Product must have at least one variant (domain invariant). Guard for strict TS.
  if (variants.length === 0) {
    throw new Error(`toCatalogCard: product "${product.id}" has no variants`);
  }

  // Lowest variant price
  const first = variants[0] as NonNullable<(typeof variants)[0]>;
  const cheapest = variants.reduce(
    (lo, v) => (v.price.amount < lo.price.amount ? v : lo),
    first,
  );

  // Sale flag: present when any variant has a compareAtPrice
  const onSaleVariant = variants.find((v) => v.compareAtPrice != null) ?? null;

  // Most-buyable availability via CARD_ROLLUP_ORDER (lower index = more buyable)
  const availability = variants.reduce<Availability>((best, v) => {
    return CARD_ROLLUP_ORDER.indexOf(v.availability) < CARD_ROLLUP_ORDER.indexOf(best)
      ? v.availability
      : best;
  }, first.availability);

  // Deduplicated color list preserving insertion order
  const matchedColors = [...new Set(variants.map((v) => v.optionValues.color))];
  const firstColor = matchedColors[0] ?? '';
  const imageUrl = product.imagesByColor[firstColor]?.[0]?.url ?? '';

  return {
    productId: product.id,
    slug: product.slug,
    fromPrice: cheapest.price,
    compareAtFromPrice: onSaleVariant?.compareAtPrice ?? null,
    availability,
    matchedColors,
    imageUrl,
  };
}

export type ProductCardProps = {
  card: CatalogCard;
  title: string; // already-localized title[locale]
  imageUrl: string; // first image for the first matchedColor
  imageAlt: string; // already-localized alt
  locale: Locale;
  priority?: boolean; // first row eager-loads
};

export function ProductCard({
  card,
  title,
  imageUrl,
  imageAlt,
  locale,
  priority = false,
}: ProductCardProps): React.JSX.Element {
  const motionEnabled = useMotionCapability();
  const ref = useRef<HTMLLIElement>(null);

  // Visible-by-default: only start hidden when motion will animate.
  // SSR/reduced-motion/coarse-pointer/Save-Data all resolve motionEnabled=false,
  // so content is never stranded at opacity:0 before hydration.
  const [revealed, setRevealed] = useState(!motionEnabled);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (!motionEnabled) {
      setRevealed(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target); // pause work once revealed
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [motionEnabled]);

  const onSale = card.compareAtFromPrice !== null;

  return (
    <li
      ref={ref}
      data-testid="product-card"
      data-product-id={card.productId}
      data-revealed={revealed ? 'true' : 'false'}
      className={[
        'group relative flex flex-col bg-smoke-900',
        'transition-[clip-path,opacity] duration-700 ease-out motion-reduce:transition-none',
        'data-[revealed=false]:[clip-path:inset(0_0_100%_0)] data-[revealed=false]:opacity-0',
        'data-[revealed=true]:[clip-path:inset(0_0_0_0)] data-[revealed=true]:opacity-100',
      ].join(' ')}
    >
      {/* Wishlist toggle — visual-only per spec */}
      <button
        type="button"
        aria-pressed={wished}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => setWished((w) => !w)}
        className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-paper backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <span aria-hidden="true" className={wished ? 'text-blaze' : 'text-paper'}>
          {wished ? '♥' : '♡'}
        </span>
      </button>

      <Link
        href={`/product/${card.slug}`}
        className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        {/* View-transition origin: keyed on product id (locale-stable per conventions) */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-ink"
          style={{ viewTransitionName: `product-${card.productId}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        <div className="flex flex-col gap-1 p-3">
          <h3 className="display text-sm leading-tight text-paper">{title}</h3>
          <div className="flex items-baseline gap-2 font-[family-name:var(--font-mono)] text-paper">
            <span className="text-sm">{formatMoney(card.fromPrice, locale)}</span>
            {onSale ? (
              <span className="text-xs text-smoke-500 line-through">
                {formatMoney(card.compareAtFromPrice!, locale)}
              </span>
            ) : null}
          </div>
          {card.matchedColors.length > 1 ? (
            <span className="text-xs text-smoke-300">{card.matchedColors.length} colors</span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
