export interface OrderReceivedEventPayload {
  orderId: string;
  shopifyOrderId: string;
  totalItems: number;
  hasFragileItems: boolean;
  occurredAt: Date;
}

export class OrderReceivedEvent {
  public readonly eventName = 'order.received';
  public readonly occurredAt: Date;
  public readonly payload: OrderReceivedEventPayload;

  constructor(payload: OrderReceivedEventPayload) {
    this.payload = payload;
    this.occurredAt = payload.occurredAt;
  }
}
