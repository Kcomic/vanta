'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/domain';
import { Money as MoneyComponent } from '@/components/ui/Money';
import { Link } from '@/lib/i18n/navigation';
import { useMotionCapability } from '@/lib/motion/capability';
// Pure data utilities live in a non-client module so Server Components can call toCatalogCard.
import type { CatalogCard } from './catalog-card';
export type { CatalogCard } from './catalog-card';
export { toCatalogCard } from './catalog-card';

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
          <div className="flex items-baseline gap-2 text-paper">
            <span className="text-sm">
              <MoneyComponent value={card.fromPrice} locale={locale} />
            </span>
            {onSale ? (
              <span className="text-xs text-smoke-500 line-through">
                <MoneyComponent value={card.compareAtFromPrice!} locale={locale} />
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
