export interface OrderFailedEventPayload {
  orderId: string;
  shopifyOrderId: string;
  reason: string;
  occurredAt: Date;
}

export class OrderFailedEvent {
  readonly eventName = 'order.failed';
  readonly occurredAt: Date;

  constructor(readonly payload: OrderFailedEventPayload) {
    this.occurredAt = payload.occurredAt ?? new Date();
  }
}

