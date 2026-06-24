import { Order } from '../../../src/domain/order/entities/order.entity';
import { OrderItem } from '../../../src/domain/order/entities/order-item.entity';
import { Money } from '../../../src/domain/order/value-objects/money.vo';
import { OrderStatus } from '../../../src/domain/order/value-objects/order-status.vo';
import { BoxType } from '../../../src/domain/order/value-objects/box-type.vo';
import {
  InvalidOrderStateTransitionException,
  OrderAlreadyProcessedException,
} from '../../../src/domain/order/exceptions/order.exceptions';

describe('Order Entity', () => {
  const createTestItems = (count: number, quantity = 1): OrderItem[] =>
    Array.from({ length: count }, (_, i) =>
      OrderItem.create({
        orderId: '',
        shopifyLineItemId: null,
        productName: `Product ${i + 1}`,
        quantity,
        price: new Money(10),
        isFragile: false,
        sku: null,
      }),
    );

  describe('create', () => {
    it('should create an order in PENDING state', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      expect(order.status.value).toBe('PENDING');
      expect(order.boxType).toBeNull();
      expect(order.errorMessage).toBeNull();
      expect(order.processedAt).toBeNull();
    });

    it('should emit OrderReceivedEvent on creation', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('order.received');
    });
  });

  describe('state transitions', () => {
    it('should transition PENDING -> PROCESSING', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      order.startProcessing();
      expect(order.status.value).toBe('PROCESSING');
    });

    it('should transition PROCESSING -> COMPLETED', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      order.startProcessing();
      order.complete(BoxType.SMALL);
      expect(order.status.value).toBe('COMPLETED');
      expect(order.boxType).toBe(BoxType.SMALL);
      expect(order.processedAt).not.toBeNull();
    });

    it('should transition PROCESSING -> FAILED', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      order.startProcessing();
      order.fail('Insufficient inventory');
      expect(order.status.value).toBe('FAILED');
      expect(order.errorMessage).toBe('Insufficient inventory');
    });

    it('should throw InvalidOrderStateTransitionException when not PENDING', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      order.startProcessing();
      expect(() => order.startProcessing()).toThrow(InvalidOrderStateTransitionException);
    });

    it('should throw OrderAlreadyProcessedException when already in terminal state', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      order.startProcessing();
      order.complete(BoxType.SMALL);
      expect(() => order.fail('test')).toThrow(OrderAlreadyProcessedException);
    });
  });

  describe('queries', () => {
    it('should calculate total product count', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: [
          OrderItem.create({ orderId: '', shopifyLineItemId: null, productName: 'A', quantity: 2, price: new Money(10), isFragile: false, sku: null }),
          OrderItem.create({ orderId: '', shopifyLineItemId: null, productName: 'B', quantity: 3, price: new Money(10), isFragile: false, sku: null }),
        ],
        hasFragileItems: false,
        idempotencyKey: null,
      });

      expect(order.totalProductCount).toBe(5);
    });

    it('should identify terminal states', () => {
      const order = Order.create({
        shopifyOrderId: '123',
        customerEmail: 'test@test.com',
        totalPrice: new Money(29.99),
        items: createTestItems(2),
        hasFragileItems: false,
        idempotencyKey: null,
      });

      expect(order.isInTerminalState()).toBe(false);
      order.startProcessing();
      expect(order.isInTerminalState()).toBe(false);
      order.complete(BoxType.SMALL);
      expect(order.isInTerminalState()).toBe(true);
    });
  });
});
