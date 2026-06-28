import { randomUUID } from 'node:crypto';
import type {
  Order,
  OrderLineItem,
  OrderTotals,
  Address,
  Cart,
  Money,
  Product,
  Variant,
} from '@/lib/domain';
import { products, orders, cart as cartStore } from '@/lib/data';
import { cartService } from '@/lib/services/cart-service';
import { authService } from '@/lib/services/auth-service';
import { mockPaymentService } from '@/lib/services/payment-service';

export type PlaceOrderInput = {
  email: string;
  shippingAddress: Address;
  paymentToken: string; // opaque token from PaymentService
};

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };

export interface CheckoutService {
  /** Snapshots cart -> OrderLineItems, charges via PaymentService, persists Order, clears cart. */
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  buildLineItemsFromCart(cart: Cart): Promise<Order['lineItems']>;
}

/** Flat shipping rate — owned here, the only place shipping is computed. ฿50 = 5000 satang. */
/** Flat shipping in satang (฿50). Exported so the checkout preview uses the same constant the charge does. */
export const SHIPPING_FLAT: Money = { amount: 5000, currency: 'THB' };

/**
 * First image for the variant's colorway, falling back to any first image.
 * Returns empty string if no images are present.
 */
function pickImageUrl(product: Product, variant: Variant): string {
  const byColor = product.imagesByColor[variant.optionValues.color];
  const firstByColor = byColor?.[0];
  if (firstByColor) return firstByColor.url;
  const anyImages = Object.values(product.imagesByColor)[0];
  const firstAny = anyImages?.[0];
  return firstAny ? firstAny.url : '';
}

/**
 * Resolve variant + owning product, then build a self-contained OrderLineItem snapshot.
 * Uses `products.getProductByVariantId` per errata #6 (no per-item list() scans).
 */
async function snapshotLineItem(variantId: string, quantity: number): Promise<OrderLineItem> {
  const variant = await products.getVariantById(variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} no longer exists; cannot snapshot order line item.`);
  }
  // errata #6: use getProductByVariantId rather than list() scan.
  // Locale is not needed for snapshot — we store the full LocalizedText.
  const product = await products.getProductByVariantId(variantId, 'en');
  if (!product) {
    throw new Error(
      `Product owning variant ${variantId} not found; cannot snapshot order line item.`,
    );
  }
  return {
    variantId: variant.id,
    sku: variant.sku,
    title: product.title, // full LocalizedText snapshot
    optionValues: variant.optionValues,
    unitPrice: variant.price, // snapshot at purchase time
    quantity,
    imageUrl: pickImageUrl(product, variant), // snapshot
  };
}

/** Compute order totals from line items. Applies flat shipping for non-empty orders. */
function computeTotals(lineItems: OrderLineItem[]): OrderTotals {
  const subtotalAmount = lineItems.reduce(
    (sum, li) => sum + li.unitPrice.amount * li.quantity,
    0,
  );
  const subtotal: Money = { amount: subtotalAmount, currency: 'THB' };
  const shipping: Money = subtotalAmount > 0 ? SHIPPING_FLAT : { amount: 0, currency: 'THB' };
  const total: Money = { amount: subtotal.amount + shipping.amount, currency: 'THB' };
  return { subtotal, shipping, total };
}

/**
 * High-entropy, unguessable order id. A guest order's confirmation URL is its only access
 * grant (see `canViewOrder`), so the id must not be time-derived or enumerable.
 */
function newOrderId(): string {
  return `ord_${randomUUID()}`;
}

export const checkoutService: CheckoutService = {
  async buildLineItemsFromCart(cart: Cart): Promise<OrderLineItem[]> {
    const items: OrderLineItem[] = [];
    for (const item of cart.items) {
      items.push(await snapshotLineItem(item.variantId, item.quantity));
    }
    return items;
  },

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    // Guard: empty cart must not proceed to payment.
    const rawCart = await cartStore.read();
    if (rawCart.items.length === 0) {
      return { ok: false, error: 'empty_cart' };
    }

    // Reconcile against live stock through cartService (clamps quantities, drops sold-out
    // variants) so we never charge for — or snapshot — more than is actually available.
    const cart = await cartService.getCart();
    const changed =
      cart.items.length !== rawCart.items.length ||
      cart.items.some((ci) => {
        const before = rawCart.items.find((r) => r.variantId === ci.variantId);
        return !before || before.quantity !== ci.quantity;
      });
    if (cart.items.length === 0 || changed) {
      // A variant went out of stock (or its quantity was clamped) since the user added it —
      // stop and let them review their cart rather than silently charging a stale total.
      return { ok: false, error: 'out_of_stock' };
    }

    // Build self-contained snapshots before charging — if a variant is gone, surface early.
    const lineItems = await this.buildLineItemsFromCart(cart);
    const totals = computeTotals(lineItems);

    // Charge first; on decline, leave cart untouched and return error.
    const chargeResult = await mockPaymentService.charge({
      amountMinor: totals.total.amount,
      currency: 'THB',
      paymentToken: input.paymentToken,
    });
    if (!chargeResult.ok) {
      return { ok: false, error: 'payment_declined' };
    }

    // Resolve authenticated user (null => guest checkout).
    const user = await authService.getCurrentUser();

    const order: Order = {
      id: newOrderId(),
      userId: user ? user.id : null,
      status: 'paid',
      lineItems,
      totals,
      shippingAddress: input.shippingAddress,
      email: input.email,
      placedAt: new Date().toISOString(),
    };

    // Persist order, then clear cart. Both must succeed before we return ok.
    const persisted = await orders.create(order);
    await cartStore.clear();

    return { ok: true, order: persisted };
  },
};
