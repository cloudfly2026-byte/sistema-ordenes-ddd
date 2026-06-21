import { Inventory } from '../entities/inventory.entity';

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | null>;
  findByMaterialId(materialId: string): Promise<Inventory | null>;
  save(inventory: Inventory): Promise<Inventory>;
  update(inventory: Inventory): Promise<Inventory>;
  findAll(): Promise<Inventory[]>;
  findLowStock(threshold: number): Promise<Inventory[]>;
}

