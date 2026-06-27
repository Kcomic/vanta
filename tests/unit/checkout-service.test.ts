import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Cart, Product, Variant, User } from '@/lib/domain';

// --- Mock the data seam ---
const getById = vi.fn();
const getVariantById = vi.fn();
const getProductByVariantId = vi.fn();
const list = vi.fn();
const create = vi.fn();
const read = vi.fn();
const clear = vi.fn();

vi.mock('@/lib/data', () => ({
  products: {
    getById: (...a: unknown[]) => getById(...a),
    getVariantById: (...a: unknown[]) => getVariantById(...a),
    getProductByVariantId: (...a: unknown[]) => getProductByVariantId(...a),
    list: (...a: unknown[]) => list(...a),
  },
  orders: { create: (...a: unknown[]) => create(...a) },
  cart: { read: (...a: unknown[]) => read(...a), clear: (...a: unknown[]) => clear(...a) },
}));

// --- Mock auth ---
const getCurrentUser = vi.fn();
vi.mock('@/lib/services/auth-service', () => ({
  authService: { getCurrentUser: (...a: unknown[]) => getCurrentUser(...a) },
}));

// --- Mock payment ---
const charge = vi.fn();
vi.mock('@/lib/services/payment-service', () => ({
  mockPaymentService: { charge: (...a: unknown[]) => charge(...a) },
}));

import { checkoutService } from '@/lib/services/checkout-service';

const VARIANT: Variant = {
  id: 'var_1',
  sku: 'VNT-TEE-BLK-M',
  optionValues: { size: 'M', color: 'black' },
  price: { amount: 199000, currency: 'THB' },
  stock: 10,
  availability: 'live',
};

const PRODUCT: Product = {
  id: 'prod_1',
  slug: 'void-tee',
  title: { en: 'Void Tee', th: 'เสื้อยืดวอยด์' },
  description: { en: 'd', th: 'ด' },
  optionAxes: { size: ['M'], color: ['black'] },
  variants: [VARIANT],
  imagesByColor: {
    black: [
      {
        id: 'img_1',
        url: '/img/void-black.jpg',
        alt: { en: 'a', th: 'อ' },
        width: 800,
        height: 1000,
      },
    ],
  },
  collectionIds: [],
};

const CART_2X: Cart = {
  items: [{ variantId: 'var_1', quantity: 2 }],
  itemCount: 2,
  subtotal: { amount: 398000, currency: 'THB' },
  updatedAt: '2026-06-27T00:00:00.000Z',
};

const ADDRESS = {
  id: 'addr_1',
  fullName: 'Somchai Jaidee',
  line1: '99 Sukhumvit Rd',
  city: 'Bangkok',
  postalCode: '10110',
  country: 'TH',
};

beforeEach(() => {
  vi.clearAllMocks();
  getVariantById.mockResolvedValue(VARIANT);
  getById.mockResolvedValue(PRODUCT);
  getProductByVariantId.mockResolvedValue(PRODUCT);
  list.mockResolvedValue([PRODUCT]);
  getCurrentUser.mockResolvedValue(null);
  create.mockImplementation(async (o) => o);
});

describe('buildLineItemsFromCart', () => {
  it('snapshots each cart item into a self-contained OrderLineItem', async () => {
    const items = await checkoutService.buildLineItemsFromCart(CART_2X);
    expect(items).toEqual([
      {
        variantId: 'var_1',
        sku: 'VNT-TEE-BLK-M',
        title: { en: 'Void Tee', th: 'เสื้อยืดวอยด์' },
        optionValues: { size: 'M', color: 'black' },
        unitPrice: { amount: 199000, currency: 'THB' },
        quantity: 2,
        imageUrl: '/img/void-black.jpg',
      },
    ]);
  });

  it('throws if a variant referenced by the cart no longer exists', async () => {
    getVariantById.mockResolvedValueOnce(null);
    await expect(checkoutService.buildLineItemsFromCart(CART_2X)).rejects.toThrow();
  });
});

describe('placeOrder', () => {
  it('rejects an empty cart', async () => {
    read.mockResolvedValue({
      items: [],
      itemCount: 0,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: 'x',
    });
    const result = await checkoutService.placeOrder({
      email: 'a@b.co',
      shippingAddress: ADDRESS,
      paymentToken: 'tok_ok',
    });
    expect(result).toEqual({ ok: false, error: 'empty_cart' });
    expect(charge).not.toHaveBeenCalled();
  });

  it('computes totals = subtotal + flat ฿50 shipping and charges the grand total', async () => {
    read.mockResolvedValue(CART_2X);
    charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
    const result = await checkoutService.placeOrder({
      email: 'a@b.co',
      shippingAddress: ADDRESS,
      paymentToken: 'tok_ok',
    });
    expect(result.ok).toBe(true);
    // charged the grand total in minor units: 398000 + 5000
    expect(charge).toHaveBeenCalledWith({
      amountMinor: 403000,
      currency: 'THB',
      paymentToken: 'tok_ok',
    });
    if (result.ok) {
      expect(result.order.totals).toEqual({
        subtotal: { amount: 398000, currency: 'THB' },
        shipping: { amount: 5000, currency: 'THB' },
        total: { amount: 403000, currency: 'THB' },
      });
      expect(result.order.status).toBe('paid');
      expect(result.order.lineItems).toHaveLength(1);
      expect(typeof result.order.placedAt).toBe('string');
      expect(new Date(result.order.placedAt).toString()).not.toBe('Invalid Date');
      expect(result.order.email).toBe('a@b.co');
      expect(result.order.userId).toBeNull(); // guest
    }
  });

  it('attaches the authenticated user id when a member is logged in', async () => {
    read.mockResolvedValue(CART_2X);
    charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
    const member: User = {
      id: 'usr_member',
      email: 'member@vanta.shop',
      name: 'Member',
      role: 'member',
      addresses: [],
    };
    getCurrentUser.mockResolvedValue(member);
    const result = await checkoutService.placeOrder({
      email: 'member@vanta.shop',
      shippingAddress: ADDRESS,
      paymentToken: 'tok_ok',
    });
    if (result.ok) {
      expect(result.order.userId).toBe('usr_member');
    } else {
      throw new Error('expected ok');
    }
  });

  it('returns payment_declined, does NOT persist or clear, on a declining token', async () => {
    read.mockResolvedValue(CART_2X);
    charge.mockResolvedValue({ ok: false, declineCode: 'card_declined' });
    const result = await checkoutService.placeOrder({
      email: 'a@b.co',
      shippingAddress: ADDRESS,
      paymentToken: 'tok_decline',
    });
    expect(result).toEqual({ ok: false, error: 'payment_declined' });
    expect(create).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it('persists the order and clears the cart on success', async () => {
    read.mockResolvedValue(CART_2X);
    charge.mockResolvedValue({ ok: true, chargeId: 'ch_123' });
    await checkoutService.placeOrder({
      email: 'a@b.co',
      shippingAddress: ADDRESS,
      paymentToken: 'tok_ok',
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
