import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByShopifyOrderId(shopifyOrderId: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  findRecent(limit: number, offset: number): Promise<Order[]>;
  countByStatus(status: string): Promise<number>;
}
