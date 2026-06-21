import { Injectable } from '@nestjs/common';
import { BoxType } from '../value-objects/box-type.vo';

export interface PackagingRequirement {
  boxType: BoxType;
  label: number;
  tape: number;
  filler: number;
}

@Injectable()
export class PackagingCalculatorDomainService {
  calculate(totalProducts: number, hasFragileItems: boolean): PackagingRequirement {
    let boxType: BoxType;
    if (totalProducts <= 2) {
      boxType = BoxType.SMALL;
    } else if (totalProducts <= 5) {
      boxType = BoxType.MEDIUM;
    } else {
      boxType = BoxType.LARGE;
    }

    return {
      boxType,
      label: 1,
      tape: 1,
      filler: hasFragileItems ? 1 : 0,
    };
  }
}
