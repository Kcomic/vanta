import type { Order } from '@/lib/domain';

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  getById(orderId: string): Promise<Order | null>;
  listByUser(userId: string): Promise<Order[]>;
}
