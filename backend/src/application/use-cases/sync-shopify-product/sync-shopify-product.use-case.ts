import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialEntity } from '../../../infrastructure/database/entities/material.entity';
import { InventoryEntity } from '../../../infrastructure/database/entities/inventory.entity';

@Injectable()
export class SyncShopifyProductUseCase {
  private readonly logger = new Logger(SyncShopifyProductUseCase.name);

  constructor(
    @InjectRepository(MaterialEntity)
    private readonly materialRepo: Repository<MaterialEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
  ) {}

  async execute(payload: Record<string, unknown>): Promise<void> {
    const shopifyProductId = String(payload['id']);
    const title = (payload['title'] as string) || '';
    const variants = (payload['variants'] as Record<string, unknown>[]) || [];

    for (const variant of variants) {
      const sku = (variant['sku'] as string) || '';
      const inventoryQty = (variant['inventory_quantity'] as number) || 0;

      if (!sku) continue;

      const material = await this.materialRepo.findOne({ where: { code: sku } });
      if (material) {
        const inventory = await this.inventoryRepo.findOne({ where: { materialId: material.id } });
        if (inventory) {
          inventory.quantityAvailable = inventoryQty;
          await this.inventoryRepo.save(inventory);
          this.logger.log(`Updated material ${sku} stock to ${inventoryQty}`);
        }
      }
    }
  }
}
