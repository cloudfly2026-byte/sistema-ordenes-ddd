import { Injectable, Logger } from '@nestjs/common';
import { IInventoryRepository } from '../../../domain/inventory/repositories/inventory.repository.interface';
import { Inventory } from '../../../domain/inventory/entities/inventory.entity';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  private readonly logger = new Logger(InventoryRepository.name);
  private inventory: Map<string, Inventory> = new Map();

  async findById(id: string): Promise<Inventory | null> {
    return this.inventory.get(id) ?? null;
  }

  async findByMaterialId(materialId: string): Promise<Inventory | null> {
    for (const inv of this.inventory.values()) {
      if (inv.materialId === materialId) {
        return inv;
      }
    }
    return null;
  }

  async save(inventory: Inventory): Promise<Inventory> {
    this.inventory.set(inventory.id, inventory);
    this.logger.log(`Inventory saved: ${inventory.id}`);
    return inventory;
  }

  async update(inventory: Inventory): Promise<Inventory> {
    this.inventory.set(inventory.id, inventory);
    this.logger.log(`Inventory updated: ${inventory.id}`);
    return inventory;
  }

  async findAll(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async findLowStock(threshold: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(
      (inv) => inv.currentStock < threshold,
    );
  }
}

