import { Injectable, Logger } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { Order } from '../../../domain/order/entities/order.entity';

@Injectable()
export class OrderRepository implements IOrderRepository {
  private readonly logger = new Logger(OrderRepository.name);
  private orders: Map<string, Order> = new Map();

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByShopifyOrderId(shopifyOrderId: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.shopifyOrderId === shopifyOrderId) {
        return order;
      }
    }
    return null;
  }

  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    this.logger.log(`Order saved: ${order.id}`);
    return order;
  }

  async update(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    this.logger.log(`Order updated: ${order.id}`);
    return order;
  }

  async findRecent(limit: number, offset: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async countByStatus(status: string): Promise<number> {
    return Array.from(this.orders.values()).filter((o) => o.status.value === status).length;
  }
}
