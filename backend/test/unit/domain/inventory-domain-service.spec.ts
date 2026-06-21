import { InventoryDomainService } from '../../../src/domain/inventory/services/inventory.domain-service';

describe('InventoryDomainService', () => {
  let service: InventoryDomainService;

  beforeEach(() => {
    service = new InventoryDomainService();
  });

  describe('canReserve', () => {
    it('should return true when stock is sufficient', () => {
      expect(service.canReserve(10, 0, 5)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      expect(service.canReserve(3, 0, 5)).toBe(false);
    });

    it('should account for reserved stock', () => {
      expect(service.canReserve(10, 8, 5)).toBe(false);
    });
  });

  describe('calculateAvailable', () => {
    it('should return available stock', () => {
      expect(service.calculateAvailable(10, 3)).toBe(7);
    });

    it('should return 0 when reserved exceeds current', () => {
      expect(service.calculateAvailable(5, 10)).toBe(0);
    });
  });

  describe('isBelowThreshold', () => {
    it('should return true when below threshold', () => {
      expect(service.isBelowThreshold(5, 10)).toBe(true);
    });

    it('should return false when above threshold', () => {
      expect(service.isBelowThreshold(15, 10)).toBe(false);
    });
  });
});

