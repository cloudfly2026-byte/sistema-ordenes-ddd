import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Money } from '../value-objects/money.vo';

export class OrderAggregate {
  constructor(private readonly order: Order) {}

  static create(props: {
    shopifyOrderId: string;
    customerEmail?: string;
    totalPrice?: number;
    items: OrderItem[];
    hasFragileItems: boolean;
  }): OrderAggregate {
    const order = Order.create({
      shopifyOrderId: props.shopifyOrderId,
      customerEmail: props.customerEmail ?? null,
      totalPrice: new Money(props.totalPrice ?? 0),
      items: props.items,
      hasFragileItems: props.hasFragileItems,
      idempotencyKey: null,
    });
    return new OrderAggregate(order);
  }

  getOrder(): Order {
    return this.order;
  }
}
