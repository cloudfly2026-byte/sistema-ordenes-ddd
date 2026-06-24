import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInventoryRepository } from '../../../domain/inventory/repositories/inventory.repository.interface';
import { Inventory } from '../../../domain/inventory/entities/inventory.entity';
import { InventoryEntity } from '../entities/inventory.entity';
import { MaterialEntity } from '../entities/material.entity';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { InventoryConcurrencyConflictException } from '../../../domain/inventory/exceptions/inventory.exceptions';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  private readonly logger = new Logger(InventoryRepository.name);

  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
    @InjectRepository(MaterialEntity)
    private readonly materialRepo: Repository<MaterialEntity>,
  ) {}

  async findById(id: string): Promise<Inventory | null> {
    const entity = await this.inventoryRepo.findOne({ where: { id }, relations: ['material'] });
    if (!entity) return null;
    return InventoryMapper.toDomain(entity);
  }

  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async findByMaterialId(materialIdOrCode: string): Promise<Inventory | null> {
    // Only query by material_id (uuid column) when the value actually looks like a UUID.
    // Postgres validates the literal's format before comparing, so passing a non-UUID
    // string (e.g. "BOX_SMALL") throws "invalid input syntax for type uuid" instead of
    // simply returning no rows.
    if (InventoryRepository.UUID_REGEX.test(materialIdOrCode)) {
      const entity = await this.inventoryRepo.findOne({ where: { materialId: materialIdOrCode }, relations: ['material'] });
      if (entity) return InventoryMapper.toDomain(entity);
    }

    // Treat as material code, look up material first
    const material = await this.materialRepo.findOne({ where: { code: materialIdOrCode } });
    if (!material) return null;
    const entity = await this.inventoryRepo.findOne({ where: { materialId: material.id }, relations: ['material'] });
    if (!entity) return null;
    return InventoryMapper.toDomain(entity);
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const entity = InventoryMapper.toPersistence(inventory);
    await this.inventoryRepo.save(entity as InventoryEntity);
    this.logger.log(`Inventory saved: ${inventory.id}`);
    return inventory;
  }

  async update(inventory: Inventory): Promise<Inventory> {
    // Optimistic locking: only update the row if its version still matches what
    // we read. If another transaction updated it concurrently, `affected` will
    // be 0 — that's a real conflict (lost-update prevention), not a no-op.
    const result = await this.inventoryRepo
      .createQueryBuilder()
      .update(InventoryEntity)
      .set({
        quantityAvailable: inventory.currentStock,
        quantityReserved: inventory.reservedStock,
        version: () => 'version + 1',
        lastUpdatedAt: () => 'now()',
      })
      .where('id = :id AND version = :version', { id: inventory.id, version: inventory.version })
      .execute();

    if (!result.affected) {
      this.logger.warn(
        `Optimistic lock conflict updating inventory ${inventory.id} (material ${inventory.materialId}), expected version ${inventory.version}`,
      );
      throw new InventoryConcurrencyConflictException(inventory.materialId);
    }

    this.logger.log(`Inventory updated: ${inventory.id}`);
    return inventory;
  }

  async findAll(): Promise<Inventory[]> {
    const entities = await this.inventoryRepo.find({ relations: ['material'] });
    return entities.map((e) => InventoryMapper.toDomain(e));
  }

  async findLowStock(threshold: number): Promise<Inventory[]> {
    const entities = await this.inventoryRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.material', 'm')
      .where('i.quantity_available <= i.minimum_stock')
      .getMany();
    return entities.map((e) => InventoryMapper.toDomain(e));
  }
}
