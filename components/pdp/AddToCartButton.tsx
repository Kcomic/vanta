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

  // Native `disabled` ONLY for the no-size state (real gating). During the in-flight add we
  // keep the button focusable (aria-disabled + a click guard) so it stays the activeElement
  // when the drawer opens — that lets the drawer return focus here on Escape/close. A natively
  // disabled button loses focus, which broke focus-return.
  const noSize = variant === null;
  const busy = isPending || optimisticAdding;

  return (
    <button
      type="button"
      data-testid="add-to-cart"
      disabled={noSize}
      aria-disabled={busy || undefined}
      onClick={() => {
        if (noSize || busy) return;
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
        noSize || busy
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
