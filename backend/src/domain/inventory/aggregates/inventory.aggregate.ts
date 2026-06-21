import { Inventory } from '../entities/inventory.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';

export class InventoryAggregate {
  private readonly movements: InventoryMovement[] = [];

  constructor(private readonly inventory: Inventory) {}

  static create(props: { id: string; materialId: string; currentStock: number }): InventoryAggregate {
    const inventory = new Inventory(props.id, props.materialId, props.currentStock, 0);
    return new InventoryAggregate(inventory);
  }

  getInventory(): Inventory {
    return this.inventory;
  }

  getMovements(): InventoryMovement[] {
    return [...this.movements];
  }
}

