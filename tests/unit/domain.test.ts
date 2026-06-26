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

describe('lib/domain barrel', () => {
  it('exposes every domain type with the locked shape', () => {
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

    expect([
      money.currency,
      locale,
      availability,
      image.id,
      product.slug,
      collection.slug,
      drop.id,
      cart.itemCount,
      order.id,
      user.id,
      status,
      totals.total.amount,
    ]).toHaveLength(12);
  });
});
