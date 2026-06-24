import { Injectable } from '@nestjs/common';
import { BoxType } from '../value-objects/box-type.vo';
import { BoxSelectionPolicy } from '../policies/box-selection.policy';

export interface PackagingRequirement {
  boxType: BoxType;
  label: number;
  tape: number;
  filler: number;
}

@Injectable()
export class PackagingCalculatorDomainService {
  constructor(private readonly boxSelectionPolicy: BoxSelectionPolicy) {}

  calculate(totalProducts: number, hasFragileItems: boolean): PackagingRequirement {
    const boxType = this.boxSelectionPolicy.selectBoxType(totalProducts);

    return {
      boxType,
      label: 1,
      tape: 1,
      filler: hasFragileItems ? 1 : 0,
    };
  }
}
