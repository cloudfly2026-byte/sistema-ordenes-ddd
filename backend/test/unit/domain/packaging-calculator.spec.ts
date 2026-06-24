import { PackagingCalculatorDomainService } from '../../../src/domain/order/services/packaging-calculator.domain-service';
import { BoxSelectionPolicy } from '../../../src/domain/order/policies/box-selection.policy';
import { BoxType } from '../../../src/domain/order/value-objects/box-type.vo';

describe('PackagingCalculatorDomainService', () => {
  let service: PackagingCalculatorDomainService;

  beforeEach(() => {
    service = new PackagingCalculatorDomainService(new BoxSelectionPolicy());
  });

  describe('calculate', () => {
    it('should return BOX_SMALL for 1 product without fragile items', () => {
      const result = service.calculate(1, false);
      expect(result.boxType).toBe(BoxType.SMALL);
      expect(result.label).toBe(1);
      expect(result.tape).toBe(1);
      expect(result.filler).toBe(0);
    });

    it('should return BOX_SMALL for 2 products', () => {
      const result = service.calculate(2, false);
      expect(result.boxType).toBe(BoxType.SMALL);
    });

    it('should return BOX_MEDIUM for 3 products', () => {
      const result = service.calculate(3, false);
      expect(result.boxType).toBe(BoxType.MEDIUM);
    });

    it('should return BOX_MEDIUM for 5 products', () => {
      const result = service.calculate(5, false);
      expect(result.boxType).toBe(BoxType.MEDIUM);
    });

    it('should return BOX_LARGE for 6 products', () => {
      const result = service.calculate(6, false);
      expect(result.boxType).toBe(BoxType.LARGE);
    });

    it('should add FILLER when has fragile items', () => {
      const result = service.calculate(2, true);
      expect(result.filler).toBe(1);
    });

    it('should NOT add FILLER when no fragile items', () => {
      const result = service.calculate(2, false);
      expect(result.filler).toBe(0);
    });

    it('should always assign 1 LABEL and 1 TAPE', () => {
      const result = service.calculate(4, false);
      expect(result.label).toBe(1);
      expect(result.tape).toBe(1);
    });
  });
});

