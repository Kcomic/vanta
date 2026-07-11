import { describe, it, expect } from 'vitest';
import type {
  Currency,
  Money,
  Locale,
  LocalizedText,
  Availability,
  ProductImage,
  Variant,
  Product,
  Collection,
  Drop,
  CartItem,
  Cart,
  OrderStatus,
  Address,
  OrderLineItem,
  OrderTotals,
  Order,
  Role,
  User,
} from '@/lib/domain';
import { AVAILABILITY_PRECEDENCE } from '@/lib/services/availability';
import { seedDrops } from '@/lib/data/mock/seed';
import { seedProducts } from '@/lib/data/mock/seed';

describe('lib/domain — runtime invariants', () => {
  it('every Availability value is present in AVAILABILITY_PRECEDENCE', () => {
    // The full set of Availability literals (spec-locked); adding one here must also
    // be added to AVAILABILITY_PRECEDENCE or this test catches the omission.
    const ALL_AVAILABILITY: Availability[] = [
      'sold_out',
      'coming_soon',
      'early_access',
      'low_stock',
      'live',
    ];
    for (const state of ALL_AVAILABILITY) {
      expect(AVAILABILITY_PRECEDENCE).toContain(state);
    }
    // No extras in AVAILABILITY_PRECEDENCE either.
    expect(AVAILABILITY_PRECEDENCE).toHaveLength(ALL_AVAILABILITY.length);
  });

  it('LocalizedText always has both en and th keys', () => {
    const text: LocalizedText = { en: 'Hello', th: 'สวัสดี' };
    expect(typeof text.en).toBe('string');
    expect(typeof text.th).toBe('string');
    // Ensure keys exist (not undefined).
    expect('en' in text).toBe(true);
    expect('th' in text).toBe(true);
  });

  it('every seed product Money.amount is a non-negative integer (no floating-point pence)', () => {
    const amounts: number[] = [];
    for (const product of seedProducts) {
      for (const variant of product.variants) {
        amounts.push(variant.price.amount);
      }
    }
    expect(amounts.length).toBeGreaterThan(0);
    for (const amount of amounts) {
      expect(Number.isInteger(amount)).toBe(true);
      expect(amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('every seed drop has valid ISO-8601 timestamps in earlyAccessAt, releaseAt, endAt', () => {
    for (const drop of seedDrops) {
      expect(Number.isNaN(Date.parse(drop.earlyAccessAt))).toBe(false);
      expect(Number.isNaN(Date.parse(drop.releaseAt))).toBe(false);
      expect(Number.isNaN(Date.parse(drop.endAt))).toBe(false);
    }
  });

  it('domain shape compiles correctly (type-level smoke check via value assignment)', () => {
    const currency: Currency = 'THB';
    const money: Money = { amount: 199000, currency };
    const locale: Locale = 'th';
    const text: LocalizedText = { en: 'Hello', th: 'สวัสดี' };
    const availability: Availability = 'low_stock';
    const image: ProductImage = {
      id: 'img_1',
      url: '/x.jpg',
      alt: text,
      width: 1200,
      height: 1600,
    };
    const variant: Variant = {
      id: 'var_1',
      sku: 'SKU-1',
      optionValues: { size: 'M', color: 'Black' },
      price: money,
      stock: 3,
      availability,
    };
    const product: Product = {
      id: 'prd_1',
      slug: 'tee',
      title: text,
      description: text,
      optionAxes: { size: ['M'], color: ['Black'] },
      variants: [variant],
      imagesByColor: { Black: [image] },
      collectionIds: ['col_1'],
      dropId: 'drp_1',
    };
    const collection: Collection = {
      id: 'col_1',
      slug: 'void',
      title: text,
      description: text,
      heroImageUrl: '/hero.jpg',
      productIds: ['prd_1'],
    };
    const drop: Drop = {
      id: 'drp_1',
      name: text,
      earlyAccessAt: '2026-07-01T00:00:00.000Z',
      releaseAt: '2026-07-02T00:00:00.000Z',
      endAt: '2026-07-09T00:00:00.000Z',
    };
    const cartItem: CartItem = { variantId: 'var_1', quantity: 2 };
    const cart: Cart = {
      items: [cartItem],
      itemCount: 2,
      subtotal: money,
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    const status: OrderStatus = 'paid';
    const role: Role = 'member';
    const address: Address = {
      id: 'adr_1',
      fullName: 'A B',
      line1: '1 Rd',
      city: 'Bangkok',
      postalCode: '10110',
      country: 'TH',
    };
    const lineItem: OrderLineItem = {
      variantId: 'var_1',
      sku: 'SKU-1',
      title: text,
      optionValues: { size: 'M', color: 'Black' },
      unitPrice: money,
      quantity: 2,
      imageUrl: '/x.jpg',
    };
    const totals: OrderTotals = { subtotal: money, shipping: money, total: money };
    const order: Order = {
      id: 'ord_seed_demo',
      userId: null,
      status,
      lineItems: [lineItem],
      totals,
      shippingAddress: address,
      email: 'a@b.com',
      placedAt: '2026-06-27T00:00:00.000Z',
    };
    const user: User = {
      id: 'usr_member',
      email: 'member@vanta.shop',
      name: 'Member',
      role,
      addresses: [address],
    };

    // Runtime assertions on constructed values (not compile-time tautologies).
    expect(money.amount).toBeGreaterThan(0);
    expect(Number.isInteger(money.amount)).toBe(true);
    expect(locale).toBe('th');
    expect(product.variants).toHaveLength(1);
    expect(cart.itemCount).toBe(cart.items.reduce((s, i) => s + i.quantity, 0));
    expect(Date.parse(drop.earlyAccessAt)).toBeLessThan(Date.parse(drop.releaseAt));
    expect(Date.parse(drop.releaseAt)).toBeLessThan(Date.parse(drop.endAt));
    expect(order.lineItems.every((li) => li.quantity > 0)).toBe(true);
    expect(user.addresses).toHaveLength(1);
    // Suppress unused-variable TS errors while keeping the type-check surface.
    void [currency, availability, image, collection, cartItem, totals, status, lineItem];
  });
});
