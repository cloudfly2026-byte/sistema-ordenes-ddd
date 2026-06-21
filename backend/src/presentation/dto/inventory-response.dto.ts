export class InventoryResponseDto {
  materialId: string;
  sku: string;
  name: string;
  type: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

