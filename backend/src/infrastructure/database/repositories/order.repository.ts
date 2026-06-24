import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { Order } from '../../../domain/order/entities/order.entity';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepo: Repository<OrderItemEntity>,
  ) {}

  async findById(id: string): Promise<Order | null> {
    const entity = await this.orderRepo.findOne({ where: { id } });
    if (!entity) return null;
    const items = await this.orderItemRepo.find({ where: { orderId: id } });
    return OrderMapper.toDomain(entity, items);
  }

  async findByShopifyOrderId(shopifyOrderId: string): Promise<Order | null> {
    const entity = await this.orderRepo.findOne({ where: { shopifyOrderId } });
    if (!entity) return null;
    const items = await this.orderItemRepo.find({ where: { orderId: entity.id } });
    return OrderMapper.toDomain(entity, items);
  }

  async save(order: Order): Promise<Order> {
    const entity = OrderMapper.toPersistence(order);
    const saved = await this.orderRepo.save(entity as OrderEntity);
    // Save items
    for (const item of order.items) {
      await this.orderItemRepo.save(OrderMapper.toItemPersistence(item, saved.id) as OrderItemEntity);
    }
    this.logger.log(`Order saved: ${order.id}`);
    return order;
  }

  async update(order: Order): Promise<Order> {
    const entity = OrderMapper.toPersistence(order);
    await this.orderRepo.update(order.id, entity);
    this.logger.log(`Order updated: ${order.id}`);
    return order;
  }

  async findRecent(limit: number, offset: number, status?: string): Promise<Order[]> {
    const where = status ? { status } : {};
    const entities = await this.orderRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    const orders: Order[] = [];
    for (const entity of entities) {
      const items = await this.orderItemRepo.find({ where: { orderId: entity.id } });
      orders.push(OrderMapper.toDomain(entity, items));
    }
    return orders;
  }

  async countByStatus(status?: string): Promise<number> {
    return this.orderRepo.count(status ? { where: { status } } : undefined);
  }
}
