import type { Money } from './money';
import type { LocalizedText } from './i18n';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

/** Country-first single example address. NO US State/ZIP labels. */
export type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string; // ISO-3166 alpha-2, e.g. 'TH'
  phone?: string;
};

/** Self-contained snapshot at purchase time — never re-read from Product/Variant. */
export type OrderLineItem = {
  variantId: string;
  sku: string;
  title: LocalizedText; // snapshot
  optionValues: { size: string; color: string };
  unitPrice: Money; // snapshot
  quantity: number;
  imageUrl: string; // snapshot
};

export type OrderTotals = {
  subtotal: Money;
  shipping: Money;
  total: Money;
};

export type Order = {
  id: string; // e.g. 'ord_seed_demo'
  userId: string | null; // null => guest checkout
  status: OrderStatus;
  lineItems: OrderLineItem[];
  totals: OrderTotals;
  shippingAddress: Address;
  email: string;
  placedAt: string; // ISO-8601
};
