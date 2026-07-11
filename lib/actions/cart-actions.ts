'use server';

import { revalidatePath } from 'next/cache';
import type { Cart } from '@/lib/domain';
import { cartService } from '@/lib/services/cart-service';

function revalidateCartSurfaces(): void {
  // Stock badges + cart line state are RSC-rendered; refresh them after a mutation.
  revalidatePath('/[locale]', 'layout');
}

export async function addToCart(variantId: string, quantity: number): Promise<Cart> {
  const cart = await cartService.addItem(variantId, quantity);
  revalidateCartSurfaces();
  return cart;
}

export async function updateCartQuantity(variantId: string, quantity: number): Promise<Cart> {
  const cart = await cartService.updateQuantity(variantId, quantity);
  revalidateCartSurfaces();
  return cart;
}

export async function removeFromCart(variantId: string): Promise<Cart> {
  const cart = await cartService.removeItem(variantId);
  revalidateCartSurfaces();
  return cart;
}

export async function getCartAction(): Promise<Cart> {
  return cartService.getCart();
}
