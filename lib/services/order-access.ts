import type { Order, User } from '@/lib/domain';

/**
 * PURE authorization decision for reading an order (no request scope).
 *
 * A member order is private to its owner (or an admin). A guest order (`userId === null`)
 * is reachable by anyone who holds its link — order ids are high-entropy `crypto.randomUUID`
 * values (see checkout-service `newOrderId`), so the unguessable URL is the access grant,
 * which is the standard guest-confirmation pattern.
 */
export function canViewOrder(order: Pick<Order, 'userId'>, user: User | null): boolean {
  if (order.userId === null) return true;
  if (!user) return false;
  return user.id === order.userId || user.role === 'admin';
}
