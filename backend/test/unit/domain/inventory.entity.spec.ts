import { Inventory } from '../../../src/domain/inventory/entities/inventory.entity';

describe('Inventory Entity', () => {
  let inventory: Inventory;

  beforeEach(() => {
    inventory = new Inventory('inv-1', 'mat-1', 100, 0);
  });

  describe('availableStock', () => {
    it('should return currentStock - reservedStock', () => {
      expect(inventory.availableStock).toBe(100);
      inventory.reserve(30);
      expect(inventory.availableStock).toBe(70);
    });

    it('should never return negative', () => {
      const lowInventory = new Inventory('inv-2', 'mat-2', 5, 10);
      expect(lowInventory.availableStock).toBe(0);
    });
  });

  describe('canReserve', () => {
    it('should return true when stock is sufficient', () => {
      expect(inventory.canReserve(50)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      expect(inventory.canReserve(101)).toBe(false);
    });

    it('should account for already reserved stock', () => {
      inventory.reserve(80);
      expect(inventory.canReserve(21)).toBe(false);
      expect(inventory.canReserve(20)).toBe(true);
    });
  });

  describe('reserve', () => {
    it('should increase reservedStock', () => {
      inventory.reserve(10);
      expect(inventory.reservedStock).toBe(10);
    });

    it('should throw when trying to reserve more than available', () => {
      expect(() => inventory.reserve(101)).toThrow();
    });
  });

  describe('consume', () => {
    it('should decrease both currentStock and reservedStock', () => {
      inventory.reserve(20);
      inventory.consume(20);
      expect(inventory.currentStock).toBe(80);
      expect(inventory.reservedStock).toBe(0);
    });

    it('should not go below zero', () => {
      inventory.consume(200);
      expect(inventory.currentStock).toBe(0);
      expect(inventory.reservedStock).toBe(0);
    });
  });

  describe('release', () => {
    it('should decrease reservedStock without affecting currentStock', () => {
      inventory.reserve(30);
      inventory.release(10);
      expect(inventory.reservedStock).toBe(20);
      expect(inventory.currentStock).toBe(100);
    });

    it('should not go below zero', () => {
      inventory.release(100);
      expect(inventory.reservedStock).toBe(0);
    });
  });
});

