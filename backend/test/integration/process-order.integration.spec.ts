import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProcessOrderUseCase } from '../../src/application/use-cases/process-order/process-order.use-case';
import { PackagingCalculatorDomainService } from '../../src/domain/order/services/packaging-calculator.domain-service';
import { BoxSelectionPolicy } from '../../src/domain/order/policies/box-selection.policy';
import { OrderRepository } from '../../src/infrastructure/database/repositories/order.repository';
import { InventoryRepository } from '../../src/infrastructure/database/repositories/inventory.repository';
import { OrderEntity } from '../../src/infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../src/infrastructure/database/entities/order-item.entity';
import { InventoryEntity } from '../../src/infrastructure/database/entities/inventory.entity';
import { MaterialEntity } from '../../src/infrastructure/database/entities/material.entity';
import { OrderMaterial } from '../../src/infrastructure/database/entities/order-material.entity';
import { InventoryMovement } from '../../src/infrastructure/database/entities/inventory-movement.entity';

/**
 * Integration test for ProcessOrderUseCase using real TypeORM repositories.
 * Requires a running PostgreSQL instance (or testcontainers).
 *
 * To run with a real DB, set the environment variables:
 *   DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
 *
 * This test validates:
 * - Stock sufficient → order COMPLETED, inventory decremented
 * - Stock insufficient → order FAILED, no partial deduction
 */
describe('ProcessOrderUseCase (Integration)', () => {
  let moduleRef: TestingModule;
  let processOrderUseCase: ProcessOrderUseCase;
  let orderRepo: Repository<OrderEntity>;
  let orderItemRepo: Repository<OrderItemEntity>;
  let inventoryRepo: Repository<InventoryEntity>;
  let materialRepo: Repository<MaterialEntity>;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5432';
    process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
    process.env.DB_NAME = process.env.DB_NAME ?? 'shopify_orders_test';

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [OrderEntity, OrderItemEntity, InventoryEntity, MaterialEntity, OrderMaterial, InventoryMovement],
          synchronize: false,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          OrderEntity, OrderItemEntity, InventoryEntity, MaterialEntity, OrderMaterial, InventoryMovement,
        ]),
      ],
      providers: [
        ProcessOrderUseCase,
        PackagingCalculatorDomainService,
        BoxSelectionPolicy,
        OrderRepository,
        InventoryRepository,
        {
          provide: 'IOrderRepository',
          useClass: OrderRepository,
        },
        {
          provide: 'IInventoryRepository',
          useClass: InventoryRepository,
        },
      ],
    }).compile();

    processOrderUseCase = moduleRef.get(ProcessOrderUseCase);
    orderRepo = moduleRef.get(getRepositoryToken(OrderEntity));
    orderItemRepo = moduleRef.get(getRepositoryToken(OrderItemEntity));
    inventoryRepo = moduleRef.get(getRepositoryToken(InventoryEntity));
    materialRepo = moduleRef.get(getRepositoryToken(MaterialEntity));
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await moduleRef?.close();
  });

  beforeEach(async () => {
    // Clean tables
    await dataSource.query('TRUNCATE order_items, order_materials, inventory_movements, inventory, materials, orders, webhook_events, job_executions, audit_logs CASCADE');

    // Seed materials
    await materialRepo.save([
      materialRepo.create({ code: 'BOX_SMALL', name: 'Small Box', unit: 'unit' }),
      materialRepo.create({ code: 'BOX_MEDIUM', name: 'Medium Box', unit: 'unit' }),
      materialRepo.create({ code: 'BOX_LARGE', name: 'Large Box', unit: 'unit' }),
      materialRepo.create({ code: 'LABEL', name: 'Label', unit: 'unit' }),
      materialRepo.create({ code: 'TAPE', name: 'Tape', unit: 'unit' }),
      materialRepo.create({ code: 'FILLER', name: 'Filler', unit: 'unit' }),
    ]);

    // Seed inventory with sufficient stock
    const materials = await materialRepo.find();
    for (const mat of materials) {
      await inventoryRepo.save(
        inventoryRepo.create({
          materialId: mat.id,
          quantityAvailable: 100,
          quantityReserved: 0,
          minimumStock: 10,
        }),
      );
    }
  });

  it('should complete order when stock is sufficient', async () => {
    // Create order
    const order = await orderRepo.save(
      orderRepo.create({
        shopifyOrderId: 'TEST-001',
        status: 'PENDING',
        totalPrice: 49.99,
        currency: 'USD',
        itemsCount: 2,
        hasFragileItems: false,
      }),
    );

    await orderItemRepo.save(
      orderItemRepo.create({
        orderId: order.id,
        productName: 'Product A',
        quantity: 2,
        price: 24.99,
        isFragile: false,
      }),
    );

    // Process
    const result = await processOrderUseCase.execute(order.id);

    expect(result.status).toBe('COMPLETED');

    // Verify inventory was decremented
    const boxSmall = await materialRepo.findOne({ where: { code: 'BOX_SMALL' } });
    const boxSmallInv = await inventoryRepo.findOne({ where: { materialId: boxSmall.id } });
    expect(boxSmallInv.quantityAvailable).toBe(99); // 100 - 1 box
  });

  it('should fail order when stock is insufficient (no partial deduction)', async () => {
    // Set BOX_SMALL stock to 0
    const boxSmall = await materialRepo.findOne({ where: { code: 'BOX_SMALL' } });
    const boxSmallInv = await inventoryRepo.findOne({ where: { materialId: boxSmall.id } });
    boxSmallInv.quantityAvailable = 0;
    await inventoryRepo.save(boxSmallInv);

    // Create order with 1 product (needs BOX_SMALL)
    const order = await orderRepo.save(
      orderRepo.create({
        shopifyOrderId: 'TEST-002',
        status: 'PENDING',
        totalPrice: 19.99,
        currency: 'USD',
        itemsCount: 1,
        hasFragileItems: false,
      }),
    );

    await orderItemRepo.save(
      orderItemRepo.create({
        orderId: order.id,
        productName: 'Product B',
        quantity: 1,
        price: 19.99,
        isFragile: false,
      }),
    );

    // Process
    const result = await processOrderUseCase.execute(order.id);

    expect(result.status).toBe('FAILED');

    // Verify no inventory was deducted
    const labelInv = await inventoryRepo.findOne({
      where: { materialId: (await materialRepo.findOne({ where: { code: 'LABEL' } })).id },
    });
    expect(labelInv.quantityAvailable).toBe(100); // unchanged
  });

  it('should handle fragile items (add FILLER)', async () => {
    const order = await orderRepo.save(
      orderRepo.create({
        shopifyOrderId: 'TEST-003',
        status: 'PENDING',
        totalPrice: 29.99,
        currency: 'USD',
        itemsCount: 1,
        hasFragileItems: true,
      }),
    );

    await orderItemRepo.save(
      orderItemRepo.create({
        orderId: order.id,
        productName: 'Fragile Product',
        quantity: 1,
        price: 29.99,
        isFragile: true,
      }),
    );

    const result = await processOrderUseCase.execute(order.id);

    expect(result.status).toBe('COMPLETED');

    // Verify FILLER was consumed
    const filler = await materialRepo.findOne({ where: { code: 'FILLER' } });
    const fillerInv = await inventoryRepo.findOne({ where: { materialId: filler.id } });
    expect(fillerInv.quantityAvailable).toBe(99); // 100 - 1 filler
  });
});

