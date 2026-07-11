import type { Cart, CartItem, Variant } from '@/lib/domain';

/**
 * PURE. Maps requested items against live variants, merging duplicate lines,
 * dropping unknown variants, and clamping each quantity to live stock
 * (clamp to 0 removes the line). Subtotal is summed in integer satang.
 */
export function reconcileCart(
  items: CartItem[],
  variantsById: Map<string, Variant>,
  now: string,
): Cart {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  }

  const reconciled: CartItem[] = [];
  let subtotalAmount = 0;
  let itemCount = 0;

  for (const [variantId, requested] of merged) {
    const variant = variantsById.get(variantId);
    if (!variant) continue; // dropped: variant no longer exists
    const quantity = Math.min(requested, variant.stock);
    if (quantity <= 0) continue; // sold out / clamped away
    reconciled.push({ variantId, quantity });
    subtotalAmount += variant.price.amount * quantity;
    itemCount += quantity;
  }

  return {
    items: reconciled,
    itemCount,
    subtotal: { amount: subtotalAmount, currency: 'THB' },
    updatedAt: now,
  };
}
