'use client';

import React, { useOptimistic, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Cart, Locale, Money } from '@/lib/domain';
import { useCartStore } from '@/lib/store/cart-store';
import { removeFromCart, updateCartQuantity } from '@/lib/actions/cart-actions';
import { formatMoney } from '@/lib/format/money';
import { Link } from '@/lib/i18n/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { CartLineItem, type CartLineItemView } from './CartLineItem';
import { useCartDrawer } from './CartDrawerContext';

// Unique id for the heading so Dialog can use aria-labelledby.
const TITLE_ID = 'cart-drawer-title';

export function CartDrawer(): React.JSX.Element {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const { isOpen, close, announcement, lineViews } = useCartDrawer();

  const cart = useCartStore((s) => s.cart);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const [isPending, startTransition] = useTransition();

  // Build price lookup BEFORE useOptimistic so the reducer can close over it.
  const viewById = new Map(lineViews.map((v) => [v.variantId, v]));

  // Optimistic mirror of the authoritative cart for in-flight qty/remove.
  // Recomputes subtotal from line unit prices so the footer stays accurate
  // during the server round-trip (B2).
  const [optimisticCart, applyOptimistic] = useOptimistic(
    cart,
    (state: Cart, action: { variantId: string; quantity: number }): Cart => {
      const items = state.items
        .map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i))
        .filter((i) => i.quantity > 0);
      const itemCount = items.reduce((n, i) => n + i.quantity, 0);
      const subtotalAmount = items.reduce(
        (sum, i) => sum + (viewById.get(i.variantId)?.unitPrice.amount ?? 0) * i.quantity,
        0,
      );
      return { ...state, items, itemCount, subtotal: { amount: subtotalAmount, currency: 'THB' } };
    },
  );

  function handleQuantityChange(variantId: string, quantity: number) {
    startTransition(async () => {
      applyOptimistic({ variantId, quantity });
      const next = await updateCartQuantity(variantId, quantity);
      replaceFromServer(next);
    });
  }

  function handleRemove(variantId: string) {
    startTransition(async () => {
      applyOptimistic({ variantId, quantity: 0 });
      const next = await removeFromCart(variantId);
      replaceFromServer(next);
    });
  }
  const rows: CartLineItemView[] = optimisticCart.items.map((item) => {
    const snapshot = viewById.get(item.variantId);
    return snapshot
      ? { ...snapshot, quantity: item.quantity }
      : {
          variantId: item.variantId,
          title: { en: item.variantId, th: item.variantId },
          size: '',
          color: '',
          unitPrice: { amount: 0, currency: 'THB' } as Money,
          quantity: item.quantity,
          imageUrl: '/placeholder.svg',
          maxStock: item.quantity,
        };
  });

  return (
    <>
      {/* aria-live region is always mounted (outside Dialog) so announcements work
          regardless of whether the drawer is open or closed. */}
      <div aria-live="polite" className="sr-only" data-testid="cart-live-region">
        {announcement}
      </div>

      <Dialog open={isOpen} onClose={close} labelledById={TITLE_ID}>
        <div
          data-testid="cart-drawer"
          className="flex h-full flex-col bg-ink text-paper"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-smoke-700 p-6">
            <h2 id={TITLE_ID} className="display text-xl">
              {t('title')}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t('close')}
              className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze"
            >
              ×
            </button>
          </div>

          {/* Body */}
          {rows.length === 0 ? (
            <p className="flex-1 p-6 text-smoke-300">{t('empty')}</p>
          ) : (
            <ul className="flex-1 divide-y divide-smoke-700 overflow-y-auto px-6">
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
          )}

          {/* Footer */}
          <div className="border-t border-smoke-700 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="display text-sm">{t('subtotal')}</span>
              <span className="font-mono text-lg" data-testid="cart-drawer-subtotal">
                {formatMoney(optimisticCart.subtotal, locale)}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={close}
              className="block w-full bg-blaze py-3 text-center font-mono uppercase text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
            >
              {t('checkout')}
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  );
}
