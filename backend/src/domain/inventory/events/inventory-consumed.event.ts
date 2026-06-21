export interface InventoryConsumedEventPayload {
  materialId: string;
  orderId: string;
  quantity: number;
  occurredAt: Date;
}

export class InventoryConsumedEvent {
  readonly eventName = 'inventory.consumed';
  readonly occurredAt: Date;

  constructor(readonly payload: InventoryConsumedEventPayload) {
    this.occurredAt = payload.occurredAt ?? new Date();
  }
}

