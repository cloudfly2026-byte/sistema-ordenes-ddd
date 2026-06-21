import { Controller, Get, Param, Logger } from '@nestjs/common';
import { GetInventoryStatusUseCase } from '../../application/use-cases/get-inventory-status/get-inventory-status.use-case';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly getInventoryStatusUseCase: GetInventoryStatusUseCase,
  ) {}

  @Get()
  async getInventory() {
    this.logger.log('Fetching inventory status');
    return { data: [] };
  }

  @Get('low-stock')
  async getLowStock() {
    this.logger.log('Fetching low stock alerts');
    return { alerts: [] };
  }

  @Get(':materialId')
  async getMaterialStock(@Param('materialId') materialId: string) {
    this.logger.log(`Fetching stock for material ${materialId}`);
    return { materialId, currentStock: 0, reservedStock: 0 };
  }
}

