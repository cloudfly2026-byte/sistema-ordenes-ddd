import { Inventory } from '../../../domain/inventory/entities/inventory.entity';
import { InventoryEntity } from '../entities/inventory.entity';

export class InventoryMapper {
  static toDomain(entity: InventoryEntity): Inventory {
    return new Inventory(
      entity.id,
      entity.materialId,
      entity.quantityAvailable,
      entity.quantityReserved,
      entity.version,
      entity.minimumStock,
      entity.material?.code ?? null,
      entity.material?.name ?? null,
    );
  }

  static toPersistence(domain: Inventory): Partial<InventoryEntity> {
    return {
      id: domain.id,
      materialId: domain.materialId,
      quantityAvailable: domain.currentStock,
      quantityReserved: domain.reservedStock,
      minimumStock: domain.minimumStock,
    };
  }
}
