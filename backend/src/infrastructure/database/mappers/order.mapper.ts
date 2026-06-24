import { Order } from '../../../domain/order/entities/order.entity';
import { OrderItem } from '../../../domain/order/entities/order-item.entity';
import { Money } from '../../../domain/order/value-objects/money.vo';
import { OrderStatus } from '../../../domain/order/value-objects/order-status.vo';
import { BoxType } from '../../../domain/order/value-objects/box-type.vo';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

export class OrderMapper {
  static toDomain(entity: OrderEntity, items: OrderItemEntity[]): Order {
    return Order.reconstitute({
      id: entity.id,
      shopifyOrderId: entity.shopifyOrderId,
      status: new OrderStatus(entity.status),
      customerEmail: entity.customerEmail,
      totalPrice: new Money(Number(entity.totalPrice), entity.currency),
      items: items.map((item) => OrderItem.create({
        id: item.id,
        orderId: item.orderId,
        shopifyLineItemId: item.shopifyLineItemId,
        productName: item.productName,
        quantity: item.quantity,
        price: new Money(Number(item.price)),
        isFragile: item.isFragile,
        sku: item.sku,
      })),
      hasFragileItems: entity.hasFragileItems,
      boxType: entity.boxType ? BoxType.fromString(entity.boxType) : null,
      errorMessage: entity.errorMessage,
      idempotencyKey: entity.idempotencyKey,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      processedAt: entity.processedAt,
    });
  }

  static toPersistence(domain: Order): Partial<OrderEntity> {
    return {
      id: domain.id,
      shopifyOrderId: domain.shopifyOrderId,
      status: domain.status.value,
      customerEmail: domain.customerEmail,
      totalPrice: domain.totalPrice.amount,
      currency: domain.totalPrice.currency,
      itemsCount: domain.totalProductCount,
      hasFragileItems: domain.hasFragileItems,
      boxType: domain.boxType?.value ?? null,
      errorMessage: domain.errorMessage,
      idempotencyKey: domain.idempotencyKey,
      processedAt: domain.processedAt,
    };
  }

  static toItemPersistence(domainItem: OrderItem, orderId: string): Partial<OrderItemEntity> {
    return {
      id: domainItem.id,
      orderId,
      shopifyLineItemId: domainItem.shopifyLineItemId,
      productName: domainItem.productName,
      quantity: domainItem.quantity,
      price: domainItem.price.amount,
      isFragile: domainItem.isFragile,
      sku: domainItem.sku,
    };
  }
}
