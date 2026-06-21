export class InsufficientStockException extends Error {
  constructor(materialId: string, required: number, available: number) {
    super(`Insufficient stock for material ${materialId}: required=${required}, available=${available}`);
    this.name = 'InsufficientStockException';
  }
}

export class MaterialNotFoundException extends Error {
  constructor(materialId: string) {
    super(`Material not found: ${materialId}`);
    this.name = 'MaterialNotFoundException';
  }
}

export class InvalidInventoryOperationException extends Error {
  constructor(reason: string) {
    super(`Invalid inventory operation: ${reason}`);
    this.name = 'InvalidInventoryOperationException';
  }
}

