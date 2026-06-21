import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InventoryDomainService {
  private readonly logger = new Logger(InventoryDomainService.name);

  canReserve(currentStock: number, reservedStock: number, required: number): boolean {
    return currentStock - reservedStock >= required;
  }

  calculateAvailable(currentStock: number, reservedStock: number): number {
    return Math.max(0, currentStock - reservedStock);
  }

  isBelowThreshold(currentStock: number, threshold: number): boolean {
    return currentStock < threshold;
  }
}
