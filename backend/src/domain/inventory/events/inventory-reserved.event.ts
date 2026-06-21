export interface InventoryReservedEventPayload {
  materialId: string;
  orderId: string;
  quantity: number;
  occurredAt: Date;
}

export class InventoryReservedEvent {
  readonly eventName = 'inventory.reserved';
  readonly occurredAt: Date;

  constructor(readonly payload: InventoryReservedEventPayload) {
    this.occurredAt = payload.occurredAt ?? new Date();
  }
}

