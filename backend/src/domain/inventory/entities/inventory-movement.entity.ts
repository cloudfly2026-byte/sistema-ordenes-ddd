export class InventoryMovement {
  constructor(
    public readonly id: string,
    public readonly materialId: string,
    public readonly orderId: string | null,
    public readonly transactionType: 'RESERVATION' | 'CONSUMPTION' | 'RELEASE' | 'ADJUSTMENT',
    public readonly quantity: number,
    public readonly stockBefore: number,
    public readonly stockAfter: number,
    public readonly reason: string | null,
    public readonly createdAt: Date = new Date(),
  ) {}
}

