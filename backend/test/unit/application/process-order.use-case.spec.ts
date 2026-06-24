import { ProcessOrderUseCase } from '../../../src/application/use-cases/process-order/process-order.use-case';
import { PackagingCalculatorDomainService } from '../../../src/domain/order/services/packaging-calculator.domain-service';
import { BoxSelectionPolicy } from '../../../src/domain/order/policies/box-selection.policy';
import { IOrderRepository } from '../../../src/domain/order/repositories/order.repository.interface';
import { IInventoryRepository } from '../../../src/domain/inventory/repositories/inventory.repository.interface';
import { Order } from '../../../src/domain/order/entities/order.entity';
import { Inventory } from '../../../src/domain/inventory/entities/inventory.entity';
import { Money } from '../../../src/domain/order/value-objects/money.vo';
import { OrderItem } from '../../../src/domain/order/entities/order-item.entity';

function createMockRepo() {
  return {
    create: jest.fn((v) => v),
    save: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ProcessOrderUseCase (Unit)', () => {
  let useCase: ProcessOrderUseCase;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let inventoryRepo: jest.Mocked<IInventoryRepository>;
  let packagingCalculator: PackagingCalculatorDomainService;
  let orderMaterialRepo: ReturnType<typeof createMockRepo>;
  let inventoryMovementRepo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    orderRepo = {
      findById: jest.fn(),
      findByShopifyOrderId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findRecent: jest.fn(),
      countByStatus: jest.fn(),
    };

    inventoryRepo = {
      findById: jest.fn(),
      findByMaterialId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findLowStock: jest.fn(),
    };

    packagingCalculator = new PackagingCalculatorDomainService(new BoxSelectionPolicy());

    orderMaterialRepo = createMockRepo();
    inventoryMovementRepo = createMockRepo();

    useCase = new ProcessOrderUseCase(
      orderRepo,
      inventoryRepo,
      packagingCalculator,
      orderMaterialRepo as any,
      inventoryMovementRepo as any,
    );
  });

  it('should return FAILED when order not found', async () => {
    orderRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent-id');
    expect(result.status).toBe('FAILED');
  });

  it('should complete order when stock is sufficient', async () => {
    const order = Order.create({
      shopifyOrderId: 'TEST-001',
      customerEmail: 'test@test.com',
      totalPrice: new Money(29.99),
      items: [
        OrderItem.create({
          orderId: '',
          shopifyLineItemId: null,
          productName: 'Product A',
          quantity: 1,
          price: new Money(29.99),
          isFragile: false,
          sku: null,
        }),
      ],
      hasFragileItems: false,
      idempotencyKey: null,
    });

    const inventory = new Inventory('inv-1', 'BOX_SMALL', 100, 0);

    orderRepo.findById.mockResolvedValue(order);
    inventoryRepo.findByMaterialId.mockResolvedValue(inventory);

    const result = await useCase.execute('order-id');

    expect(result.status).toBe('COMPLETED');
    expect(inventoryRepo.update).toHaveBeenCalled();
  });

  it('should fail order when stock is insufficient', async () => {
    const order = Order.create({
      shopifyOrderId: 'TEST-002',
      customerEmail: 'test@test.com',
      totalPrice: new Money(29.99),
      items: [
        OrderItem.create({
          orderId: '',
          shopifyLineItemId: null,
          productName: 'Product A',
          quantity: 1,
          price: new Money(29.99),
          isFragile: false,
          sku: null,
        }),
      ],
      hasFragileItems: false,
      idempotencyKey: null,
    });
    const failSpy = jest.spyOn(order, 'fail');

    const inventory = new Inventory('inv-1', 'BOX_SMALL', 0, 0); // No stock

    orderRepo.findById.mockResolvedValue(order);
    inventoryRepo.findByMaterialId.mockResolvedValue(inventory);

    const result = await useCase.execute('order-id');

    expect(result.status).toBe('FAILED');
    expect(failSpy).toHaveBeenCalledTimes(1);
    expect(failSpy).toHaveBeenCalledWith(expect.stringContaining('BOX_SMALL'));
  });
});
