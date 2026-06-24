import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { IInventoryRepository } from '../../../domain/inventory/repositories/inventory.repository.interface';
import { PackagingCalculatorDomainService } from '../../../domain/order/services/packaging-calculator.domain-service';
import {
  InsufficientStockException,
  InventoryConcurrencyConflictException,
} from '../../../domain/inventory/exceptions/inventory.exceptions';
import { OrderMaterial } from '../../../infrastructure/database/entities/order-material.entity';
import { InventoryMovement } from '../../../infrastructure/database/entities/inventory-movement.entity';

const MAX_RESERVATION_RETRIES = 3;

@Injectable()
export class ProcessOrderUseCase {
  private readonly logger = new Logger(ProcessOrderUseCase.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IInventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    private readonly packagingCalculator: PackagingCalculatorDomainService,
    @InjectRepository(OrderMaterial)
    private readonly orderMaterialRepo: Repository<OrderMaterial>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepo: Repository<InventoryMovement>,
  ) {}

  async execute(orderId: string): Promise<{ orderId: string; status: string }> {
    this.logger.log(`Processing order: ${orderId}`);

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return { orderId, status: 'FAILED' };
    }

    // Domain transition: PENDING -> PROCESSING
    order.startProcessing();
    await this.orderRepository.update(order);

    // Calculate packaging using domain service
    const packaging = this.packagingCalculator.calculate(
      order.totalProductCount,
      order.hasFragileItems,
    );

    // Build materials list from packaging requirement
    const materialsToReserve: { code: string; quantity: number }[] = [
      { code: packaging.boxType.value, quantity: 1 },
      { code: 'LABEL', quantity: 1 },
      { code: 'TAPE', quantity: 1 },
    ];
    if (packaging.filler > 0) {
      materialsToReserve.push({ code: 'FILLER', quantity: packaging.filler });
    }

    // Reserve inventory using domain aggregate, recording each reservation in
    // order_materials and inventory_movements for traceability (HU3/HU4).
    // Each material reservation retries locally on an optimistic-lock conflict
    // (another order updated the same material concurrently) — distinct from
    // BullMQ's job-level retry, so a transient collision doesn't fail the whole order.
    try {
      for (const { code, quantity } of materialsToReserve) {
        await this.reserveMaterialWithRetry(orderId, code, quantity);
      }
    } catch (error) {
      // Domain transition: PROCESSING -> FAILED
      order.fail(error.message);
      await this.orderRepository.update(order);
      this.logger.warn(`Order ${orderId} failed: ${error.message}`);
      return { orderId, status: 'FAILED' };
    }

    // Consume reserved inventory, recording consumption for traceability
    for (const { code, quantity } of materialsToReserve) {
      const inventory = await this.inventoryRepository.findByMaterialId(code);
      if (inventory) {
        const before = inventory.currentStock;
        inventory.consume(quantity);
        await this.inventoryRepository.update(inventory);
        await this.recordConsumption(orderId, inventory.materialId, inventory.id, quantity, before, inventory.currentStock);
      }
    }

    // Domain transition: PROCESSING -> COMPLETED
    order.complete(packaging.boxType);
    await this.orderRepository.update(order);

    this.logger.log(`Order ${orderId} completed successfully`);
    return { orderId, status: 'COMPLETED' };
  }

  /**
   * Reserves `quantity` units of `code` in inventory, retrying the
   * read-modify-write cycle if an optimistic-lock conflict is detected.
   * Stock-insufficiency is not retried — it propagates immediately.
   * On success, records the reservation in order_materials and inventory_movements.
   */
  private async reserveMaterialWithRetry(orderId: string, code: string, quantity: number): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RESERVATION_RETRIES; attempt++) {
      const inventory = await this.inventoryRepository.findByMaterialId(code);
      if (!inventory) {
        throw new InsufficientStockException(code, quantity, 0);
      }
      if (!inventory.canReserve(quantity)) {
        throw new InsufficientStockException(code, quantity, inventory.availableStock);
      }
      const before = inventory.currentStock - inventory.reservedStock;
      inventory.reserve(quantity);
      try {
        await this.inventoryRepository.update(inventory);
      } catch (error) {
        if (error instanceof InventoryConcurrencyConflictException && attempt < MAX_RESERVATION_RETRIES) {
          this.logger.warn(`Retrying reservation for ${code} after concurrency conflict (attempt ${attempt})`);
          continue;
        }
        throw error;
      }

      await this.orderMaterialRepo.save(
        this.orderMaterialRepo.create({
          orderId,
          materialId: inventory.materialId,
          quantityRequired: quantity,
          quantityReserved: quantity,
          quantityConsumed: 0,
          status: 'RESERVED',
        }),
      );
      await this.inventoryMovementRepo.save(
        this.inventoryMovementRepo.create({
          inventoryId: inventory.id,
          orderId,
          movementType: 'RESERVE',
          quantity,
          quantityBefore: before,
          quantityAfter: inventory.availableStock,
          reason: `Reserved for order ${orderId}`,
        }),
      );
      return;
    }
  }

  private async recordConsumption(
    orderId: string,
    materialId: string,
    inventoryId: string,
    quantity: number,
    stockBefore: number,
    stockAfter: number,
  ): Promise<void> {
    await this.orderMaterialRepo.update(
      { orderId, materialId },
      { quantityConsumed: quantity, status: 'CONSUMED' },
    );
    await this.inventoryMovementRepo.save(
      this.inventoryMovementRepo.create({
        inventoryId,
        orderId,
        movementType: 'CONSUME',
        quantity,
        quantityBefore: stockBefore,
        quantityAfter: stockAfter,
        reason: `Consumed for order ${orderId}`,
      }),
    );
  }
}
