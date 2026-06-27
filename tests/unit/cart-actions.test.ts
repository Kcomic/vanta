import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cart } from '@/lib/domain';

const authoritative: Cart = {
  items: [{ variantId: 'var_a', quantity: 1 }],
  itemCount: 1,
  subtotal: { amount: 199000, currency: 'THB' },
  updatedAt: '2026-06-27T00:00:00.000Z',
};

const { addItem, updateQuantity, removeItem, getCart } = vi.hoisted(() => ({
  addItem: vi.fn(async () => authoritative),
  updateQuantity: vi.fn(async () => authoritative),
  removeItem: vi.fn(async () => authoritative),
  getCart: vi.fn(async () => authoritative),
}));

vi.mock('@/lib/services/cart-service', () => ({
  cartService: { addItem, updateQuantity, removeItem, getCart, clear: vi.fn() },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCartAction,
} from '@/lib/actions/cart-actions';
import { revalidatePath } from 'next/cache';

beforeEach(() => vi.clearAllMocks());

describe('cart-actions', () => {
  it('addToCart delegates to cartService.addItem and returns its cart', async () => {
    const result = await addToCart('var_a', 2);
    expect(addItem).toHaveBeenCalledWith('var_a', 2);
    expect(result).toBe(authoritative);
    // The RSC surfaces (stock badges, cart count/drawer) only update if the layout revalidates.
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout');
  });

  it('updateCartQuantity delegates to cartService.updateQuantity', async () => {
    const result = await updateCartQuantity('var_a', 3);
    expect(updateQuantity).toHaveBeenCalledWith('var_a', 3);
    expect(result).toBe(authoritative);
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout');
  });

  it('removeFromCart delegates to cartService.removeItem', async () => {
    const result = await removeFromCart('var_a');
    expect(removeItem).toHaveBeenCalledWith('var_a');
    expect(result).toBe(authoritative);
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout');
  });

  it('getCartAction delegates to cartService.getCart and does NOT revalidate (read-only)', async () => {
    const result = await getCartAction();
    expect(getCart).toHaveBeenCalledTimes(1);
    expect(result).toBe(authoritative);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
