'use client';

import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCartDrawer } from '@/components/cart/CartDrawerContext';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useCartCount } from '@/lib/store/cart-store';

export function Header(): React.JSX.Element {
  const t = useTranslations('Nav');
  const { open } = useCartDrawer();
  const count = useCartCount();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-smoke-700 bg-ink px-6 py-4 text-paper">
      <Link
        href="/"
        className="display text-2xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <span data-testid="brand">VANTA</span>
      </Link>

      <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm uppercase tracking-wide">
        <Link
          href="/shop"
          className="hover:text-blaze focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {t('shop')}
        </Link>
        <Link
          href="/collections"
          className="hover:text-blaze focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {t('collections')}
        </Link>

        {/* LocaleSwitcher slot — renders inline within the nav. */}
        <LocaleSwitcher />

        <button
          type="button"
          data-testid="cart-count"
          onClick={open}
          className="rounded-full border border-paper px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
          aria-label={t('cart')}
        >
          {t('cart')} (<span data-testid="cart-count-value">{count}</span>)
        </button>
      </nav>
    </header>
  );
}
