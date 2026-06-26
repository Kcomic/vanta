import type { Variant, Drop, User, Availability } from '@/lib/domain';

export const LOW_STOCK_THRESHOLD = 5;

/**
 * SINGLE-VARIANT precedence used by deriveAvailability (most → least urgent state).
 * Lower index = wins when a single variant could be described multiple ways.
 * sold_out > coming_soon > early_access > low_stock > live
 *
 * INTENTIONALLY DIFFERENT FROM CARD_ROLLUP_ORDER:
 * This answers "how should I describe ONE variant?".
 * The multi-variant card roll-up (CARD_ROLLUP_ORDER) answers "can the shopper
 * buy THIS PRODUCT right now?" — a live variant always wins there.
 */
export const AVAILABILITY_PRECEDENCE: readonly Availability[] = [
  'sold_out',
  'coming_soon',
  'early_access',
  'low_stock',
  'live',
] as const;

/**
 * MULTI-VARIANT card roll-up ("most BUYABLE across a product's matching variants").
 * Lower index = more buyable; a card surfaces the most-buyable variant's state.
 * live > low_stock > early_access > coming_soon > sold_out.
 *
 * INTENTIONALLY DIFFERENT FROM AVAILABILITY_PRECEDENCE:
 * This answers "can the shopper buy THIS PRODUCT right now?" — a live variant
 * always wins; an early_access-gated variant is less buyable than an in-stock
 * low_stock one. Use this in catalog/search/collection card builders.
 */
export const CARD_ROLLUP_ORDER: readonly Availability[] = [
  'live',
  'low_stock',
  'early_access',
  'coming_soon',
  'sold_out',
] as const;

/**
 * PURE. No clock, no cookies. Read identically by home/catalog/PDP/marquee.
 * Single-variant precedence (AVAILABILITY_PRECEDENCE): sold_out > coming_soon > early_access > low_stock > live.
 * The multi-variant card roll-up uses CARD_ROLLUP_ORDER, intentionally a different order.
 *
 *  - stock <= 0                                  => 'sold_out'
 *  - drop && now < earlyAccessAt                 => 'coming_soon'
 *  - drop && now < releaseAt && !member          => 'early_access' (gated)
 *  - drop && now < releaseAt &&  member/admin    => fall through to buyable states
 *  - 0 < stock <= LOW_STOCK_THRESHOLD            => 'low_stock'
 *  - otherwise                                   => 'live'
 *
 * DESIGN NOTE — `endAt` is intentionally NOT consulted here.
 * The `Availability` union has no "ended" state by design (spec-locked to 5 states:
 * sold_out | coming_soon | early_access | low_stock | live).
 * After `releaseAt`, a variant's availability is purely stock-based regardless of
 * whether the drop event has closed. `drop.endAt` bounds the drop EVENT window and
 * is consumed by `DropRepository.getActive` (which filters out past-`endAt` drops)
 * and the UI countdown timer — not by per-variant availability.
 */
export function deriveAvailability(
  variant: Variant,
  drop: Drop | null,
  now: Date,
  user: User | null,
): Availability {
  if (variant.stock <= 0) return 'sold_out';

  if (drop) {
    const nowMs = now.getTime();
    const earlyMs = Date.parse(drop.earlyAccessAt);
    const releaseMs = Date.parse(drop.releaseAt);

    if (nowMs < earlyMs) return 'coming_soon';

    if (nowMs < releaseMs) {
      const unlocked = user?.role === 'member' || user?.role === 'admin';
      if (!unlocked) return 'early_access';
      // member/admin: fall through to buyable states (low_stock / live).
    }
  }

  if (variant.stock <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'live';
}
