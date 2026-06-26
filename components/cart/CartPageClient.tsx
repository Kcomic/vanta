'use client';

import { useEffect, useOptimistic, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Cart, Locale } from '@/lib/domain';
import { useCartStore } from '@/lib/store/cart-store';
import { removeFromCart, updateCartQuantity } from '@/lib/actions/cart-actions';
import { formatMoney } from '@/lib/format/money';
import { Link } from '@/lib/i18n/navigation';
import { CartLineItem, type CartLineItemView } from './CartLineItem';
import { useCartDrawer } from './CartDrawerContext';

export function CartPageClient({
  initialCart,
  lineViews,
}: {
  initialCart: Cart;
  lineViews: CartLineItemView[];
}): React.JSX.Element {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const { setLineViews } = useCartDrawer();

  const hydrate = useCartStore((s) => s.hydrate);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const cart = useCartStore((s) => s.cart);
  const [isPending, startTransition] = useTransition();

  // Seed mirror + drawer snapshots from the server-rendered cart.
  useEffect(() => {
    hydrate(initialCart);
    setLineViews(lineViews);
  }, [hydrate, initialCart, lineViews, setLineViews]);

  const [optimisticCart, applyOptimistic] = useOptimistic(
    cart,
    (state: Cart, action: { variantId: string; quantity: number }): Cart => {
      const items = state.items
        .map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i))
        .filter((i) => i.quantity > 0);
      return { ...state, items, itemCount: items.reduce((n, i) => n + i.quantity, 0) };
    },
  );

  function handleQuantityChange(variantId: string, quantity: number) {
    startTransition(async () => {
      applyOptimistic({ variantId, quantity });
      replaceFromServer(await updateCartQuantity(variantId, quantity));
    });
  }

  function handleRemove(variantId: string) {
    startTransition(async () => {
      applyOptimistic({ variantId, quantity: 0 });
      replaceFromServer(await removeFromCart(variantId));
    });
  }

  const viewById = new Map(lineViews.map((v) => [v.variantId, v]));
  const rows: CartLineItemView[] = optimisticCart.items
    .map((item) => {
      const snapshot = viewById.get(item.variantId);
      return snapshot ? { ...snapshot, quantity: item.quantity } : null;
    })
    .filter((row): row is CartLineItemView => row !== null);

  if (rows.length === 0) {
    return (
      <p className="text-smoke-500" data-testid="cart-empty">
        {t('empty')}
      </p>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
      <ul className="divide-y divide-smoke-300" data-testid="cart-list">
        {rows.map((row) => (
          <CartLineItem
            key={row.variantId}
            line={row}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            disabled={isPending}
          />
        ))}
      </ul>
      <aside className="h-fit border border-smoke-300 p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="display text-sm">{t('subtotal')}</span>
          <span className="font-mono text-lg" data-testid="cart-subtotal">
            {formatMoney(optimisticCart.subtotal, locale)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="block w-full bg-blaze-on-light py-3 text-center font-mono uppercase text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
        >
          {t('checkout')}
        </Link>
      </aside>
    </div>
  );
}
