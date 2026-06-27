'use client';

import { useOptimistic, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Variant, Availability } from '@/lib/domain';
import { addToCart } from '@/lib/actions/cart-actions';
import { useCartStore } from '@/lib/store/cart-store';
import { useCartDrawer } from '@/components/cart/CartDrawerContext';

export function AddToCartButton({
  variant,
  availability,
}: {
  variant: Variant | null;
  availability: Availability | null;
}) {
  const t = useTranslations('pdp');
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const { open, setAnnouncement } = useCartDrawer();
  const [isPending, startTransition] = useTransition();
  const [optimisticAdding, setOptimisticAdding] = useOptimistic(
    false,
    (_state, next: boolean) => next,
  );

  // Visual-only "Notify me" for sold-out selection — no backend.
  if (availability === 'sold_out') {
    return (
      <button
        type="button"
        data-testid="notify-me"
        className="w-full bg-smoke-700 py-4 font-mono text-sm uppercase tracking-wide text-paper"
      >
        {t('notifyMe')}
      </button>
    );
  }

  const disabled = variant === null || isPending;

  return (
    <button
      type="button"
      data-testid="add-to-cart"
      disabled={disabled}
      onClick={() => {
        if (!variant) return;
        startTransition(async () => {
          setOptimisticAdding(true);
          const cart = await addToCart(variant.id, 1);
          replaceFromServer(cart);
          setAnnouncement(t('addedToCart'));
          open();
        });
      }}
      className={[
        'w-full py-4 font-mono text-sm uppercase tracking-wide',
        disabled
          ? 'cursor-not-allowed bg-smoke-700 text-smoke-300'
          : 'bg-blaze text-paper hover:bg-blaze-on-light',
      ].join(' ')}
    >
      {variant === null
        ? t('selectSize')
        : optimisticAdding || isPending
          ? t('adding')
          : t('addToCart')}
    </button>
  );
}
