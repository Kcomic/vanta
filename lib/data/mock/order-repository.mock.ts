import type { Order } from '@/lib/domain';
import type { OrderRepository } from '@/lib/data/repositories';
import { seedOrders } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

// Next.js dev runs Server Actions and RSC page renders in separate module graphs, so a
// plain per-instance Map would not let an order created in `placeOrder` be read back by the
// confirmation page. Back the runtime store with a process-global singleton so created
// orders survive across that boundary (a real DB adapter supersedes this). Tests pass an
// explicit seed to get an isolated store.
const ORDERS_KEY = Symbol.for('vanta.mock.orders');

function sharedStore(): Map<string, Order> {
  const g = globalThis as unknown as Record<symbol, Map<string, Order> | undefined>;
  if (!g[ORDERS_KEY]) {
    g[ORDERS_KEY] = new Map(clone(seedOrders).map((o) => [o.id, o]));
  }
  return g[ORDERS_KEY]!;
}

export class MockOrderRepository implements OrderRepository {
  private orders: Map<string, Order>;

  constructor(seed?: Order[]) {
    this.orders = seed ? new Map(clone(seed).map((o) => [o.id, o])) : sharedStore();
  }

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, clone(order));
    return clone(order);
  }

  async getById(orderId: string): Promise<Order | null> {
    const found = this.orders.get(orderId);
    return found ? clone(found) : null;
  }

  async listByUser(userId: string): Promise<Order[]> {
    return clone([...this.orders.values()].filter((o) => o.userId === userId));
  }
}
