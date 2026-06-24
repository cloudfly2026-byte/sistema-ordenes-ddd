import { Controller, Get, Param, Logger, Inject } from '@nestjs/common';
import { IInventoryRepository } from '../../domain/inventory/repositories/inventory.repository.interface';

interface InventoryItem {
  code: string;
  name: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
}

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    @Inject('IInventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  @Get()
  async getInventory() {
    this.logger.log('Fetching inventory status');
    const inventory = await this.inventoryRepository.findAll();

    const data: InventoryItem[] = inventory.map((inv) => ({
      code: inv.materialCode ?? inv.materialId,
      name: inv.materialName ?? inv.materialCode ?? inv.materialId,
      currentStock: inv.currentStock,
      reservedStock: inv.reservedStock,
      availableStock: inv.availableStock,
      lowStockThreshold: inv.minimumStock,
    }));

    return { data };
  }

  @Get('low-stock')
  async getLowStock() {
    this.logger.log('Fetching low stock alerts');
    const inventory = await this.inventoryRepository.findLowStock(0);

    const alerts = inventory.map((inv) => ({
      material: inv.materialCode ?? inv.materialId,
      materialName: inv.materialName ?? inv.materialCode ?? inv.materialId,
      currentStock: inv.currentStock,
      threshold: inv.minimumStock,
    }));

    return { alerts };
  }

  @Get(':materialId')
  async getMaterialStock(@Param('materialId') materialId: string) {
    this.logger.log(`Fetching stock for material ${materialId}`);
    const inv = await this.inventoryRepository.findByMaterialId(materialId);
    if (!inv) return null;

    return {
      materialId: inv.materialId,
      code: inv.materialCode ?? inv.materialId,
      name: inv.materialName ?? inv.materialCode ?? inv.materialId,
      currentStock: inv.currentStock,
      reservedStock: inv.reservedStock,
      availableStock: inv.availableStock,
      lowStockThreshold: inv.minimumStock,
    };
  }
}
