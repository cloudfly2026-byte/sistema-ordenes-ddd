import { Injectable, Logger, Inject } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { Order } from '../../../domain/order/entities/order.entity';
import { OrderItem } from '../../../domain/order/entities/order-item.entity';
import { Money } from '../../../domain/order/value-objects/money.vo';
import { OrderQueueProducer } from '../../../infrastructure/queue/producers/order-queue.producer';

@Injectable()
export class SyncShopifyOrderUseCase {
  private readonly logger = new Logger(SyncShopifyOrderUseCase.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly orderQueueProducer: OrderQueueProducer,
  ) {}

  async execute(payload: Record<string, unknown>): Promise<void> {
    const shopifyOrderId = String(payload['id']);
    this.logger.log(`Syncing order ${shopifyOrderId}`);

    // Idempotency guard: Shopify sends multiple topics (orders/create, orders/updated,
    // orders/paid) for the same order, each with its own webhook event id. The
    // webhook_events table dedupes by event id, but a *new* event for an *existing*
    // order would otherwise hit the orders.shopify_order_id UNIQUE constraint as an
    // unhandled insert failure. Detect it here and skip re-creation.
    const existingOrder = await this.orderRepository.findByShopifyOrderId(shopifyOrderId);
    if (existingOrder) {
      if (existingOrder.isInTerminalState()) {
        this.logger.log(
          `Order ${shopifyOrderId} already in terminal state (${existingOrder.status.value}); ignoring webhook`,
        );
        return;
      }
      this.logger.log(`Order ${shopifyOrderId} already exists (status ${existingOrder.status.value}); skipping re-creation`);
      return;
    }

    // Create domain aggregate (Order.create handles validation and events)
    const lineItems = (payload['line_items'] as Record<string, unknown>[]) || [];
    const items = lineItems.map((item) =>
      OrderItem.create({
        orderId: '', // Will be set after order is created
        shopifyLineItemId: String(item['id']),
        productName: (item['title'] as string) || '',
        quantity: (item['quantity'] as number) || 1,
        price: new Money(parseFloat(item['price'] as string) || 0),
        isFragile: this.isItemFragile(item),
        sku: (item['sku'] as string) || null,
      }),
    );

    const hasFragileItems = items.some((item) => item.isFragile);
    const totalPrice = parseFloat(payload['total_price'] as string) || 0;
    const currency = (payload['currency'] as string) || 'USD';

    const order = Order.create({
      shopifyOrderId,
      customerEmail: (payload['email'] as string) ?? null,
      totalPrice: new Money(totalPrice, currency),
      items,
      hasFragileItems,
      idempotencyKey: null,
    });

    // Persist in PENDING state
    await this.orderRepository.save(order);

    // Enqueue for async processing
    await this.orderQueueProducer.enqueue(order.id, payload);

    this.logger.log(`Order ${shopifyOrderId} persisted and enqueued for processing`);
  }

  private isItemFragile(item: Record<string, unknown>): boolean {
    const properties = (item['properties'] as Record<string, unknown>[]) || [];
    return properties.some(
      (p) => (p['name'] as string)?.toLowerCase() === 'fragile' && p['value'] === 'true',
    );
  }
}
