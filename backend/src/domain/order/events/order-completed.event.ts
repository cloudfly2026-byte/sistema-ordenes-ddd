export interface OrderCompletedEventPayload {
  orderId: string;
  shopifyOrderId: string;
  boxType: string;
  totalItems: number;
  hasFragileItems: boolean;
  occurredAt: Date;
}

export class OrderCompletedEvent {
  public readonly eventName = 'order.completed';
  public readonly occurredAt: Date;
  public readonly payload: OrderCompletedEventPayload;

  constructor(payload: OrderCompletedEventPayload) {
    this.payload = payload;
    this.occurredAt = payload.occurredAt;
  }
}
