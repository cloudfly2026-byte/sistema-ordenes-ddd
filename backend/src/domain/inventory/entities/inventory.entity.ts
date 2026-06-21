export class Inventory {
  constructor(
    public readonly id: string,
    public readonly materialId: string,
    public currentStock: number,
    public reservedStock: number,
  ) {}

  get availableStock(): number {
    return Math.max(0, this.currentStock - this.reservedStock);
  }

  canReserve(quantity: number): boolean {
    return this.availableStock >= quantity;
  }

  reserve(quantity: number): void {
    if (!this.canReserve(quantity)) {
      throw new Error(`Cannot reserve ${quantity}. Available: ${this.availableStock}`);
    }
    this.reservedStock += quantity;
  }

  consume(quantity: number): void {
    this.currentStock = Math.max(0, this.currentStock - quantity);
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
  }

  release(quantity: number): void {
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
  }
}

