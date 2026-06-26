import type { Order } from '@/lib/domain';
import type { OrderRepository } from '@/lib/data/repositories';
import { seedOrders } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

export class MockOrderRepository implements OrderRepository {
  private orders: Map<string, Order>;

  constructor(seed: Order[] = seedOrders) {
    this.orders = new Map(clone(seed).map((o) => [o.id, o]));
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
